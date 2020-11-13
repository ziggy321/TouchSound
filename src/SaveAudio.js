export class SaveAudio{
    constructor({audioContext, putFileName}){
        const $saveAudio = document.querySelector('.saveAudio');
        this.audioChunks = [];
        this.filename = "";
        this.inputBlankOpen = false;

        $saveAudio.addEventListener('click', putFileName);
    }

}