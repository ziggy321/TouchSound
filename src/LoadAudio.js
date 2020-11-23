export class LoadAudio{
    constructor({track, $trackElement}){
        this.track = track;
        const $loadAudio = $trackElement.querySelector('.loadAudio');
        $loadAudio.type = "file";
        $loadAudio.accept = "audio/*";
        $loadAudio.style = 'display: block;'

        $loadAudio.addEventListener('click', this.fetchFile.bind(track));
    }

    fetchFile = () => {
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
            .then(buffer => this.track.audioContext.decodeAudioData(buffer))
            .then(audioBuffer => {
                console.log(audioBuffer.sampleRate, audioBuffer.length, audioBuffer.duration)
                if(this.track.app.isPlaying){
                    this.track.app.stopAudio();
                }
                this.track.loadBuffer.call(this.track, audioBuffer)
                const width = Math.floor(this.track.audioSource.buffer.duration)
                    * this.track.app.samplePerDuration / this.track.app.sampleDensity + this.track.app.trackPadding * 2 + 1;
                this.track.draw(width)
            })
            .catch(e => console.log(e));
        };
        $input.click();
    }
}