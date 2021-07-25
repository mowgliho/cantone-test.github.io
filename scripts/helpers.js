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
definePlayback = function(doc, recordTime, intervalFn, startFn, recordedCallback, playbackCallback, volFn) {
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

  const off = function() {
    recordButton.disabled = true;
    playbackButton.disabled = true;
  }

  const on = function() {
    recordButton.disabled = false;
    playbackButton.disabled = h['prevAttempt'] == null;
  }

  record = function(aContext, stream) {
    startFn();
    recordButton.disabled = true;
    playbackButton.disabled = true;
    const timeouts = [];

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
          for(var to of timeouts) clearTimeout(to);
          recordButton.disabled = false;
          playbackButton.disabled = false;
          recordedCallback(audioBuffer);
        })
      };  
      reader.readAsArrayBuffer(new Blob(chunks));
    }); 
    recorder.start();

    if(intervalFn != null) {
      let innerFn = intervalFn['fn'](aContext, stream);
      let fn = function() { if(!innerFn()) recorder.stop()};
      timeouts.push(setInterval(fn, intervalFn['interval']));
    }

    timeouts.push(setTimeout(function() {recorder.stop()},recordTime * 1000));
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

  return {record: recordButton, playback: playbackButton, reset: reset, off: off, on: on};
}

//interval is in ms
getFreq = function(buffer, interval) {
  const fftSize = 2048;
  let sampleRate = buffer['sampleRate'];
  let length = buffer['length'];
  let data = combineChannels(buffer);

  freqs = [];
  for(var i = 0; i <= Math.floor((length-fftSize)/(interval/1000*sampleRate)); i++) {
    let start = i*(interval/1000*sampleRate);
    freqs.push(yin(data.slice(start, start + fftSize),sampleRate));
  }
  return freqs;
}

combineChannels = function(audioBuffer) {
  if(audioBuffer.numberOfChannels == 1) return audioBuffer.getChannelData(0);
  let nChannels = audioBuffer.numberOfChannels;
  var ret = new Float32Array(audioBuffer.length);
  for(var i = 0; i < nChannels; i++) {
    let d = audioBuffer.getChannelData(i);
    for(var j = 0; j < d.length; j++) ret[j] += d[j]/nChannels;
  }
  return ret;
}
 
//if zero, only add to the array if had more than zeroThreshold in a row
getSmoother = function(size, zeroThreshold) {
  var idx = 0;
  var active = false;
  const array = new Array(size);
  var zeroCount = 0;

  return(function(val) {
    if(val == 0) zeroCount += 1;
    else zeroCount = 0;

    if(val != 0 || zeroCount > zeroThreshold) {
      array[idx] = val;
      idx = (idx + 1) % size;
      if(idx == 0) active = true;
    }
    if(!active) return(null);
    return(array.reduce((a,b) => a + b)/size);
  });
}


getVolButtons = function(doc, share, div) {
  let volUp = doc.create('button','up',div);
  volUp.onclick = function() {share.save('micGain', share.get('micGain') * 3/2);};
  let volDown = doc.create('button','down',div);
  volDown.onclick = function() {share.save('micGain', share.get('micGain') * 2/3);};

  return {up: volUp, down: volDown};
}

cleanFrequencies = function(freqs) {
  freqs = freqs .filter(a => (a > 50 && a < 750));
  if(freqs.length > 0) {
    freqs = cleanMode(freqs);
  }
  return freqs;
}

cleanMode = function(x) {
  let hashmap = x.reduce( (acc, val) => {acc[val] = (acc[val] || 0 ) + 1; return acc },{});
  let mode =  Object.keys(hashmap).reduce((a, b) => hashmap[a] > hashmap[b] ? a : b);
  return x.filter(a => a != mode);
}

// Convert an AudioBuffer to a Blob using WAVE representation
function bufferToWave(abuffer, len) {
  var numOfChan = abuffer.numberOfChannels,
      length = len * numOfChan * 2 + 44,
      buffer = new ArrayBuffer(length),
      view = new DataView(buffer),
      channels = [], i, sample,
      offset = 0,
      pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this demo)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for(i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
      view.setInt16(pos, sample, true);          // write 16-bit sample
      pos += 2;
    }
    offset++                                     // next source sample
  }

  // create Blob
  return new Blob([buffer], {type: "audio/wav"});

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

uploadPlainTextFile = function(id, filename, text, append) {
  let fd = new FormData();
  fd.append('id', id);
  fd.append('filename', filename);
  fd.append('text', text);
  fd.append('append', append);
  fetch(Config.plainTextCgi, { method: 'POST', body: fd}).then(
    (response) => {response.text().then(function(x) {console.log(x)})}).catch(
    (error) => {console.log("error", error)});
}


uploadAudioFile = function(blob, filename) {
  var fd = new FormData();
  fd.append('audio_data',blob,filename);
  fetch(Config.audioCgi, { method: 'POST', body: fd}).then(
    (response) => {console.log(response)}).catch(
    (error) => {console.log("error", error)});
}

uploadProgress = function(id, task, status) {
  uploadPlainTextFile(id, 'progress.txt', task + '\t' + status + '\n', true);
}

getStatus = function(id, callback) {
  let fd = new FormData();
  fd.append('id',id);

  fetch(Config.statusCgi, { method: 'POST', body: fd}).then(
    (response) => {response.text().then(function(x) {
      callback(JSON.parse(x));
    })}).catch(
    (error) => {console.log("error", error)});
}
