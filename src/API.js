const API = {
    fetchFile : url => {
        fetch(url)
        .then(response => response.arrayBuffer())
        .then(buffer => audioContext.decodeAudioData(buffer))
        .then(audioBuffer => {
            const audioSource = audioContext.createBufferSource();
            audioSource.buffer = audioBuffer;
        });
    }
}