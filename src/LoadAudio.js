export class LoadAudio{
    constructor({$trackElement, fetchFile}){
        const $loadAudio = $trackElement.querySelector('.loadAudio');
        $loadAudio.type = "file";
        $loadAudio.accept = "audio/*";
        $loadAudio.style = 'display: block;'

        $loadAudio.addEventListener('click', fetchFile);
    }
}