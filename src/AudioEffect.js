export class AudioEffect{
    volumeChangeUnit = 0.1
    speedChangeUnit = 0.1

    constructor({app}){
        this.app = app;

        this.$volume = document.querySelector(".volume")
        this.$volumeUpButton = document.querySelector('.volumeUp')
        this.$volumeDownButton = document.querySelector('.volumeDown')
        this.$speed = document.querySelector(".speed")
        this.$speedUpButton = document.querySelector('.speedUp')
        this.$speedDownButton = document.querySelector('.speedDown')

        this.$volume.addEventListener('keyup', event => {
            if(event.key === 'Enter'){
                this.setVolume();
            }
        })
        this.$volumeUpButton.addEventListener('click', this.volumeUp.bind(this))
        this.$volumeDownButton.addEventListener('click', this.volumeDown.bind(this))
        this.$speed.addEventListener('keyup', event => {
            if(event.key === 'Enter'){
                this.setSpeed();
            }
        })
        this.$speedUpButton.addEventListener('click', this.speedUp.bind(this))
        this.$speedDownButton.addEventListener('click', this.speedDown.bind(this))

        document.addEventListener('click', event => {
            document.querySelectorAll('.muteAudio').forEach($item => {
                if($item.contains(event.target)){
                    this.mute.call(this, $item);
                }
            })
        })
    }

    mute = $item => {
        const id = $item.parentNode.querySelector('span').innerText;
        let track = this.app.audioTracks[id];

        if(track.isMuted) {
            track.gain.gain.value = track.mutedVolume;
            track.isMuted = false;
            return;
        }
        track.mutedVolume = track.gain.gain.value;
        track.gain.gain.value = 0;
        track.isMuted = true;
    }
    getTrack = () => {
        if(this.app.selectMode === 'channel'){
            alert('이 기능은 Edit Mode가 Track일 때에만 가능합니다.')
            return null;
        }
        const id = this.app.selectedTrackID
        let track = this.app.audioTracks[id];
        return track;
    }
    setVolume = () => {
        let track = this.getTrack();
        if(!track) {
            this.$volume.value = 1
            return;
        }
        if(this.$volume.value < 0){
            this.$volume.value = 0;
        }
        if(track.isMuted){
            track.mutedVolume = Math.round(this.$volume.value * 10) / 10
            this.$volume.value = Math.round(this.$volume.value * 10) / 10
        }
        else{
            track.gain.gain.value = Math.round(this.$volume.value * 10) / 10
            this.$volume.value = Math.round(this.$volume.value * 10) / 10
        }
        track.draw();
    }
    volumeUp = () => {
        let track = this.getTrack();
        if(!track) return;
        if(track.isMuted){
            track.mutedVolume += this.volumeChangeUnit;
            this.$volume.value = Math.round(track.mutedVolume * 10) / 10
        }
        else{
            track.gain.gain.value += this.volumeChangeUnit;
            this.$volume.value = Math.round(track.gain.gain.value * 10) / 10
        }
        track.draw();
    }
    volumeDown = () => {
        let track = this.getTrack();
        if(!track) return;
        if(track.isMuted){
            if(Math.round(track.mutedVolume * 10) / 10 === 0) return;
            track.mutedVolume -= this.volumeChangeUnit;
            this.$volume.value = Math.round(track.mutedVolume * 10) / 10
        }
        else{
            if(Math.round(track.gain.gain.value * 10) / 10 === 0) return;
            track.gain.gain.value -= this.volumeChangeUnit;
            this.$volume.value = Math.round(track.gain.gain.value * 10) / 10
        }
        track.draw();
    }
    setSpeed = () => {     
        let track = this.getTrack();

        if(!track) {
            this.$speed.value = 1
            return;
        }
        let prevRate = Math.round(track.audioSource.playbackRate.value * 10) / 10
        let rate = Math.round(this.$speed.value * 10) / 10
        if(rate < 0){
            rate = 1;
        }
        track.audioSource.playbackRate.value = rate
        this.$speed.value = rate
            
        track.draw(Math.round(track.offsetWidth * prevRate / rate));
        
        if(this.app.isPlaying){
            this.app.pauseAudio();
            this.app.playAudio();
        }
    }
    speedUp = () => {
        let track = this.getTrack();
            
        if(!track) {
            return;
        }
        let prevRate = Math.round(track.audioSource.playbackRate.value * 10) / 10
        let rate = Math.round(track.audioSource.playbackRate.value * 10) / 10 + this.speedChangeUnit;
        rate = Math.round(rate * 10) / 10;
        track.audioSource.playbackRate.value = rate
        track.rate = rate
        this.$speed.value = rate
            
        track.draw(Math.round(track.offsetWidth * prevRate / rate));
        
        if(this.app.isPlaying){
            this.app.pauseAudio();
            this.app.playAudio();
        }
    }
    speedDown = () => {
        let track = this.getTrack();

        if(!track) {
            return;
        }
        let prevRate = Math.round(track.audioSource.playbackRate.value * 10) / 10
        let rate = Math.round(track.audioSource.playbackRate.value * 10) / 10 - this.speedChangeUnit;
        if(rate < 0) {
            return;
        }
        rate = Math.round(rate * 10) / 10;
        track.audioSource.playbackRate.value = rate
        this.$speed.value = rate
            
        track.draw(Math.round(track.offsetWidth * prevRate / rate));
        
        if(this.app.isPlaying){
            this.app.pauseAudio();
            this.app.playAudio();
        }
    }
}