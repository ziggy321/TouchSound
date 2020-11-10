export class PlayAudio{
    constructor({app, playAudio, pauseAudio, stopAudio}){
        this.app = app;

        const $playAudio = document.querySelector('.playAudio');
        const $pauseAudio = document.querySelector('.pauseAudio');
        const $stopAudio = document.querySelector('.stopAudio');

        $playAudio.addEventListener('click', playAudio);
        $pauseAudio.addEventListener('click', pauseAudio);
        $stopAudio.addEventListener('click', stopAudio);

        this.$canvas = document.createElement('canvas');
        this.$canvas.className = 'playbackBar';
        document.querySelectorAll('.trackChannelList').forEach($item => {
            $item.appendChild(this.$canvas)
        })
        this.$canvas.height = this.app.defaultHeight + this.app.wavePadding * 2
        this.canvasCtx = this.$canvas.getContext('2d');
    }

    drawPlaybackBar = x => {
        if(x >= this.$canvas.width){
            this.$canvas.width *= 2;
        }
        this.$canvas.height = this.app.defaultHeight + this.app.wavePadding * 2
        this.canvasCtx.lineWidth = 1;
        this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(x, 0)
        this.canvasCtx.lineTo(x, this.$canvas.height)
        this.canvasCtx.stroke();
    }
}