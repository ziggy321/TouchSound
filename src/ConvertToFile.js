import { AudioWave } from "./AudioWave.js";
import { AudioTrack } from "./AudioTrack.js";
import { AudioChannel } from "./AudioChannel.js";
import { RecordAudio } from "./RecordAudio.js";


export class ConvertToFile {
    constructor({fileInput,audioCtx,compress_btn}) {
    this.fileInput = document.getElementById('audio-file');
    this.audioCtx = new (AudioContext || webkitAudioContext)();
    this.compress_btn = document.getElementById('compress_btn');
    


    //Load button listener
    compress_btn.addEventListener("click", function() {

    // check for file
      if(fileInput.files[0] == undefined) {
  
      // Stop the process and tell user they need to upload a file.
      return false;
      }
  
    this.reader1 = new FileReader();
        reader1.onload = function(ev) {
          
          // Decode audio
          audioCtx.decodeAudioData(ev.target.result).then(function(buffer) {
  
              // Process Audio
  
          });
        };
        reader1.readAsArrayBuffer(fileInput.files[0]);
  
    }, false);
    }
}
  // Process Audio
    
    this.offlineAudioCtx = new OfflineAudioContext({
      numberOfChannels: 2,
      length : 44100 * ArrayBuffer.duration,
      sampleRate : 44100,
    });

  // Audio Buffer Source
    this.soundSource = offlineAudioCtx.createBufferSource();
    this.soundSource.buffer = buffer;

// Create Compressor Node
    this.compressor = offlineAudioCtx.createDynamicsCompressor();

      compressor.threshold.setValueAtTime(-20, offlineAudioCtx.currentTime);
      compressor.knee.setValueAtTime(-30, offlineAudioCtx.currentTime);
      compressor.ratio.setValueAtTime(5, offlineAudioCtx.currentTime);
      compressor.attack.setValueAtTime(.05, offlineAudioCtx.currentTime);
      compressor.release.setValueAtTime(.25, offlineAudioCtx.currentTime);

// Connect nodes to destination
    soundSource.connect(compressor);
    compressor.connect(offlineAudioCtx.destination);

    offlineAudioCtx.startRendering().then(function(renderedBuffer) {
  
      make_download(renderedBuffer, offlineAudioCtx.length);
  
    }).catch(function(err) {
    // Handle error
      });

  make_download = (abuffer, total_samples) => {

	// get duration and sample rate
	  this.duration = abuffer.duration,
		this.rate = abuffer.sampleRate,
		this.offset = 0;

    this.new_file = URL.createObjectURL(bufferToWave(abuffer, total_samples));

    this.download_link = document.getElementById("download_link");
	  download_link.href = new_file;
	  this. name = generateFileName();
	  download_link.download = name;

}

  generateFileName = () => {
    this. origin_name = fileInput.files[0].name;
    this. pos = origin_name.lastIndexOf('.');
    this. no_ext = origin_name.slice(0, pos);

    return no_ext + ".compressed.wav";
  }

// Convert an AudioBuffer to a Blob using WAVE representation
  bufferToWave = (abuffer, len) =>{
    this.numOfChan = abuffer.numberOfChannels,
    this.length = len * numOfChan * 2 + 44,
    this.buffer = new ArrayBuffer(length),
    this.view = new DataView(buffer),
    this.channels = [], i, sample,
    this.offset = 0,
    this.pos = 0;
  
    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"
  
    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this demo)
  
    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length
  
    // write interleaved data
    for(i = 0; i < abuffer.numberOfChannels; i++)
      channels.push(abuffer.getChannelData(i));
  
    while(pos < length) {
      for(i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true);          // write 16-bit sample
        pos += 2;
      }
      offset++                                     // next source sample
    }
  
    // create Blob
    return new Blob([buffer], {type: "audio/wav"});
  
    setUint16 = (data) => {
      view.setUint16(pos, data, true);
      pos += 2;
    }
  
    setUint32 = (data) => {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }

  this. fileInput = document.getElementById('audio-file');
  this. audioCtx = new (AudioContext || webkitAudioContext)();
  this. compress_btn = document.getElementById('compress_btn');

// Load button listener
compress_btn.addEventListener("click", function() {

  // Check for file
  if(fileInput.files[0] == undefined) {

    // Stop the process and tell user they need to upload a file.
    return false;
  }

  this. reader1 = new FileReader();
	reader1.onload = function(ev) {
	    
	    // Decode audio
	    audioCtx.decodeAudioData(ev.target.result).then(function(buffer) {

		    // Process Audio
				this.offlineAudioCtx = new OfflineAudioContext({
				  numberOfChannels: 2,
				  length: 44100 * buffer.duration,
				  sampleRate: 44100,
				});

				// Audio Buffer Source
				soundSource = offlineAudioCtx.createBufferSource();
				soundSource.buffer = buffer;

				// Create Compressor Node
				compressor = offlineAudioCtx.createDynamicsCompressor();

				compressor.threshold.setValueAtTime(-20, offlineAudioCtx.currentTime);
				compressor.knee.setValueAtTime(30, offlineAudioCtx.currentTime);
				compressor.ratio.setValueAtTime(5, offlineAudioCtx.currentTime);
				compressor.attack.setValueAtTime(.05, offlineAudioCtx.currentTime);
				compressor.release.setValueAtTime(.25, offlineAudioCtx.currentTime);

				// Connect nodes to destination
				soundSource.connect(compressor);
				compressor.connect(offlineAudioCtx.destination);

				offlineAudioCtx.startRendering().then(function(renderedBuffer) {
					
					make_download(renderedBuffer, offlineAudioCtx.length);
				
				}).catch(function(err) {
				  // Handle error
				});
	    });
	  };
	  reader1.readAsArrayBuffer(fileInput.files[0]);

}, false);

function make_download(abuffer, total_samples) {

	// set sample length and rate
	this. duration = abuffer.duration,
		rate = abuffer.sampleRate,
		offset = 0;

	// Generate audio file and assign URL
	this. new_file = URL.createObjectURL(bufferToWave(abuffer, total_samples));

	// Make it downloadable
	this. download_link = document.getElementById("download_link");
	download_link.href = new_file;
	this. name = generateFileName();
	download_link.download = name;
}

// Utility to add "compressed" to the uploaded file's name
generateFileName = () => {
	this. origin_name = fileInput.files[0].name;
	this. pos = origin_name.lastIndexOf('.');
	this. no_ext = origin_name.slice(0, pos);

	return no_ext + ".compressed.wav";
}

// Convert AudioBuffer to a Blob using WAVE representation
bufferToWave = (abuffer, len) => {
	this.numOfChan = abuffer.numberOfChannels,
	this.length = len * numOfChan * 2 + 44,
	this.buffer = new ArrayBuffer(length),
	this.view = new DataView(buffer),
	this.channels = [], i, sample,
	this.offset = 0,
	this.pos = 0;

	// write WAVE header
	setUint32(0x46464952);                         // "RIFF"
	setUint32(length - 8);                         // file length - 8
	setUint32(0x45564157);                         // "WAVE"

	setUint32(0x20746d66);                         // "fmt " chunk
	setUint32(16);                                 // length = 16
	setUint16(1);                                  // PCM (uncompressed)
	setUint16(numOfChan);
	setUint32(abuffer.sampleRate);
	setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
	setUint16(numOfChan * 2);                      // block-align
	setUint16(16);                                 // 16-bit (hardcoded in this demo)

	setUint32(0x61746164);                         // "data" - chunk
	setUint32(length - pos - 4);                   // chunk length

	// write interleaved data
	for(i = 0; i < abuffer.numberOfChannels; i++)
		channels.push(abuffer.getChannelData(i));

	while(pos < length) {
		for(i = 0; i < numOfChan; i++) {             // interleave channels
			sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
			sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
			view.setInt16(pos, sample, true);          // write 16-bit sample
			pos += 2;
		}
		offset++                                     // next source sample
	}

	// create Blob
	return new Blob([buffer], {type: "audio/wav"});

	setUint16 = (data) => {
		view.setUint16(pos, data, true);
		pos += 2;
	}

	setUint32 = (data) => {
		view.setUint32(pos, data, true);
		pos += 4;
	}
}
