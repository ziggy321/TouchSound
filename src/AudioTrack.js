import { LoadAudio } from "./LoadAudio.js";
import { AudioChannel } from "./AudioChannel.js";
import { PlayAudio } from "./PlayAudio.js";

export class AudioTrack{
    trackID = 0;

    audioCurrent = null; // 현재까지 편집한 오디오 데이터가 담긴 노드
    channels = []; // AudioChannel의 배열
    numberOfChannels = 0; // 음원 로드/녹음에 따라 채널 수가 조정됨

    isRendered = false;

    mousePressed = false;
    isDarkened = false; // 선택된 영역(darkened)이 있는지
    selectedX1 = 0; // 드래그할 때 마우스를 누른 캔버스 좌표
    selectedX2 = 0; // 드래그할 때 마우스를 뗀 캔버스 좌표

    volume = 1;
    isMuted = false;
    mutedVolume = 0;
    rate = 1;

    constructor({app, id}){
        this.app = app;
        this.trackID = id;

        this.waveColor = "#" + Math.round(Math.random() * 0x888888).toString(16);

        // DOM Components
        const $trackList = document.querySelector('.trackList')
        this.$trackElement = document.createElement('div')
        this.$trackElement.className = 'trackElement'
        this.$trackElement.innerHTML = `
            <div class='trackInterface'>
                <span style='display: none'>${id}</span>
                <button class="loadAudio">
                    <span>Load</span>
                </button>
                <button class="muteAudio">
                    <span>Mute</span>
                </button>
                <button class="closeAudio">
                    <span>X</span>
                </button>
            </div>
            <div class='trackChannelList'></div>
            `;
        $trackList.appendChild(this.$trackElement)
        
        // draw track canvas
        this.$canvas = document.createElement('canvas');
        this.$canvas.className = 'trackBackground';
        this.$trackElement.querySelector('.trackChannelList').appendChild(this.$canvas)
        this.canvasCtx = this.$canvas.getContext('2d');
        this.offsetWidth = 0;
        this.dpr = window.devicePixelRatio || 1;
        this.padding = app.wavePadding;
        this.draw(this.app.defaultWidth, this.app.defaultHeight * this.app.$zoomVerticalValue.value)
        // event
        this.$trackChannelList = this.$trackElement.querySelector('.trackChannelList')
        this.$copyButton = document.querySelector('.copyAudio')
        this.$cutButton = document.querySelector('.cutAudio')
        this.$pasteButton = document.querySelector('.pasteAudio')
        this.$deleteButton = document.querySelector('.deleteAudio')
        this.$trackElement.addEventListener('click', this.selectAudio.bind(this))
        this.$trackChannelList.addEventListener('mousedown', this.mouseDown.bind(this))
        this.$trackChannelList.addEventListener('mousemove', this.mouseMove.bind(this))
        this.$trackChannelList.addEventListener('mouseup', this.mouseUp.bind(this))
        this.$copyButton.addEventListener('click', this.copyWave.bind(this))
        this.$cutButton.addEventListener('click', () => {
            this.copyWave.call(this)
            this.deleteWave.call(this)
        })
        this.$pasteButton.addEventListener('click', this.pasteWave.bind(this))
        this.$deleteButton.addEventListener('click', this.deleteWave.bind(this))
        
        // initialize audio context
        // this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.initAudio();

        this.loadAudio = new LoadAudio({
            track: this,
            $trackElement: this.$trackElement
        });

        this.playAudio = new PlayAudio({
            track: this,
            $trackElement: this.$trackElement
        });
    }

    // methods for canvas
    draw = (w, h = this.offsetHeight) => {
        // draw track canvas
        if(w > this.offsetWidth){
            this.offsetWidth = w;

            this.$canvas.width = this.offsetWidth

            this.canvasCtx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
            this.canvasCtx.fillStyle = 'rgb(100, 100, 100)';
            this.canvasCtx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);
            
            this.canvasCtx.translate(0, this.offsetHeight / 2 + this.padding); // Set Y = 0 to be in the middle of the canvas
        }
        if(h !== this.offsetHeight){
            this.offsetHeight = h;

            this.$canvas.height = (this.offsetHeight + this.padding * 2)

            this.canvasCtx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
            this.canvasCtx.fillStyle = 'rgb(100, 100, 100)';
            this.canvasCtx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);
            
            this.canvasCtx.translate(0, this.offsetHeight / 2 + this.padding); // Set Y = 0 to be in the middle of the canvas
        }

        if(this.app.selectMode === 'track' && this.app.selectedTrackID === this.trackID){
            this.borderTrack();
        }

        // draw wave
        for(let i = 0; i < this.numberOfChannels; i++){
            let channel = this.channels[i];
            
            channel.draw(this.offsetWidth - this.app.trackPadding * 2, 
                (this.offsetHeight - this.app.trackPadding * 2 - this.numberOfChannels - 1) / this.numberOfChannels)
        }
        
        if(this.isDarkened){
            this.darkenSelection(this.selectedX1, this.selectedX2);
        }
    }

    setBlockSize = sampleRate => {
        this.blockSize = Math.floor(sampleRate / this.app.samplePerDuration);
        // samplePerDuration은 1 duration당 몇 개의 sample을 생성할지 결정한다.
        // 1 duration 당 data의 길이(오디오 데이터 배열의 길이)는 48000이다.
        // 이를 samplePerDuration으로 나누면 blockSize(샘플 1개의 길이)가 된다.
    }

    // methods for audio
    initAudio = () => {
        // setup the audioContext
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.audioSource = this.audioContext.createBufferSource();
        this.gain = this.audioContext.createGain();
        this.volume = this.gain.gain.value;
        // this.audioConvolver = this.audioContext.createConvolver()
        // this.masterGain = this.audioContext.createGain();
        // this.masterCompression = this.audioContext.createDynamicsCompressor();
    }
    audioCurrentGetStream = () => {
        this.audioSource.connect(this.gain);
        this.gain.connect(this.audioContext.destination);
        // this.gain.connect(this.audioConvolver);
        // this.audioConvolver.connect(this.masterGain);
        // this.masterGain.connect(this.masterCompression);
    }
    loadBuffer = audioBuffer => {
        let audioBufferSourceNode = this.audioContext.createBufferSource();
        audioBufferSourceNode.buffer = audioBuffer;
        this.setAudioSource(audioBufferSourceNode)

        this.setBlockSize(audioBuffer.sampleRate)

        for(let i = 0; i < this.numberOfChannels; i++){
            let channel = new AudioChannel({
                track: this,
                $trackElement: this.$trackElement,
                channelNum: i
            })
            this.channels.push(channel)
        }
    }
    setAudioSource = audioSource => {//채널 변수와 멤버 수를 초기화
        this.audioSource = audioSource
        this.numberOfChannels = audioSource.buffer.numberOfChannels
        this.rateLevel = this.audioSource.playbackRate.value;
        
        if(this.app.selectedTrackID === this.trackID){
            this.showTrackAttributes();
        }
    }
    showTrackAttributes = () => {
        let $volume = document.querySelector(".volume")
        $volume.value =  Math.round(this.gain.gain.value * 10) / 10
        let $speed = document.querySelector(".speed")
        $speed.value = Math.round(this.audioSource.playbackRate.value * 10) / 10
    }
    play = startAt => {
        this.isPlaying = true;
        // if(this.audioSource.loop){
        //     if(startAt < this.audioSource.loopStart || startAt > this.audioSource.loopEnd){
        //         startAt = this.audioSource.loopStart
        //     }
        // }
        let usedSource = this.audioSource;
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = usedSource.buffer
        this.audioSource.playbackRate.value = usedSource.playbackRate.value

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.audioCurrentGetStream();
        this.audioSource.start(0, startAt, this.audioSource.buffer.duration);
    }
    stop = () => {
        this.isPlaying = false;
        this.audioSource.stop(0);
    }

    // methods for editing
    selectAudio = () => {
        if(this.app.selectMode !== 'track') return;
        if(this.app.selectedTrackID === this.trackID) return;

        for(var i in this.app.audioTracks){
            let track = this.app.audioTracks[i]
            if(this.app.selectedTrackID === track.trackID){
                track.unborderTrack();
                track.cancelDarkenSelection(track.selectedX1, track.selectedX2);
                track.selectedX1 = 0;
                track.selectedX2 = 0;
                break;
            }
        }
        this.app.selectedTrackID = this.trackID
        this.borderTrack();
        this.showTrackAttributes();
    }
    
    mouseDown = () => {
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.app.selectMode !== 'track') return;
        this.mousePressed = true;
        this.isDarkened = false;
        this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
        this.selectedX1 = Math.round(window.event.clientX - this.$canvas.getBoundingClientRect().left);
    };
    mouseMove = () => {
        if(!this.mousePressed) return;
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.app.selectMode !== 'track') return;
        this.isDarkened = true;
        this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
        this.selectedX2 = Math.round(window.event.clientX - this.$canvas.getBoundingClientRect().left);
        this.darkenSelection(this.selectedX1, this.selectedX2);
    };
    mouseUp = () => {
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.app.selectMode !== 'track') return;
        this.mousePressed = false;
        this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
        this.selectedX2 = Math.round(window.event.clientX - this.$canvas.getBoundingClientRect().left); //Update the current position X
        if(this.selectedX2 === this.selectedX1){
            if(this.app.isPlaying){
                this.app.wasPlaying = true;
                this.app.pauseAudio();
            }
            for(var i in this.app.audioTracks){
                let track = this.app.audioTracks[i];
                track.playAudio.drawPlaybackBar(this.selectedX2);
                let playbackBarSpeed = (track.app.samplePerDuration / track.app.sampleDensity);
                track.app.playbackTime = this.selectedX2 / playbackBarSpeed;
                track.app.$currentTime.innerText = new Date(track.app.playbackTime * 1000).toISOString().substr(11, 8);
            }
            if(this.app.wasPlaying){
                this.app.wasPlaying = false;
                this.app.playAudio();
            }

            this.selectedX1 = 0;
            this.selectedX2 = 0;
            this.isDarkened = false;
        }
        else{
            this.darkenSelection(this.selectedX1, this.selectedX2);
        }
    };
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
        if(x1 === x2) return;
        this.isDarkened = true;
        let left = (x1 < x2) ? x1 : x2
        let width = (x1 < x2) ? x2 - x1 : x1 - x2

        for(let i = 0; i < this.numberOfChannels; i++){
            let $canvas = this.channels[i].$canvas;
            let ctx = this.channels[i].canvasCtx;
            ctx.fillStyle = 'rgb(180, 180, 180)'; // draw wave with canvas
            ctx.fillRect(left,-$canvas.height/2,width,$canvas.height);
        }
    }
    cancelDarkenSelection = (x1, x2) => {
        if(x1 === x2) return;
        this.isDarkened = false;
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
        if(this.app.selectMode === 'channel') return;
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.selectedX1 === this.selectedX2) return;

        console.log(Math.abs(this.selectedX2 - this.selectedX1))

        const x1 = Math.round(((this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2) * this.app.sampleDensity);
        const x2 = Math.round(((this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1) * this.app.sampleDensity);

        const blockSize = this.blockSize

        this.app.copiedBuffer = this.audioContext.createBuffer(
            this.audioSource.buffer.numberOfChannels, (x2 - x1) * blockSize, this.audioSource.buffer.sampleRate);

        for(let i = 0; i < this.numberOfChannels; i++){
            let srcData = this.audioSource.buffer.getChannelData(i);
            let copiedAudioData = new Float32Array((x2 - x1) * blockSize)
            for(let j = (x1 * blockSize); j < (x2 * blockSize); j++){
                copiedAudioData[j - (x1 * blockSize)] = srcData[j];
            }
            this.app.copiedBuffer.copyToChannel(copiedAudioData, i)
        }
    }
    deleteWave = () => {
        if(this.app.selectMode === 'channel') return;
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.selectedX1 === this.selectedX2) return;

        const x1 = Math.round(((this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2) * this.app.sampleDensity);
        const x2 = Math.round(((this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1) * this.app.sampleDensity);

        const blockSize = this.blockSize

        for(let i = 0; i < this.numberOfChannels; i++){
            let srcData = this.audioSource.buffer.getChannelData(i);
            for(let j = (x1 * blockSize); j < (x2 * blockSize); j++){
                srcData[j] = 0;
            }
            this.audioSource.buffer.copyToChannel(srcData, i)
        }
        
        this.draw(this.offsetWidth, this.offsetHeight);
        this.darkenSelection(this.selectedX1, this.selectedX2)
    }
    pasteWave = () => {
        let playbackBarSpeed = this.app.samplePerDuration / this.app.sampleDensity;
        const x = Math.round(this.app.playbackTime * playbackBarSpeed);
        
        if(this.app.selectMode === 'channel') return;
        if(this.app.selectedTrackID !== this.trackID || !this.app.copiedBuffer) {
            return;
        }

        if(this.app.copiedBuffer.numberOfChannels !== this.numberOfChannels){
            if(this.numberOfChannels === 0){
                this.loadBuffer(this.app.copiedBuffer)
            }
            else{
                alert("채널 수가 같은 트랙에만 붙여넣기 가능합니다.")
                return;
            }
        }

        // if(this.app.copiedBuffer.sampleRate !== this.audioSource.buffer.sampleRate){
        //     let c = new OfflineAudioContext(this.app.copiedBuffer.numberOfChannels, this.app.copiedBuffer.length, 
        //         this.audioSource.buffer.sampleRate);
        //     let b = c.createBuffer(this.app.copiedBuffer.numberOfChannels, this.app.copiedBuffer.length, 
        //         this.app.copiedBuffer.sampleRate);
        //     b = this.app.copiedBuffer;
        //     let s = c.createBufferSource();
        //     s.buffer = b;
        //     s.connect(c.destination);
        //     s.start();
        //     c.startRendering().then(function (result) {
        //         this.app.copiedBuffer = result;
        //         this.pasteWave();
        //     });
        // }

        let prevData, pasteData, newData, newBuffer, prevDarken = false;
        const blockSize = this.blockSize
        for(let i = 0; i < this.numberOfChannels; i++){
            prevData = this.audioSource.buffer.getChannelData(i);
            pasteData = this.app.copiedBuffer.getChannelData(i);

            if(!this.isDarkened){
                const start = x * blockSize / this.app.sampleDensity;
                newData = this.float32ArrayConcat(prevData.slice(0, start), pasteData, prevData.slice(start))
            }
            else{
                prevDarken = true
                const x1 = Math.round(((this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2) * this.app.sampleDensity)
                const x2 = Math.round(((this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1) * this.app.sampleDensity)
                const start = x1 * blockSize
                const end = x2 * blockSize
                newData = this.float32ArrayConcat(prevData.slice(0, start), pasteData, prevData.slice(end))
            }

            if(i === 0){
                newBuffer = this.audioContext.createBuffer(this.numberOfChannels, 
                    newData.length, this.audioSource.buffer.sampleRate)
            }

            newBuffer.copyToChannel(newData, i)
        }
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = newBuffer;

        const trackWidth = this.audioSource.buffer.duration * this.app.samplePerDuration / this.app.sampleDensity
            + this.app.trackPadding * 2 + 1;
        this.draw(trackWidth, this.offsetHeight);
        
        const width = this.app.copiedBuffer.duration * this.app.samplePerDuration / this.app.sampleDensity
        
        this.cancelDarkenSelection(this.selectedX1, this.selectedX2)
        if(!prevDarken){
            this.selectedX1 = x;
            this.selectedX2 = x + width;
            this.isDarkened = true;
        }
        else{
            if(this.selectedX1 < this.selectedX2){
                this.selectedX2 = this.selectedX1 + width;
            }
            else{
                this.selectedX1 = this.selectedX2 + width;
            }
        }
        this.darkenSelection(this.selectedX1, this.selectedX2)
    }

    float32ArrayConcat = (...arrays) => {
        let totalLength = 0;
        for (let arr of arrays) {
            totalLength += arr.length;
        }
        let result = new Float32Array(totalLength);
        let offset = 0;
        for (let arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }
}