export class PlayAudio{
    constructor({track, $trackElement}){
        this.track = track;

        this.$canvas = document.createElement('canvas');
        this.$canvas.className = 'playbackBar';
        $trackElement.querySelector('.trackChannelList').appendChild(this.$canvas)
        this.$canvas.height = this.track.app.defaultHeight + this.track.app.wavePadding * 2
        this.canvasCtx = this.$canvas.getContext('2d');
    }

    drawPlaybackBar = x => {
        if(x >= this.track.$canvas.width){
            clearInterval(this.track.app.timer[this.track.trackID]);
            return;
        }
        if(x >= this.$canvas.width){
            this.$canvas.width *= 2;
        }
        this.$canvas.height = this.track.app.defaultHeight * this.track.app.$zoomVerticalValue.value + this.track.app.wavePadding * 2
        this.canvasCtx.lineWidth = 1;
        this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(x, 0)
        this.canvasCtx.lineTo(x, this.$canvas.height)
        this.canvasCtx.stroke();
    }
}