import { AudioWave } from "./AudioWave.js";
import { AudioTrack } from "./AudioTrack.js";
import { AudioChannel } from "./AudioChannel.js";
import { RecordAudio } from "./RecordAudio.js";

export class ConvertToFile {
  constructor({}) {
    this.fileInput = document.getElementById('audio-file');
    this.audioCtx = new (AudioContext || webkitAudioContext)();
    this.compress_btn = document.getElementById('compress_btn');

    //Load button listener
    compress_btn.addEventListener("click", function() {
      // check for file
      if(this.fileInput.files[0] == undefined) {
        // Stop the process and tell user they need to upload a file.
        return false;
      }
      let reader1 = new FileReader();
      reader1.onload = function(ev) {
        // Decode audio
        this.audioCtx.decodeAudioData(ev.target.result).then(function(buffer) {
          // Process Audio
          this.processAudio(buffer);
          this.createCompressorNode();
          this.renderAudio();
        });
      };
      reader1.readAsArrayBuffer(this.fileInput.files[0]);
    }, false);
  }

  // Process Audio
  processAudio = buffer => {
    this.offlineAudioCtx = new OfflineAudioContext({
      numberOfChannels: 2,
      length : 44100 * ArrayBuffer.duration,
      sampleRate : 44100,
    });

    // Audio Buffer Source
    this.soundSource = this.offlineAudioCtx.createBufferSource();
    this.soundSource.buffer = buffer;
  }

  // Create Compressor Node
  createCompressorNode = () => {
    this.compressor = this.offlineAudioCtx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-20, this.offlineAudioCtx.currentTime);
    this.compressor.knee.setValueAtTime(-30, this.offlineAudioCtx.currentTime);
    this.compressor.ratio.setValueAtTime(5, this.offlineAudioCtx.currentTime);
    this.compressor.attack.setValueAtTime(.05, this.offlineAudioCtx.currentTime);
    this.compressor.release.setValueAtTime(.25, this.offlineAudioCtx.currentTime);
  }

  // Connect nodes to destination
  renderAudio = () => {
    this.soundSource.connect(this.compressor);
    this.compressor.connect(this.offlineAudioCtx.destination);

    this.offlineAudioCtx.startRendering().then(function(renderedBuffer) {
      this.make_download(renderedBuffer, this.offlineAudioCtx.length);
    }).catch(function(err) {
      // Handle error
      console.log(err)
    });
  }

  // get duration and sample rate
  make_download = (abuffer, total_samples) => {
	  this.duration = abuffer.duration,
		this.rate = abuffer.sampleRate,
    this.offset = 0;

    const new_file = URL.createObjectURL(this.bufferToWave(abuffer, total_samples));

    let download_link = document.getElementById("download_link");
	  download_link.href = new_file;
	  let name = this.generateFileName();
	  download_link.download = name;
  }

  generateFileName = () => {
    const origin_name = this.fileInput.files[0].name;
    const pos = origin_name.lastIndexOf('.');
    const no_ext = origin_name.slice(0, pos);

    return no_ext + ".compressed.wav";
  }

  // Convert an AudioBuffer to a Blob using WAVE representation
  bufferToWave = (abuffer, len) =>{
    const buffer = new ArrayBuffer(length)
    const numOfChan = abuffer.numberOfChannels
    const length = len * numOfChan * 2 + 44
    let channels = [], i, sample
    this.view = new DataView(buffer)
    this.offset = 0,
    this.pos = 0;
  
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
    for(let i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));
  
    while(this.pos < length) {
      for(let i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][this.offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
        this.view.setInt16(this.pos, sample, true);          // write 16-bit sample
        this.pos += 2;
      }
      this.offset++                                     // next source sample
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
}