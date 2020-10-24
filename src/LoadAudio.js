export class LoadAudio{
    constructor({fetchFile}){
        const $loadAudio = document.querySelector('.loadAudio');
        $loadAudio.type = "file";
        $loadAudio.accept = "audio/*";

        $loadAudio.addEventListener('click', fetchFile);
    }
}