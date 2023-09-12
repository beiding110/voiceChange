# voice-change 变声

拾取麦克风声音并将原有音色变尖锐

voiceChanger方法，返回一个 [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)

```javascript
// 获取到音频流
var stream = await voiceChanger();

// 获取到音频组件
var audio = document.querySelector('#audio');

// 音频组件加载音频流
audio.srcObject = stream;
```
