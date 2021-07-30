class ListenTest {
  states = ['ready','picked'];
  tones = ['t1','t2','t3','t4','t5','t6'];
  colors = {
    picked: 'lawngreen', 
    normal: '', 
    canPlay: [124,252,0], 
    cantPlay: [255,255,255],
    startRound: [135,206,250],
    endRound: [224,255,255]
  };

  numPlay = 5;
  width = 500;

  constructor(manager, doc, div, audio, share, status) {
    const that = this;

    this.manager = manager;
    this.audio = audio;
    this.share = share;

    doc.create('h2', 'Perception Test:',div);
    doc.create('p', 'Let\'s see how well you\'ve learned Cantonese tones so far. Please indicate which tone you think the audio is and submit. You can play the audio up to ' + this.numPlay + ' times.', div);

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
    this.idx = status == null? 0: parseInt(status)+1;

    this.playButton.onclick = function() {that.play()};

    this.startRound();

  }

  startRound() {
    this.state = 'ready'
    this.picked = null;
    this.playCount = this.numPlay;
    this.update();
    this.startTime = (new Date()).getTime();
    this.clicks = [];
  }

  pick(tone) {
    this.picked = tone;
    this.state = 'picked';
    this.clicks.push({round: this.idx, type: tone, time: (new Date()).getTime()});
    this.update();
  }

  submit() {
    this.submitButton.disabled = true;
    const that = this;
    
    this.clicks.push({round: this.idx, type: 'submit', time: (new Date()).getTime()});
    const id = this.share.get('id');
    const idx = this.idx;
    let data = {
      round: [{round: this.idx, syl: this.stimuli[this.idx], start: this.startTime, end: (new Date()).getTime()}],
      click: this.clicks
    };
    uploadFiles(data, id, 'listen_test', idx != 0, function() {
      uploadProgress(id, 'listen_test',idx, function() {
        that.idx += 1;
        if(that.idx >= that.stimuli.length) uploadProgress(id, 'listen_test','completed', function() { that.manager.next();});
        else that.startRound();
      });
    });
  }

  update() {
    this.roundTitle.innerHTML = 'Round ' + (this.idx + 1) + '/' + this.stimuli.length + ':';
    this.roundTitle.style.backgroundColor = interpolateColor(this.colors['startRound'], this.colors['endRound'], this.idx, this.stimuli.length);
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
      this.clicks.push({round: this.idx, type: 'play', time: (new Date()).getTime()});
      this.playCount -=1;
      (new Audio(this.audio.humanum(this.stimuli[this.idx]))).play();
    }
    this.update();
  }
}
