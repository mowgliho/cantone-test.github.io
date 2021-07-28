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

function uploadFiles(d, id, name, append, callback) {
  let fileData = [];
  for(const [key,data] of Object.entries(d)) {
    if(data.length == 0) continue;
    let cols = Object.keys(data[0]);
    var filename = name + '_' + key + '.tsv';
    var text = append?'': cols.join('\t') + '\n';
    for(var row of data) {
      text += cols.map((a) => row[a]).join('\t') + '\n'
    }
    fileData.push({filename: filename, text: text, append: append});
  }
  uploadPlainTextFiles(id, fileData, callback);
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

//data is list of files, each of which is a dict [{filename: asdf, text: asdf, append: asdf},{filename: asdf, text: asdf}]
uploadPlainTextFiles = function(id, data, callback) {
  let fd = new FormData();
  fd.append('id', id);
  fd.append('data',JSON.stringify(data));

  fetch(Config.plainTextCgi, { method: 'POST', body: fd}).then(
    (response) => {response.text().then(function(x) {if(callback != null) callback();})}).catch(
    (error) => {console.log("error", error)});
}

uploadPlainTextFile = function(id, filename, text, append, callback) {
  uploadPlainTextFiles(id, [{filename: filename, text: text, append: append}], callback);
}


uploadAudioFile = function(blob, filename, callback) {
  var fd = new FormData();
  fd.append('audio_data',blob,filename);
  fetch(Config.audioCgi, { method: 'POST', body: fd}).then(
    (response) => {callback()}).catch(
    (error) => {console.log("error", error)});
}

uploadProgress = function(id, task, status, callback) {
  uploadPlainTextFile(id, 'progress.txt', task + '\t' + status + '\t' + (new Date()).getTime() + '\n', true, callback);
}

getStatus = function(id, callback) {
  getCgiInner(id, callback, Config.statusCgi);
}

getCgiInner = function(id, callback, url) {
  let fd = new FormData();
  fd.append('id',id);

  fetch(url, { method: 'POST', body: fd}).then(
    (response) => {response.text().then(function(x) {
      callback(JSON.parse(x));
    })}).catch(
    (error) => {console.log("error", error)});
}

getInfo = function(id, callback) {
  getCgiInner(id, callback, Config.infoCgi);
}
