class TestManager {
  flow = [
    'consent',
    'intro',
    'questionnaire',
    'pcpt_mando',
    'pcpt_canto',
    'mic_test',
    'task_intro',
    'listen_train',
    'listen_test',
    'prod_train',
    'prod_test',
    'feedback',
  ];

  classes = {
    consent: Consent,
    intro: Intro,
    questionnaire: Questionnaire,
    pcpt_mando: PcptMando,
    pcpt_canto: PcptCanto,
    mic_test: MicTest,
    task_intro: TaskIntro,
    listen_train: ListenTrain,
    listen_test: ListenTest,
    prod_train: ProdTrain,
    prod_test: null,
    feedback: null
  }

  constructor(doc, div) {
    this.doc = doc;
    this.div = div;
    this.state = null;
    this.share = new Shared();
    this.audio = new AudioFiles();
    if(this.share.get('id') == null) this.getId();
  }

  getId() {
    const that = this;

    fetch(Config.getIdCgi, { method: 'GET'}).then(
      (response) => {response.text().then(function(x) {
        const id = x.slice(0,x.length-1);
        that.share.save('id',id);
        console.log('id: ' + id);
      })}).catch(
      (error) => {console.log("error", error)});
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
      if(this.classes[this.state] == null) return;
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
