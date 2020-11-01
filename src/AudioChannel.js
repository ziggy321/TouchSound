import { AudioWave } from "./AudioWave.js";

export class AudioChannel{
    audioWaves = [];

    constructor({track, $trackElement, channelNum}){
        this.track = track;
        this.channelNum = channelNum

        this.$canvas = document.createElement('canvas');
        this.$canvas.className = 'channelBackground';
        this.$canvas.style = `
            z-index: 2;
            position: absolute;
            left: 2px;
            top: ${2 + (track.$canvas.height / track.numberOfChannels - 2 + 1) * channelNum}px;
        `;
        $trackElement.querySelector('.trackChannelList').appendChild(this.$canvas)

        this.canvasCtx = this.$canvas.getContext('2d');

        this.init(track.offsetWidth - 4, track.offsetHeight / track.numberOfChannels - 2)

        this.createWave(this, this.track.audioSource.buffer.getChannelData(this.channelNum), this.channelNum);
    }

    init = (w, h) => {
        // Set up the canvas
        this.dpr = window.devicePixelRatio || 1;
        this.padding = 10;

        this.offsetWidth = w;
        this.offsetHeight = h;

        this.$canvas.width = this.offsetWidth// * this.dpr;
        this.$canvas.height = (this.offsetHeight + this.padding * 2)// * this.dpr;

        const WIDTH = this.$canvas.width;
        const HEIGHT = this.$canvas.height;

        this.canvasCtx.clearRect(0,0,WIDTH,HEIGHT);
        this.canvasCtx.fillStyle = 'rgb(200, 200, 200)'; // draw wave with canvas
        this.canvasCtx.fillRect(0,0,WIDTH,HEIGHT);

        //this.canvasCtx.scale(this.dpr, this.dpr);
        this.canvasCtx.translate(0, this.offsetHeight / 2 + this.padding); // Set Y = 0 to be in the middle of the canvas
    }

    createWave = (channel, audioData, channelNum) => {
        let audioWave = new AudioWave({
            channel: channel, 
            audioData: audioData, 
            channelNum: channelNum
        })
        this.audioWaves.push(audioWave)
    }

    drawWave = (channel, audioData, channelNum) => {
        //if(this.audioWaves.length === 0) return;
        for(let i = 0; i < this.audioWaves.length; i++){
            let audioWave = this.audioWaves[i]
            audioWave.draw(channel, audioData, channelNum)
        }
    }

}