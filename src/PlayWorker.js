import { app } from '../main.js';

let currentTrack = app.audioTracks[i];
currentTrack.audioCurrentGetStream()
if (currentTrack.audioContext.state === 'suspended') {
    currentTrack.audioContext.resume();
}
currentTrack.audioSource.start();


/*

I want to implement playing multiple tracks by worker (thread)
to get rid of even a little delay between the tracks

*/