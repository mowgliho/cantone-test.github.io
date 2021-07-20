class Shared {

  constructor() {
    this.stuff = this.loadCache();
    this.timeouts = [];
  }

  save(key,value) {
    this.stuff[key] = value;
    this.saveCache();
  }

  loadCache() {
    let ret = {};
    for(const key of Object.keys(localStorage)) {
      ret[key] = localStorage.getItem(key);
    }
    return ret;
  }

  saveCache() {
    for(const [key,val] of Object.entries(this.stuff)) {
      localStorage.setItem(key, val);
    }
  }

  get(key) {
    if(!Object.keys(this.stuff).includes(key)) return null;
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

  create(type, html, div) {
    let ret = this.doc.createElement(type);
    if (typeof html !== 'undefined' && html != null) ret.innerHTML = html;
    if (typeof div !== 'undefined' && div != null) div.appendChild(ret);
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

function shuffleArray(orig) {
  let array = orig.map((a) => a);
  var idx = array.length;
  while (0 !== idx) {
    // Pick a remaining element...
    const rIdx = Math.floor(Math.random() * idx);
    idx--;
    // And swap it with the current element.
    [array[idx], array[rIdx]] = [array[rIdx], array[idx]];
  }
  return array;
}

function getAnalyzer(audioContext, stream) {
  let analyzer = audioContext.createAnalyser();
  analyzer.fftsize = Math.pow(2,9);
  audioContext.createMediaStreamSource(stream).connect(analyzer)
  return analyzer;
}

  //j is count from end, not from start
function  interpolateColor(start, end, j, n) {
  let arr = [];
  for(var i = 0; i < start.length; i++) {
    if(n == -1) arr.push(start[i]);
    else arr.push(start[i] + (end[i]-start[i])*(n-j)/n);
  }
  return 'rgba(' + arr.join(',') + ')';
}

function uploadFiles(keys, d, id, name) {
  const key = keys.pop();
  if(d[key].length > 0) {
    let data = d[key];
    let cols = Object.keys(data[0]);

    var body = id + '_' + name + '_' + key + '.tsv\n';
    body += cols.join('\t') + '\n'
    for(var row of data) {
      body += cols.map((a) => row[a]).join('\t') + '\n'
    }
    fetch(Config.plainTextCgi, { method: 'POST', body: body}).then(
      (response) => {response.text().then(function(x) {console.log(x); if(keys.length > 0) uploadFiles(keys, d, id, name);})}).catch(
      (error) => {console.log("error", error)});
  } else {
    if(keys.length > 0) uploadFiles(keys, d, id, name);
  }
}

//returns a record and a playback button that are linked appropriately
definePlayback = function(doc, recordTime, startFn, recordedCallback, playbackCallback, volFn) {
  const recordButton = doc.create('button','Record',null);
  const playbackButton = doc.create('button','Play Attempt',null);
  
  const h = {
    prevAttempt: null,
    audioContext: null
  }

  const reset = function() {
    h['prevAttempt'] = null;
    recordButton.disabled = false;
    playbackButton.disabled = true;
  };


  record = function(aContext, stream) {
    startFn();
    recordButton.disabled = true;
    playbackButton.disabled = true;

    h['audioContext'] = aContext;
    const chunks = []; 
    const recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', function(e) {
      if (e.data.size > 0) chunks.push(e.data);
    }); 

    recorder.addEventListener('stop', function() {
      let reader = new FileReader();
      reader.onloadend = function() {
        h['audioContext'].decodeAudioData(reader.result).then( (audioBuffer) => {
          h['prevAttempt'] = audioBuffer;
          recordButton.disabled = false;
          playbackButton.disabled = false;
          recordedCallback();
        })
      };  
      reader.readAsArrayBuffer(new Blob(chunks));
    }); 
    recorder.start();

    setTimeout(function() {recorder.stop()},recordTime * 1000);
  }

  playback = function() {
    startFn();
    recordButton.disabled = true;
    playbackButton.disabled = true;

    const node = h['audioContext'].createBufferSource();
    node.buffer = h['prevAttempt'];
    const gainNode = h['audioContext'].createGain();
    gainNode.gain.value = volFn();
  
    node.connect(gainNode).connect(h['audioContext'].destination);
    node.addEventListener('ended', function() {
      playbackCallback(); 
      recordButton.disabled = false;
      playbackButton.disabled = false;
    });
    node.start();
  }

  recordButton.onclick = getAudioStream(function(audioContext, stream) { record(audioContext, stream);});
  playbackButton.onclick = function() {playback()};

  return {record: recordButton, playback: playbackButton, reset: reset};
}
