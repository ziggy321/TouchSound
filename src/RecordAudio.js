import { Recorder } from '../lib/recorder.js';

export class RecordAudio{
    constructor({$trackElement}){
        this.$recordAudio = document.querySelector('.recordAudio')
        this.$recordAudio.style = 'display: block;'
        this.$recordAudio.addEventListener('click', this.switchRecording.bind(this))

        this.audioContext = new AudioContext();
        this.audioInput= null 
        this.realAudioInput =null
        this.inputPoint= null
        this.audioRecorder= null
        this.analyserContext= null
        this.recIndex = 0

        this.lock = false;   
        this.stopped = false;
        this.micStream = null;
    }

    switchRecording() {
        if(this.lock) return;
        this.lock = true;
        if(this.$recordAudio.classList.contains('recording')) {
            // if(!this.audioRecorder) {
            //     return;
            // }
            console.log('stop recording')
            //stop recording
            this.$recordAudio.classList.remove('recording')
            // this.audioRecorder.stop();
            // this.audioRecorder.getBuffers(this.gotBuffers.bind(this));
            this.exitAudio.call(this);
        } else {
            console.log('start recording')
            //start recording
            this.$recordAudio.classList.add('recording')
            this.initAudio.call(this);
        }
        this.lock = false;
    }

    gotStream(stream) {
        this.realAudioInput = this.audioContext.createMediaStreamSource(stream);
        this.micStream = stream;

        console.log('got stream')

        //this.audioRecorder = new Recorder(this.realAudioInput);
        return this.realAudioInput
    }

    initAudio() {
        if (!navigator.getUserMedia){
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        }

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
            .then(stream => {
                this.$trackElement.audioSource = this.gotStream.call(this, stream)
                // this.audioRecorder.clear();
                // this.audioRecorder.record();
            })
            .catch(e => {
                alert('Error getting audio');
                console.log(e);
            })
    }

    exitAudio = () => {
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