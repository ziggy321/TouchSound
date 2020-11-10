import { AudioWave } from "./AudioWave.js";

export class AudioChannel{
    isDarkened = false; // 선택된 영역(darkened)이 있는지
    selectedX1 = 0; // 드래그할 때 마우스를 누른 캔버스 좌표
    selectedX2 = 0; // 드래그할 때 마우스를 뗀 캔버스 좌표

    constructor({track, $trackElement, channelNum}){
        this.track = track;
        this.channelNum = channelNum

        // setup channel canvas
        this.$canvas = document.createElement('canvas');
        this.$canvas.className = 'channelBackground';
        const channelHeight = (track.$canvas.height - 4 - (track.numberOfChannels - 1)*2) / track.numberOfChannels
        const top = 2 + (channelHeight + 2) * channelNum;
        this.$canvas.style = `
            z-index: 2;
            position: absolute;
            left: 2px;
            top: ${top}px;
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
            if(currentY >= top && currentY <= top + channelHeight){
                this.selectChannel.call(this)
            }
        });
        this.track.$trackChannelList.addEventListener('mousedown', event => {
            let currentY = event.clientY - this.track.$canvas.getBoundingClientRect().top
            if(currentY >= top && currentY <= top + channelHeight){
                this.mouseDown.call(this)
            }
        })
        this.track.$trackChannelList.addEventListener('mouseup', event => {
            let currentY = event.clientY - this.track.$canvas.getBoundingClientRect().top
            if(currentY >= top && currentY <= top + channelHeight){
                this.mouseUp.call(this)
            }
        })
        this.$copyButton.addEventListener('click', this.copyWave.bind(this))
        this.$cutButton.addEventListener('click', () => {
            this.copyWave.call(this)
            this.deleteWave.call(this)
        })
        this.$pasteButton.addEventListener('click', this.pasteWave.bind(this, this.track.app.playbackTime))
        this.$deleteButton.addEventListener('click', this.deleteWave.bind(this, this.track.app.playbackTime))

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
            this.offsetHeight = h;

            this.$canvas.width = this.offsetWidth// * this.dpr;
            this.$canvas.height = (this.offsetHeight + this.padding * 2)// * this.dpr;

            this.canvasCtx.clearRect(0, 0, this.$canvas.width, this.$canvas.height);
            this.canvasCtx.fillStyle = 'rgb(200, 200, 200)'; // draw wave with canvas
            this.canvasCtx.fillRect(0, 0, this.$canvas.width, this.$canvas.height);
            
            this.canvasCtx.translate(0, this.offsetHeight / 2 + this.padding); // Set Y = 0 to be in the middle of the canvas
        }

        if(this.track.app.selectMode === 'channel' &&
            this.track.trackID === this.track.app.selectedTrackID && this.channelNum === this.track.app.selectedChannelID){
            this.borderChannel();
        }

        // draw wave
        this.audioWave.draw(this.track.audioSource.buffer.getChannelData(this.channelNum))
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
                        break;
                    }
                }
                break;
            }
        }
        this.track.app.selectedTrackID = this.track.trackID
        this.track.app.selectedChannelID = this.channelNum
        this.borderChannel();
    }

    mouseDown = () => {
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(this.isDarkened) {
            this.cancelDarkenSelection(this.selectedX1, this.selectedX2);
            this.selectedX1 = 0;
            this.selectedX2 = 0;
            return;
        }
        if(this.track.app.selectMode !== 'channel') return;
        
        this.selectedX1 = window.event.clientX - this.$canvas.getBoundingClientRect().left;
    }
    mouseUp = () => {
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(this.isDarkened) {
            this.isDarkened = false;
            return;
        }
        if(this.track.app.selectMode !== 'channel') return;
        this.isDarkened = true;
        
        this.selectedX2 = window.event.clientX - this.$canvas.getBoundingClientRect().left;

        this.darkenSelection(this.selectedX1, this.selectedX2)
    }

    borderChannel = () => {
        this.canvasCtx.fillStyle = 'rgb(0, 0, 255)'; // draw wave with canvas
        this.canvasCtx.fillRect(0, -this.$canvas.height/2, this.$canvas.width, 2);
        this.canvasCtx.fillRect(0, -this.$canvas.height/2, 2, this.$canvas.height);
        this.canvasCtx.fillRect(this.$canvas.width - 2, -this.$canvas.height/2, 2, this.$canvas.height);
        this.canvasCtx.fillRect(0, this.$canvas.height/2 - 2, this.$canvas.width, 2);
    }
    unborderChannel = () => {
        this.canvasCtx.fillStyle = 'rgb(200, 200, 200)'; // draw wave with canvas
        this.canvasCtx.fillRect(0, -this.$canvas.height/2, this.$canvas.width, 2);
        this.canvasCtx.fillRect(0, -this.$canvas.height/2, 2, this.$canvas.height);
        this.canvasCtx.fillRect(this.$canvas.width - 2, -this.$canvas.height/2, 2, this.$canvas.height);
        this.canvasCtx.fillRect(0, this.$canvas.height/2 - 2, this.$canvas.width, 2);
    }

    darkenSelection = (x1, x2) => {
        let left = (x1 < x2) ? x1 : x2
        let width = (x1 < x2) ? x2 - x1 : x1 - x2

        this.canvasCtx.fillStyle = 'rgb(180, 180, 180)'; // draw wave with canvas
        this.canvasCtx.fillRect(left,-this.$canvas.height/2,width,this.$canvas.height);

        if(this.track.app.selectMode === 'channel' &&
            this.track.app.selectedTrackID === this.track.trackID && this.track.app.selectedChannelID === this.channelNum) {
            this.borderChannel();
        }
    }
    cancelDarkenSelection = (x1, x2) => {
        if(x1 === x2) return;
        let left = (x1 < x2) ? x1 : x2
        let width = (x1 < x2) ? x2 - x1 : x1 - x2
        
        this.canvasCtx.fillStyle = 'rgb(200, 200, 200)'; // draw wave with canvas
        this.canvasCtx.fillRect(left,-this.$canvas.height/2,width,this.$canvas.height);

        if(this.track.app.selectMode === 'channel' &&
            this.track.app.selectedTrackID === this.track.trackID && this.track.app.selectedChannelID === this.channelNum) {
            this.borderChannel();
        }
    }
    copyWave = () => {
        if(this.track.app.selectMode !== 'channel') return;
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(this.selectedX1 === this.selectedX2) return;

        const x1 = (this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2
        const x2 = (this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1
        
        console.log(x1, x2)

        const blockSize = this.track.app.blockSize

        let srcData = this.track.audioSource.buffer.getChannelData(this.channelNum);
        this.track.app.copiedChannel = new Float32Array((x2 - x1) * blockSize)
        for(let j = (x1 * blockSize); j < (x2 * blockSize); j++){
            this.track.app.copiedChannel[j - (x1 * blockSize)] = srcData[j];
        }
        this.track.app.copiedChannelDuration = x2 - x1
    }
    deleteWave = () => {
        if(this.track.app.selectMode !== 'channel') return;
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(this.selectedX1 === this.selectedX2) return;

        const x1 = (this.selectedX1 < this.selectedX2) ? this.selectedX1 : this.selectedX2
        const x2 = (this.selectedX1 < this.selectedX2) ? this.selectedX2 : this.selectedX1

        const blockSize = this.track.app.blockSize

        let srcData = this.track.audioSource.buffer.getChannelData(this.channelNum);
        for(let j = (x1 * blockSize); j < (x2 * blockSize); j++){
            srcData[j] = 0;
        }
        this.track.audioSource.buffer.copyToChannel(srcData, this.channelNum)
        
        this.draw(this.offsetWidth, this.offsetHeight);
        this.darkenSelection(this.selectedX1, this.selectedX2)
    }
    pasteWave = x => {
        console.log(this.track.app.selectMode)
        if(this.track.app.selectMode !== 'channel') return;
        if(this.track.app.selectedTrackID !== this.track.trackID || this.track.app.selectedChannelID !== this.channelNum) {
            return;
        }
        if(!this.track.app.copiedChannel) {
            return;
        }

        let destData, pasteData;
        destData = this.track.audioSource.buffer.getChannelData(this.channelNum);

        const blockSize = this.track.app.blockSize
        pasteData = this.track.app.copiedChannel;
        const start = (x * blockSize)

        for(let j = 0; j < pasteData.length; j++){
            destData[j + start] = pasteData[j];
        }

        this.track.audioSource.buffer.copyToChannel(destData, this.channelNum)

        this.draw(this.offsetWidth, this.offsetHeight);
        
        const width = this.track.app.copiedChannelDuration

        this.cancelDarkenSelection(this.selectedX1, this.selectedX2)
        this.selectedX1 = x;
        this.selectedX2 = x + width;
        this.isDarkened = true;
        
        console.log(x, x + width)

        this.darkenSelection(this.selectedX1, this.selectedX2)
    }
}