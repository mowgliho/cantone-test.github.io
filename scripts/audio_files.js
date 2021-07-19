//just stores paths to audio files
class AudioFiles {
  constructor() {
    this.definePcptMando();
  }

  hello() {
    return new Audio('wav/forvo/你好_KandiceK_2229078.wav');
  }

  definePcptMando() {
    this.pcptMando = [];
    this.pcptMandoEx = {};
    for(const speaker of ['f1','f2','m1','m2']) {
      for(const vowel of ['a','e','i','o','u']) {
        for(const [tone,key] of [['1','level'],['2','rising'],['4','falling']]) {
          const fn = 'wav/pcpt_mando/' + speaker + '/' + vowel + '_' + tone + '.wav';
          if(speaker == 'f1' && vowel == 'a') this.pcptMandoEx[key] = fn;
          this.pcptMando.push(fn);
        }
      }
    }
  }

  pcptMandoExamples() {
    return this.pcptMandoEx;
  }

  pcptMandoFilenames() {
    return this.pcptMando.slice();
  }

  pcptCanto(reference, contourTones, inj) {
    let ret = [];
    const tones = contourTones? ['2','4','5']: ['1','3','6'];
    const segs = reference?['si']:['ji','jyu','haam','wan'];
    for(var i = 0; i < tones.length; i++) {
      let seg = segs[Math.floor(Math.random()*segs.length)];
      let tone = inj? tones[i]: tones[Math.floor(Math.random()*tones.length)];
      ret.push({fn: 'wav/humanum/' + seg + tone + '.wav', tone:tone});
    }
    return ret;
  }

  taskIntro(tone) {
    return new Audio('wav/humanum/si' + tone + '.wav');
  }

  listenTrain(syl) {
    return 'wav/humanum/' + syl + '.wav';
  }
}
