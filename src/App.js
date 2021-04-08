import { RecordAudio } from "./RecordAudio.js";
import { SaveAudio } from "./SaveAudio.js";
import { AudioTrack } from "./AudioTrack.js";
import { AudioEffect } from "./AudioEffect.js";

export class App {
    audioTracks = {}
    timer = {}
    trackCreationCount = 0;

    isPlaying = false;
    isLoop = false;
    isDraggingPlaybackBar = false;

    startTime = 0; // 현재 재생바가 0에서 언제부터 움직이기 시작했는지 결정
    playbackTime = 0; // 현재 재생바의 위치를 결정
    stopped = true;

    zoomChangeUnit = 0.1
    samplePerDuration = 10; // 1 duration당 몇 개의 sample을 생성할지 결정한다. -> this.blockSize를 set한다.
    sampleDensity = 1; // 오디오 길이 1픽셀당 샘플(blockSize) 몇 개 그려지는지 결정
    trackPadding = 2; // track와 channel 사이의 padding
    wavePadding = 20; // channel canvas 내부에서 wave의 maxHeight과 위아래 사이의 padding
    verticalZoomProportion = 1; // 세로 줌의 상태

    selectMode = 'track';
    selectedTrackID = 0;
    selectedChannelID = 0;
    copiedBuffer = null;
    copiedChannel = null;
    copiedChannelDuration = 0;

    defaultWidth = 1234;
    defaultHeight = 151;

    constructor(){
        this.$trackList = document.querySelector('.trackList')

        const $playAudio = document.querySelector('.playAudio');
        const $pauseAudio = document.querySelector('.pauseAudio');
        const $stopAudio = document.querySelector('.stopAudio');

        this.$currentTime = document.querySelector('.currentTime');
        this.$loopStart = document.querySelector('.loopStart');
        this.$loopEnd = document.querySelector('.loopEnd');

        this.$zoomHorizontalValue = document.querySelector('.zoomHorizontal')
        this.$zoomHorizontalInButton = document.querySelector('.zoomHorizontalIn')
        this.$zoomHorizontalOutButton = document.querySelector('.zoomHorizontalOut')
        this.$zoomVerticalValue = document.querySelector('.zoomVertical')
        this.$zoomVerticalInButton = document.querySelector('.zoomVerticalIn')
        this.$zoomVerticalOutButton = document.querySelector('.zoomVerticalOut')
        this.$createTrackButton = document.querySelector('.createTrack')
        this.$deleteTrackButton = document.querySelector('.deleteTrack')
        this.$selectMode = document.querySelector('.selectMode')
        
        $playAudio.addEventListener('click', this.playAudio);
        $pauseAudio.addEventListener('click', this.pauseAudio);
        $stopAudio.addEventListener('click', this.stopAudio);

        this.$createTrackButton.addEventListener('click', this.createTrack.bind(this));
        this.$selectMode.addEventListener('change', this.switchSelectMode.bind(this))

        this.$zoomHorizontalValue.addEventListener('keyup', event => {
            if(event.key === 'Enter'){
                this.setZoomHorizontal();
            }
        })
        this.$zoomHorizontalInButton.addEventListener('click', this.zoomHorizontalIn.bind(this))
        this.$zoomHorizontalOutButton.addEventListener('click', this.zoomHorizontalOut.bind(this))

        this.$zoomVerticalValue.addEventListener('keyup', event => {
            if(event.key === 'Enter'){
                this.setZoomVertical();
            }
        })
        this.$zoomVerticalInButton.addEventListener('click', this.zoomVerticalIn.bind(this))
        this.$zoomVerticalOutButton.addEventListener('click', this.zoomVerticalOut.bind(this))

        document.addEventListener('click', event => {
            document.querySelectorAll('.closeAudio').forEach($item => {
                if($item.contains(event.target)){
                    this.deleteTrack.call(this, $item);
                }
            })
        })

        this.createTrack();

        this.saveAudio = new SaveAudio({
            app: this
        });

        this.recordAudio = new RecordAudio({
            app: this
        })

        this.audioEffect = new AudioEffect({
            app: this
        })
    }

    playAudio = () => {
        if(this.isPlaying) return;
        console.log('play')
        this.isPlaying = true;

        let initial = Object.keys(this.audioTracks)[0];
        this.startTime = this.audioTracks[initial].audioContext.currentTime - this.playbackTime;
        for(var i in this.audioTracks){
            let currentTrack = this.audioTracks[i];
            this.timer[i] = setInterval(() => {
                let playbackBarSpeed = this.samplePerDuration / this.sampleDensity;
                this.playbackTime = (this.audioTracks[initial].audioContext.currentTime - this.startTime)
                currentTrack.playAudio.drawPlaybackBar(this.playbackTime * playbackBarSpeed);
                this.$currentTime.innerText = new Date(this.playbackTime * 1000).toISOString().substr(11, 8)
            }, 1);

            if(currentTrack.numberOfChannels === 0) continue;
            currentTrack.play(this.playbackTime * currentTrack.audioSource.playbackRate.value);
        }
    }
    pauseAudio = () => {
        if(!this.isPlaying) return;
        console.log('paused')
        this.isPlaying = false;
        
        let initial = Object.keys(this.audioTracks)[0];
        for(var i in this.audioTracks){
            let currentTrack = this.audioTracks[i];
            let playbackBarSpeed = this.samplePerDuration / this.sampleDensity
            this.playbackTime = (this.audioTracks[initial].audioContext.currentTime - this.startTime)
            currentTrack.playAudio.drawPlaybackBar(this.playbackTime * playbackBarSpeed);
            this.$currentTime.innerText = new Date(this.playbackTime * 1000).toISOString().substr(11, 8)
            if(this.timer[i] != null) {
                clearInterval(this.timer[i]);
            }
            if(currentTrack.isPlaying){
                currentTrack.stop();
            }
        }
    }
    stopAudio = () => {
        console.log('stopped')
        this.isPlaying = false;

        this.playbackTime = 0
        this.$currentTime.innerText = new Date(this.playbackTime * 1000).toISOString().substr(11, 8)
        for(var i in this.audioTracks){
            let currentTrack = this.audioTracks[i];
            currentTrack.playAudio.drawPlaybackBar(0);
            if(this.timer[i] != null) {
                clearInterval(this.timer[i]);
            }
            if(currentTrack.isPlaying){
                currentTrack.stop();
            }
        }
    }
    // setLoop = () => {
    //     if(this.isLoop){
    //         for(var i in this.audioTracks){
    //             let currentTrack = this.audioTracks[i];
    //             currentTrack.audioSource.loop = false;
    //         }
    //     }
    //     else{
    //         for(var i in this.audioTracks){
    //             let currentTrack = this.audioTracks[i];
    //             currentTrack.audioSource.loop = true;
    //             currentTrack.audioSource.loopStart = this.$loopStart.value.toSeconds();
    //             currentTrack.audioSource.loopEnd = this.$loopEnd.value.toSeconds();
    //         }
    //     }
    // }

    zoomHorizontalChange = () => {
        this.$zoomHorizontalValue.value = this.sampleDensity
        
        let playbackBarSpeed = this.samplePerDuration / this.sampleDensity
        this.$currentTime.innerText = new Date(this.playbackTime * 1000).toISOString().substr(11, 8)

        for(var trackID in this.audioTracks){
            let track = this.audioTracks[trackID]
            track.playAudio.drawPlaybackBar(this.playbackTime * playbackBarSpeed);
            if(track.audioSource.buffer === null) return;
            const width = Math.floor(track.audioSource.buffer.duration) 
                    * this.samplePerDuration / this.sampleDensity + this.trackPadding * 2 + 1;
            track.draw(width, track.offsetHeight)
        }
    }
    setZoomHorizontal = () => {
        let zoomHorizontal = Math.round(this.$zoomHorizontalValue.value * 10) / 10
        if(zoomHorizontal < 0){
            zoomHorizontal = 1;
        }
        this.sampleDensity = zoomHorizontal;
        this.zoomHorizontalChange();
    }
    zoomHorizontalIn = () => {
        if(Math.round(this.sampleDensity * 10) / 10 === 0.1) return;
        this.sampleDensity -= this.zoomChangeUnit;
        this.sampleDensity = Math.round(this.sampleDensity * 10) / 10
        this.zoomHorizontalChange();
    }
    zoomHorizontalOut = () => {
        this.sampleDensity += this.zoomChangeUnit;
        this.sampleDensity = Math.round(this.sampleDensity * 10) / 10
        this.zoomHorizontalChange();
    }

    zoomVerticalChange = () => {
        this.$zoomVerticalValue.value = this.verticalZoomProportion
        for(var trackID in this.audioTracks){
            let track = this.audioTracks[trackID]
            const height = this.defaultHeight * this.$zoomVerticalValue.value
            track.draw(track.offsetWidth, height)

            if(!this.isPlaying){
                let playbackBarSpeed = this.samplePerDuration / this.sampleDensity;
                track.playAudio.drawPlaybackBar(this.playbackTime * playbackBarSpeed);
                this.$currentTime.innerText = new Date(this.playbackTime * 1000).toISOString().substr(11, 8)
            }
        }
    }
    setZoomVertical = () => {
        let zoomVertical = Math.round(this.$zoomVerticalValue.value * 10) / 10
        if(zoomVertical < 0){
            zoomVertical = 1;
        }
        this.$zoomVerticalValue.value = zoomVertical;
        this.zoomVerticalChange();
    }
    zoomVerticalIn = () => {
        if(Math.round(this.sampleDensity * 10) / 10 === 0.1) return;
        this.verticalZoomProportion -= this.zoomChangeUnit;
        this.verticalZoomProportion = Math.round(this.verticalZoomProportion * 10) / 10
        this.zoomVerticalChange();
    }
    zoomVerticalOut = () => {
        this.verticalZoomProportion += this.zoomChangeUnit;
        this.verticalZoomProportion = Math.round(this.verticalZoomProportion * 10) / 10
        this.zoomVerticalChange();
    }

    createTrack = () => {
        const track = new AudioTrack({
            app: this,
            id: this.trackCreationCount
        })
        this.audioTracks[track.trackID] = track;
        let playbackBarSpeed = this.samplePerDuration / this.sampleDensity
        track.playAudio.drawPlaybackBar(this.playbackTime * playbackBarSpeed);
        this.trackCreationCount += 1;

        let initial = Object.keys(this.audioTracks)[0];
        if(this.isPlaying){
            this.timer[track.trackID] = setInterval(() => {
                let playbackBarSpeed = this.samplePerDuration / this.sampleDensity;
                this.playbackTime = (this.audioTracks[initial].audioContext.currentTime - this.startTime)
                track.playAudio.drawPlaybackBar(this.playbackTime * playbackBarSpeed);
                this.$currentTime.innerText = new Date(this.playbackTime * 1000).toISOString().substr(11, 8)
            }, 1);
        }
    }
    deleteTrack = $item => {
        const id = $item.parentNode.parentNode.parentNode.querySelector('span').innerText;
        delete this.audioTracks[id];
        $item.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.remove();
    }

    switchSelectMode = () => {
        if(this.selectMode === 'track'){
            if(this.selectedTrackID in this.audioTracks){
                let track = this.audioTracks[this.selectedTrackID];
                track.unborderTrack();
                track.cancelDarkenSelection(track.selectedX1, track.selectedX2);
                track.selectedX1 = 0;
                track.selectedX2 = 0;
                if(track.channels.length > 0){
                    track.channels[this.selectedChannelID].borderChannel();
                }
            }
            this.selectMode = 'channel'
        }
        else if(this.selectMode === 'channel'){
            if(this.selectedTrackID in this.audioTracks){
                let track = this.audioTracks[this.selectedTrackID];
                if(track.channels.length > 0){
                    let channel = track.channels[this.selectedChannelID];
                    channel.unborderChannel();
                    channel.cancelDarkenSelection(channel.selectedX1, channel.selectedX2);
                    channel.selectedX1 = 0;
                    channel.selectedX2 = 0;
                }
                track.borderTrack();
            }
            this.selectMode = 'track'
        }
    }
}