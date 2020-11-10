export class RecordAudio {
    constructor({ }){
        this.$recordButton = document.querySelector('.recordAudio');
        
        this.savedAudioMessagesContainer = document.querySelector('#saved-audio-messages');
   
        this.recorder;
        this.audio;
        this.vm;
        this.$recordButton.addEventListener('click',function (e) {
            console.log("클릭")
            const vm = this;
            this.setAttribute("disabled","disabled");
        
            setTimeout(function () {
                console.log("처리완료")
                vm.removeAttribute("disabled")
            },1000)
        })
        this.$recordButton.addEventListener('click',async x => {
            await this.switchRecording(x);  
        });
       


        // this.playButton.addEventListener('click', () => {
        //     this.audio.play();
        // });
   
        // this.saveButton.addEventListener('click', () => {
        //    const reader = new FileReader();
        //    this.reader.readAsDataURL(this.audio.audioBlob);
        //    this.reader.onload = () => {
        //     const base64AudioMessage = this.reader.result.split(',')[1];
   
        //    fetch('/messages', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ message: base64AudioMessage })
        //    }).then(res => {
        //     if (res.status === 201) {
        //        return populateAudioMessages();
        //     }
        //    console.log('Invalid status saving audio message: ' + res.status);
        //    });
        //   };
        // });
   
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
    recordAudio = () => {

        return new Promise(async resolve => {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            let audioChunks = [];
                this.mediaRecorder.addEventListener('dataavailable', event => {
                    this.audioChunks.push(event.data);
            });
        const start =this.start;
        const stop =this.stop;
        resolve({ start, stop });
        });
    }
    
    sleep = time => new Promise(resolve => setTimeout(resolve, time));
    
    switchRecording =async x => {
        
        this.audio;
        this.recorder;

        if(this.$recordButton.classList.contains('recording')) {
            // if(!this.audioRecorder) {
            //     return;
            // }
            this.audio = await this.recorder.stop();
            console.log('stop recording');
            //stop recording
            this.$recordButton.classList.remove('recording');
            // this.audioRecorder.stop();
            // this.audioRecorder.getBuffers(this.gotBuffers.bind(this));
            // this.exitAudio.call(this);
        } else {
            if (!this.recorder) {
                this.recorder = await this.recordAudio();
            }

            this.recorder.start();
            console.log('start recording');
            //start recording
            this.$recordButton.classList.add('recording');
            // this.initAudio.call(this);
        }
        
    }   
    
    populateAudioMessages = () => {
        return fetch('/messages').then(res => {
        if (res.status === 200) {
        return res.json().then(json => {
        json.messageFilenames.forEach(filename => {
            let audioElement = document.querySelector(`[data-audio-filename="${filename}"]`);
        if (!audioElement) {
          audioElement = document.createElement('audio');
          audioElement.src = `/messages/${filename}`;
          audioElement.setAttribute('data-audio-filename', filename);
          audioElement.setAttribute('controls', true);
          savedAudioMessagesContainer.appendChild(audioElement);
        }
            });
        });
        }
    console.log('Invalid status getting messages: ' + res.status);
        });
    };



    // populateAudioMessages = () => {
    // };
}