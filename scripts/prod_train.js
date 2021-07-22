class ProdTrain {
  minF0 = 50;
  maxF0 = 750;
  worldParam = 16;
  buttonBarWidth = 500;
  recordTime = 2;
  canvasWidth = 500;
  canvasHeight = 500;
  canvasText = 15;
  //vocoded params
  vocodedUISpacing = '20px';
  vocodeTryWidth = 500;
  tuneTime = 2;
  matchTime = 2;
  matchMaxTime = 10;
  smoothLength = 10;
  smoothThreshold = 10;


  timeLeft = 900*1000;//amount of time for the task.
  stimuli = Stimuli.getProdTrainStimuli(1, 27);

  constructor(manager, doc, div, audio, share) {
    this.audio = audio;
    this.share = share;
    this.manager = manager;

    this.visType = this.share.get('visual');
    this.audioType = this.share.get('audio');
    this.mean = parseFloat(this.share.get('st'));

    let header = doc.create('h2','Production Training ',div);
    this.timerLabel = doc.create('label',null,header);
    doc.create('hr',null,div);
    
    this.stateDependentButtons = [];

    if(this.audioType == 'vocoded') {
      this.vocoder = new WorldVocoder(this, this.tuneTime, this.mean);
    }

    this.buildIntroDiv(doc, div);
    this.buildTrainDiv(doc, div, audio);
  }

  buildIntroDiv(doc, div) {
    const that = this;

    this.introDiv = doc.create('div', null, div);
    doc.create('h3','Introduction:',this.introDiv);
    let p = doc.create('p', 'For the next ' + (this.timeLeft/60000).toFixed(0) + ' minutes, you will learn to speak Cantonese tones.', this.introDiv);

    doc.create('p', ' You will be able to play exemplar audio files of the stimuli. You will attempt to imitate the exemplars, focusing on the pitch contour.', this.introDiv);

    doc.create('p', 'Everyone\'s vocal range is different; you do not have to reproduce the exemplar pitches exactly. You will also be able to record and play your attempts. You can control the volume of the playback with buttons.', this.introDiv);
    if(this.audioType == 'exemplar') {
      if(this.visType != 'none') {
        doc.create('p', 'You will be able to refer to a tone chart.', this.introDiv);
      }
    } else {//audio type is vocoded
      doc.create('p', 'In addition, you will be able to hear the stimuli with its pitch manipulated to lie within your vocal range.', this.introDiv);
      let list = doc.create('ul',null,this.introDiv);
      doc.create('li','On the left, similar to the Mic Test, you will be able to match the starting and ending parts of each syllable. Each will play for a small amount of time. You can match the pitch afterwards. Try to make the lines match.', list);
      doc.create('li','On the right, you will see a tone chart with the target tone highlighted. Click "Try It" and attempt to say the syllable. A line should show up, representing your attempt. Again, try to make the lines/pitch contours match.', list);
      doc.create('p', 'Also note that at the beginning of each round the buttons may not be available for a few seconds. This is due to the time it takes for the system to adjust audio files for your vocal range.',this.introDiv);
    }
    doc.create('p', 'Some rounds will be "test rounds", in which you will only be able to record and hear your attempts. This is to help you internalize the tone contours and not rely on other aids.', this.introDiv);

    let screenshotDiv = doc.create('div',null,this.introDiv);
    doc.create('h4', 'Example Screenshot:', screenshotDiv);
    let image = doc.create('img',null, screenshotDiv);
    image.src = 'img/prod_train_' + this.visType + '_' + this.audioType + '.png';
    image.style.border = '1px solid';

    let startButton = doc.create('button', 'Start!', this.introDiv);
    startButton.onclick = function() {that.startTraining()};
 }

  buildTrainDiv(doc, div) {
    const that = this;
    
    this.adjustAudioDiv = doc.create('div',null, div);
    this.adjustLabel = doc.create('h3',null,this.adjustAudioDiv);

    let trainDiv = doc.create('div',null,div);

    //round and stimuli label
    this.roundLabel = doc.create('h3',null, trainDiv);
    let stimuliP = doc.create('p', 'Current syllable is ', trainDiv);
    this.stimuliLabel = doc.create('label', null, stimuliP);
    this.stimuliLabel.style.backgroundColor = 'lavender';
    doc.create('label',', which is tone ',stimuliP);
    this.stimuliToneLabel = doc.create('label', null, stimuliP);
    this.stimuliToneLabel.style.backgroundColor = 'lavender';
    doc.create('label',':',stimuliP);

    this.exButton = this.getExemplarButton(doc);

    let trainPb = this.buildPlayback(doc);
    this.resetPb = trainPb['reset'];
    this.offPb = trainPb['off'];
    this.onPb = trainPb['on'];
    this.trainUI = doc.create('div',null,trainDiv);
    if(this.visType != 'none') {
      let canvasDiv = doc.create('div',null,null);
      let canvas = doc.create('canvas',null,canvasDiv);
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      canvasDiv.style.width = this.canvasWidth + 'px';
      canvasDiv.style.height = this.canvasHeight + 'px';
      canvasDiv.style.border = '1px solid';
      this.visCanvas = canvas;

      if(this.audioType == 'exemplar') {
        this.trainUI.appendChild(canvasDiv);
        let buttonBar = this.getButtonBar(doc, [this.exButton, trainPb['record'], trainPb['playback']]);
        trainDiv.appendChild(buttonBar);
      } else {//vocoded
        this.tuners = {};
        for(const x of ['start','end']) {
          let outerDiv = doc.create('div',null,this.trainUI);
          let label = doc.create('label',x.charAt(0).toUpperCase() + x.slice(1) + ':',outerDiv);
          label.style.backgroundColor = '#BCB88A';
          let tuner = new Tuning(doc, this.share, this.tuneTime, this.matchTime, this.matchMaxTime, this);
          let innerDiv = tuner.getDiv();
          outerDiv.appendChild(innerDiv);
          let button = doc.create('button','Adjusted ' + x,outerDiv);
          this.stateDependentButtons.push(button);
          button.style.width = '100%';
          button.onclick = function() {that.tuneVocoded(x)};
          outerDiv.style.width = tuner.getWidth() + 'px';
          outerDiv.style.display = 'inline-block';
          let span = doc.create('span', null, this.trainUI);
          span.style.width = this.vocodedUISpacing;
          span.style.display = 'inline-block';
          this.tuners[x] = tuner;
        }
        //try canvas
        let tryDiv = doc.create('div',null,this.trainUI);
        tryDiv.style.display = 'inline-block';
        let label = doc.create('label','Try:',tryDiv);
        label.style.backgroundColor = '#BCB88A';
        tryDiv.appendChild(canvasDiv);
        let vocodedButton = this.getVocodedButton(doc);
        tryDiv.appendChild(this.getButtonBar(doc, [this.exButton, vocodedButton]));
        tryDiv.appendChild(this.getButtonBar(doc, [trainPb['record'], trainPb['playback']]));
        doc.create('p',null,trainDiv);
      }
    }

    //control playback volume
    let attemptVol = doc.create('div','Attempt playback volume: ',trainDiv);
    let volUp = doc.create('button','up',attemptVol);
    volUp.onclick = function() {that.share.save('micGain', that.share.get('micGain') * 3/2);};
    let volDown = doc.create('button','down',attemptVol);
    volDown.onclick = function() {that.share.save('micGain', that.share.get('micGain') * 2/3);};
   
    //next button
    doc.create('hr',null,trainDiv);
    let nextButton = doc.create('button', 'Next Round', trainDiv);
    nextButton.onclick = function() {that.nextRound();};
    this.stateDependentButtons.push(nextButton);

    this.trainDiv = trainDiv;
  }

  vocoderActive() {
    console.log('vocoder active');
  }

  getButtonBar(doc, buttons) {
    let div = doc.create('div',null,null);
    div.style.width = this.buttonBarWidth + 'px';
    for(const button of buttons) {
      button.style.width = (100/buttons.length).toFixed(2) + '%';
      div.appendChild(button)
    }
    return div;

  }

  getExemplarButton(doc) {
    const that = this;

    let button = doc.create('button','Play Exemplar',null);
    this.stateDependentButtons.push(button);
    button.onclick = function() {that.playExemplar()};
    return button;
  }

  getVocodedButton(doc) {
    const that = this;

    let button = doc.create('button','Adjusted to your range',null); 
    this.stateDependentButtons.push(button);
    button.onclick = function() {
      that.changeState('busy');
      let [node,audioContext] = that.getVocoded('char'); 
      node.onended = function() {that.changeState('ready')};
      node.start();};
    return button;
  }

  buildPlayback(doc) {
    const that = this;

    const volFn = function() {return that.share.get('micGain');};
    const startFn = function() {
      for(var tuner of Object.values(that.tuners)) tuner.deactivate();
      that.changeState('busy');
    };
    const recordedCallback = function(buffer) { 
      const sampleRate = buffer.sampleRate;
      const array = combineChannels(buffer);
      that.changeState('ready');
      for(var tuner of Object.values(that.tuners)) tuner.reactivate();
      let contour = that.vocoder.getF0Contour(array, sampleRate,that.worldParam).f0.filter(f => (f > that.minF0 && f < that.maxF0));
      if(contour.length > 0) that.plotAttemptContour(contour);
    };
    const playbackCallback = function() {that.changeState('ready')};

    let ret = definePlayback(doc, this.recordTime, startFn, recordedCallback, playbackCallback, volFn);

    return ret;
  }

  tuneVocoded(type) {
    const that = this;

    getAudioStream(function(a, stream) {
      let tuner = that.tuners[type];
      that.tunerStarted(tuner);
      let [node, audioContext] = that.getVocoded(type);
      tuner.guideNode(node, node, audioContext, stream, false)
    })();
  }

  getVocoded(type) {
    const [node, duration, audioContext] = this.adjustedAudio[this.stimuli[this.stimIdx]['syl']][type]();
    return [node, audioContext];
  }

  playExemplar() {
    const that = this;

    this.changeState('busy');
    let wav = new Audio(this.audio.humanum(this.stimuli[this.stimIdx]['syl']));
    wav.onended = function() { that.changeState('ready')};
    wav.play();
  }

  changeState(s) {
    this.state = s;
    this.update();
  }

  update() {
    let disabled = this.state != 'ready';
    for(const val of this.stateDependentButtons) {
      val.disabled = disabled;
    }
    if(disabled) this.offPb();
    else this.onPb();
  }

  startRound() {
    let stim = this.stimuli[this.stimIdx];

    this.roundLabel.innerHTML = 'Round ' + (this.round+1) + (stim['type'] == 'test'?' (Test Round)':'');
    this.stimuliLabel.innerHTML = stim['syl'];
    this.stimuliToneLabel.innerHTML = stim['tone'];

    //test ui vs train ui
    this.exButton.style.visibility = stim['type'] == 'test'?'hidden':'visible';
    this.trainUI.style.display = stim['type'] == 'test'?'none':'block';

    //update audio stuff
    if(this.visType != null) {
      ToneContours.paintContour(this.visCanvas, this.visType, ['t' + stim['tone']], this.canvasText);
    }

    if(this.audioType == 'vocoded') {
      for(const [type,tuner] of Object.entries(this.tuners)) {
        const st = ToneContours.getTuningHumanumSt(this.mean, stim['tone'], type);
        const z = (st - this.mean)/ToneContours.humanumSt;
        tuner.set(this.mean, z, ToneContours.humanumSt);
      }
    }
    
    this.resetPb();
    this.changeState('ready');
  }

  plotAttemptContour(contour) {
    let stContour = ToneContours.freqArrayToSemitone(contour, -this.mean).map((a) => a/ToneContours.humanumSt);;
    const smoother = getSmoother(this.smoothLength, this.smoothThreshold);
    var smoothed = [];
    for(const x of stContour) smoothed.push(smoother(x));
    smoothed = smoothed.filter(st => (st != null));
    if(smoothed.length == 0) return;
    let tone = 't' + this.stimuli[this.stimIdx]['tone'];
    let ret = ToneContours.paintContour(this.visCanvas, this.visType, [tone], this.canvasText);
    let canvas = this.visCanvas;
    let ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = 'green';
    ctx.setLineDash([]);
    var started = false;
    for(const [i, val] of stContour.entries()) {
      let x = ret['x'](i/stContour.length*ret['maxTs'][tone]);
      let y = ret['y'](val);
      if(!started) {
        started = true;
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  }

  tunerStarted(t) {
    this.changeState('busy');
    for(var tuner of Object.values(this.tuners)) {
      if(tuner != t) tuner.deactivate();
    }
  }

  tunerFinished(t, mean, z, contour) {
    this.changeState('ready');
    for(var tuner of Object.values(this.tuners)) {
      tuner.reactivate();
    }
  }

  nextRound() {
    this.round += 1;
    this.stimIdx = this.round % this.stimuli.length;
    this.startRound();
  }

  adjustAudio() {
    const that = this;

    this.trainDiv.style.display = 'none'
    this.adjustAudioDiv.style.display = 'block';
    this.adjustLabel.innerHTML = 'asdf';
    const chars = this.stimuli.map((a) => { return {syl: a['syl'], tone: a['tone']}});
    var idx = 0;
    this.adjustedAudio = {};
    let loadAudio = function() {
      that.adjustLabel.innerHTML = 'Adjusting syllable ' + (idx + 1) + '/' + chars.length + '...';
      that.vocoder.loadCharacter(chars[idx]['syl'], chars[idx]['tone'], function(ret) {
        that.adjustedAudio[chars[idx]['syl']] = ret;
        idx += 1;
        if(idx < chars.length) loadAudio();
        else that.startTrain();
      });
    };
    loadAudio();
  }

  startTraining() {
    this.introDiv.style.display = 'none';
    if(this.share.get('micGain') == null) this.share.save('micGain',1.0);
    if(this.audioType == 'vocoded') this.adjustAudio();
    else this.startTrain();
  }

  startTrain() {
    this.trainDiv.style.display = 'block';
    //set up timer
    this.startTimer();
    this.round = 0;
    this.stimIdx = 0;
    this.startRound();
  }

  startTimer() {
    const that = this;

    this.endTime = (new Date()).getTime() + this.timeLeft;
    this.timerTO = setInterval(function() {
      let time = (new Date()).getTime();
      if(that.endTime < time) {
        clearTimeout(that.timerTO);
        that.finish();
      } else {
        let timeLeft = that.endTime - time;
        that.timerLabel.innerHTML = '(' + ProdTrain.getDisplay(timeLeft) + ' minutes remaining)';
        that.timerLabel.style.color = timeLeft < 60000?'red':'black';
      }
    }, 1000);
  }

  stopTimer() {
    clearTimeout(that.timerTO);
    this.timeLeft= this.endTime - (new Date()).getTime();
  }

  start() {
    this.trainDiv.style.display = 'none';
    this.introDiv.style.display = 'block';
  }

  finish() {
    //upload data
    console.log('finished');
    //this.manager.next();
  }

  static getDisplay(t) {
    let s = Math.round(t/1000);
    return Math.floor(s/60) + ':' + String(s % 60).padStart(2,'0');
  }
}
