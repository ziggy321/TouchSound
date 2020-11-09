export class RecordAudio{
    constructor({$trackElement}){
        this.$recordAudio = document.querySelector('.recordAudio')
        this.$recordAudio.style = 'display: block;'
        // this.$recordAudio.addEventListener('click', this.switchRecording.bind(this))

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