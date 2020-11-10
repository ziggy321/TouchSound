import { LoadAudio } from "./LoadAudio.js";
import { RecordAudio } from "./RecordAudio.js";
import { AudioChannel } from "./AudioChannel.js";

export class AudioTrack{
    trackID = 0;

    audioNodes = {};
    audioCurrent = null; // 현재까지 편집한 오디오 데이터가 담긴 노드
    channels = []; // AudioChannel의 배열
    numberOfChannels = 0; // 음원 로드/녹음에 따라 채널 수가 조정됨

    isRendered = false;

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
        this.waveColor = "#" + Math.round(Math.random() * 0xffffff).toString(16);

        // DOM Components
        const $trackList = document.querySelector('.trackList')
        this.$trackElement = document.createElement('div')
        this.$trackElement.className = 'trackElement'
        this.$trackElement.innerHTML = `
            <div class='trackInterface'>
                <span style='display: none'>${id}</span>
                <button class="loadAudio">
                    <img src="img/loadButton.JPG" alt="" class="buttonInTrack">
                </button>
                <button class="recordAudio">
                    <img src="img/recordButton.JPG" alt="" class="buttonInTrack">
                </button>
                <button class="muteAudio">
                    <img src="img/muteButton.JPG" alt="" class="buttonInTrack">
                </button>
                <button class="closeAudio">
                    <img src="img/closeButton.JPG" alt="" class="buttonInTrack">
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
        this.draw(this.app.defaultWidth, this.app.defaultHeight)

        // event
        this.$trackChannelList = this.$trackElement.querySelector('.trackChannelList')
        this.$copyButton = document.querySelector('.copyAudio')
        this.$cutButton = document.querySelector('.cutAudio')
        this.$pasteButton = document.querySelector('.pasteAudio')
        this.$deleteButton = document.querySelector('.deleteAudio')
        this.$trackElement.addEventListener('click', this.selectAudio.bind(this))
        this.$trackChannelList.addEventListener('mousedown', this.mouseDown.bind(this))
        this.$trackChannelList.addEventListener('mouseup', this.mouseUp.bind(this))
        this.$copyButton.addEventListener('click', this.copyWave.bind(this))
        this.$cutButton.addEventListener('click', () => {
            this.copyWave.call(this)
            this.deleteWave.call(this)
        })
        this.$pasteButton.addEventListener('click', this.pasteWave.bind(this, this.app.playbackTime))
        this.$deleteButton.addEventListener('click', this.deleteWave.bind(this, this.app.playbackTime))
        this.$trackElement.querySelector('.muteAudio').addEventListener('click', this.mute);
        
        // initialize audio context
        // this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.initAudio();

        this.loadAudio = new LoadAudio({
            track: this,
            $trackElement: this.$trackElement
        });

        this.recordAudio = new RecordAudio({
            $trackElement: this.$trackElement
        })
    }

    // methods for canvas
    draw = (w, h = this.offsetHeight) => {
        // draw track canvas
        if(w > this.offsetWidth){
            this.offsetWidth = w;
            this.offsetHeight = h;

            this.$canvas.width = this.offsetWidth// * this.dpr;
            this.$canvas.height = (this.offsetHeight + this.padding * 2)// * this.dpr;

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
    initOfflineAudio = (numberOfChannels, length, sampleRate) => {
        this.offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
        this.audioSource = this.offlineContext.createBufferSource();
        this.gain = this.offlineContext.createGain();
        this.volume = this.gain.gain.value;
        this.audioConvolver = this.offlineContext.createConvolver()
        this.masterGain = this.offlineContext.createGain();
        this.masterCompression = this.offlineContext.createDynamicsCompressor();
    }
    loadBuffer = audioBuffer => {
        // this.initOfflineAudio(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate)
        // let audioBufferSourceNode = this.offlineContext.createBufferSource();
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

        // this.renderAudio();
    }
    setAudioSource = audioSource => {
        this.audioSource = audioSource
        this.numberOfChannels = audioSource.buffer.numberOfChannels
        this.rateLevel = this.audioSource.playbackRate.value;
        
        if(this.app.selectedTrackID === this.trackID){
            this.showTrackAttributes();
        }
    }
    renderAudio = () => {
        if(this.isRendered){
            let audioReplace = this.offlineContext.createBufferSource();
            audioReplace.buffer = this.audioSource.buffer;
            this.audioSource = audioReplace
        }
        this.isRendered = true;

        this.audioSource.connect(this.gain);
        this.gain.connect(this.offlineContext.destination);
        
        console.log(this.offlineContext.state)
        if(this.offlineContext.state === 'closed'){
            this.offlineContext.resume()
        }

        this.audioSource.start();
        this.offlineContext.startRendering().then(renderedBuffer => {
            this.audioCurrent = this.audioContext.createBufferSource();
            this.audioCurrent.buffer = renderedBuffer;
            this.audioCurrent.connect(this.audioContext.destination);

            for(let i = 0; i < this.numberOfChannels; i++){
                let channel = new AudioChannel({
                    track: this,
                    $trackElement: this.$trackElement,
                    channelNum: i
                })
                this.channels.push(channel)
            }

            const width = Math.floor(this.audioCurrent.buffer.duration)
                * this.app.samplePerDuration / this.app.sampleDensity + this.app.trackPadding * 2 + 1;
            this.draw(width)
        }).catch(function(err) {
            console.log('Rendering failed: ' + err);
            // Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
        });
        
    }

    showTrackAttributes = () => {
        let $volume = document.querySelector(".volume")
        $volume.value =  Math.round(this.gain.gain.value * 10) / 10
        let $speed = document.querySelector(".speed")
        $speed.value = Math.round(this.audioSource.playbackRate.value * 10) / 10
    }
    play = startAt => {
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
        this.audioSource.stop(0);
    }
    ////
    // drawPlaybackBar = x => {
    //     if(x >= this.$canvas.width){
    //         this.$canvas.width *= 2;
    //     }
    //     this.$canvas.height = this.app.defaultHeight + this.app.wavePadding * 2
    //     this.canvasCtx.lineWidth = 1;
    //     this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
    //     this.canvasCtx.beginPath();
    //     this.canvasCtx.moveTo(x, 0)
    //     this.canvasCtx.lineTo(x, this.$canvas.height)
    //     this.canvasCtx.stroke();
    // }
    ////

    // methods for editing
    selectAudio = () => {
        if(this.app.selectMode !== 'track') return;
        if(this.app.selectedTrackID === this.trackID) return;

        for(var i in this.app.audioTracks){
            let track = this.app.audioTracks[i]
            if(this.app.selectedTrackID === track.trackID){
                track.unborderTrack();
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
        if(this.isDarkened) {
            this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
            this.selectedX1 = 0;
            this.selectedX2 = 0;
            return;
        }
        
        if(this.app.selectMode !== 'track') return;
        this.selectedX1 = window.event.clientX - this.$canvas.getBoundingClientRect().left
    }
    mouseUp = () => {
        if(this.app.selectedTrackID !== this.trackID) {
            return;
        }
        if(this.isDarkened) {
            this.isDarkened = false;
            return;
        }
        
        if(this.app.selectMode !== 'track') return;
        this.isDarkened = true;
        this.selectedX2 = window.event.clientX - this.$canvas.getBoundingClientRect().left

        this.darkenSelection(this.selectedX1, this.selectedX2)
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
    }
    cancelDarkenSelection = (x1, x2) => {
        if(x1 === x2) return;
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

        const x1 = (this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2
        const x2 = (this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1

        const blockSize = this.app.blockSize

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

        const x1 = (this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2
        const x2 = (this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1

        const blockSize = this.app.blockSize

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
    pasteWave = x => {
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

        let destData, pasteData;
        const blockSize = this.app.blockSize
        for(let i = 0; i < this.numberOfChannels; i++){
            destData = this.audioSource.buffer.getChannelData(i);
            pasteData = this.app.copiedBuffer.getChannelData(i);
            const start = (x * blockSize)

            for(let j = 0; j < pasteData.length; j++){
                destData[j + start] = pasteData[j];
            }

            this.audioSource.buffer.copyToChannel(destData, i)
        }
        
        this.draw(this.offsetWidth, this.offsetHeight);
        
        const width = this.app.copiedBuffer.duration * this.app.samplePerDuration / this.app.sampleDensity
        
        this.cancelDarkenSelection(this.selectedX1, this.selectedX2)
        this.selectedX1 = x;
        this.selectedX2 = x + width;
        this.isDarkened = true;
        this.darkenSelection(this.selectedX1, this.selectedX2)
    }
}