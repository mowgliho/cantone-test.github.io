class WorldVocoder {
  static worldJSSpeed = 16;
  static checked = ['p','t','k'];
  static cutpoints = {checked:{start:0.5,end:0.5},normal:{start:0.2,end:0.8}};
  static apThreshold = 0.5
  static minApBand = 5;
  static spectralTuneWidth = 0.1;

  timeouts;
  world;
  audioBuffers;
  audioCtx;
  tuningDuration;

  audioLoaded;
  f0;
  spectral;
  aperiodicity;
  fft_size;
  sampleRate;
  synth;//the synthetic audio files (as buffers);

  //to be updated
  mean;

  constructor(trainer, tuningDuration, mean, visType) {
    const that = this;

    this.tuningDuration = tuningDuration;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    this.audioBuffers = {};

    this.timeouts = [];
    this.timeouts.push(setInterval(function() {that.activate()},100));

    this.audioLoaded = false;
    this.mean = mean;
    this.trainer = trainer;
    this.world = null;
    this.wait = null;
    this.ready = false;
    this.visType = visType;
  } 

  activate() {
    if(Object.keys(Module).includes('WorldJS')) {
      this.world = Module.WorldJS
      this.clearTimeouts();
      this.ready = true;
      this.trainer.vocoderActive();
    }
  }

  isReady() {
    return this.ready;
  }

  loadCharacter(char, tone, callback) {
    if(!this.ready) return;

    const that = this;

    this.ready = false;

    this.audioBuffers = {};
    this.audioLoaded = false;
    this.tone = tone;
    this.char = char.slice(0,-1);
    const url = Config.worldFilePrefix + char + '.wav'
    const req = new XMLHttpRequest();
    req.open('GET', url);
    req.responseType = 'arraybuffer';
    req.onload = function(e) {that.loadAudio(req.response, callback)};
    req.send();
  }

  getF0Contour(buffer, sampleRate, param) {
    return this.world.Dio(buffer,sampleRate, param);
  }

  loadAudio(arraybuffer, callback) {
    const that = this;

    this.audioCtx.decodeAudioData(arraybuffer).then(function(audio) {
      that.sampleRate = audio.sampleRate;
      var buffer = combineChannels(audio);
      const f0 = that.getF0Contour(buffer, that.sampleRate, WorldVocoder.worldJSSpeed);
      const sp = that.world.CheapTrick(buffer, f0.f0, f0.time_axis, that.sampleRate);
      const ap = that.world.D4C(buffer, f0.f0, f0.time_axis, sp.fft_size, that.sampleRate);
      that.f0 = f0.f0;
      that.spectral = sp.spectral;
      that.aperiodicity = ap.aperiodicity;
      that.fft_size = sp.fft_size;
      that.audioLoaded = true;
      that.synthesizeAudio(callback);
    });
  }

  synthesizeAudio(callback) {
    const that = this;

    const getAudioFn = function(samples) {
      return function() {
        const node = that.audioCtx.createBufferSource();
        const nodeBuffer = that.audioCtx.createBuffer(1, samples.length, that.sampleRate);
        nodeBuffer.copyToChannel(samples,0);
        node.buffer = nodeBuffer;
        const duration = samples.length/that.sampleRate;
        node.connect(that.audioCtx.destination);
        return [node,duration, that.audioCtx];
      }
    }

    const ret = {};
    //shift for whole syllable
    const shift = ToneContours.getHumanumShift(this.mean);
    const charf0 = ToneContours.semitoneArrayToFreq(ToneContours.freqArrayToSemitone(this.f0, shift));
    const charSamples = WorldVocoder.float64To32(this.world.Synthesis(charf0, this.spectral, this.aperiodicity, this.fft_size, this.sampleRate, WorldVocoder.worldJSSpeed));
    ret['char'] = getAudioFn(charSamples);
    //beginning elements
    const [voiceStart,voiceEnd] = this.getVoicedIndices(this.aperiodicity);
    const cutpoints = WorldVocoder.cutpoints[WorldVocoder.checked.includes(this.char.slice(-1))?'checked':'normal'];
    for(const [type, point] of Object.entries(cutpoints)) {
      //get indices
      const midIdx = voiceStart + (point)*(voiceEnd - voiceStart)
      const startIdx = Math.floor(midIdx - (WorldVocoder.spectralTuneWidth/2)*(voiceEnd-voiceStart));
      var endIdx = Math.ceil(midIdx + (WorldVocoder.spectralTuneWidth/2)*(voiceEnd-voiceStart));
      if(endIdx == startIdx) endIdx += 1;
      //get the desired spectrum, aperiodicty, f0
      const spectrum = this.getMedians(this.spectral.slice(startIdx, endIdx));
      const aperiodicity = this.getMedians(this.aperiodicity.slice(startIdx, endIdx));
      const f0 = ToneContours.semitoneToFreq(ToneContours.getTuningHumanumSt(this.mean, this.tone, type, this.visType));
      //repeat for desired length
      const indicesPerSecond = this.f0.length/(charSamples.length/this.sampleRate);
      const numInds = Math.max(1,Math.round(indicesPerSecond*this.tuningDuration));
      const spectra = this.duplicate(spectrum, numInds);
      const aperioda = this.duplicate(aperiodicity, numInds);
      const f0s = this.duplicate(f0, numInds);
      ret[type] = getAudioFn(WorldVocoder.float64To32(this.world.Synthesis(f0s, spectra, aperioda, this.fft_size, this.sampleRate, WorldVocoder.worldJSSpeed)));
    }
    this.ready = true;
    callback(ret);
  }

  duplicate(x, n) {
    const ret = [];
    for(var i = 0; i < n; i++) {
      ret.push(x);
    }
    return ret;
  }

  getMedians(spectra) {
    const ret = new Float64Array(spectra[0].length);
    for(var i = 0; i < ret.length; i++) {
      const vals = new Float64Array(spectra.length);
      for(var j = 0; j < vals.length; j++) {
        vals[j] = spectra[j][i]
      }
      ret[i] = this.getMedian(vals);
    }
    return ret;
  }

  getMedian(values){
    if(values.length == 0) return 0;
    values.sort(function(a,b){
      return a-b;
    });
    var half = Math.floor(values.length / 2);
    if (values.length % 2) return values[half];
    return (values[half - 1] + values[half]) / 2.0;
  }

  //checks if first 10th of fft buckets are below 0.5
  getVoicedIndices(aperiodicity) {
    const apBuckets = [];
    for(var j = 0; j < this.spectral.length; j++) {
      apBuckets.push(this.getMedian(aperiodicity[j].slice(0,Math.floor(aperiodicity[j].length/10))))
    }
    var start = null;
    var end = null;
    var startCount = 0;
    var endCount = 0;
    for(var i = 0; i < apBuckets.length; i++) {
      if(start == null) {
        if(apBuckets[i] < WorldVocoder.apThreshold) startCount += 1;
        else startCount = 0;
        if(startCount >= WorldVocoder.minApBand) start = i - WorldVocoder.minApBand + 1;
      }
      if(end == null) {
        if(apBuckets[apBuckets.length-i] < WorldVocoder.apThreshold) endCount += 1;
        else endCount = 0;
        if(endCount >= WorldVocoder.minApBand) end = (apBuckets.length-i) + WorldVocoder.minApBand - 1;
      }
    }
    if(start == null || end == null || end <= start) {
      start = Math.floor(apBuckets.length/2);
      end = Math.ceil(apBuckets.length/2);
    }
    return [start,end];
  }


  //as in Zhang 2018, use middle 80% (tone/nucleus as in Yang)
  //Tone contour begins and ends at syllable (Xu), so we adjust accordingly based on the tone
  //for checked tones (ptk at end), we use the middle (they are level tones and mostly short): checked that all characters with 'p', 't', and 'k' at the end are indeed t1,3,6
  //We get start/end differences from humanum
  getTuningAudio(audioCtx) {

  }

  clearTimeouts() {
    for(const timeout of this.timeouts) {
      clearTimeout(timeout);
    }
    this.timeouts = [];
  }

  static float64To32(array) {
    var ret = new Float32Array(array.length);
    for(var i = 0; i < array.length; i++) {
      ret[i] = Math.fround(array[i]);
    }
    return ret;
  }

}
