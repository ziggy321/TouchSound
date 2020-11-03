import { LoadAudio } from "./LoadAudio.js";
import { RecordAudio } from "./RecordAudio.js";
import { AudioChannel } from "./AudioChannel.js";

export class AudioTrack{
    trackID = 0;

    audioCurrent = null;
    channels = [];
    numberOfChannels = 1;

    pasteTarget = false;

    isMuted = false;
    MutedVolume = 0;

    constructor({app, id}){
        console.log('new track')
        this.app = app;
        this.trackID = id;

        const $trackList = document.querySelector('.trackList')
        this.$trackElement = document.createElement('div')
        this.$trackElement.className = 'trackElement'
        this.$trackElement.innerHTML = `
            <div class='trackInterface'>
                <button class="loadAudio">
                    <img src="img/loadButton.JPG" alt="" class="buttonInTrack">
                </button>
                <button class="recordAudio">
                    <img src="img/recordButton.JPG" alt="" class="buttonInTrack">
                </button>
                <a class="saveRecord">Save Record</a>
                <button class="muteAudio">
                    <img src="img/muteButton.JPG" alt="" class="buttonInTrack">
                </button>
            </div>
            <div class='trackChannelList'></div>
            `;
        $trackList.appendChild(this.$trackElement)

        this.initAudioContext();
        
        // setup the background canvas of track
        this.$canvas = document.createElement('canvas');
        this.$canvas.className = 'trackBackground';
        this.$trackElement.querySelector('.trackChannelList').appendChild(this.$canvas)
        this.canvasCtx = this.$canvas.getContext('2d');
        this.setTrackBackgroundImage(1000, 150)

        // event
        this.$copyButton = document.querySelector('.copyAudio')
        this.$cutButton = document.querySelector('.cutAudio')
        this.$pasteButton = document.querySelector('.pasteAudio')
        // this.$selectButton = document.querySelector('.selectAudio')
        this.$trackElement.querySelector('.trackChannelList').addEventListener('mousedown', this.mouseDown.bind(this))
        this.$trackElement.querySelector('.trackChannelList').addEventListener('mouseup', this.mouseUp.bind(this))
        this.$copyButton.addEventListener('click', this.copyWave.bind(this, false))
        this.$cutButton.addEventListener('click', this.copyWave.bind(this, true))
        this.$pasteButton.addEventListener('click', this.pasteWave.bind(this, 0))
        this.$trackElement.querySelector('.muteAudio').addEventListener('click', this.mute);
        // this.$selectButton.addEventListener('click', this.selectAudio.bind(this))
        // if(this.app.selectedTrackID === this.trackID){
        //     this.$selectButton.innerHTML = `<img src="img/selected.JPG" alt="" class="buttonInTrack">`
        // }

        // for event
        this.isDarkened = false;
        this.mouseDownLeft = 0;
        this.selectedX1 = 0;
        this.selectedX2 = 0;

        this.loadAudio = new LoadAudio({
            $trackElement: this.$trackElement,
            fetchFile: () => {
                console.log('load')
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
                        
                        this.setAudioSource(audioBufferSourceNode)

                        for(let i = 0; i < this.numberOfChannels; i++){
                            let channel = new AudioChannel({
                                track: this,
                                $trackElement: this.$trackElement,
                                channelNum: i
                            })
                            this.channels.push(channel)
                        }
                    })
                    .catch(e => console.log(e));
                };
                $input.click();
            }
        });

        this.recordAudio = new RecordAudio({
            $trackElement: this.$trackElement
        })
    }

    initAudioContext = () => {
        // setup the audioContext
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioSource = this.audioContext.createBufferSource();
        this.audioAnalyser = this.audioContext.createAnalyser();

        this.gain = this.audioContext.createGain();
        this.audioConvolver = this.audioContext.createConvolver()
        this.masterGain = this.audioContext.createGain();
        this.masterCompression = this.audioContext.createDynamicsCompressor();
    }
    setTrackBackgroundImage = (w, h) => {
        // Set up the canvas
        this.dpr = window.devicePixelRatio || 1;
        this.padding = 20;

        this.offsetWidth = w;
        this.offsetHeight = h;

        this.$canvas.width = this.offsetWidth// * this.dpr;
        this.$canvas.height = (this.offsetHeight + this.padding * 2)// * this.dpr;

        const WIDTH = this.$canvas.width;
        const HEIGHT = this.$canvas.height;

        this.canvasCtx.clearRect(0,0,WIDTH,HEIGHT);
        this.canvasCtx.fillStyle = 'rgb(100, 100, 100)'; // draw wave with canvas
        this.canvasCtx.fillRect(0,0,WIDTH,HEIGHT);

        //this.canvasCtx.scale(this.dpr, this.dpr);
        this.canvasCtx.translate(0, this.offsetHeight / 2 + this.padding); // Set Y = 0 to be in the middle of the canvas
    }
    setAudioSource = audioSource => {
        this.audioSource = audioSource
        this.numberOfChannels = audioSource.buffer.numberOfChannels
    }

    audioCurrentGetStream = () => {
        this.audioSource.connect(this.audioAnalyser);
        this.audioAnalyser.connect(this.gain);
        this.gain.connect(this.audioConvolver);
        this.audioConvolver.connect(this.masterGain);
        this.masterGain.connect(this.masterCompression);

        this.audioCurrent = this.gain;
        this.audioCurrent.connect(this.audioContext.destination);
    }

    play = startAt => {
        // if(this.audioSource.loop){
        //     if(startAt < this.audioSource.loopStart || startAt > this.audioSource.loopEnd){
        //         startAt = this.audioSource.loopStart
        //     }
        // }
        
        this.audioCurrentGetStream()
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.audioSource.start(startAt, 0, this.audioSource.buffer.duration);
        this.app.startTime = this.audioContext.currentTime; 
        this.app.stopped = false;
    }
    pause = () => {
        this.audioSource.stop(0);
        this.app.currentTime = this.audioContext.currentTime - this.app.startTime
        this.app.stopped = true;
    }
    stop = () => {
        this.audioSource.stop(0);
        this.app.startTime = 0;
        this.app.currentTime = 0;
        this.app.stopped = true;
    }
    getCurrentTime = () => {
        return (stopped) ? 0 : context.currentTime - startTime;
    }
    
    drawPlaybackBar = x => {
        this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(x, -this.$canvas.height)
        this.canvasCtx.lineTo(x, this.$canvas.height)
        this.canvasCtx.stroke();
        
        requestAnimationFrame(() => this.drawPlaybackBar(x))
    }

    // selectAudio = () => {
    //     if(this.app.selectedTrackID === this.trackID) return;
    //     this.$selectButton.innerHTML = `<img src="img/selected.JPG" alt="" class="buttonInTrack">`

    //     for(let i = 0; i < this.app.audioTracks.length; i++){
    //         let track = this.app.audioTracks[i]
    //         if(this.app.selectedTrackID === track.trackID){
    //             track.$selectButton.innerHTML = `<img src="img/notSelected.JPG" alt="" class="buttonInTrack">`
    //             break;
    //         }
    //     }

    //     this.app.selectedTrackID = this.trackID
    // }

    mute = () => {
        if(this.isMuted) {
            this.gain.gain.value = this.MutedVolume;
            return;
        }
        this.MutedVolume = this.gain.gain.value;
        this.gain.gain.value = 0;
    }
    setCurrentVolume = volume => {
        this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }
    setEntireVolume = volume => {
        this.masterGain.gain.value = volume;
    }
    setRate = rate => {
        this.audioSource.playbackRate.setValueAtTime(rate, this.audioContext.currentTime)
    }
    setPitch = newSemitones => {
        // const curSemitones = 12 * Math.log2(this.audioSource.playbackRate);
        // this.audioSource.playbackRate = Math.pow(2, newSemitones/12);
    }

    drawTrack = () => {
        for(let i = 0; i < this.numberOfChannels; i++){
            let channel = this.channels[i];
            channel.drawWave(channel, this.audioSource.buffer.getChannelData(i), i);
        }
    }

    mouseDown = () => {
        if(this.isDarkened) {
            this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
            this.selectedX1 = 0;
            this.selectedX2 = 0;
            return;
        }
        this.mouseDownLeft = this.$canvas.getBoundingClientRect().left;
        this.mouseDownTop = this.$canvas.getBoundingClientRect().top;
        this.selectedX1 = window.event.clientX - this.mouseDownLeft;
    }
    mouseUp = () => {
        if(this.isDarkened) {
            this.isDarkened = false;
            return;
        }
        this.isDarkened = true;
        
        this.selectedX2 = window.event.clientX - this.mouseDownLeft;

        this.darkenSelection(this.selectedX1, this.selectedX2)
    }
    darkenSelection = (x1, x2) => {
        let left = (x1 < x2) ? x1 : x2
        let width = (x1 < x2) ? x2 - x1 : x1 - x2

        for(let i = 0; i < this.numberOfChannels; i++){
            let $canvas = this.channels[i].$canvas;
            let ctx = this.channels[i].canvasCtx;
            ctx.fillStyle = 'rgb(180, 180, 180)'; // draw wave with canvas
            ctx.fillRect(left,-$canvas.height,width,$canvas.height * 2);
        }

        console.log('darken')
    }
    cancelDarkenSelection = (x1, x2) => {
        let left = (x1 < x2) ? x1 : x2
        let width = (x1 < x2) ? x2 - x1 : x1 - x2

        for(let i = 0; i < this.numberOfChannels; i++){
            let $canvas = this.channels[i].$canvas;
            let ctx = this.channels[i].canvasCtx;
            ctx.fillStyle = 'rgb(200, 200, 200)'; // draw wave with canvas
            ctx.fillRect(left,-$canvas.height,width,$canvas.height * 2);
        }
    }

    // 복사 혹은 잘라내기 실행 시 호출
    copyWave = cut => { // cut is true or false
        if(this.selectedX1 === this.selectedX2) return;
        console.log(cut)

        const x1 = (this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2
        const x2 = (this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1

        const dataLength = this.audioSource.buffer.length;
        const samples = this.offsetWidth - 4; // Number of samples we want to have in our final data set
        const blockSize = Math.floor(dataLength / samples); // the number of samples in each subdivision
        this.app.copiedBuffer = this.audioContext.createBuffer(
            this.audioSource.buffer.numberOfChannels, (x2 - x1) * blockSize, this.audioSource.buffer.sampleRate);

        for(let i = 0; i < this.numberOfChannels; i++){
            let srcData = this.audioSource.buffer.getChannelData(i);

            let copiedAudioData = new Float32Array((x2 - x1) * blockSize)// / this.dpr);

            for(let j = (x1 * blockSize); j < (x2 * blockSize); j++){
                copiedAudioData[j - (x1 * blockSize)] = srcData[j];
                if(cut){
                    srcData[j] = 0;
                }
            }
            if(cut){
                this.audioSource.buffer.copyToChannel(srcData, i)
            }        
            this.app.copiedBuffer.copyToChannel(copiedAudioData, i)
        }
        if(cut){
            this.drawTrack();
            this.darkenSelection(this.selectedX1, this.selectedX2)
        } 

        // let clipboard = document.createElement('input');
        // clipboard.value = this.copiedBuffer
        // console.log(clipboard.value)
        // clipboard.select();
        // document.execCommand('copy');
        
        console.log('copy')
    }
    pasteWave = x => {
        if(!this.app.copiedBuffer) return;
        if(this.app.selectedTrackID !== this.trackID) return;
        const x1 = (this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2
        x = x1;

        for(let i = 0; i < this.numberOfChannels; i++){
            let destData = this.audioSource.buffer.getChannelData(i);
            const samples = this.channels[i].offsetWidth; // Number of samples we want to have in our final data set
            const blockSize = Math.floor(destData.length / samples); // the number of samples in each subdivision
            let pasteData = this.app.copiedBuffer.getChannelData(i);
            const start = (x * blockSize)// / this.dpr

            for(let j = 0; j < pasteData.length; j++){
                destData[j + start] = pasteData[j];
            }

            this.audioSource.buffer.copyToChannel(destData, i)
        }

        this.drawTrack();
        if(this.selectedX1 !== this.selectedX2){
            this.darkenSelection(this.selectedX1, this.selectedX2)
        }
    }
}