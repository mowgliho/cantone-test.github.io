class Stimuli {
  static tones = {
    level: ['1','3','6'],
    contour: ['2','4','5'],
    all: ['1','2','3','4','5','6']
  }

  static listenTrain = {
    level: ['laai','ze','wui','gwan','sing','faan'],
    contour: ['hang','waan','wun','nin','cin','cung'],
    all: ['hon','ham','hau','jiu','joeng','soeng','se']
  }

  static prodTrain = {
    level: ['wui','gwan'],
    contour: ['hang','waan'],
    all: ['hon','ham']
  }

  static prodTest = [
    {syl: 'jan', desc: 'This sound starts with a "y" sound, like the beginning of "you". The rest of the syllable rhymes with the "un" of "fun"'},
    {syl: 'ji', desc: 'This sound is similar to the "ee" the English word "see".'},
    {syl: 'si', desc: 'This sound is pronounced like the English words "see" and "sea".'},
    {syl: 'fan', desc: 'This sound is pronounced like the English word "fun".'}
  ]

  //returns array: source goes to source syllables; target goes to an array of dicts, which point to tone and syl 
  static getListenTrainStimuli(type, same, injective, nTrial) {
    let stimuli = Stimuli.listenTrain[type];
    let tones = injective? shuffleArray(Stimuli.tones[type]): Stimuli.getTones(Stimuli.tones[type]);
    let ret = [];
    for(var i = 0; i < tones.length; i++) {
      let seg;
      if(i == 0) seg = stimuli[Math.floor(Math.random()*stimuli.length)];
      else seg = same?ret[i-1]['seg']:stimuli[Math.floor(Math.random()*stimuli.length)];
      ret.push({'seg':seg, tone:tones[i]});
    }
    let sourceStimuli = ret.map((a) => { return {tone: a['tone'], syl: a['seg'] + a['tone']}});
    let targetStimuli = Stimuli.tones[type].map((t) => {return {tone: t, syl: 'si' + t}})
    return {sources: sourceStimuli, targets: targetStimuli};
  }

  static getListenTestStimuli(n) {
    return shuffleArray(['1','2','3','4','5','6'].map((a) => ['si' + a, 'jiu' + a]).reduce((a,b) => a.concat(b),[]));
  }

  //should return a pretty long list, from easiest to hardest, but repeating (as no vocoding is likely to take much shorter)
  // when don't show graph, have to be a segmental that we already know.
  // returns n*27 trials, followed by random stimuli
  // in training, can loop
  // not random
  static getProdTrainStimuli(n, totalN) {
    let stimuli = [];
    for(const type of ['level','contour','all']) {
      let trainStimuli = Stimuli.prodTrain[type].slice(0,type == 'all'?n:2*n);
      let testStimuli = Stimuli.prodTrain[type].slice(trainStimuli.length, type == 'all'?2*n:3**n);
      for(const [key, val] of Object.entries({train: trainStimuli, test: testStimuli})) {
        stimuli = stimuli.concat(val.map((a) => Stimuli.tones[type].map((b) => { return {tone: b, type: key, syl: a + b}})).reduce((a,b) => a.concat(b), []));
      }
    }
    if(totalN <= stimuli.length) return stimuli.slice(0,totalN);
    else {
      var ind = 0;
      while(stimuli.length < totalN) {
        let tone = Stimuli.tones['all'][Math.floor(Math.random() * Stimuli.tones['all'].length)];
        let syl = Stimuli.prodTrain['all'][Math.floor(Math.random() * Stimuli.prodTrain['all'].length)];
        stimuli.push({tone: tone, type: ind % 3 == 2? 'test':'train', syl: syl + tone}) 
        ind += 1;
      }
      return stimuli;
    }
  }

  static getProdTestStimuli() {
    let stimuli = [];
    for(var s of Stimuli.prodTest) {
      for(var t of Stimuli.tones['all']) {
        stimuli.push({syl: s['syl'] + t, desc: s['desc'], tone: t});
      }
    }
    return shuffleArray(stimuli);
  }

  static getTones(tones) {
    let ret = [];
    for(var i = 0; i < tones.length; i++) {
      ret.push(tones[Math.floor(Math.random()*tones.length)])
    }
    return ret;
  }
}
