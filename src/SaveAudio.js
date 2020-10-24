export class SaveAudio{
    constructor({audioContext, putFileName}){
        const $SaveAudio = document.querySelector('.SaveAudio');
        this.audioChunks = [];
        this.filename = "";
        this.inputBlankOpen = false;

        $SaveAudio.addEventListener('click', putFileName);
    }

    readyToSaveFile(audioContext, audioComplete, filename){
        console.log(audioComplete);
        this.filename = filename;

        let destinationForSavingFile = audioContext.createMediaStreamDestination();
        let mediaStream = destinationForSavingFile.stream;
        audioComplete.connect(destinationForSavingFile);

        const options = {mimeType: 'video/webm;codecs=vp9'};
        let mediaRecorder = new MediaRecorder(mediaStream, options);
        mediaRecorder.ondataavailable = event => this.pushDataToChunks(event);

        mediaRecorder.start();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        audioComplete.start();

        mediaRecorder.stop();
        audioComplete.stop();
    }

    pushDataToChunks(event){
        console.log(event.data);
        if (event.data.size > 0) {
            console.log("data-available");
            console.log(this);
            this.audioChunks.push(event.data);
            console.log(this.audioChunks);
            this.createFile();
        }
    }

    createFile() {
        let blob = new Blob(this.audioChunks, { type: "audio/mpeg" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        //document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = this.filename;
        a.click();
        //window.URL.revokeObjectURL(url);
    }

}