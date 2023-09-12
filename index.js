const Jungle = require('./jungle.js');

var audioContext = null;
var audioInput = null;
var effectInput = null;
var wetGain = null;
var dryGain = null;
var outputMix = null;
var currentEffectNode = null;

var _streamOrg = null;
var _stream = null;

// 转换成单声道
function convertToMono(input) {
    // access the individual channels of an audio stream and process them separately.
    // 访问音频通道
    // 分割成的声道道数目
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    // 将一个节点的输出连接到一个指定目标
    // destination 需要连接的
    // outputIndex 一个索引，用于描述当前 AudioNode 的哪个输出会连接到 destination。索引数字是由输出频道（详见 Audio channels）的数量来确定的。
    // inputIndex 一个索引，用于描述当前 AudioNode 会连接到 destination 的哪个输入，它的默认值是 0。索引数字是由输入频道（详见 Audio channels）的数量来确定的。
    input.connect(splitter);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 0, 1);
    
    return merger;
}

function gotStream(stream) {
    // Create an AudioNode from the stream.
    // 关联可能来自本地计算机麦克风或其他来源的音频流
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
    // outputMix.connect(audioContext.destination);

    crossfade(1.0);
    changeEffect();
}

// 交叉混合
function crossfade(value) {
    // equal-power crossfade
    var gain1 = Math.cos(value * 0.5 * Math.PI);
    var gain2 = Math.cos((1.0 - value) * 0.5 * Math.PI);

    dryGain.gain.value = gain1;
    wetGain.gain.value = gain2;
}

function changeEffect() {
    if (currentEffectNode) {
        currentEffectNode.disconnect();
    }

    if (effectInput) {
        effectInput.disconnect();
    }

    var effect = new Jungle(audioContext);
    
    effect.output.connect(wetGain);
    currentEffectNode = effect.input;
    effect.setPitchOffset(.7); // 设置变声系数[-1, 1]，越大越尖锐

    audioInput.connect(currentEffectNode);
}

async function voiceChanger(stream) {
    return new Promise((res, reg) => {
        // 音频上下文
        audioContext = new AudioContext();

        if (stream) {
            // 有音频流，直接使用
            _streamOrg = stream;

            gotStream(_streamOrg);

            getNewStream();

            res(_stream);
        } else {
            // 没有音频流，获取麦克风的音频流
            if (!navigator.getUserMedia) {
                return alert('Error: getUserMedia not supported!');
            }

            navigator.getUserMedia({ audio: true }, stream => {
                _streamOrg = stream;

                gotStream(_streamOrg);

                getNewStream();

                res(_stream);
            }, e => {
                alert('Error getting audio');
                console.log(e);

                rej(e);
            });
        }
    })
}

function getNewStream() {
    var destination = audioContext.createMediaStreamDestination(),
        handledStream = destination.stream;

    outputMix.connect(destination);

    _stream = handledStream;
}

module.exports = voiceChanger;