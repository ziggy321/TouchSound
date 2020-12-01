export class PlayAudio{
        constructor({track, $trackElement}){
            this.track = track;
            this.$canvas = document.createElement('canvas');
            this.$canvas.className = 'playbackBar';
            this.$canvas.draggable = true;
            
            $trackElement.querySelector('.trackChannelList').appendChild(this.$canvas)
            this.$canvas.height = this.track.app.defaultHeight + this.track.app.wavePadding * 2
            this.canvasCtx = this.$canvas.getContext('2d');
            this.wasPlaying = false;
            document.addEventListener("dragstart", event => {
                if(this.track.mousePressed === true){
                    this.track.mousePressed = false;
                }
                for(var i in this.track.channels){
                    let channel = this.track.channels[i];
                    if(channel.mousePressed === true){
                        channel.mousePressed = false;
                    }
                }
                if(this.track.app.isPlaying){
                    this.wasPlaying = true;
                    this.track.app.pauseAudio();
                }
                this.$canvas.width = 4;
            }, false);
            document.addEventListener("dragover", event => {
                this.dragPlaybackBar(event);
            }, false);
            document.addEventListener("dragend", event => {
                this.dragPlaybackBar(event);
                if(this.wasPlaying){
                    this.wasPlaying = false;
                    this.track.app.playAudio();
                }
            }, false);
        }
        drawPlaybackBar = x => {
            if(x >= this.track.$canvas.width){
                clearInterval(this.track.app.timer[this.track.trackID]);
                x = this.track.$canvas.width
            }
            this.$canvas.style = `left: ${x}px`;
            this.$canvas.height = this.track.app.defaultHeight * this.track.app.$zoomVerticalValue.value + this.track.app.wavePadding * 2
            this.$canvas.width = 4;
            this.canvasCtx.lineWidth = 4;
            this.canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            this.canvasCtx.beginPath();
            this.canvasCtx.moveTo(0, 0)
            this.canvasCtx.lineTo(0, this.$canvas.height)
            this.canvasCtx.stroke();
        }
        dragPlaybackBar = event => {
            this.$canvas.width = 4;
            let x = Math.round(event.clientX - this.track.$canvas.getBoundingClientRect().left);
            if(x < 0){
                x = 0;
            }
            else if(x > this.track.$canvas.width){
                x = this.track.$canvas.width
            }
            this.drawPlaybackBar(x);
            let playbackBarSpeed = (this.track.app.samplePerDuration / this.track.app.sampleDensity)
            this.track.app.playbackTime = x / playbackBarSpeed
            this.track.app.$currentTime.innerText = new Date(this.track.app.playbackTime * 1000).toISOString().substr(11, 8)
            this.track.cancelDarkenSelection(this.track.selectedX1, this.track.selectedX2);
            for(var i in this.track.channels){
                let channel = this.track.channels[i];
                channel.cancelDarkenSelection(channel.selectedX1, channel.selectedX2);
            }
            event.preventDefault();
        }
    }
    