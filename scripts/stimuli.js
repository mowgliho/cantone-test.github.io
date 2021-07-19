class Stimuli {
  static listenTrain = {
    level: {tones: ['1','3','6'], stimuli: ['laai','ze','wui','gwan','sing','faan']},
    contour: {tones: ['2','4','5'], stimuli: ['hang','waan','wun','nin','cin','cung']},
    all: {tones: ['1','2','3','4','5','6'], stimuli:['hon','ham','hau','jiu','joeng','soeng','se']}
  }

  static getListenTrainStimuli(type, same, injective, nTrial) {
    let info = Stimuli.listenTrain[type];
    let stimuli = info['stimuli'];
    let tones = injective? shuffleArray(info['tones']): Stimuli.getTones(info['tones']);
    let ret = [];
    for(var i = 0; i < tones.length; i++) {
      let seg;
      if(i == 0) seg = stimuli[Math.floor(Math.random()*stimuli.length)];
      else seg = same?ret[i-1]['seg']:stimuli[Math.floor(Math.random()*stimuli.length)];
      ret.push({'seg':seg, tone:tones[i]});
    }
    return ret.map((a) => a['seg'] + a['tone']);
  }

  static getTones(tones) {
    let ret = [];
    for(var i = 0; i < tones.length; i++) {
      ret.push(tones[Math.floor(Math.random()*tones.length)])
    }
    return ret;
  }
}
