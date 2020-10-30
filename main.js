window.AudioContext= window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput= null,
    realAudioInput =null,
    inputPoint= null,
    audioRecorder= null,
var analyserContext= null;
var recIndex = 0;

function saveAudio() {
    audioRecorder.exportWAV( doneEncoding);
    
function doneEncoding(blob) {
    Recorder.setupDownload(blob, "myRecord" + ((recIndex<10)?"0":"")+recIndex+".wav");
    recIndex++;
}

function switchRecording(e) {
    if(e.ClassList.contains("recording")) {
        //stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        audioRecorder.getBuffers(gotBuffers);
    } else {
        //start recording
        if(!audioRecorder)
            return;
        e.classList.add("recording");
        audioRecorder.clear();
        audioRecorder.record();
    }
}

function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}
function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}

}
function switchMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput =realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono(realAudioUnput);
    }

    audioInput.connect(inputPoint)

    }

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput=realAudioInput;
    audioInput.connect(inputPoint);
    
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize =2048;
    inputPoint.connect(analyserNode);

    audioRecorder = new Recorder(inputPoint);

    zeroGain= audioContext.createGain();
    zeroGain.gain.value= 0.0;
    inputPoint.connect(zeroGain);
    zeroGain.connect( audioContext.destination);
    updateAnalysers();
}

function initAudio() {
    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
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
        }, gotStream, function(e) {
        alert('Error getting audio');
        console.log(e);
        });
}

window.addEventListener('load', initAudio);

