import { LoadAudio } from "./LoadAudio.js";
import { RecordAudio } from "./RecordAudio.js";
import { AudioChannel } from "./AudioChannel.js";

export class AudioTrack{
    trackID = 0;

    audioCurrent = null; // 현재까지 편집한 오디오 데이터가 담긴 노드
    channels = []; // AudioChannel 생성자로 생성한 객체들의 배열
    numberOfChannels = 0; // 음원 로드/녹음에 따라 채널 수가 조정됨

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
        this.setTrackBackgroundImage(1000, 151)

        // event
        this.$copyButton = document.querySelector('.copyAudio')
        this.$cutButton = document.querySelector('.cutAudio')
        this.$pasteButton = document.querySelector('.pasteAudio')
        this.$trackElement.addEventListener('click', this.selectAudio.bind(this))
        this.$trackElement.querySelector('.trackChannelList').addEventListener('mousedown', this.mouseDown.bind(this))
        this.$trackElement.querySelector('.trackChannelList').addEventListener('mouseup', this.mouseUp.bind(this))
        this.$copyButton.addEventListener('click', this.copyWave.bind(this))
        this.$cutButton.addEventListener('click', () => {
            this.copyWave.call(this)
            this.deleteWave.call(this)
        })
        this.$pasteButton.addEventListener('click', this.pasteWave.bind(this, 0))
        this.$trackElement.querySelector('.muteAudio').addEventListener('click', this.mute);

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

    // methods for canvas
    setTrackBackgroundImage = (w, h) => {
        // Set up the canvas
        this.dpr = window.devicePixelRatio || 1;
        this.padding = 20;

        this.offsetWidth = w;
        this.offsetHeight = h;

        this.$canvas.width = this.offsetWidth// * this.dpr;
        this.$canvas.height = (this.offsetHeight + this.padding * 2)// * this.dpr;

        this.canvasCtx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
        this.canvasCtx.fillStyle = 'rgb(100, 100, 100)'; // draw wave with canvas
        this.canvasCtx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);

        //this.canvasCtx.scale(this.dpr, this.dpr);
        this.canvasCtx.translate(0, this.offsetHeight / 2 + this.padding); // Set Y = 0 to be in the middle of the canvas

        if(this.app.selectedTrackID === this.trackID){
            this.borderTrack();
        }
    }
    draw = () => {
        for(let i = 0; i < this.numberOfChannels; i++){
            let channel = this.channels[i];
            channel.draw(channel, this.audioSource.buffer.getChannelData(i), i);
        }
    }

    // methods for audio
    initAudioContext = () => {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioSource = this.audioContext.createBufferSource();
        this.audioAnalyser = this.audioContext.createAnalyser();

        this.gain = this.audioContext.createGain();
        this.audioConvolver = this.audioContext.createConvolver()
        this.masterGain = this.audioContext.createGain();
        this.masterCompression = this.audioContext.createDynamicsCompressor();
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
    }
    pause = () => {
        this.audioSource.stop(0);
    }
    stop = () => {
        this.audioSource.stop(0);
    }
    getCurrentTime = () => {
        return (stopped) ? 0 : context.currentTime - startTime;
    }
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

    // methods for editing
    mouseDown = () => {
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.isDarkened) {
            this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
            this.selectedX1 = 0;
            this.selectedX2 = 0;
            return;
        }
        
        this.selectedX1 = window.event.clientX - this.$canvas.getBoundingClientRect().left;
    }
    mouseUp = () => {
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.isDarkened) {
            this.isDarkened = false;
            return;
        }
        this.isDarkened = true;
        
        this.selectedX2 = window.event.clientX - this.$canvas.getBoundingClientRect().left;

        this.darkenSelection(this.selectedX1, this.selectedX2)
    }
    selectAudio = () => {
        if(this.app.selectedTrackID === this.trackID) return;

        for(let i = 0; i < this.app.audioTracks.length; i++){
            let track = this.app.audioTracks[i]
            if(this.app.selectedTrackID === track.trackID){
                track.unborderTrack();
                break;
            }
        }
        this.app.selectedTrackID = this.trackID
        this.borderTrack();
    }
    borderTrack = () => {
        this.canvasCtx.fillStyle = 'rgb(255, 0, 0)'; // draw wave with canvas
        this.canvasCtx.fillRect(0, -this.$canvas.height/2, this.$canvas.width, 2);
        this.canvasCtx.fillRect(0, -this.$canvas.height/2, 2, this.$canvas.height);
        this.canvasCtx.fillRect(this.$canvas.width - 2, -this.$canvas.height/2, 2, this.$canvas.height);
        this.canvasCtx.fillRect(0, this.$canvas.height/2 - 2, this.$canvas.width, 2);
    }
    unborderTrack = () => {
        this.canvasCtx.fillStyle = 'rgb(100, 100, 100)'; // draw wave with canvas
        this.canvasCtx.fillRect(0, -this.$canvas.height/2, this.$canvas.width, 2);
        this.canvasCtx.fillRect(0, -this.$canvas.height/2, 2, this.$canvas.height);
        this.canvasCtx.fillRect(this.$canvas.width - 2, -this.$canvas.height/2, 2, this.$canvas.height);
        this.canvasCtx.fillRect(0, this.$canvas.height/2 - 2, this.$canvas.width, 2);
    }
    darkenSelection = (x1, x2) => {
        let left = (x1 < x2) ? x1 : x2
        let width = (x1 < x2) ? x2 - x1 : x1 - x2

        for(let i = 0; i < this.numberOfChannels; i++){
            let $canvas = this.channels[i].$canvas;
            let ctx = this.channels[i].canvasCtx;
            ctx.fillStyle = 'rgb(180, 180, 180)'; // draw wave with canvas
            ctx.fillRect(left,-$canvas.height/2,width,$canvas.height);
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
    copyWave = () => {
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.selectedX1 === this.selectedX2) return;

        const x1 = (this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2
        const x2 = (this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1

        const dataLength = this.audioSource.buffer.length;
        const samples = this.offsetWidth - 4;
        const blockSize = Math.floor(dataLength / samples);

        this.app.copiedBuffer = this.audioContext.createBuffer(
            this.audioSource.buffer.numberOfChannels, (x2 - x1) * blockSize, this.audioSource.buffer.sampleRate);

        for(let i = 0; i < this.numberOfChannels; i++){
            let srcData = this.audioSource.buffer.getChannelData(i);
            let copiedAudioData = new Float32Array((x2 - x1) * blockSize)// / this.dpr);
            for(let j = (x1 * blockSize); j < (x2 * blockSize); j++){
                copiedAudioData[j - (x1 * blockSize)] = srcData[j];
            }       
            this.app.copiedBuffer.copyToChannel(copiedAudioData, i)
        }
    }
    deleteWave = () => {
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.selectedX1 === this.selectedX2) return;

        const x1 = (this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2
        const x2 = (this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1

        const dataLength = this.audioSource.buffer.length;
        const samples = this.offsetWidth - 4;
        const blockSize = Math.floor(dataLength / samples);

        for(let i = 0; i < this.numberOfChannels; i++){
            let srcData = this.audioSource.buffer.getChannelData(i);
            for(let j = (x1 * blockSize); j < (x2 * blockSize); j++){
                srcData[j] = 0;
            }
            this.audioSource.buffer.copyToChannel(srcData, i)
        }
        this.draw();
        this.darkenSelection(this.selectedX1, this.selectedX2)
    }
    pasteWave = x => {
        if(this.app.selectedTrackID !== this.trackID || !this.app.copiedBuffer) {
            return;
        }
        const x1 = (this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2
        x = x1;

        let destData, pasteData, width;
        for(let i = 0; i < this.numberOfChannels; i++){
            destData = this.audioSource.buffer.getChannelData(i);
            const samples = this.channels[i].offsetWidth;
            const blockSize = Math.floor(destData.length / samples);
            pasteData = this.app.copiedBuffer.getChannelData(i);
            const start = (x * blockSize)// / this.dpr

            for(let j = 0; j < pasteData.length; j++){
                destData[j + start] = pasteData[j];
            }

            this.audioSource.buffer.copyToChannel(destData, i)
        }

        this.draw();
        // this.selectedX1 = x;
        // this.selectedX2 = x + width;

        if(this.selectedX1 !== this.selectedX2){
            this.darkenSelection(this.selectedX1, this.selectedX2)
        }
    }
}