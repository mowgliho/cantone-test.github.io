class ProdTest {
  recordTime = 2;
  buttonBarWidth = 200;
  
  //TODO vol buttons
  constructor(manager, doc, div, audio, share) {
    const that = this;

    this.manager = manager;
    this.share = share;

    doc.create('h2','Production Test',div);
    doc.create('hr',null,div);
    doc.create('p','As a final task, you will record yourself saying cantonese syllables. You will be provided with pronunciation for syllables (which rhyme with English words) as well as a tone.',div);
    doc.create('p','You will then record yourself saying the syllable. You can listen to your attempts and re-record if you wish.',div);

    this.stimuli = Stimuli.getProdTestStimuli();
    
    const startButton = doc.create('button', 'Start!', div);
    startButton.onclick = function() {startButton.style.display = 'none'; that.startTest()};

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
      function() {that.recorded()},
      function() {that.played()},
      function() {return that.share.get('micGain')});
    this.resetPb = pb['reset'];

    let buttonDiv = doc.create('div',null,this.testDiv);
    buttonDiv.style.width = this.buttonBarWidth + 'px';
    for(const button of [pb['record'],pb['playback']]) {
      button.style.width = (100/2).toFixed(2) + '%';
      buttonDiv.appendChild(button)
    }

    let attemptVol = doc.create('p','Attempt playback volume: ',this.testDiv);
    getVolButtons(doc, this.share, attemptVol)

    doc.create('hr',null,this.testDiv);
    this.submitButton = doc.create('button','Submit',this.testDiv);
    this.submitButton.onclick = function() { that.nextRound()};
  }

  busy() {
    this.submitButton.disabled = true;
  }

  recorded() {
    this.hasRecorded = true;
    this.update();
  }

  played() {
    this.update();
  }

  startTest() {
    this.idx = 0;
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
    let syl = this.stimuli[this.idx];
    this.resetPb();
    this.sylLabel.innerHTML = syl['syl'];
    this.toneLabel.innerHTML = syl['tone'];
    this.descLabel.innerHTML = syl['desc'];
  }

  nextRound() {
    //do gathering of data

    this.idx += 1;
    if(this.idx < this.stimuli.length) {
      this.startRound();
    } else {
      this.manager.next();
    }
  }

  start(){};

}
