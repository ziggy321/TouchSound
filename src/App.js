import {LoadAudio} from "./LoadAudio.js";
import {CreateAudio} from "./CreateAudio.js";

export class App {
    audioContext = null;
    audioBufferSourceNode = null;
    audioDestination = null;

    constructor(){
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.$loadAudio = new LoadAudio({
            audioContext: this.audioContext,
            audioBufferSourceNode: this.audioBufferSourceNode
        });

        this.$createAudio = new CreateAudio({

        });
    }
}