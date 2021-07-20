class ProdTrain {
  timeLimit = 900;//amount of time for the task.

  constructor(manager, doc, div, audio, share) {
    this.share = share;
    this.manager = manager;

    this.visType = this.share.get('visual');
    this.audioType = this.share.get('audio');
    console.log(this.visType, this.audioType);

    let header = doc.create('h2','Production Training ',div);
    let timerLabel = doc.create('label',null,header);
    
    this.buildIntroDiv(doc, div, timerLabel);
  }

  buildIntroDiv(doc, div, timerLabel) {
    const that = this;

    this.introDiv = doc.create('div', null, div);
    doc.create('h3','Introduction:',this.introDiv);
    let p = doc.create('p', 'For the next ' + (this.timeLimit/60).toFixed(0) + ' minutes, you will learn to speak Cantonese tones.', this.introDiv);

    doc.create('p', ' You will be able to play exemplar audio files of the stimuli. You will attempt to imitate the exemplars, focusing on the pitch contour.', this.introDiv);
    if(this.audioType == 'exemplar') {
      doc.create('p', 'Everyone\'s vocal range is different; you do not have to reproduce the exemplar pitches exactly. You will also be able to record and play your attempts.', this.introDiv);
      if(this.visType != 'none') {
        doc.create('p', 'For the first few rounds, you will be able to refer to a tone chart. Afterwards, the tone chart will periodically not be available, and you will only be able to hear your own attempts. This is to help you internalize tone contours.', this.introDiv);
      }
    } else {//audio type is vocoded
      doc.create('p', 'In addition, you will be able to hear the stimuli with its pitch manipulated to lie within your vocal range.', this.introDiv);
      let list = doc.create('ul',null,this.introDiv);
      doc.create('li','On the left, similar to the Mic Test, you will be able to match the starting and ending parts of each syllable. Each will play for a small amount of time. You can match the pitch afterwards. Try to make the lines match.', list);
      doc.create('li','On the right, you will see a tone chart with the target tone highlighted. Click "Try It" and attempt to say the syllable. A line should show up, representing your attempt. Again, try to make the lines/pitch contours match.', list);
      doc.create('p', 'Periodically, the tuners and attempt graphs will not be available, and you will only be able to hear your own attempts. This is to help you internalize the tone contours.', this.introDiv);
    }

    let screenshotDiv = doc.create('div',null,this.introDiv);
    doc.create('h4', 'Example Screenshot:', screenshotDiv);
    let image = doc.create('img',null, screenshotDiv);
    image.src = 'img/prod_train_' + this.visType + '_' + this.audioType + '.png';
    image.style.border = '1px solid';

    let startButton = doc.create('button', 'Start!', this.introDiv);
    startButton.onclick = function() {that.startTraining(timerLabel)};
 }

  startTraining(timerLabel) {
    //set up timer
    this.startTimer(timerLabel);
    this.introDiv.style.display = 'none';
  }

  startTimer(timerLabel) {
    const that = this;

    const label = timerLabel;
    var count = this.timeLimit + 1;
    this.share.addTimeout(setInterval(function() {
      count -= 1;
      if(count < 0) {
        that.share.clearTimeouts();
        that.finish();
      } else {
        timerLabel.innerHTML = '(' + ProdTrain.getDisplay(count) + ' minutes remaining)';
        timerLabel.style.color = count < 60?'red':'black';
      }
    }, 1000));
  }

  start() {}

  finish() {
    //upload data
    console.log('finished');
    //this.manager.next();
  }

  static getDisplay(s) {
    return Math.floor(s/60) + ':' + String(s % 60).padStart(2,'0');
  }
}
