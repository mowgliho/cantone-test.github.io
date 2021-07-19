class ListenTrain {
  toneSets = [
    {type: 'level', n: 2, color: 'lavender'},
    {type: 'contour', n: 2, color: '#BCB88A'},
    {type: 'all', n: 1, color: '#FFA07A'}
  ]

  paramSets = [
    {ref: true, same: true, injective: true, visual: true},
    {ref: false, same: true, injective: true, visual: true}, {ref: false, same: false, injective: true, visual: true},
    {ref: false, same: false, injective: false, visual: true},
    {ref: false, same: false, injective: false, visual: false}
  ]

  paramText = {
    ref: 'Can compare to reference audio: ',
    same: 'Input audio the same (except for tones): ',
    injective: 'One-to-one matching (i.e. can deduce by elimination): '
  }

  paramSettings = {
    true: {text:'yes', color: 'skyblue'},
    false: {text:'no', color: 'lawngreen'}
  }

  constructor(manager, doc, div, audio, share) {
    const that = this;

    this.share = share;
    this.manager = manager;
    this.visType = share.get('visual');

    doc.create('h2', 'Perception Training:',div);
    this.trials = this.buildTrials();

    this.trialDesc = doc.create('h3', null, div);
    doc.create('p','In this round: ', div);
    let paramList = doc.create('ul',null,div);
    this.trialParamDesc = {};
    for(const [param, text] of Object.entries(this.paramText)) {
      let paramDiv = doc.create('div',null, paramList);
      doc.create('label',text,paramDiv);
      this.trialParamDesc[param] = doc.create('label', null, paramDiv);
    }
    doc.create('hr',null,div);
    doc.create('hr',null,div);

    this.nextButton = doc.create('button','Next',div);
    this.nextButton.onclick = function() { that.nextTrial() };
    
    this.trialIdx = [0,0];
    this.startTrial();
  }

  buildTrials() {
    const trials = [];
    for(var tones of this.toneSets) {
      const trialSet = [];
      for(var params of this.paramSets) {
        for(var i = 0; i < tones['n']; i++) {
          const param = {type:tones['type'], n: i, color: tones['color']};
          for(const [key,val] of Object.entries(params)) {
            if(key == 'visual' && this.visType == 'none') param[key] = false;
            else param[key] = val
          }
          trialSet.push(param);
        }
      }
      trials.push(trialSet);
    }
    return trials;
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
    //ui stuff
    let trial = this.trials[this.trialIdx[0]][this.trialIdx[1]];
    this.trialDesc.innerHTML = 'Training ' + trial['type'] + ' tones, round ' + (this.trialIdx[1]+1) + '/' + this.trials[this.trialIdx[0]].length + ':';
    this.trialDesc.style.backgroundColor = trial['color'];
    for(const param of ['ref','same','injective']) {
      this.trialParamDesc[param].innerHTML = this.paramSettings[trial[param]]['text'];
      this.trialParamDesc[param].style.backgroundColor = this.paramSettings[trial[param]]['color'];
    }
    //match stuff
  }

  nextTrial() {
    this.trialIdx[1] += 1;
    if(this.trialIdx[1] < this.trials[this.trialIdx[0]].length) this.startTrial();
    else {
      this.trialIdx = [this.trialIdx[0] + 1,0];
      if(this.trialIdx[0] < this.trials.length) this.startTrial();
      else this.finish();
    }
  }

  finish() {
    this.nextButton.disabled = true;
    console.log('finnished');
  }

  start() {}
}
