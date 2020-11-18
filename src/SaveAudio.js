export class SaveAudio{
    constructor({app}) {
        this.app = app;
        const $saveAudio = document.querySelector('.saveAudio');
        this.filename = "";
        this.audioCtx = new (AudioContext || webkitAudioContext)();

        //Load button listener
        $saveAudio.addEventListener('click', () => {
            this.filename = prompt("파일명을 입력하세요.", "output");
            this.soundSource = [];
            this.offlineAudioCtx = [];
            this.renderedBuffers = [];
            let buffers = [];
            
            for(let i in this.app.audioTracks){
                let buffer = this.app.audioTracks[i].audioSource.buffer
                if(buffer === null) {
                    alert("저장할 트랙이 없습니다.");
                    return;
                }
                buffers.push(buffer)
                this.processAudio(buffer, i);
            }
            
            let initial = Object.keys(this.app.audioTracks)[0];
            this.mixedBuffer = this.audioCtx.createBuffer(this.soundSource[initial].buffer.numberOfChannels, 
                this.soundSource[initial].buffer.length, this.soundSource[initial].buffer.sampleRate);

            for(let i in this.app.audioTracks){
                this.renderAudio(i);
            }
        })
    }

    mixBuffer = (bufferA, bufferB, ratio, offset) => {    
        if (ratio == null) ratio = 0.5;
        var fn = ratio instanceof Function ? ratio : function (a, b) {
            return a + b // a * (1 - ratio) + b * ratio;
        };
    
        if (offset == null) offset = 0;
        else if (offset < 0) offset += bufferA.length;
    
        for (var channel = 0; channel < bufferA.numberOfChannels; channel++) {
            var aData = bufferA.getChannelData(channel);
            var bData = bufferB.getChannelData(channel);
    
            for (var i = offset, j = 0; i < bufferA.length && j < bufferB.length; i++, j++) {
                aData[i] = fn.call(bufferA, aData[i], bData[j], j, channel);
            }
        }
    
        return bufferA;
    }

    // Process Audio
    processAudio = (buffer, i) => {
        this.offlineAudioCtx.push(new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate));

        // Audio Buffer Source
        this.soundSource.push(this.offlineAudioCtx[i].createBufferSource());
        this.soundSource[i].buffer = buffer;
    }

    // Connect nodes to destination
    renderAudio = i => {
        this.soundSource[i].connect(this.offlineAudioCtx[i].destination);
        if(this.offlineAudioCtx[i].state === 'closed'){
            this.offlineAudioCtx[i].resume()
        }

        this.soundSource[i].start();

        this.offlineAudioCtx[i].startRendering().then(renderedBuffer => {
            this.renderedBuffers.push(renderedBuffer);
            if(this.renderedBuffers.length === Object.keys(this.app.audioTracks).length){
                for(let j in this.renderedBuffers){
                    this.mixBuffer(this.mixedBuffer, this.renderedBuffers[j]);
                }
                this.make_download(this.mixedBuffer, this.offlineAudioCtx[i].length);
            }
        }).catch(function(err) {
            console.log(err)
        });
    }

    // get duration and sample rate
    make_download = (abuffer, total_samples) => {
        const new_file = URL.createObjectURL(this.bufferToWave(abuffer, total_samples));
        let download_link = document.createElement("a");
	    download_link.href = new_file;
        download_link.download = this.filename + ".wav";
        download_link.click();
    }

    // Convert an AudioBuffer to a Blob using WAVE representation
    bufferToWave = (abuffer, len) =>{
        const numOfChan = abuffer.numberOfChannels
        const length = len * numOfChan * 2 + 44
        const buffer = new ArrayBuffer(length)
        let channels = [], i, sample
        let offset = 0
        this.view = new DataView(buffer)
        this.pos = 0
  
        // write WAVE header
        this.setUint32(0x46464952);                         // "RIFF"
        this.setUint32(length - 8);                         // file length - 8
        this.setUint32(0x45564157);                         // "WAVE"
  
        this.setUint32(0x20746d66);                         // "fmt " chunk
        this.setUint32(16);                                 // length = 16
        this.setUint16(1);                                  // PCM (uncompressed)
        this.setUint16(numOfChan);
        this.setUint32(abuffer.sampleRate);
        this.setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        this.setUint16(numOfChan * 2);                      // block-align
        this.setUint16(16);                                 // 16-bit (hardcoded in this demo)
  
        this.setUint32(0x61746164);                         // "data" - chunk
        this.setUint32(length - this.pos - 4);                   // chunk length
  
        // write interleaved data
        for(i = 0; i < abuffer.numberOfChannels; i++){
            channels.push(abuffer.getChannelData(i));
        }
  
        let cnt = 0, loop = 0;
        while(this.pos < length) {
            for(i = 0; i < numOfChan; i++) {             // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
                this.view.setInt16(this.pos, sample, true);          // write 16-bit sample
                this.pos += 2;
            }
            offset++                                     // next source sample
        }
  
        // create Blob
        return new Blob([buffer], {type: "audio/wav"});
    }

    setUint16 = (data) => {
        this.view.setUint16(this.pos, data, true);
        this.pos += 2;
    }

    setUint32 = (data) => {
        this.view.setUint32(this.pos, data, true);
        this.pos += 4;
    }

    // Create Compressor Node
    // createCompressorNode = () => {
    //     this.compressor = this.offlineAudioCtx.createDynamicsCompressor();
    //     this.compressor.threshold.setValueAtTime(-20, this.offlineAudioCtx.currentTime);
    //     this.compressor.knee.setValueAtTime(-30, this.offlineAudioCtx.currentTime);
    //     this.compressor.ratio.setValueAtTime(5, this.offlineAudioCtx.currentTime);
    //     this.compressor.attack.setValueAtTime(.05, this.offlineAudioCtx.currentTime);
    //     this.compressor.release.setValueAtTime(.25, this.offlineAudioCtx.currentTime);
    // }
}