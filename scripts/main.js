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
    'end'
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
    feedback: Feedback,
    end: null
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
    if(this.share.get('id') == null) {//if no id, start from beginning
      this.startBlank();
    } else {
      const that = this;

      getStatus(this.share.get('id'), function(status) { 
        if(status['task'] == null) {//if no task, start from beginning
          that.startBlank();
        } else {
          getInfo(that.share.get('id'), function(y) {//get info
            if(y['data'] == null) {//if data is bad, start from beginning
              that.startBlank();
              return;
            }
            let data = y['data'];
            for(const x of ['id','visual','audio']) {//if data incomplete, start from beginning
              if(!Object.keys(data).includes(x)) {
                that.startBlank();
                return;
              }
              that.share.save(x,data[x]);
            }
            let ind = that.flow.indexOf(status['task']);
            if(ind == -1) {//if bad data, start over
              that.startBlank();
              return;
            }
            if(ind >= that.flow.indexOf('mic_test')) {//if task more than mic_test, but mic params not set, start from mic test
              for(const x of ['ambientDbfs','st']) {
                if(!Object.keys(data).includes(x)) {
                  that.state = 'mic_test';
                  that.status = null;
                  that.startTask();
                  return;
                }
                that.share.save(x,data[x]);
              }
            }
            //now, safe to start from the task that we got from the server
            if(status['status'] == 'completed') {
              that.startNextTask(status['task']);
            } else {
              that.state = status['task'];
              that.status = status['status'];
              that.startTask();
            }
          });

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
