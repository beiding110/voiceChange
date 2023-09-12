(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? (module.exports = factory())
        : typeof define === 'function' && define.amd
        ? define(factory)
        : ((global = global || self), (global.VoiceChanger = factory()));
})(this, function () {
    function createDelayTimeBuffer(context, activeTime, fadeTime, shiftUp) {
        var length1 = activeTime * context.sampleRate;
        var length2 = (activeTime - 2*fadeTime) * context.sampleRate;
        var length = length1 + length2;
        var buffer = context.createBuffer(1, length, context.sampleRate);
        var p = buffer.getChannelData(0);
    
        console.log("createDelayTimeBuffer() length = " + length);
        
        // 1st part of cycle
        for (var i = 0; i < length1; ++i) {
            if (shiftUp)
              // This line does shift-up transpose
              p[i] = (length1-i)/length;
            else
              // This line does shift-down transpose
              p[i] = i / length1;
        }
    
        // 2nd part
        for (var i = length1; i < length; ++i) {
            p[i] = 0;
        }
    
        return buffer;
    }

    class VoiceChanger {
        constructor(obj) {
            this.init(obj);
        }

        init({ stream, ready }) {
            // 音频上下文
            this._audioContext = new AudioContext();

            if (stream) {
                // 有音频流，直接使用
                this._stream = stream;
            } else {
                // 没有音频流，获取麦克风的音频流
                navigator.mediaDevices
                    .getUserMedia({ audio: true })
                    .then((stream) => {
                        this._stream = stream;

                        // this.loud();
                        this.shifter();

                        this.ready(ready);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
            }
        }

        loud() {
            const gainNode = this._audioContext.createGain();
            const sourceNode = this._audioContext.createMediaStreamSource(
                this._stream
            );

            sourceNode.connect(gainNode);
            gainNode.connect(this._audioContext.destination);
            gainNode.gain.value = 2.0;

            return this;
        }

        shifter(speed = 1.7) {
            const sourceNode = this._audioContext.createMediaStreamSource(this._stream);
            const filter = this._audioContext.createBiquadFilter();

            const processor = this._audioContext.createScriptProcessor( 4096, 1, 1 );

            processor.onaudioprocess = (event) => {
                // 处理回调中拿到输入声音数据
                const inputBuffer = event.inputBuffer;

                // 创建新的输出源
                const outputSource = this._audioContext.createMediaStreamDestination();
                const audioBuffer = this._audioContext.createBufferSource();

                audioBuffer.buffer = inputBuffer;

                // // 设置声音加粗，慢放speed倍
                audioBuffer.playbackRate.value = speed;

                audioBuffer.connect(outputSource);
                audioBuffer.start();

                // 返回新的 MediaStream
                const newStream = outputSource.stream;
                const node = this._audioContext.createMediaStreamSource(newStream);

                // 连接到扬声器播放
                node.connect(this._audioContext.destination);
            };

            // 添加处理节点
            filter.connect(processor);
            processor.connect(this._audioContext.destination);
        }

        shifter3() {
            const delay = this._audioContext.createDelay(1);
            const dryNode = this._audioContext.createGain();
            const wetNode = this._audioContext.createGain();
            const mixer = this._audioContext.createGain();
            const filter = this._audioContext.createBiquadFilter();

            delay.delayTime.value = 0.75;
            dryNode.gain.value = 1;
            wetNode.gain.value = 0;
            filter.frequency.value = 1100;
            filter.type = 'highpass';

            wetNode.gain.setValueAtTime(parseFloat(0.75), this._audioContext);
        }
        
        bold() {
            // 创建多个不同作用功能的node节点
            var analyser = this._audioContext.createAnalyser();
            var distortion = this._audioContext.createWaveShaper();
            var gainNode = this._audioContext.createGain();
            var biquadFilter = this._audioContext.createBiquadFilter();
            var convolver = this._audioContext.createConvolver();

            // 将所有节点连接在一起
            const sourceNode = this._audioContext.createMediaStreamSource(
                this._stream
            );

            sourceNode.connect(analyser);
            analyser.connect(distortion);
            distortion.connect(biquadFilter);
            biquadFilter.connect(convolver);
            convolver.connect(gainNode);
            gainNode.connect(this._audioContext.destination);

            // 控制双二阶滤波器

            biquadFilter.type = 'lowshelf';
            biquadFilter.frequency.value = 1000;
            biquadFilter.gain.value = 25;

            return this;
        }

        ready(ready) {
            this.$ready = ready;

            // this.mediaStream = this._audioContext.createMediaStreamSource(this._stream);
            // this.src = window.URL.createObjectURL(this.mediaStream);

            this.src = this._stream;

            this.$ready && this.$ready(this.src);

            return this;
        }
    }

    return VoiceChanger;
});
