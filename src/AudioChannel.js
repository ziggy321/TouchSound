import { AudioWave } from "./AudioWave.js";

export class AudioChannel{
    isDarkened = false; // 선택된 영역(darkened)이 있는지
    selectedX1 = 0; // 드래그할 때 마우스를 누른 캔버스 좌표
    selectedX2 = 0; // 드래그할 때 마우스를 뗀 캔버스 좌표

    mousePressed = false;

    constructor({track, $trackElement, channelNum}){
        this.track = track;
        this.channelNum = channelNum

        // setup channel canvas
        this.$canvas = document.createElement('canvas');
        this.$canvas.className = 'channelBackground';
        this.channelHeight = this.track.channelHeight;
        this.top = 2 + (this.channelHeight + this.track.app.trackPadding) * channelNum;
        this.$canvas.style = `
            z-index: 2;
            position: absolute;
            left: 2px;
            top: ${this.top}px;
        `;
        $trackElement.querySelector('.trackChannelList').appendChild(this.$canvas)
        this.canvasCtx = this.$canvas.getContext('2d');
        this.offsetWidth = 0;
        this.dpr = window.devicePixelRatio || 1;
        this.padding = track.padding / 2;

        // event
        this.$copyButton = document.querySelector('.copyAudio')
        this.$cutButton = document.querySelector('.cutAudio')
        this.$pasteButton = document.querySelector('.pasteAudio')
        this.$deleteButton = document.querySelector('.deleteAudio')
        this.track.$trackChannelList.addEventListener('click', event => {
            let currentY = event.clientY - this.track.$canvas.getBoundingClientRect().top
            if(currentY >= this.top && currentY <= this.top + this.channelHeight){
                this.selectChannel.call(this)
            }
        });
        this.track.$trackChannelList.addEventListener('mousedown', event => {
            let currentY = event.clientY - this.track.$canvas.getBoundingClientRect().top
            if(currentY >= this.top && currentY <= this.top + this.channelHeight){
                this.mouseDown.call(this)
            }
        })
        this.track.$trackChannelList.addEventListener('mousemove', event => {
            let currentY = event.clientY - this.track.$canvas.getBoundingClientRect().top
            if(currentY >= this.top && currentY <= this.top + this.channelHeight){
                this.mouseMove.call(this)
            }
        })
        this.track.$trackChannelList.addEventListener('mouseup', event => {
            let currentY = event.clientY - this.track.$canvas.getBoundingClientRect().top
            if(currentY >= this.top && currentY <= this.top + this.channelHeight){
                this.mouseUp.call(this)
            }
        })
        this.$copyButton.addEventListener('click', this.copyWave.bind(this))
        this.$cutButton.addEventListener('click', () => {
            this.copyWave.call(this)
            this.deleteWave.call(this)
        })
        this.$pasteButton.addEventListener('click', this.pasteWave.bind(this))
        this.$deleteButton.addEventListener('click', this.deleteWave.bind(this))

        this.audioWave = new AudioWave({
            channel: this, 
            audioData: this.track.audioSource.buffer.getChannelData(this.channelNum), 
            channelNum: channelNum
        })
    }

    draw = (w, h = this.offsetHeight) => {
        // Set up the canvas
        if(w > this.offsetWidth){
            this.offsetWidth = w;

            this.$canvas.width = this.offsetWidth

            this.canvasCtx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
            this.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            this.canvasCtx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);
            
            this.canvasCtx.translate(0, this.offsetHeight)
        }
        if(h !== this.offsetHeight){
            this.channelHeight = this.track.channelHeight;
            this.top = 2 + (this.channelHeight + this.track.app.trackPadding) * this.channelNum;
            this.$canvas.style = `
                z-index: 2;
                position: absolute;
                left: 2px;
                top: ${this.top}px;
            `;

            this.offsetHeight = h;

            this.$canvas.height = this.offsetHeight

            this.canvasCtx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
            this.canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            this.canvasCtx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);
            
            this.canvasCtx.translate(0, this.offsetHeight / 2)
        }

        if(this.track.app.selectMode === 'channel' &&
            this.track.trackID === this.track.app.selectedTrackID && this.channelNum === this.track.app.selectedChannelID){
            this.borderChannel();
        }

        // draw wave
        this.audioWave.draw(this.track.audioSource.buffer.getChannelData(this.channelNum))

        if(this.isDarkened){
            this.darkenSelection(this.selectedX1, this.selectedX2);
        }
    }

    // methods for editing
    selectChannel = () => {
        if(this.track.app.selectMode !== 'channel') return;
        if(this.track.app.selectedTrackID === this.track.trackID){
            if(this.track.app.selectedChannelID === this.channelNum){
                return;
            }
        }

        for(var i in this.track.app.audioTracks){
            let track = this.track.app.audioTracks[i]
            if(track.trackID === this.track.app.selectedTrackID){
                for(let j = 0; j < track.numberOfChannels; j++){
                    let channel = track.channels[j];
                    if(channel.channelNum === this.track.app.selectedChannelID){
                        channel.unborderChannel();
                        channel.cancelDarkenSelection(channel.selectedX1, channel.selectedX2);
                        channel.selectedX1 = 0;
                        channel.selectedX2 = 0;
                        break;
                    }
                }
                break;
            }
        }
        this.track.app.selectedTrackID = this.track.trackID;
        this.track.app.selectedChannelID = this.channelNum;
        this.borderChannel();
    }

    mouseDown = () => {
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(this.track.app.selectMode !== 'channel') return;
        this.mousePressed = true;
        this.isDarkened = false;
        this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
        this.selectedX1 = Math.round(window.event.clientX - this.$canvas.getBoundingClientRect().left);
    };
    mouseMove = () => {
        if(!this.mousePressed) return;
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(this.track.app.selectMode !== 'channel') return;
        this.isDarkened = true;
        this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
        this.selectedX2 = Math.round(window.event.clientX - this.$canvas.getBoundingClientRect().left);
        this.darkenSelection(this.selectedX1, this.selectedX2);
    };
    mouseUp = () => {
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(this.track.app.selectMode !== 'channel') return;
        this.mousePressed = false;
        this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
        this.selectedX2 = Math.round(window.event.clientX - this.$canvas.getBoundingClientRect().left); //Update the current position X
        if(this.selectedX2 === this.selectedX1){
            if(this.track.app.isPlaying){
                this.track.app.wasPlaying = true;
                this.track.app.pauseAudio();
            }
            for(var i in this.track.app.audioTracks){
                let track = this.track.app.audioTracks[i];
                track.playAudio.drawPlaybackBar(this.selectedX2);
                let playbackBarSpeed = (track.app.samplePerDuration / track.app.sampleDensity);
                track.app.playbackTime = this.selectedX2 / playbackBarSpeed;
                track.app.$currentTime.innerText = new Date(track.app.playbackTime * 1000).toISOString().substr(11, 8);
            }
            if(this.track.app.wasPlaying){
                this.track.app.wasPlaying = false;
                this.track.app.playAudio();
            }

            this.selectedX1 = 0;
            this.selectedX2 = 0;
            this.isDarkened = false;
        }
        else{
            this.darkenSelection(this.selectedX1, this.selectedX2);
        }
    };

    borderChannel = () => {
        console.log('borderChannel')
        this.track.canvasCtx.fillStyle = 'rgb(0, 0, 255)'; // draw wave with canvas
        this.track.canvasCtx.fillRect(0, -this.track.$canvas.height/2 + this.top - 2, this.track.$canvas.width, 2);
        this.track.canvasCtx.fillRect(0, -this.track.$canvas.height/2 + this.top - 2, 2, this.channelHeight + 2);
        this.track.canvasCtx.fillRect(this.track.$canvas.width - 2, -this.track.$canvas.height/2 + this.top, 2, this.channelHeight + 2);
        this.track.canvasCtx.fillRect(0, -this.track.$canvas.height/2 + this.top + this.channelHeight, this.track.$canvas.width, 2);
    }
    unborderChannel = () => {
        this.track.canvasCtx.fillStyle = 'rgb(100, 100, 100)'; // draw wave with canvas
        this.track.canvasCtx.fillRect(0, -this.track.$canvas.height/2 + this.top - 3, this.track.$canvas.width, 4);
        this.track.canvasCtx.fillRect(0, -this.track.$canvas.height/2 + this.top - 2, 4, this.channelHeight + 2);
        this.track.canvasCtx.fillRect(this.track.$canvas.width - 2, -this.track.$canvas.height/2 + this.top, 2, this.channelHeight + 2);
        this.track.canvasCtx.fillRect(0, -this.track.$canvas.height/2 + this.top + this.channelHeight - 1, this.track.$canvas.width, 4);
    }

    darkenSelection = (x1, x2) => {
        if(x1 === x2) return;
        let left = (x1 < x2) ? x1 : x2
        let width = (x1 < x2) ? x2 - x1 : x1 - x2

        this.canvasCtx.fillStyle = 'rgb(180, 180, 180)'; // draw wave with canvas
        this.canvasCtx.fillRect(left,-this.$canvas.height/2,width,this.$canvas.height);
        this.isDarkened = true;

        // if(this.track.app.selectMode === 'channel' &&
        //     this.track.app.selectedTrackID === this.track.trackID && this.track.app.selectedChannelID === this.channelNum) {
        //     this.borderChannel();
        // }
    }
    cancelDarkenSelection = (x1, x2) => {
        if(x1 === x2) return;
        let left = (x1 < x2) ? x1 : x2
        let width = (x1 < x2) ? x2 - x1 : x1 - x2
        
        this.canvasCtx.fillStyle = 'rgb(200, 200, 200)'; // draw wave with canvas
        this.canvasCtx.fillRect(left,-this.$canvas.height/2,width,this.$canvas.height);
        this.isDarkened = false;

        // if(this.track.app.selectMode === 'channel' &&
        //     this.track.app.selectedTrackID === this.track.trackID && this.track.app.selectedChannelID === this.channelNum) {
        //     this.borderChannel();
        // }
    }
    copyWave = () => {
        if(this.track.app.selectMode !== 'channel') return;
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(this.selectedX1 === this.selectedX2) return;

        const x1 = ((this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2) * this.track.app.sampleDensity;
        const x2 = ((this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1) * this.track.app.sampleDensity;

        const blockSize = this.track.blockSize

        let srcData = this.track.audioSource.buffer.getChannelData(this.channelNum);
        this.track.app.copiedChannel = new Float32Array((x2 - x1) * blockSize)
        for(let j = (x1 * blockSize); j < (x2 * blockSize); j++){
            this.track.app.copiedChannel[j - (x1 * blockSize)] = srcData[j];
        }
        this.track.app.copiedChannelDuration = x2 - x1;
    }
    deleteWave = () => {
        if(this.track.app.selectMode !== 'channel') return;
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(this.selectedX1 === this.selectedX2) return;

        const x1 = ((this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2) * this.track.app.sampleDensity;
        const x2 = ((this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1) * this.track.app.sampleDensity;

        const blockSize = this.track.blockSize

        let srcData = this.track.audioSource.buffer.getChannelData(this.channelNum);
        for(let j = (x1 * blockSize); j < (x2 * blockSize); j++){
            srcData[j] = 0;
        }
        this.track.audioSource.buffer.copyToChannel(srcData, this.channelNum)
        
        this.draw(this.offsetWidth, this.offsetHeight);
        this.darkenSelection(this.selectedX1, this.selectedX2)
    }
    pasteWave = () => {
        if(this.track.app.selectMode !== 'channel') return;
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(!this.track.app.copiedChannel) {
            return;
        }

        let playbackBarSpeed = this.track.app.samplePerDuration / this.track.app.sampleDensity;
        const x = this.track.app.playbackTime * playbackBarSpeed;

        let prevData, pasteData, newData, newBuffer, prevDarken = false;
        
        const blockSize = this.track.blockSize

        prevData = this.track.audioSource.buffer.getChannelData(this.channelNum);
        pasteData = this.track.app.copiedChannel;

        if(!this.isDarkened){
            const start = x * blockSize
            newData = this.float32ArrayConcat(prevData.slice(0, start), pasteData, prevData.slice(start))
        }
        else{
            prevDarken = true
            const x1 = ((this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2) * this.track.app.sampleDensity;
            const x2 = ((this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1) * this.track.app.sampleDensity;
            const start = x1 * blockSize
            const end = x2 * blockSize
            newData = this.float32ArrayConcat(prevData.slice(0, start), pasteData, prevData.slice(end))
        }

        newBuffer = this.track.audioContext.createBuffer(this.track.numberOfChannels, 
            newData.length, this.track.audioSource.buffer.sampleRate)

        for(let i = 0; i < this.track.numberOfChannels; i++){
            if(i === this.channelNum){
                newBuffer.copyToChannel(newData, this.channelNum)
            }
            else{
                newBuffer.copyToChannel(this.track.audioSource.buffer.getChannelData(i), i)
            }
        }

        this.track.audioSource = this.track.audioContext.createBufferSource();
        this.track.audioSource.buffer = newBuffer;
    
        const trackWidth = this.track.audioSource.buffer.duration * this.track.app.samplePerDuration / this.track.app.sampleDensity
            + this.track.app.trackPadding * 2 + 1;
        this.track.draw(trackWidth);

        const width = this.track.app.copiedChannelDuration / this.track.app.sampleDensity

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