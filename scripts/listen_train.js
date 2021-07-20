class ListenTrain {
  visSize = {side:300, text:15};

  toneSets = [
    {type: 'level', n: 2, color: 'lavender',tones: ['t1','t3','t6']},
    {type: 'contour', n: 2, color: '#BCB88A',tones: ['t2','t4','t5']},
    {type: 'all', n: 1, color: '#FFA07A',tones:null}
  ]

  paramSets = [
    {ref: true, same: true, injective: true, visual: true},
    {ref: false, same: true, injective: true, visual: true},
    {ref: false, same: false, injective: true, visual: true},
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

    this.audio = audio;
    this.share = share;
    this.manager = manager;
    this.visType = share.get('visual');
    this.doc = doc;

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
    
    //diagram if applicable
    this.toneChart = doc.create('div', null, div);
    doc.create('p','Tone Chart:',this.toneChart);
    doc.create('hr',null,this.toneChart);
    this.toneChart.style.display = 'none';


    this.match = new Match(doc,audio, this, {text: 'Correct', fn: function() { that.correct()}});
    div.appendChild(this.match.getDiv());

    doc.create('hr',null,div);

    this.nextButton = doc.create('button','Next',div);
    this.nextButton.onclick = function() { that.nextTrial() };
    
    this.data = {trial: [], play: [], line: []};
    this.trialIdx = [0,0];
    this.trialId = 0;
    this.startTrial();
  }

  buildTrials() {
    const trials = [];
    for(var tones of this.toneSets) {
      const trialSet = [];
      for(var params of this.paramSets) {
        for(var i = 0; i < tones['n']; i++) {
          const param = {type:tones['type'], n: i, color: tones['color'], tones: tones['tones']};
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

  startTrial() {
    //ui stuff
    let trial = this.trials[this.trialIdx[0]][this.trialIdx[1]];
    this.data['trial'].push({
      id: this.trialId,
      tones: trial['type'], 
      ref: trial['ref'],
      same: trial['same'],
      injective: trial['injective'],
      visual: trial['visual'],
      vistype: this.visType,
      start: (new Date()).getTime()
    });
    this.trialDesc.innerHTML = 'Training ' + trial['type'] + ' tones, round ' + (this.trialIdx[1]+1) + '/' + this.trials[this.trialIdx[0]].length + ':';
    this.trialDesc.style.backgroundColor = trial['color'];
    for(const param of ['ref','same','injective']) {
      this.trialParamDesc[param].innerHTML = this.paramSettings[trial[param]]['text'];
      this.trialParamDesc[param].style.backgroundColor = this.paramSettings[trial[param]]['color'];
    }
    //visual if applicable
    this.toneChart.innerHTML = '';
    if(this.visType != 'none' && trial['visual']) {
      this.doc.create('h4','Tone Chart: ',this.toneChart);
      let visDiv = ToneContours.getVisual(this.doc, this.visType, this.visSize['side'], this.visSize['side'], trial['tones'], this.visSize['text']);
      visDiv.style.display = 'inline-block';
      this.toneChart.appendChild(visDiv);
      this.doc.create('hr',null,this.toneChart);
      this.toneChart.style.display = 'block';
    } else {
      this.toneChart.style.display = 'none';
    }

    //match stuff
    let stimuli = Stimuli.getListenTrainStimuli(trial['type'], trial['same'], trial['injective'], trial['n']);
    let sources = stimuli['sources'].map((a) => {return {fn: this.audio.listenTrain(a['syl']), tone: a['tone']}});
    let targets = stimuli['targets'].map((a) => {return {fn: this.audio.listenTrain(a['syl']), tone: a['tone']}});
    this.match.set(this.trialId, sources,targets, -1, true, !trial['ref'])
    
    this.nextButton.style.display = 'none';
  }

  nextTrial() {
    let usageData = this.match.getUsageData();
    for(const [key,val] of Object.entries(usageData)) {
      this.data[key] = this.data[key].concat(val);
    }
    this.data['trial'][this.data['trial'].length - 1]['end'] = (new Date()).getTime();
    this.trialIdx[1] += 1;
    this.trialId += 1;
    if(this.trialIdx[1] < this.trials[this.trialIdx[0]].length) this.startTrial();
    else {
      this.trialIdx = [this.trialIdx[0] + 1,0];
      if(this.trialIdx[0] < this.trials.length) this.startTrial();
      else this.finish();
    }
  }

  correct() {
    this.data['trial'][this.data['trial'].length - 1]['correct'] = (new Date()).getTime();
    this.match.correct();
    this.nextButton.style.display = 'block';
  }

  finish() {
    this.nextButton.style.display = 'none';
    uploadFiles(Object.keys(this.data), this.data, this.share.get('id'), 'listen_train');
    this.manager.next();
  }

  start() {}
}
