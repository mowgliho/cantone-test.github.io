class TestManager {
  flow = [
    'consent',
    'intro',
    'questionnaire',
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
    pcpt_canto: PcptCanto,
    mic_test: MicTest,
    task_intro: TaskIntro,
    listen_train: ListenTrain,
    listen_test: ListenTest,
    prod_train: ProdTrain,
    prod_test: ProdTest,
    feedback: null
  }

  constructor(doc, div) {
    this.doc = doc;
    this.div = div;
    this.state = null;
    this.share = new Shared();
    this.audio = new AudioFiles();
    this.initialize();
  }

  initialize() {
    if(this.share.get('id') == null) {
      this.startBlank();
    } else {
      const that = this;

      getStatus(this.share.get('id'), function(x) { 
        if(x['task'] == null) {
          that.startBlank();
        } else {
          let ind = that.flow.indexOf(x['task']);
          if(ind == -1) that.startBlank();
          else {
            if(x['status'] == 'completed') {
              that.startNextTask(x['task']);
            } else {
              that.state = x['task'];
              that.status = x['status'];
              that.startTask();
            }
          }
        }
      });
    }
  }

  startNextTask(task) {
    let ind = this.flow.indexOf(task);
    if(ind < this.flow.length - 1) {
      this.state = this.flow[ind+1];
      this.status = null;
      this.startTask();
    } else {
      //TODO: done/end div
    }
  }

  startBlank() {
    this.state = 'consent';
    this.status = null;
    this.startTask();
  }

  next() {
    this.startNextTask(this.state);
  }

  startTask() {
    this.div.innerHTML = '';
    if(this.classes[this.state] == null) return;
    let cl = new this.classes[this.state](this, this.doc, this.div, this.audio, this.share, this.status);
    cl.start();
  }
}

window.onload = function() {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  let div = document.getElementById('main');
  let doc = new DocumentWrapper(document);
  let testManager = new TestManager(doc, div);
}
