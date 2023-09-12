var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    effectInput = null,
    wetGain = null,
    dryGain = null,
    outputMix = null,
    currentEffectNode = null;

var constraints = {
    audio: {
        optional: [{ echoCancellation: false }],
    },
};

function convertToMono(input) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect(splitter);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 0, 1);
    return merger;
}


function gotStream(stream) {
    // Create an AudioNode from the stream.
    var input = audioContext.createMediaStreamSource(stream);

    audioInput = convertToMono(input);
    // create mix gain nodes
    outputMix = audioContext.createGain();
    dryGain = audioContext.createGain();
    wetGain = audioContext.createGain();
    effectInput = audioContext.createGain();
    audioInput.connect(dryGain);
    audioInput.connect(effectInput);
    dryGain.connect(outputMix);
    wetGain.connect(outputMix);
    outputMix.connect(audioContext.destination);
    crossfade(1.0);
    changeEffect();
}

function initAudio() {
    if (!navigator.getUserMedia)
        return alert('Error: getUserMedia not supported!');

    navigator.getUserMedia(constraints, gotStream, function (e) {
        alert('Error getting audio');
        console.log(e);
    });
}

window.addEventListener('load', initAudio);

function crossfade(value) {
    // equal-power crossfade
    var gain1 = Math.cos(value * 0.5 * Math.PI);
    var gain2 = Math.cos((1.0 - value) * 0.5 * Math.PI);

    dryGain.gain.value = gain1;
    wetGain.gain.value = gain2;
}

function changeEffect() {
    if (currentEffectNode) currentEffectNode.disconnect();
    if (effectInput) effectInput.disconnect();

    currentEffectNode = createPitchShifter();

    audioInput.connect(currentEffectNode);
}

function createPitchShifter() {
    effect = new Jungle(audioContext);
    effect.output.connect(wetGain);
    return effect.input;
}
