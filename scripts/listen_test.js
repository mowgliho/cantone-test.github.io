class ListenTest {
  states = ['ready','picked'];
  tones = ['t1','t2','t3','t4','t5','t6'];
  colors = {picked: 'lawngreen', normal: '', canPlay: [124,252,0], cantPlay: [255,255,255]};

  numPlay = 5;
  width = 500;

  constructor(manager, doc, div, audio, share) {
    const that = this;

    this.manager = manager;
    this.audio = audio;
    this.share = share;

    doc.create('h2', 'Perception Test:',div);
    doc.create('p', 'It\'s time for a perception test to see how well you\'ve learned Cantonese tones so far. Please indicate which tone you think the audio is and submit. You can play the audio up to ' + this.newPlay + ' times.', div);

    doc.create('hr',null,div);

    this.roundTitle = doc.create('h3',null,div);

    this.buttons = {};
    let buttonDiv = doc.create('div',null,div);
    this.playButton = doc.create('button','Play!',buttonDiv);
    this.playButton.style.width = '100%';
    doc.create('p',null,buttonDiv);
    let buttonPanel = doc.create('div', null, buttonDiv);
    for(const tone of this.tones) {
      let button = doc.create('button',tone,buttonPanel);
      button.style.width = '16.66%';
      button.onclick = function() {that.pick(tone)};
      this.buttons[tone] = button;
    }
    doc.create('p',null,buttonDiv);
    this.submitButton = doc.create('button','Submit!',buttonDiv);
    this.submitButton.style.width = '100%';
    this.submitButton.onclick = function() {that.submit()};
    buttonDiv.style.width = this.width + 'px';

    this.stimuli = Stimuli.getListenTestStimuli(12);
    this.idx = 0;

    this.playButton.onclick = function() {that.play()};

    this.startRound();

    this.data = {round: [], click: []};

  }

  startRound() {
    this.state = 'ready'
    this.picked = null;
    this.playCount = this.numPlay;
    this.update();
    this.startTime = (new Date()).getTime();
  }

  pick(tone) {
    this.picked = tone;
    this.state = 'picked';
    this.data['click'].push({round: this.idx, tone: tone, time: (new Date()).getTime()});
    this.update();
  }

  submit() {
    this.data['round'].push({round: this.idx, syl: this.stimuli[this.idx], start: this.startTime, end: (new Date()).getTime()});
    this.idx += 1;
    if(this.idx >= this.stimuli.length) {
      uploadFiles(Object.keys(this.data), this.data, this.share.get('id'),'listen_test');
      this.manager.next();
    }
    else this.startRound();
  }

  update() {
    this.roundTitle.innerHTML = 'Round ' + (this.idx + 1) + '/' + this.stimuli.length + ':';
    let playColor = interpolateColor(this.colors['canPlay'], this.colors['cantPlay'], this.playCount, this.numPlay) 
    this.playButton.style.backgroundColor = playColor;
    this.playButton.style.color = this.playCount > 0? 'black':playColor;
    for(const [tone,button] of Object.entries(this.buttons)) {
      let color;
      if(this.state == 'picked' && tone == this.picked) color = this.colors['picked'];
      else color = this.colors['normal'];
      button.style.backgroundColor = color;
    }
    this.submitButton.disabled = this.state == 'picked'? false:true;
  }

  start() {}

  play() {
    if(this.playCount > 0) {
      this.playCount -=1;
      (new Audio(this.audio.listenTest(this.stimuli[this.idx]))).play();
    }
    this.update();
  }
}
