import { PlayAudio } from "./PlayAudio.js";
import { RecordAudio } from "./RecordAudio.js";
import { SaveAudio } from "./SaveAudio.js";
import { AudioTrack } from "./AudioTrack.js";
// import { ConvertToFile } from "./ConvertToFile.js";

export class App {
    audioTracks = [];
    trackCreationCount = 0;
    selectedTrackID = 0;

    startTime = 0; // 현재 재생바가 0에서 언제부터 움직이기 시작했는지 결정
    currentTime = 0; // 현재 재생바의 위치를 결정
    stopped = true;

    canvasLengthPerDuration = 20; // 오디오 길이에 따른 캔버스 길이 비율을 결정
    sampleDensity = 2; // 오디오 길이 1픽셀당 샘플 몇 개 그려지는지 결정
    copiedBuffer = null;

    constructor(){
        this.$trackList = document.querySelector('.trackList')
        this.createTrack();

        this.$createTrackButton = document.querySelector('.createTrack')
        this.$deleteTrackButton = document.querySelector('.deleteTrack')

        this.$createTrackButton.addEventListener('click', this.createTrack);
        this.$deleteTrackButton.addEventListener('click', this.deleteTrack)

        this.playAudio = new PlayAudio({
            playAudio: () => {
                console.log('playstart')
                for(let i = 0; i < this.audioTracks.length; i++){
                    let currentTrack = this.audioTracks[i];
                    currentTrack.play(this.currentTime);
                }
            },
            pauseAudio: () => {
                console.log('paused')
                for(let i = 0; i < this.audioTracks.length; i++){
                    let currentTrack = this.audioTracks[i];
                    currentTrack.pause();
                }
            },
            stopAudio: () => {
                console.log('stopped')
                for(let i = 0; i < this.audioTracks.length; i++){
                    let currentTrack = this.audioTracks[i];
                    currentTrack.stop();
                }
            }
        });

        this.recordAudio = new RecordAudio({
            
        })

        this.saveAudio = new SaveAudio({
            putFileName: () => {
                if(this.saveAudio.inputBlankOpen) return;

                const currentTrack = this.audioTracks[0];

                this.saveAudio.inputBlankOpen = true;
                const $downloadAudio = document.querySelector('.downloadAudio')
                const $filename = document.createElement('input')
                $filename.type = 'text'
                $filename.placeholder = '파일명을 입력하세요.'
                $downloadAudio.appendChild($filename);
        
                $filename.addEventListener('keydown', event => {
                    if(event.key == 'Enter'){
                        this.$saveAudio.readyToSaveFile(currentTrack.audioContext, currentTrack.audioCurrent, event.target.value);
                        $downloadAudio.innerHTML = ``;
                        this.$saveAudio.inputBlankOpen = false;
                    }
                })
            }
        });
        
    }

    createTrack = () => {
        const track = new AudioTrack({
            app: this,
            id: this.trackCreationCount
        })
        this.audioTracks.push(track);
        this.trackCreationCount += 1;
    }
    deleteTrack = () => {
        if(this.audioTracks.length < 2) return;
        this.audioTracks.pop();
        this.$trackList.removeChild(this.$trackList.lastChild);
    }

}