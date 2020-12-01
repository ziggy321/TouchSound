export class AudioWave{
        waveMax = 0.3
        constructor({channel, audioData, channelNum}){
            this.channel = channel;
            this.audioData = audioData;
            this.channelNum = channelNum;
            this.$canvas = document.createElement('canvas');
            this.$canvas.className = 'waveForm';
            this.$canvas.style = `
                z-index: 2;
                position: absolute;
                left: 2px;
                top: ${2 + (this.channel.track.$canvas.height / this.channel.track.numberOfChannels - 1) * this.channelNum}px;
            `;
            channel.track.$trackElement.querySelector('.trackChannelList').appendChild(this.$canvas)
            this.canvasCtx = this.$canvas.getContext('2d');
            this.offsetWidth = 0;
            this.dpr = window.devicePixelRatio || 1;
            this.padding = channel.track.padding / 2;
        }
        filterData = () => {
            const rawData = this.audioData
            const blockSize = Math.round(this.channel.track.blockSize * this.channel.track.audioSource.playbackRate.value);
            const samples = Math.floor(rawData.length / blockSize);
            const filteredData = [];
            for (let i = 0; i < samples; i++) {
                let blockStart = blockSize * i;
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum = sum + Math.abs(rawData[blockStart + j])
                }
                sum *= this.channel.track.gain.gain.value;
                filteredData.push(sum / blockSize);
            }
            return filteredData;
        }
        normalizeData = filteredData => {
            return filteredData.map(n => {
                let ret = n / this.waveMax
                ret = (ret > 1) ? 1 : (ret < -1) ? -1 : ret;
                return ret
            });
        }
        drawLineSegment = (ctx, x, y, width, isEven) => {
            ctx.lineWidth = 1;
            ctx.strokeStyle = this.channel.track.waveColor;
            ctx.beginPath();
            y = isEven ? y : -y;
            ctx.moveTo(x, 0);
            ctx.lineTo(x, y);
            ctx.arc(x + width / 2, y, width / 2, Math.PI, 0, isEven);
            ctx.lineTo(x + width, 0);
            ctx.stroke();
        };
        draw = audioData => {
            this.audioData = audioData
            let filteredData = this.filterData();
            let normalizedData = this.normalizeData(filteredData);
            // Set up the canvas
            this.$canvas.style = `
                z-index: 2;
                position: absolute;
                left: 2px;
                top: ${2 + (this.channel.track.$canvas.height / this.channel.track.numberOfChannels - 1) * this.channelNum}px;
            `;
            this.offsetWidth = normalizedData.length / this.channel.track.app.sampleDensity;
            this.offsetHeight = this.channel.track.offsetHeight / this.channel.track.numberOfChannels - 2;
            this.$canvas.width = this.offsetWidth
            this.$canvas.height = (this.offsetHeight + this.padding * 2)
            
            this.canvasCtx.translate(0, this.offsetHeight / 2 + this.padding);
          
            // draw the line segments
            const width = this.offsetWidth / normalizedData.length;
            for (let i = 0; i < normalizedData.length; i++) {
                const x = width * i;
                let height = normalizedData[i] * (this.offsetHeight / 2)
                this.drawLineSegment(this.canvasCtx, x, height, width, (i + 1) % 2);
            }
        };
    }