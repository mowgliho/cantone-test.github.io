class Tuning {
  static smoothLength = 5;
  static smoothThreshold = 10;
  static width = 100;
  static height = 500;
  static canvasHeightSd = 6;//6 sds tall
  static margin = 0.05;
  static closeTune = 0.05;

  states = ['deactivated','ready','guiding','tuning','tuned'];

  buttonInfo = {
    ready: {text:'Start',color:''},
    guiding: {text:'Listen',color:'skyblue'},
    tuning: {text:'Match!',color:'red'},
    deactivated: {text:'deactivated',color:''},
    tuned: {text:'ready',color:'lawngreen'}
  }
  colors = {guide:'black',far:'red',close:'green'};
  gain = 1.3;
  measurementInterval = 20;

  constructor(doc, share, tuningDur, matchDur, tryDur, parent) {
    this.share = share;
    this.tuningDur = tuningDur;
    this.matchDur = matchDur;
    this.tryDur = tryDur;
    this.parent = parent;

    this.div = doc.create('div', null, null);

    this.canvas = doc.create('canvas',null, this.div);
    this.canvas.width = Tuning.width;
    this.canvas.height = Tuning.height;
    this.button = doc.create('button',null, this.div);
    this.button.style.width = '100%';
    this.div.style.display = 'inline-block';
    this.div.style.border = '1px solid';
    this.div.style.width = Tuning.width + 'px';
    this.line = null;
    this.state = 'deactivated';
    this.update();
  }

  getWidth() {
    return Tuning.width;
  }

  set(mean, z, sd) {
    this.state = 'ready';
    this.mean = mean;
    this.target = mean + z*sd;
    this.sdHeight = Tuning.canvasHeightSd * sd;
    this.line = 0.5 + z/Tuning.canvasHeightSd;
    this.z = z;
    this.attempt = null;
    this.tunedFlag = false;
    this.update();
  }

  guide() {
    const that = this;

    this.state = 'guiding';
    this.update();
    getAudioStream(function(audioContext, stream) {
      that.parent.tunerStarted(that);
      const node = Tuning.createNode(audioContext, that.target);
      const gain= audioContext.createGain();
      gain.gain.value = that.gain; 
      node.connect(gain).connect(audioContext.destination);
      that.share.addTimeout(setTimeout(function() {that.tune(node, audioContext, stream)},that.tuningDur*1000));
      node.start();
    })();
  }

  tune(node, audioContext, stream) {
    const that = this;
    const start = (new Date()).getTime();

    this.share.clearTimeouts();
    node.stop();
    this.state = 'tuning';
    this.update();

    const analyzer = getAnalyzer(audioContext, stream);
    let data = new Float32Array(analyzer.fftSize)
    const sampleRate = audioContext.sampleRate;
    const smoother = Tuning.getSmoother(Tuning.smoothLength, Tuning.smoothThreshold);
    var idx = 0;
    const attempts = new Array(Math.round((1000*this.matchDur)/this.measurementInterval)).fill(NaN);
    const contour = [];

    const intervalFn = function() {
      analyzer.getFloatTimeDomainData(data);
      const st = 49 + 12*Math.log2(yin(data, sampleRate)/440);
      const rawAttempt = 0.5 + (st-that.mean)/that.sdHeight;

      attempts[idx] = rawAttempt;
      idx = (idx + 1) % attempts.length;
      const mean = attempts.reduce((a,x) => a+x,0)/attempts.length;
      contour.push([(new Date()).getTime() - start, st.toFixed(3), that.target.toFixed(3)]);
      if(Math.abs(mean - that.line) < Tuning.closeTune) that.stopTuning(true, contour);

      const val = Math.max(Tuning.margin, Math.min(1-Tuning.margin, rawAttempt));
      that.attempt = smoother(val);
      that.paintCanvas();
    }

    this.share.addTimeout(setInterval(intervalFn, this.measurementInterval));
    this.share.addTimeout(setTimeout(function() {that.stopTuning(false, contour)}, this.tryDur*1000));
  }

  stopTuning(success, contour) {
    this.share.clearTimeouts();
    this.state = success?'tuned':'ready';
    this.tunedFlag = this.tunedFlag || success;
    this.update();
    this.parent.tunerFinished(this, this.mean, this.z, contour);
  }

  tuned() {
    return this.state == 'tuned';
  }

  paintCanvas() {
    Tuning.clearCanvas(this.canvas);
    if(this.line != null) Tuning.drawLine(this.canvas, this.line,this.colors['guide']);
    if(this.attempt != null) {
      let color = Math.abs(this.attempt-this.line) < Tuning.closeTune? this.colors['close']:this.colors['far'];
      Tuning.drawLine(this.canvas, this.attempt, color);
    }
  }

  update() {
    const that = this;

    this.button.innerHTML = this.buttonInfo[this.state]['text'];
    this.button.style.backgroundColor = this.buttonInfo[this.state]['color'];
    this.button.onclick = this.state == 'ready'?function() {that.guide()}:function() {};
    this.button.disabled = this.state != 'ready';
    this.paintCanvas();
  }

  deactivate() {
    this.state = 'deactivated';
    this.update();
  }

  reactivate() {
    this.state = this.tunedFlag? 'tuned':'ready';
    this.update();
  }

  getDiv() {
    return this.div;
  }



  //HELPER FUNCTIONS
  
  static createNode(audioContext, st, duration) {
    const node = audioContext.createOscillator();
    node.frequency.value = Math.pow(2,(st - 49)/12)*440;
    return(node);
  }


  static clearCanvas(canvas) {
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.beginPath();
  }

  static drawLine(canvas, y, color) {
    let ctx = canvas.getContext('2d');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0,(1-y)*canvas.height);
    ctx.lineTo(canvas.width, (1-y)*canvas.height);
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  
  //if zero, only add to the array if had more than zeroThreshold in a row
  static getSmoother = (size, zeroThreshold) => {
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
}
