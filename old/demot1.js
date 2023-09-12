var audio = document.querySelector('audio');
var audioctx = new (window.AudioContext || window.webkitAudioContext)();
var filter_high = audioctx.createBiquadFilter();
var analyser = audioctx.createAnalyser();
var dataArray = new Uint8Array(analyser.frequencyBinCount);
var media1 = navigator.mediaDevices.getUserMedia({ audio: true });
media1.then(getdata).catch((error) => {
    alert(error);
});
function getdata(mediaStream) {
    var mic = audioctx.createMediaStreamSource(mediaStream);
    audio.src = window.URL.createObjectURL(mediaStream);
    mic.connect(analyser);
    filter_high.type = 'highpass';
    filter_high.frequency.value = 20;
    analyser.connect(filter_high);
    //filter_high.connect(audioctx.destination);
    //analyser.connect(audioctx.destination);
}
elVolume = document.getElementById('volume');
var box = document.querySelector('.box');
function draw() {
    var x = Math.floor(getByteFrequencyDataAverage());
    elVolume.innerHTML = x;
    box.style.width = 2 + x * 3 + 'px';
}
setInterval(draw, 100);

function getByteFrequencyDataAverage() {
    analyser.getByteFrequencyData(dataArray);
    return (
        dataArray.reduce(function (previous, current) {
            return previous + current;
        }) / analyser.frequencyBinCount
    );
}
//以下是简单的高频滤波部分
var high = document.querySelector('#high');
high.onchange = function () {
    filter_high.frequency.value = high.value;
    document.querySelector('#level').innerText = high.value;
};

//通过ScriptProcessorNode处理音频
//变声音  播放速度减小 声音变粗 速度增大 声音变细
//反应在代码就是采样点减少。。
var style = document.querySelector('#audio_style');
style.onchange = function () {
    audio_style = parseInt(style.value);
};
var audio_style = 0;
var scriptNode = audioctx.createScriptProcessor(4096, 1, 1);
scriptNode.onaudioprocess = function (audioProcessingEvent) {
    var inputBuffer = audioProcessingEvent.inputBuffer;
    var outputBuffer = audioProcessingEvent.outputBuffer;
    for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
        var inputData = inputBuffer.getChannelData(channel);
        var outputData = outputBuffer.getChannelData(channel);
        // Loop through the 4096 samples
        for (var sample = 0; sample < inputBuffer.length; sample++) {
            // outputData[sample] = inputData[sample]*1;
            //这里做处理即可
            // if (sample % 2 == 0) {
            //     outputData[sample] = inputData[sample / 2];
            // } else {
            //     outputData[sample] = inputData[(sample - 1) / 2];
            // }

            outputData[sample] = inputData[sample * 2];
        }
    }
};
filter_high.connect(scriptNode);
scriptNode.connect(audioctx.destination);
