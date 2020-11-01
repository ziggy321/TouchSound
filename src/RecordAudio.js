import Recorder from 'lib/recorder.js';

export class RecordAudio{
    constructor({$trackElement}){
        const $recordAudio = document.querySelector('.recordAudio')
        $recordAudio.style = 'display: block;'
        $recordAudio.addEventListener('click', switchRecording)

        this.audioContext = new AudioContext();
        this.audioInput= null 
        this.realAudioInput =null
        this.inputPoint= null
        this.audioRecorder= null
        this.analyserContext= null
        this.recIndex = 0

        this.isRecording = false;   
        this.micStream;
    }

    gotBuffers( buffers ) {
        // var canvas = document.getElementById( "wavedisplay" );
        // drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );

        // the ONLY time gotBuffers is called is right after a new recording is completed - 
        // so here's where we should set up the download.
        this.audioRecorder.exportWAV( doneEncoding );
    }

    doneEncoding(blob) {
        this.Recorder.setupDownload(blob, "myRecord" + ((recIndex<10)?"0":"")+recIndex+".wav");
        this.recIndex++;
    }

    switchRecording() {
        if(isRecording) {
            console.log('stop recording')
            //stop recording
            this.audioRecorder.stop();
            this.isRecording = false;
            this.audioRecorder.getBuffers(this.gotBuffers);
            exitAudio();
        } else {
            console.log('start recording')
            //start recording

            this.initAudio();
        }
    }

    gotStream(stream) {
        this.inputPoint = this.audioContext.createGain();

        this.realAudioInput = this.audioContext.createMediaStreamSource(stream);
        this.micStream = stream;

        this.audioInput=this.realAudioInput;
        this.audioInput.connect(inputPoint);
    
        analyserNode = this.audioContext.createAnalyser();
        analyserNode.fftSize =2048;
        this.inputPoint.connect(analyserNode);

        zeroGain= this.audioContext.createGain();
        //zeroGain.gain.value= 0.0;
        this.inputPoint.connect(zeroGain);
        zeroGain.connect( audioContext.destination);
        //updateAnalysers();

        console.log('get stream and init recorder')
        this.audioRecorder = new Recorder(inputPoint);

        return true;
    }

    initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

        navigator.mediaDevices.getUserMedia(
            {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
            })
            .then(stream => this.gotStream(stream))
            .then(() => {
                this.isRecording = true;
                console.log(audioRecorder)
                this.audioRecorder.clear();
                this.audioRecorder.record();
            })
            .catch(e => {
                alert('Error getting audio');
                console.log(e);
            })
    }

    exitAudio = () => {
        console.log(micStream)
        this.micStream.getTracks().forEach(function(track) {
            track.stop();
        });
    }

// function convertToMono( input ) {
//     var splitter = audioContext.createChannelSplitter(2);
//     var merger = audioContext.createChannelMerger(2);

//     input.connect( splitter );
//     splitter.connect( merger, 0, 0 );
//     splitter.connect( merger, 0, 1 );
//     return merger;
// }
// function cancelAnalyserUpdates() {
//     window.cancelAnimationFrame( rafID );
//     rafID = null;
// }

// }


// function switchMono() {
//     if (audioInput != realAudioInput) {
//         audioInput.disconnect();
//         realAudioInput.disconnect();
//         audioInput =realAudioInput;
//     } else {
//         realAudioInput.disconnect();
//         audioInput = convertToMono(realAudioUnput);
//     }

//     audioInput.connect(inputPoint)

// }

}