class TestManager {
  flow = [
    'intro',
    'pcpt_mando',
    'pcpt_canto',
    'mic_test',
    'task_intro',
    'listen_train',
    'listen_test',
    'prod_train',
    'prod_test',
    'questionnaire',
  ];

  classes = {
    intro: Intro,
    pcpt_mando: null,
    pcpt_canto: null,
    mic_test: null,
    task_intro: null,
    listen_train: null,
    listen_test: null,
    prod_train: null,
    prod_test: null,
    questionnaire: null
  }

  constructor(doc, div) {
    this.doc = doc;
    this.div = div;
    this.state = null;
    this.share = new Shared();
    this.audio = new AudioFiles();
  }

  next() {
    let next = false;
    if(this.state == null) {
      next = true;
      this.state = this.flow[0];
    } else {
      next = false;
      for(const state of this.flow) {
        if(next) {
          this.state = state;
          break;
        }
        if(state == this.state) next = true;
      }
    }
    if(next) {
      this.div.innerHTML = '';
      let cl = new this.classes[this.state](this, this.doc, this.div, this.audio, this.share);
      cl.start();
    }
  }
}

window.onload = function() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  let div = document.getElementById('main');
  let doc = new DocumentWrapper(document);
  let testManager = new TestManager(doc, div);
  testManager.next();
}
