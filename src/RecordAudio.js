export class RecordAudio {
    constructor({ }){
        this.$recordButton = document.querySelector('.recordAudio');
        this.savedAudioMessagesContainer = document.querySelector('#saved-audio-messages');
   
        this.$recordButton.addEventListener('click', async e => {
            const vm = this.$recordButton;
            vm.setAttribute("disabled","disabled");
            setTimeout(function () {
                vm.removeAttribute("disabled")
            },1000)
            await this.switchRecording();  
        })
    }
    
    start = () => {
        this.audioChunks = [];
        this.mediaRecorder.start();
    };
    stop = () => {
        return new Promise(resolve => {
            this.mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(this.audioChunks);
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                const play = () => audio.play();
                const chunks= this.audioChunks;
                resolve({ chunks, audioBlob, audioUrl, play });
            }); 
            this.mediaRecorder.stop();
        });
    }    
    recordAudio = async () => {
        return new Promise(async resolve => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.mediaRecorder.addEventListener('dataavailable', event => {
                this.audioChunks.push(event.data);
            });
            const start = this.start;
            const stop = this.stop;
            resolve({ start, stop });
        });
    }
    
    sleep = async time => new Promise(resolve => setTimeout(resolve, time));
    
    switchRecording = async () => {
        if(this.$recordButton.classList.contains('recording')) {
            this.$recordButton.classList.remove('recording');
            this.audio = await this.recorder.stop();
            console.log('stop recording');
        } else {
            this.$recordButton.classList.add('recording');
            if (!this.recorder) {
                this.recorder = await this.recordAudio();
            }
            this.recorder.start();
            console.log('start recording');
        }
    }   
}