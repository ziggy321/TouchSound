export class PlayAudio{
    constructor({playAudio}){
        const $playAudio = document.querySelector('.playAudio');

        $playAudio.addEventListener('click', playAudio);
    }
}