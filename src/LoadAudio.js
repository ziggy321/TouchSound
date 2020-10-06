export class LoadAudio{
    constructor({audioContext, audioBufferSourceNode}){
        const $loadAudio = document.querySelector('.loadAudio');
        $loadAudio.type = "file";
        $loadAudio.accept = "audio/mpeg";

        $loadAudio.addEventListener('click', () => this.fetchFile(audioContext, audioBufferSourceNode));
    }

    // 파일 직접 선택해서 불러와서 오디오 노드 생성하고 재생
    fetchFile(audioContext, audioBufferSourceNode){
        const $input = document.createElement("input");
        $input.type = "file";
        $input.accept = "audio/mpeg";
        $input.onchange = event => {
            const file = event.target.files[0];
            if(file.type !== "audio/mpeg"){
                alert("올바른 파일 형식이 아닙니다.");
                return;
            }
            file.arrayBuffer()
            .then(buffer => audioContext.decodeAudioData(buffer))
            .then(audioBuffer => {
                audioBufferSourceNode = audioContext.createBufferSource();
                audioBufferSourceNode.buffer = audioBuffer;
                audioBufferSourceNode.connect(audioContext.destination);
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
                audioBufferSourceNode.start();
            })
            .catch(e => console.log(e));
        };
        $input.click();
    }
}