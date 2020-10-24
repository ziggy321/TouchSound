import { LoadAudio } from "./LoadAudio.js";
import { PlayAudio } from "./PlayAudio.js";
import { SaveAudio } from "./SaveAudio.js";

export class App {
    audioContext = null;
    audioSource = null;

    audioGain = null;

    audioCurrent = null;
    audioDestination = null;

    constructor(){
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioSource = this.audioContext.createBufferSource();

        this.audioGain = this.audioContext.createGain();

        this.audioSource.connect(this.audioGain);
        this.audioGain.connect(this.audioCurrent);

        this.audioDestination = this.audioContext.destination;

        this.loadAudio = new LoadAudio({
            fetchFile: () => {
                const $input = document.createElement("input");
                $input.type = "file";
                $input.accept = "audio/*";
                $input.onchange = event => {
                    const file = event.target.files[0];
                    if(file.type.substring(0, 5) !== "audio"){
                        alert("올바른 파일 형식이 아닙니다.");
                        return;
                    }
                    file.arrayBuffer()
                    .then(buffer => this.audioContext.decodeAudioData(buffer))
                    .then(audioBuffer => {
                        let audioBufferSourceNode = this.audioContext.createBufferSource();
                        audioBufferSourceNode.buffer = audioBuffer;
                        console.log(audioBufferSourceNode);
                        this.audioCurrent = audioBufferSourceNode;
                    })
                    .catch(e => console.log(e));
                };
                $input.click();
            }
        });

        this.playAudio = new PlayAudio({
            playAudio: () => {
                this.audioCurrent.connect(this.audioContext.destination)
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                this.audioCurrent.start();
            }
        });

        this.saveAudio = new SaveAudio({
            putFileName: () => {
                if(this.saveAudio.inputBlankOpen) return;
                this.saveAudio.inputBlankOpen = true;
                const $downloadAudio = document.querySelector('.DownloadAudio')
                const $filename = document.createElement('input')
                $filename.type = 'text'
                $filename.placeholder = '파일명을 입력하세요.'
                $downloadAudio.appendChild($filename);
        
                $filename.addEventListener('keydown', event => {
                    if(event.key == 'Enter'){
                        this.$saveAudio.readyToSaveFile(this.audioContext, this.audioCurrent, event.target.value);
                        $downloadAudio.innerHTML = ``;
                        this.$saveAudio.inputBlankOpen = false;
                    }
                })
            }
        });

        this.volumeChange = new VolumeChange({
            setVolume: volume => {
                this.audioGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
                //this.audioGain.gain.value = volume;
            }
        });
    }

    
    
                
}