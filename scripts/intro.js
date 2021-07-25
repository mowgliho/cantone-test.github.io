class Intro {
  idColor = 'green'
  micDuration = 3;

  constructor(manager, doc, div, audio, share, status) {
    const that = this;
    this.share = share;

    this.manager = manager;
    //intro
    let label = doc.create('label', "Thanks for agreeing to participate! Your anonymous identification number is ",div);
    label = doc.create('label', share.get('id'),div);
    label.style.color = this.idColor;
    doc.create('label','. Please keep this for your records. If you would like to withdraw from the study, just tell us with this id number.', div)
    doc.create('hr',null,div);
    doc.create('label',"For this experiment, you will need to be able to hear audio and create audio.", div)

    let list = doc.create('ul', null, div);
    //audio check
    let audioLi = doc.create('li', null, list);
    doc.create('label', 'When you click on the following button, you should hear some audio corresponding to someone saying "Hello" in Cantonese: ', audioLi);
    const audioButton = doc.create('button', 'Play!',audioLi);
    audioButton.onclick = function() {
      audioButton.disabled = true;
      let a = audio.hello();
      a.onended = function() {
        audioButton.disabled = false;
      }
      a.play();
    }

    //mic check
    let micLi = doc.create('li', null, list);
    let gain = this.share.get('micGain'); 
    if(gain == null) this.share.save('micGain',1);
    let volFn = function() {return that.share.get('micGain');};
    let pb = definePlayback(doc, this.micDuration, null, function() {}, function() {}, function() {}, volFn)
    doc.create('label', 'Now, click the "Record" button, allow access to your microphone, and say something within ' + this.micDuration + ' seconds. You should be able to play what you recorded with the "Play Attempt" button and to adjust playback volume with the "Up" and "Down" buttons ',micLi);
    micLi.appendChild(pb['record']);
    micLi.appendChild(pb['playback']);
    getVolButtons(doc, this.share, micLi);

    //next
    this.nextButton = doc.create('button','Move on to next step!', div);
    this.nextButton.onclick = function() {
      uploadProgress(that.share.get('id'), 'intro','completed', function() { manager.next()});
    };
  }

  start() {
  }
}
