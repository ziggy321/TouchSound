export class PlayAudio{
    constructor({playAudio, pauseAudio, stopAudio}){
        const $playAudio = document.querySelector('.playAudio');
        const $pauseAudio = document.querySelector('.pauseAudio');
        const $stopAudio = document.querySelector('.stopAudio');

        $playAudio.addEventListener('click', playAudio);
        $pauseAudio.addEventListener('click', pauseAudio);
        $stopAudio.addEventListener('click', stopAudio);
    }
    
    drawPlaybackBar = x => {
        this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
        this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(x, -this.$canvas.height)
        this.canvasCtx.lineTo(x, this.$canvas.height)
        this.canvasCtx.stroke();
        
        requestAnimationFrame(() => this.drawPlaybackBar(x))
    }
}