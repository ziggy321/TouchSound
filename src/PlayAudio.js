export class PlayAudio{
    constructor({playAudio, pauseAudio, stopAudio}){
        const $playAudio = document.querySelector('.playAudio');
        const $pauseAudio = document.querySelector('.pauseAudio');
        const $stopAudio = document.querySelector('.stopAudio');

        $playAudio.addEventListener('click', playAudio);
        $pauseAudio.addEventListener('click', pauseAudio);
        $stopAudio.addEventListener('click', stopAudio);
    }
}