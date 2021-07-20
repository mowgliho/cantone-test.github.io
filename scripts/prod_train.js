class ProdTrain {
  buttonBarWidth = 500;
  recordTime = 2;

  timeLeft = 900*1000;//amount of time for the task.
  stimuli = Stimuli.getProdTrainStimuli(1, 51);

  constructor(manager, doc, div, audio, share) {
    this.audio = audio;
    this.share = share;
    this.manager = manager;

    this.visType = this.share.get('visual');
    this.audioType = this.share.get('audio');

    let header = doc.create('h2','Production Training ',div);
    this.timerLabel = doc.create('label',null,header);
    doc.create('hr',null,div);
    
    this.stateDependentButtons = [];
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

    this.trainUI = doc.create('div',null,trainDiv);
    if(this.audioType == 'exemplar') {
      let trainPb = this.buildPlayback(doc);
      this.resetPb = trainPb['reset'];
      let buttonBar = this.getButtonBar(doc, [this.exButton, trainPb['record'], trainPb['playback']]);
      trainDiv.appendChild(buttonBar);
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

  buildPlayback(doc) {
    const that = this;

    const volFn = function() {return that.share.get('micGain');};
    const startFn = function() {that.changeState('busy');};
    const recordedCallback = function() {that.changeState('ready')};
    const playbackCallback = function() {that.changeState('ready')};

    return definePlayback(doc, this.recordTime, startFn, recordedCallback, playbackCallback, volFn);
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
  }

  startRound() {
    let stim = this.stimuli[this.stimIdx];

    this.roundLabel.innerHTML = 'Round ' + (this.round+1) + (stim['type'] == 'test'?' (Test Round)':'');
    this.stimuliLabel.innerHTML = stim['syl'];
    this.stimuliToneLabel.innerHTML = stim['tone'];

    //test ui vs train ui
    this.exButton.style.visibility = stim['type'] == 'test'?'hidden':'visible';
    this.trainUI.style.display = stim['type'] == 'test'?'none':'block';

    this.resetPb();
    this.changeState('ready');
  }

  nextRound() {
    this.round += 1;
    this.stimIdx = this.round % this.stimuli.length;
    this.startRound();
  }

  startTraining() {
    //set up timer
    this.introDiv.style.display = 'none';
    this.trainDiv.style.display = 'block';
    this.startTimer();
    this.round = 0;
    this.stimIdx = 0;
    if(this.share.get('micGain') == null) this.share.save('micGain',1.0);
    this.startRound();
  }

  startTimer() {
    const that = this;

    this.endTime = (new Date()).getTime() + this.timeLeft;
    this.share.addTimeout(setInterval(function() {
      let time = (new Date()).getTime();
      if(that.endTime < time) {
        that.share.clearTimeouts();
        that.finish();
      } else {
        let timeLeft = that.endTime - time;
        that.timerLabel.innerHTML = '(' + ProdTrain.getDisplay(timeLeft) + ' minutes remaining)';
        that.timerLabel.style.color = timeLeft < 60000?'red':'black';
      }
    }, 1000));
  }

  stopTimer() {
    this.share.clearTimeouts();
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
