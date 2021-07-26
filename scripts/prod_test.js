class ProdTest {
  recordTime = 2;
  buttonBarWidth = 200;
  colors = {
    startRound: [135,206,250],
    endRound: [224,255,255]
  }
  
  constructor(manager, doc, div, audio, share, status) {
    const that = this;

    this.manager = manager;
    this.share = share;
    this.buttons = {};

    doc.create('h2','Production Test',div);
    doc.create('hr',null,div);
    doc.create('p','As a final task, you will record yourself saying cantonese syllables. You will be provided with pronunciation for syllables (which rhyme with English words) as well as a tone.',div);
    doc.create('p','You will then record yourself saying the syllable. You can listen to your attempts and re-record if you wish.',div);

    this.stimuli = Stimuli.getProdTestStimuli();
    
    this.startButton = doc.create('button', 'Start!', div);
    this.startButton.onclick = function() {that.startTest()};

    doc.create('hr',null,div);

    this.testDiv = doc.create('div',null, div);
    this.testDiv.style.display = 'none';
    
    this.roundLabel = doc.create('h3',null,this.testDiv);
    let descDiv = doc.create('div',null,this.testDiv);
    doc.create('label','The current sound is ', descDiv);
    this.sylLabel = doc.create('label',null, descDiv);
    this.sylLabel.style.backgroundColor = 'lavender';
    doc.create('label',', with tone ', descDiv);
    this.toneLabel = doc.create('label',null, descDiv);
    this.toneLabel.style.backgroundColor = 'lavender';
    doc.create('label','.', descDiv);
    this.descLabel = doc.create('p',null, descDiv);

    let pb = definePlayback(doc, this.recordTime, null, 
      function() {that.busy()}, 
      function(buffer) {that.recorded(buffer)},
      function() {that.played()},
      function() {return that.share.get('micGain')});
    this.resetPb = pb['reset'];
    this.offPb = pb['off'];

    let buttonDiv = doc.create('div',null,this.testDiv);
    buttonDiv.style.width = this.buttonBarWidth + 'px';
    for(const key of ['record','playback']) {
      let button = pb[key];
      this.buttons[key] = button;
      button.style.width = (100/2).toFixed(2) + '%';
      buttonDiv.appendChild(button)
    }

    let attemptVol = doc.create('p','Attempt playback volume: ',this.testDiv);
    getVolButtons(doc, this.share, attemptVol);

    doc.create('hr',null,this.testDiv);
    this.submitButton = doc.create('button','Submit',this.testDiv);
    this.buttons['submit'] = this.submitButton;
    this.recordButtons();//EWW: has to be before so that the order of event listeners is good.
    this.submitButton.onclick = function() { that.nextRound()};

    this.idx = 0;
    if(status != null) {
      this.idx = parseInt(status) + 1;
      this.startTest();
    }
  }

  recordButtons() {
    const that = this;
    for(const [key, button] of Object.entries(this.buttons)) {
      button.addEventListener('click', function() {that.data['click'].push({round: that.idx, button: key, time: (new Date()).getTime() - that.startTime})});
    }
  }

  busy() {
    this.submitButton.disabled = true;
  }

  recorded(buffer) {
    const that = this;

    let freqs = cleanFrequencies(getFreq(buffer, 20));
    if(freqs.length > 0) {
      this.data['contour'].push({round:this.idx,attempt: this.numAttempts, contour: ToneContours.freqArrayToSemitone(freqs, 0).map((a) => a.toFixed(2))});
    }
    this.hasRecorded = true;
    this.update();
    this.numAttempts += 1;
    this.audio = buffer;
  }

  played() {
    this.update();
  }

  startTest() {
    this.startButton.style.display = 'none';
    this.testDiv.style.display = 'block';
    this.startRound();
    this.hasRecorded = false;
    this.update();
  }

  update() {
    this.submitButton.disabled = !this.hasRecorded;
  }

  startRound() {
    this.roundLabel.innerHTML = 'Round ' + (this.idx + 1) + '/' + this.stimuli.length;
    this.roundLabel.style.backgroundColor = interpolateColor(this.colors['startRound'], this.colors['endRound'], this.idx, this.stimuli.length);
    let syl = this.stimuli[this.idx];
    this.resetPb();
    this.sylLabel.innerHTML = syl['syl'];
    this.toneLabel.innerHTML = syl['tone'];
    this.descLabel.innerHTML = syl['desc'];

    this.startTime = (new Date()).getTime();
    this.numAttempts = 0;
    this.data = {click: [], contour: []};
  }

  nextRound() {
    this.submitButton.disabled = true;
    this.offPb();

    const that = this;

    const id = this.share.get('id');
    //do gathering of data
    let syl = this.stimuli[this.idx];
    this.data['round'] = [{round: this.idx, syl: syl['syl'], tone: syl['tone'], attempts: this.numAttempts, time: (new Date()).getTime() - this.startTime}];
    uploadFiles(this.data, id, 'prod_test', this.idx != 0, function() {
      uploadProgress(id, 'prod_test', that.idx , function() {
        let blob = bufferToWave(that.audio, that.audio.length);
        uploadAudioFile(blob, id + '_prod_test_' + that.idx + '.wav', function() {
          that.idx += 1;
          if(that.idx < that.stimuli.length) {
            that.startRound();
          } else {
            that.finish();
          }
        });
      });
    });
  }

  finish() {
    const that = this;
    uploadProgress(this.share.get('id'), 'prod_train','completed', function() { that.manager.next();});
  }

  start(){};
}
