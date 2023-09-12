(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? (module.exports = factory())
        : typeof define === 'function' && define.amd
        ? define(factory)
        : ((global = global || self), (global.VoiceChanger = factory()));
})(this, function () {

    class VoiceChanger {
        constructor(obj) {
            this.audioContext = null;
            this.audioInput = null;
            this.realAudioInput = null;
            this.effectInput = null;
            this.wetGain = null;
            this.dryGain = null;
            this.outputMix = null;
            this.currentEffectNode = null;
            this.lpInputFilter = null;

            this._onReady = obj.ready;
            this._streamOrg = null;
            this._stream = null;

            this.init(obj);
        }

        // 转换成单声道
        convertToMono(input) {
            // access the individual channels of an audio stream and process them separately.
            // 访问音频通道
            // 分割成的声道道数目
            var splitter = this.audioContext.createChannelSplitter(2);
            var merger = this.audioContext.createChannelMerger(2);

            // 将一个节点的输出连接到一个指定目标
            // destination 需要连接的
            // outputIndex 一个索引，用于描述当前 AudioNode 的哪个输出会连接到 destination。索引数字是由输出频道（详见 Audio channels）的数量来确定的。
            // inputIndex 一个索引，用于描述当前 AudioNode 会连接到 destination 的哪个输入，它的默认值是 0。索引数字是由输入频道（详见 Audio channels）的数量来确定的。
            input.connect(splitter);
            splitter.connect(merger, 0, 0);
            splitter.connect(merger, 0, 1);
            
            return merger;
        }

        gotStream(stream) {
            // Create an AudioNode from the stream.
            // 关联可能来自本地计算机麦克风或其他来源的音频流
            var input = this.audioContext.createMediaStreamSource(stream);
        
            this.audioInput = this.convertToMono(input);

            // create mix gain nodes
            this.outputMix = this.audioContext.createGain();
            this.dryGain = this.audioContext.createGain();
            this.wetGain = this.audioContext.createGain();
            this.effectInput = this.audioContext.createGain();
            
            this.audioInput.connect(this.dryGain);
            this.audioInput.connect(this.effectInput);
            this.dryGain.connect(this.outputMix);
            this.wetGain.connect(this.outputMix);
            // this.outputMix.connect(this.audioContext.destination);

            this.crossfade(1.0);
            this.changeEffect();
        }

        // 交叉混合
        crossfade(value) {
            // equal-power crossfade
            var gain1 = Math.cos(value * 0.5 * Math.PI);
            var gain2 = Math.cos((1.0 - value) * 0.5 * Math.PI);
        
            this.dryGain.gain.value = gain1;
            this.wetGain.gain.value = gain2;
        }

        changeEffect() {
            if (this.currentEffectNode) {
                this.currentEffectNode.disconnect();
            }

            if (this.effectInput) {
                this.effectInput.disconnect();
            }

            var effect = new Jungle(this.audioContext);
            
            effect.output.connect(this.wetGain);
            this.currentEffectNode = effect.input;
            effect.setPitchOffset(.7);
        
            this.audioInput.connect(this.currentEffectNode);
        }

        init({ stream }) {
            // 音频上下文
            this.audioContext = new AudioContext();

            if (stream) {
                // 有音频流，直接使用
                this._streamOrg = stream;
            } else {
                // 没有音频流，获取麦克风的音频流
                if (!navigator.getUserMedia) {
                    return alert('Error: getUserMedia not supported!');
                }

                navigator.getUserMedia({ audio: true }, (stream) => {
                    this._streamOrg = stream;

                    this.gotStream(stream);

                    this.getNewStream();

                    this.ready();
                }, (e) => {
                    alert('Error getting audio');
                    console.log(e);
                });
            }
        }

        ready() {
            this._onReady && this._onReady(this._stream);

            return this;
        }

        getNewStream() {
            var destination = this.audioContext.createMediaStreamDestination(),
                handledStream = destination.stream;

            this.outputMix.connect(destination);

            this._stream = handledStream;
        }
    }

    return VoiceChanger;
});
