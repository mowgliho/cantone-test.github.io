//just stores paths to audio files
//TODO incosistent access to audio files: sometimes we make the Audio, sometimes we just return the filename
class AudioFiles {
  constructor() {}

  hello() {
    return new Audio('wav/forvo/你好_KandiceK_2229078.wav');
  }

  taskIntro(tone) {
    return new Audio('wav/humanum/si' + tone + '.wav');
  }

  humanum(syl) {
    return 'wav/humanum/' + syl + '.wav';
  }
}
