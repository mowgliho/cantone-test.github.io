class ListenTrain {
  visSize = {side:300, text:15};

  toneSets = [
    {type: 'level', color: 'lavender', tones: ['t1','t3','t6']},
    {type: 'contour', color: '#BCB88A', tones: ['t2','t4','t5']},
    {type: 'all', color: '#FFA07A', tones: null}
  ]

  paramText = {
    ref: 'Can compare to reference audio: ',
    same: 'Input audio the same (except for tones): ',
    injective: 'One-to-one matching (i.e. can deduce by elimination): ',
    visual: 'Can look at tone chart: '
  }

  paramSettings = {
    true: {text:'yes', color: 'skyblue'},
    false: {text:'no', color: 'lawngreen'}
  }

  constructor(manager, doc, div, audio, share, status) {
    this.stimuli = Stimuli.getListenTrainStimuli();

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
      if(param == 'visual' && this.visType == 'none') continue;
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
    
    this.trialId = status == null? 0: parseInt(status)+1;
    this.trialIdx = this.getTrialIdx(this.trialId);
    this.startTrial();
  }

  buildTrials() {
    const trials = [];
    for(var tones of this.toneSets) {
      let type = tones['type'];
      let stim = this.stimuli[type];
      const trialSet = [];
      for(const st of stim) {
        trialSet.push({
          type:type, 
          color: tones['color'], 
          tones: tones['tones'],
          sources: st['sources'], 
          targets: st['targets'], 
          visual: this.visType == 'none'? false: st['params']['visual'],
          ref: st['params']['ref'],
          same: st['params']['same'],
          injective: st['params']['injective']
        });
      }
      trials.push(trialSet);
    }
    return trials;
  }

  startTrial() {
    //ui stuff
    let trial = this.trials[this.trialIdx[0]][this.trialIdx[1]];
    this.trialData = {
      id: this.trialId,
      tones: trial['type'], 
      ref: trial['ref'],
      same: trial['same'],
      injective: trial['injective'],
      visual: trial['visual'],
      vistype: this.visType,
      start: (new Date()).getTime()
    };
    this.trialDesc.innerHTML = 'Training ' + trial['type'] + ' tones, round ' + (this.trialIdx[1]+1) + '/' + this.trials[this.trialIdx[0]].length + ':';
    this.trialDesc.style.backgroundColor = trial['color'];
    for(const param of Object.keys(this.paramText)) {
      if(param == 'visual' && this.visType == 'none') continue;
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
    let sources = trial['sources'].map((a) => {return {fn: this.audio.humanum(a['syl']), tone: a['tone']}});
    let targets = trial['targets'].map((a) => {return {fn: this.audio.humanum(a['syl']), tone: a['tone']}});
    this.match.set(this.trialId, sources,targets, -1, true, !trial['ref'])
    
    this.nextButton.style.display = 'none';
    this.nextButton.disabled = false;
  }

  nextTrial() {
    const that = this;
    const id = this.share.get('id');

    this.nextButton.disabled = true;
    this.trialData['end'] = (new Date()).getTime();
    let usageData = this.match.getUsageData();
    let data = {};
    for(const [key,val] of Object.entries(usageData)) {
      data[key] = val;
    }
    data['trial'] = [this.trialData];
    uploadFiles(data, id, 'listen_train', this.trialId != 0, function() {
      uploadProgress(id, 'listen_train',that.trialId, function() {
        that.trialId += 1;
        that.trialIdx = that.getTrialIdx(that.trialId);
        if(that.trialIdx != null) that.startTrial();
        else that.finish();
      });
    });
  }

  getTrialIdx(round) {
    var trialIdx = [0,0];
    for(var i = 0; i < round; i++) {
      trialIdx[1] += 1;
      if(trialIdx[1] == this.trials[trialIdx[0]].length) {
        trialIdx = [trialIdx[0] + 1, 0];
        if(trialIdx[0] == this.trials.length) return null;
      }
    }
    return trialIdx;
  }

  correct() {
    this.trialData['correct'] = (new Date()).getTime();
    this.match.correct();
    this.nextButton.style.display = 'block';
  }

  finish() {
    const that = this;
    uploadProgress(this.share.get('id'), 'listen_train','completed', function() { that.manager.next();});
  }

  start() {}
}
