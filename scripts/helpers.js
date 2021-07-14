class Shared {
  constructor() {
    this.stuff = {};
    this.timeouts = [];
  }

  save(key,value) {
    this.stuff[key] = value;
  }

  get(key) {
    return this.stuff[key];
  }

  addTimeout(to) {
    this.timeouts.push(to);
  }

  clearTimeouts() {
    for(const to of this.timeouts) {
      clearTimeout(to);
    }
    this.timeouts = [];
  }
}

class DocumentWrapper {
  constructor(doc) {
    this.doc = doc;
  }

  create(type, html) {
    let ret = this.doc.createElement(type);
    if (typeof html !== 'undefined') ret.innerHTML = html;
    return ret;
  }
}

function getAudioStream(callback) {
  return function() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    let constraints = {
      audio: {
        autoGainControl: false,
        channelCount: 1,
        echoCancellation: false,
        latency: 0,
        noiseSuppression: false,
        sampleRate: 16000,
        sampleSize: 16,
        volume: 1.0
      }
    };
    navigator.mediaDevices.getUserMedia(constraints).then(function(s) { callback(audioContext, s);}).catch(function(err) {
      console.log('error' + err + err.stack);
      alert('Stream generation failed.' + err.stack);
    });
  }
}
