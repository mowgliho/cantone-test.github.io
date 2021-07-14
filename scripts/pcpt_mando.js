2320
class PcptMando {
  types = [
    ['rising','Rising: ➚'],
    ['level','Level: ➙'],
    ['falling','Falling: ➘']
  ];
  numExamples = 2;

  constructor(manager, doc, div, audio, share) {
    const that = this;

    this.manager = manager;
    this.audioFiles = audio.pcptMandoFilenames();
    this.guesses = [];
    this.share = share;

    //instructions
    doc.create('h2','Perception Test:', div);
    doc.create('label','Here, you listen to audio snippets and classify them as having a rising pitch, a falling pitch, or a level pitch. You will start by hearing some examples, each of which you will hear ' + this.numExamples + ' times. In the test, you will be able to hear each stimuli only once.',div);
    doc.create('hr', null, div);
    
    //examples
    const examples = audio.pcptMandoExamples();
    const exDiv = doc.create('div',null,div);
    doc.create('label','Example: ',exDiv);
    const buttonDiv = doc.create('div',null,exDiv);
    buttonDiv.style.display = 'inline-block';
    this.exButtons = {};
    this.exCounts = {};
    for(const [key,text] of this.types) {
      this.buildExampleButton(doc, key, text, examples, buttonDiv);
    }
    this.nextButton = doc.create('button','Move on to Test',exDiv);
    this.nextButton.style.display = 'block';
    this.nextButton.disabled = true;
    this.nextButton.onclick = function() {exDiv.style.display = 'none'; that.startTest();};
    doc.create('hr',null,exDiv);

    //test divs
    this.testDiv = doc.create('div',null,div);
    this.testDiv.style.display = 'none';
    this.label = doc.create('label', null, this.testDiv);
    this.playButton = doc.create('button', 'Play Next!',this.testDiv);
    this.playButton.onclick = function() {
      that.playButton.disabled = true;
      const fn = that.audioFiles[that.idx];
      const audio = new Audio(fn);
      audio.onended = function() {
        that.time = (new Date()).getTime();
        that.state = 'guess';
        that.update();
      }
      audio.play();
    }
    const trialDiv = doc.create('this.testDiv', null, this.testDiv);
    trialDiv.style.display = 'block';
    this.buttons = [];
    for(const [key,text] of this.types) {
      const button = doc.create('button',text, trialDiv);
      button.onclick = function() {that.guess(key);}
      this.buttons.push(button);
    }

    //update
    this.new();
  }

  buildExampleButton(doc, key, text, examples, buttonDiv) {
    const that = this;

    const button = doc.create('button',text,buttonDiv);
    this.exButtons[key] = button;
    this.exCounts[key] = this.numExamples;
    button.onclick = function() {
      button.disabled = true;
      const audio = new Audio(examples[key]);
      audio.onended = function() {
        that.exCounts[key] -= 1;
        button.disabled = that.exCounts[key] == 0;
        that.checkEx();
      }
      audio.play();
    }
  }

  checkEx() {
    for(const val of Object.values(this.exCounts)) {
      if(val != 0) return;
    }
    this.nextButton.disabled = false;
  }

  startTest() {
    this.testDiv.style.display = 'block';
  }

  new() {
    if(this.audioFiles.length == 0) {
      this.end();
      return;
    }
    this.idx = Math.floor(Math.random() * this.audioFiles.length);
    this.state = 'ready';
    this.update();
  }

  update() {
    this.label.innerHTML = this.audioFiles.length + ' stimuli left';
    this.playButton.disabled = this.state != 'ready';
    for(const button of this.buttons) {
      button.disabled = this.state != 'guess';
    }
  }

  guess(x) {
    this.guesses.push([this.audioFiles[this.idx], x, (new Date()).getTime() - this.time]);
    this.audioFiles.splice(this.idx, 1);
    this.new();
  }

  start() {}

  end() {
    const id = this.share.get('id');
    var body = id + '_pcpt_mando.tsv\n';
    body += 'file\tguess\ttime\n';
    for(const guess of this.guesses) {
      body += guess.join('\t') + '\n';
    }
    
    fetch(Config.plainTextCgi, { method: 'POST', body: body}).then(
      (response) => {response.text().then(function(x) {console.log(x)})}).catch(
      (error) => {console.log("error", error)});

    this.manager.next();
  }
}
