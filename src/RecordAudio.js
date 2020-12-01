export class RecordAudio {
        constructor({app}){
            this.app = app;
            this.$recordButton = document.querySelector('.recordAudio');
            this.savedAudioMessagesContainer = document.querySelector('#saved-audio-messages');
       
            this.$recordButton.addEventListener('click', async e => {
                const vm = this.$recordButton;
                vm.setAttribute("disabled","disabled");
                setTimeout(function () {
                    vm.removeAttribute("disabled")
                },1000)
                await this.switchRecording();
            })
        }
        switchRecording = async () => {
            if(this.$recordButton.classList.contains('recording')) {
                this.$recordButton.classList.remove('recording');
                this.audio = await this.recorder.stop();
                this.audio.load();
                console.log('stop recording');
            } else {
                let track = this.app.audioTracks[this.app.selectedTrackID];
                if(track.numberOfChannels > 1){
                    alert("The track must be empty or the number of channel must be 1 for recording.");
                    return;
                }
                this.$recordButton.classList.add('recording');
                if (!this.recorder) {
                    this.recorder = await this.recordAudio();
                }
                this.recorder.start();
                console.log('start recording');
            }
        }   
        
        recordAudio = async () => {
            return new Promise(async resolve => {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                this.mediaRecorder.addEventListener('dataavailable', event => {
                    this.audioChunks.push(event.data);
                });
                const start = () => {
                    this.audioChunks = [];
                    this.mediaRecorder.start();
                };
                const stop = () => {
                    return new Promise(resolve => {
                        this.mediaRecorder.addEventListener('stop', () => {
                            const audioBlob = new Blob(this.audioChunks);
                            const audioUrl = URL.createObjectURL(audioBlob);
                            const load = () => {
                                let track = this.app.audioTracks[this.app.selectedTrackID];
                                track.loadAudio.recordAudioData(audioBlob);
                            }
                            resolve({ audioBlob, audioUrl, load });
                        }); 
                        this.mediaRecorder.stop();
                    });
                }    
                resolve({ start, stop });
            });
        }
        
    }
    