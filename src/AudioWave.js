export class AudioWave{
    constructor({channel, audioData, channelNum}){
        this.channel = channel;
        this.audioData = audioData;
        this.channelNum = channelNum;

        this.$canvas = document.createElement('canvas');
        this.$canvas.className = 'waveForm';
        this.$canvas.style = `
            z-index: 2;
            position: absolute;
            left: 2px;
            top: ${2 + (this.channel.track.$canvas.height / this.channel.track.numberOfChannels - 1) * this.channelNum}px;
        `;
        channel.track.$trackElement.querySelector('.trackChannelList').appendChild(this.$canvas)

        this.canvasCtx = this.$canvas.getContext('2d');
        
        this.draw(channel, audioData, channelNum);
    }

    init = (w, h) => {
        // Set up the canvas
        this.dpr = window.devicePixelRatio || 1;
        this.padding = 10;

        this.offsetWidth = w;
        this.offsetHeight = h;

        this.$canvas.width = this.offsetWidth// * this.dpr;
        this.$canvas.height = (this.offsetHeight + this.padding * 2)// * this.dpr;

        //this.canvasCtx.scale(this.dpr, this.dpr);
        this.canvasCtx.translate(0, this.offsetHeight / 2 + this.padding); // Set Y = 0 to be in the middle of the canvas
    }

    filterData = () => {
        const rawData = this.audioData //this.channel.track.audioSource.buffer.getChannelData(this.channelNum); // We only need to work with one channel of data
        //const rawData = audioData;
        const samples = Math.floor(this.channel.track.audioSource.buffer.duration) * this.channel.track.app.canvasLengthPerDuration
        //Number of samples we want to have in our final data set
        const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
        const filteredData = [];
        for (let i = 0; i < samples; i++) {
            let blockStart = blockSize * i; // the location of the first sample in the block
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum = sum + Math.abs(rawData[blockStart + j]) // find the sum of all the samples in the block
            }
            filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
        }
        return filteredData;
    }
    normalizeData = filteredData => {
        const multiplier = Math.pow(Math.max(...filteredData), -1);
        return filteredData.map(n => n * multiplier);
    }
    drawLineSegment = (ctx, x, y, width, isEven) => {
        ctx.lineWidth = 1; // how thick the line is
        ctx.strokeStyle = 'rgb(0, 200, 0)'; // what color our line is
        ctx.beginPath();
        y = isEven ? y : -y;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, y);
        ctx.arc(x + width / 2, y, width / 2, Math.PI, 0, isEven);
        ctx.lineTo(x + width, 0);
        ctx.stroke();
    };
    draw = (channel, audioData, channelNum) => {
        this.audioData = audioData //this.channel.track.audioSource.buffer.getChannelData(this.channelNum)
        let filteredData = this.filterData();
        let normalizedData = this.normalizeData(filteredData);

        const channelWidth = normalizedData.length / this.channel.track.app.sampleDensity
        const channelHeight = this.channel.track.offsetHeight / this.channel.track.numberOfChannels - 2

        console.log('setTrackBackgroundImage')
        this.channel.track.setTrackBackgroundImage(channelWidth + 4, this.channel.track.offsetHeight);
        console.log('channel.init')
        this.channel.init(channelWidth, channelHeight)
        this.init(channelWidth, channelHeight)
      
        // draw the line segments
        const width = this.offsetWidth / normalizedData.length;
        console.log(width)
        for (let i = 0; i < normalizedData.length; i++) {
            const x = width * i;
            let height = normalizedData[i] * this.offsetHeight - this.padding;
            if (height < 0) {
                height = 0;
            } else if (height > this.offsetHeight / 2) {
                height = height > this.offsetHeight / 2;
            }
            this.drawLineSegment(this.canvasCtx, x, height, width, (i + 1) % 2);
        }

        console.log('drawn')
    };

}