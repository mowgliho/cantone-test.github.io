class Playback {
  h = {prevAttempt: null, audioContext: null};

  constructor(doc, recordTime, intervalFn, startFn, recordedCallback, playbackCallback, volFn) {
    const that = this;

    this.recordTime = recordTime;
    this.intervalFn = intervalFn;
    this.startFn = startFn;
    this.recordedCallback = recordedCallback;
    this.playbackCallback = playbackCallback;
    this.volFn = volFn;

    this.recordButton = doc.create('button','Record',null);
    this.playbackButton = doc.create('button','Play Attempt',null);
 
    this.recordButton.onclick = getAudioStream(function(audioContext, stream) { that.record(audioContext, stream);});
    this.playbackButton.onclick = function() {that.playback()};
  }

  get(key) {
    return key == 'record'? this.recordButton: this.playbackButton;
  }

  reset() {
    this.h['prevAttempt'] = null;
    this.recordButton.disabled = false;
    this.playbackButton.disabled = true;
  };

  off() {
    this.recordButton.disabled = true;
    this.playbackButton.disabled = true;
  }

  on() {
    this.recordButton.disabled = false;
    this.playbackButton.disabled = this.h['prevAttempt'] == null;
  }

  record = function(aContext, stream) {
    const that = this;

    this.startFn();
    this.recordButton.disabled = true;
    this.playbackButton.disabled = true;
    const timeouts = [];

    this.h['audioContext'] = aContext;
    const chunks = []; 
    const recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', function(e) {
      if (e.data.size > 0) chunks.push(e.data);
    }); 

    recorder.addEventListener('stop', function() {
      let reader = new FileReader();
      reader.onloadend = function() {
        that.h['audioContext'].decodeAudioData(reader.result).then( (audioBuffer) => {
          that.h['prevAttempt'] = audioBuffer;
          for(var to of timeouts) clearTimeout(to);
          that.recordButton.disabled = false;
          that.playbackButton.disabled = false;
          that.recordedCallback(audioBuffer);
        })
      };  
      reader.readAsArrayBuffer(new Blob(chunks));
    }); 
    recorder.start();

    if(this.intervalFn != null) {
      let innerFn = this.intervalFn['fn'](aContext, stream);
      let fn = function() { if(!innerFn()) recorder.stop()};
      timeouts.push(setInterval(fn, this.intervalFn['interval']));
    }

    timeouts.push(setTimeout(function() {recorder.stop()},this.recordTime * 1000));
  }

  playback() {
    const that = this;

    this.startFn();
    this.recordButton.disabled = true;
    this.playbackButton.disabled = true;

    const node = this.h['audioContext'].createBufferSource();
    node.buffer = this.h['prevAttempt'];
    const gainNode = this.h['audioContext'].createGain();
    gainNode.gain.value = this.volFn();
  
    node.connect(gainNode).connect(this.h['audioContext'].destination);
    node.addEventListener('ended', function() {
      that.playbackCallback(); 
      that.recordButton.disabled = false;
      that.playbackButton.disabled = false;
    });
    node.start();
  }
}
