export class RecordAudio{
    constructor({$trackElement}){
        const $recordAudio = $trackElement.querySelector('.recordAudio');
        $recordAudio.style = 'display: block;'
    }
}