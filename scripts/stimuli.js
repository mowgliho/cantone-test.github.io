class Stimuli {
  static tones = {
    level: ['1','3','6'],
    contour: ['2','4','5'],
    all: ['1','2','3','4','5','6']
  }

  static listenTrain = {
    ref: ['si'],
    voiced: ['jan','jau','wai'],
    fric: ['soeng','seoi','si'],
    fricbutref: ['soeng','seoi'],
    allbutref: ['jan','jau','wai','soeng','seoi'],
    all: ['si','jan','jau','wai','soeng','seoi']
  }

  static prodTrain = ['jan','jau','wai','wan'];

  static prodTest = [
    {syl: 'jan', desc: 'This sound starts with a "y" sound, like the beginning of "you". The rest of the syllable rhymes with the "un" of "fun"'},
    {syl: 'ji', desc: 'This sound is similar to the "ee" the English word "see".'},
    {syl: 'si', desc: 'This sound is pronounced like the English words "see" and "sea".'},
    {syl: 'fan', desc: 'This sound is pronounced like the English word "fun".'}
  ]

  static getListenTrainStimuli() {
    let lt = Stimuli.listenTrain;

    let stimuli = {level:[], contour: [], all: []};

    const counts = {};
    for(const syls of Object.values(lt)) {
      for(const syl of syls) {
        for(const t of this.tones['all']) {
          counts[syl + t] = {tone: t, seg: syl, count: 0};
        }
      }
    }
    const f = function(type, sources, targets, params) {
      stimuli[type].push({sources:sources, targets: targets, params: params});
      for(var source of sources) counts[source['syl']]['count'] += 1;
    }
    
    let syl = {};
    for(const s of lt['voiced'].concat(lt['fric'])) syl[s] = {level:0, contour:0, all: 0};
    const pick = function(n, type, frication, params) {
      let candidates = Object.keys(syl).filter((k) => ((syl[k][type] < 3) && (lt[frication].includes(k))));
      let s = shuffleArray(candidates).slice(0,n);
      for(const seg of s) {
        if(type == 'all') { syl[seg]['level'] += 1; syl[seg]['contour'] += 1;}
        else { syl[seg][type] += 1;}
        syl[seg]['all'] = Math.max(syl[seg]['level'],syl[seg]['contour']);
        let sources = shuffleArray(Stimuli.tones[type].map((t) => { return {tone: t, syl: seg + t}}));
        let targets = Stimuli.tones[type].map((t) => { return {tone: t, syl: 'si' + t}});
        f(type, sources, targets, params);
      }
    }

    const pickDiff = function(type, injective, params) {
      let candidates = Object.keys(counts).filter((k) => (Stimuli.tones[type].includes(counts[k]['tone']) && counts[k]['count'] < 3));
      let s;
      if(injective) {
        s = Stimuli.tones[type].map((t) => shuffleArray(candidates.filter((k) => counts[k]['tone'] == t))[0])
      } else {
        s = shuffleArray(candidates).slice(0,Stimuli.tones[type].length);
      }
      let sources = shuffleArray(s).map((syl) => { return {tone: syl.slice(-1), syl: syl}});
      let targets = Stimuli.tones[type].map((t) => { return {tone: t, syl: 'si' + t}});
      f(type,sources,targets, params);
    }

    //fill with most restrictive first
    let pickOrder = [
      {n: 2, type: 'all', frication: 'allbutref', params: {ref: true, visual: true, same: true, injective:true}},
      {n: 1, type: 'all', frication: 'all', params: {ref: false, visual: true, same: true, injective:true}},
      {n: 2, type: 'level', frication: 'voiced', params: {ref: true, visual: true, same: true, injective:true}},
      {n: 2, type: 'level', frication: 'fricbutref', params: {ref: true, visual: true, same: true, injective:true}},
      {n: 2, type: 'contour', frication: 'voiced', params: {ref: true, visual: true, same: true, injective:true}},
      {n: 2, type: 'contour', frication: 'fricbutref', params: {ref: true, visual: true, same: true, injective:true}},
      {n: 1, type: 'level', frication: 'voiced', params: {ref: false, visual: true, same: true, injective:true}},
      {n: 1, type: 'level', frication: 'fric', params: {ref: false, visual: true, same: true, injective:true}},
      {n: 1, type: 'contour', frication: 'voiced', params: {ref: false, visual: true, same: true, injective:true}},
      {n: 1, type: 'contour', frication: 'fric', params: {ref: false, visual: true, same: true, injective:true}}
    ]
    for(const info of pickOrder) {
      pick(info['n'],info['type'],info['frication'], info['params']);
    }
    
    let pickDiffOrder = [
      {type: 'level', inj: true, n: 2, params: {ref: false, visual: true, same: false, injective:true}},
      {type: 'contour', inj: true, n: 2, params: {ref: false, visual: true, same: false, injective:true}},
      {type: 'all', inj: true, n: 1, params: {ref: false, visual: true, same: false, injective:true}},
      {type: 'level', inj: false, n: 2, params: {ref: false, visual: true, same: false, injective:false}},
      {type: 'contour', inj: false, n: 2, params: {ref: false, visual: true, same: false, injective:false}},
      {type: 'all', inj: false, n: 1, params: {ref: false, visual: true, same: false, injective:false}},
      {type: 'level', inj: false, n: 2, params: {ref: false, visual: false, same: false, injective:false}},
      {type: 'contour', inj: false, n: 2, params: {ref: false, visual: false, same: false, injective:false}},
      {type: 'all', inj: false, n: 1, params: {ref: false, visual: false, same: false, injective:false}}

    ]
    for(const info of pickDiffOrder) {
      for(var i = 0; i < info['n']; i++) {
        pickDiff(info['type'], info['inj'], info['params']);
      }
    }
    if ((Object.keys(counts).filter((k) => (counts[k]['count'] != 3))).length != 0) {
      console.log('repicking');
      return Stimuli.getListenTrainStimuli();
    } else {
      return stimuli;
    }
  }

  static getListenTestStimuli(n) {
    return shuffleArray(Stimuli.tones['all'].map((t) => ['seon','jyun','si','jan','seoi'].map((a) => a + t)).reduce((a,b) => a.concat(b), []));
  }

  //divides stimuli into two groups. Trains level tones on all of one group, then random of one group, then with contour, then swap.
  static getProdTrainStimuli() {
    const f = function(syl, t, trainType) { return {tone: t, type: trainType, syl: syl + t}};
    let seg = shuffleArray(Stimuli.prodTrain);
    let groups = [0,1].map((a) => (seg.filter((x,i) => (i % 2 == a))));//put odds in one group, even in other group

    let stimuli = [];
    for(const x of [0,1]) {
      for(const [i,type] of ['level','contour'].entries()) {
        let group = groups[(x+i)%2];
        stimuli = stimuli.concat(group.map((a) => shuffleArray(Stimuli.tones[type].map((b) => f(a,b,'train')))).reduce((a,b) => a.concat(b),[]));
        stimuli = stimuli.concat(Stimuli.tones[type].map((t) => (f(group[Math.floor(Math.random()*group.length)],t,'test'))));
      }
    }
    return stimuli;
  }

  static getProdTestStimuli() {
    let stimuli = [];
    for(var s of shuffleArray(Stimuli.prodTest)) {
      for(var t of shuffleArray(Stimuli.tones['all'])) {
        stimuli.push({syl: s['syl'] + t, desc: s['desc'], tone: t});
      }
    }
    return stimuli;
  }

  static getTones(tones) {
    let ret = [];
    for(var i = 0; i < tones.length; i++) {
      ret.push(tones[Math.floor(Math.random()*tones.length)])
    }
    return ret;
  }

  static pcptCanto(reference, contourTones, inj) {
    let ret = [];
    const tones = contourTones? ['2','4','5']: ['1','3','6'];
    const segs = reference?['si']:['jyu','haam'];
    for(var i = 0; i < tones.length; i++) {
      let seg = segs[Math.floor(Math.random()*segs.length)];
      let tone = inj? tones[i]: tones[Math.floor(Math.random()*tones.length)];
      ret.push({fn: 'wav/humanum/' + seg + tone + '.wav', tone:tone});
    }
    return ret;
  }
}
