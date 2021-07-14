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
}
