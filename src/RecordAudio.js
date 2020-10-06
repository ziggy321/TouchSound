class RecordAudio{
    constructor(){
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then(successCallback)
        .catch(failureCallback);

        audioSourceNode.connect(audioDestination);
    }
}