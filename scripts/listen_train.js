class ListenTrain {
  toneSets = [
    {type: 'level', n: 2},
    {type: 'contour', n: 2},
    {type: 'all', n: 1}
  ]

  paramSets = [
    {ref: true, same: true, injective: true, visual: true},
    {ref: false, same: true, injective: true, visual: true},
    {ref: false, same: false, injective: true, visual: true},
    {ref: false, same: false, injective: false, visual: true},
    {ref: false, same: false, injective: false, visual: false}
  ]

  constructor(manager, doc, div, audio, share) {
    const that = this;

    this.share = share;
    this.manager = manager;

    doc.create('h2', 'Perception Training:',div);
    this.trials = [];
    this.addTrial(0,0,1);

    this.nextButton = doc.create('button','Next',div);
    this.nextButton.onclick = function() { that.nextTrial() };
    
    this.trialIdx = 0;
    this.startTrial();
  }

  addTrial(toneSetIdx, paramSetIdx, n) {
    this.trials.push({tones: this.toneSets[toneSetIdx]['type'], params: this.paramSets[paramSetIdx], n: n});
    if(n < this.toneSets[toneSetIdx]['n']) this.addTrial(toneSetIdx, paramSetIdx, n + 1);
    else {
      if(paramSetIdx < this.paramSets.length - 1) this.addTrial(toneSetIdx, paramSetIdx + 1, 1);
      else {
        if(toneSetIdx < this.toneSets.length - 1) this.addTrial(toneSetIdx + 1, 0, 1);
        else return;
      }
    }
  }

  startTrial() {
    let trial = this.trials[this.trialIdx];
    console.log(this.trialIdx);
    console.log(Stimuli.getListenTrainStimuli(trial['tones'], trial['params']['same'], trial['params']['injective'], trial['n']) );
  }

  nextTrial() {
    this.trialIdx += 1;
    if(this.trialIdx < this.trials.length) this.startTrial();
    else this.manager.next();
  }

  finish() {
    console.log('finnished');
  }

  start() {}
}
