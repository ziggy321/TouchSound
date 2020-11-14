import { PlayAudio } from "./PlayAudio.js";
import { RecordAudio } from "./RecordAudio.js";
import { SaveAudio } from "./SaveAudio.js";
import { AudioTrack } from "./AudioTrack.js";
import { AudioEffect } from "./AudioEffect.js";
// import { ConvertToFile } from "./ConvertToFile.js";

export class App {
    audioTracks = {}
    trackCreationCount = 0;

    isPlaying = false;

    startTime = 0; // 현재 재생바가 0에서 언제부터 움직이기 시작했는지 결정
    playbackTime = 0; // 현재 재생바의 위치를 결정
    stopped = true;

    zoomChangeUnit = 0.1
    samplePerDuration = 10; // 1 duration당 몇 개의 sample을 생성할지 결정한다. -> this.blockSize를 set한다.
    sampleDensity = 1; // 오디오 길이 1픽셀당 샘플(blockSize) 몇 개 그려지는지 결정
    trackPadding = 2; // track와 channel 사이의 padding
    wavePadding = 20; // channel canvas 내부에서 wave의 maxHeight과 위아래 사이의 padding

    selectMode = 'track';
    selectedTrackID = 0;
    selectedChannelID = 0;
    copiedBuffer = null;
    copiedChannel = null;
    copiedChannelDuration = 0;

    defaultWidth = 1234;
    defaultHeight = 151;

    constructor(){
        this.setBlockSize();
        this.playbackBarSpeed = this.samplePerDuration / this.sampleDensity; // default

        this.$trackList = document.querySelector('.trackList')
        this.createTrack();

        this.$zoomValue = document.querySelector('.zoom')
        this.$zoomInButton = document.querySelector('.zoomIn')
        this.$zoomOutButton = document.querySelector('.zoomOut')
        this.$createTrackButton = document.querySelector('.createTrack')
        this.$deleteTrackButton = document.querySelector('.deleteTrack')
        this.$selectMode = document.querySelector('.selectMode')

        this.$createTrackButton.addEventListener('click', this.createTrack.bind(this));
        this.$selectMode.addEventListener('change', this.switchSelectMode.bind(this))
        this.$zoomValue.addEventListener('keyup', event => {
            if(event.key === 'Enter'){
                this.setZoom();
            }
        })
        this.$zoomInButton.addEventListener('click', this.zoomIn.bind(this))
        this.$zoomOutButton.addEventListener('click', this.zoomOut.bind(this))

        document.addEventListener('click', event => {
            document.querySelectorAll('.closeAudio').forEach($item => {
                if($item.contains(event.target)){
                    this.deleteTrack.call(this, $item);
                }
            })
        })

        this.playAudio = new PlayAudio({
            app: this,
            playAudio: () => {
                if(this.isPlaying) return;
                this.isPlaying = true;
                console.log('play start')

                let initial = Object.keys(this.audioTracks)[0];
                this.startTime = this.audioTracks[initial].audioContext.currentTime
                this.timer = setInterval(() => {
                    this.playbackBarSpeed = this.audioTracks[initial].rate * this.samplePerDuration / this.sampleDensity;
                    // this.playbackTime += (this.playbackBarSpeed / 1)
                    //     * Math.round(this.audioTracks[initial].audioSource.playbackRate.value * 10) / 10

                    this.playbackTime = this.playbackBarSpeed * (this.audioTracks[initial].audioContext.currentTime - this.startTime)
                    this.playAudio.drawPlaybackBar(this.playbackTime);
                }, 1);
                for(var i in this.audioTracks){
                    let currentTrack = this.audioTracks[i];
                    currentTrack.play(this.playbackTime);
                }
            },
            pauseAudio: () => {
                console.log('paused')

                this.isPlaying = false;
                let initial = Object.keys(this.audioTracks)[0];
                this.playbackBarSpeed = this.audioTracks[initial].rate * this.samplePerDuration / this.sampleDensity;
                this.playbackTime = this.playbackBarSpeed * (this.audioTracks[initial].audioContext.currentTime - this.startTime)
                this.playAudio.drawPlaybackBar(this.playbackTime);
                if(this.timer != null) {
                    clearInterval(this.timer);
                }
                for(var i in this.audioTracks){
                    let currentTrack = this.audioTracks[i];
                    currentTrack.stop();
                }
            },
            stopAudio: () => {
                console.log('stopped')
                
                this.isPlaying = false;
                this.playbackTime = 0
                this.playAudio.drawPlaybackBar(this.playbackTime);
                if(this.timer != null) {
                    clearInterval(this.timer);
                }
                for(var i in this.audioTracks){
                    let currentTrack = this.audioTracks[i];
                    currentTrack.stop();
                }
            }
        });

        this.recordAudio = new RecordAudio({
            
        })

        this.saveAudio = new SaveAudio({
            app: this,
            putFileName: () => {
                this.saveAudio.filename = prompt("파일명을 입력하세요.", "output");

                // if(this.saveAudio.inputBlankOpen) return;
                // const currentTrack = this.audioTracks[0];
                // this.saveAudio.inputBlankOpen = true;
                // const $downloadAudio = document.querySelector('.downloadAudio')
                // const $filename = document.createElement('input')
                // $filename.type = 'text'
                // $filename.placeholder = '파일명을 입력하세요.'
                // $downloadAudio.appendChild($filename);
                // $filename.addEventListener('keydown', event => {
                //     if(event.key == 'Enter'){
                //         this.$saveAudio.readyToSaveFile(currentTrack.audioContext, currentTrack.audioCurrent, event.target.value);
                //         $downloadAudio.innerHTML = ``;
                //         this.$saveAudio.inputBlankOpen = false;
                //     }
                // })
            }
        });

        this.audioEffect = new AudioEffect({
            app: this
        })
    }

    setBlockSize = () => {
        const dataLengthPerDuration = 48000 // literally
        this.blockSize = Math.floor(dataLengthPerDuration / this.samplePerDuration);
        // samplePerDuration은 1 duration당 몇 개의 sample을 생성할지 결정한다.
        // 1 duration 당 data의 길이(오디오 데이터 배열의 길이)는 48000이다.
        // 이를 samplePerDuration으로 나누면 blockSize(샘플 1개의 길이)가 된다.
    }
    zoomChange = () => {
        this.$zoomValue.value = this.sampleDensity
        for(var trackID in this.audioTracks){
            let track = this.audioTracks[trackID]
            const width = Math.floor(track.audioSource.buffer.duration) 
                    * this.samplePerDuration / this.sampleDensity + this.trackPadding * 2;
            track.draw(width, track.offsetHeight)
        }
    }
    setZoom = () => {
        let zoom = Math.round(this.$zoomValue.value * 10) / 10
        if(zoom < 0){
            zoom = 1;
        }
        this.sampleDensity = zoom;
        this.zoomChange();
    }
    zoomIn = () => {
        if(Math.round(this.sampleDensity * 10) / 10 === 0.1) return;
        this.sampleDensity -= this.zoomChangeUnit;
        this.sampleDensity = Math.round(this.sampleDensity * 10) / 10
        this.zoomChange();
    }
    zoomOut = () => {
        this.sampleDensity += this.zoomChangeUnit;
        this.sampleDensity = Math.round(this.sampleDensity * 10) / 10
        this.zoomChange();
    }

    createTrack = () => {
        const track = new AudioTrack({
            app: this,
            id: this.trackCreationCount
        })
        this.audioTracks[track.trackID] = track;
        this.trackCreationCount += 1;
        // this.playAudio.$canvas.height = this.playAudio.$canvas.height + (this.defaultHeight + this.wavePadding * 2)
    }
    deleteTrack = $item => {
        const id = $item.parentNode.querySelector('span').innerText;
        delete this.audioTracks[id];
        $item.parentNode.parentNode.remove();
        // this.playAudio.$canvas.height = this.playAudio.$canvas.height - (this.defaultHeight + this.wavePadding * 2)
    }

    switchSelectMode = () => {
        if(this.selectMode === 'track'){
            if(this.selectedTrackID in this.audioTracks){
                this.audioTracks[this.selectedTrackID].unborderTrack();
                if(this.audioTracks[this.selectedTrackID].channels.length > 0){
                    this.audioTracks[this.selectedTrackID].channels[this.selectedChannelID].borderChannel();
                }
            }
            this.selectMode = 'channel'
        }
        else if(this.selectMode === 'channel'){
            if(this.selectedTrackID in this.audioTracks){
                this.audioTracks[this.selectedTrackID].borderTrack();
                if(this.audioTracks[this.selectedTrackID].channels.length > 0){
                    this.audioTracks[this.selectedTrackID].channels[this.selectedChannelID].unborderChannel();
                }
            }
            this.selectMode = 'track'
        }
    }
}