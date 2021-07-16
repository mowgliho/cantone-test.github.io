class Intro {
  idColor = 'green'
  micColor = 'green';
  micDuration = 3;
  measurementInterval = 25;
  minFreq = 50;
  maxFreq = 500;

  constructor(manager, doc, div, audio, share) {
    const that = this;
    this.share = share;

    this.manager = manager;
    //intro
    let label = doc.create('label', "Thanks for agreeing to participate! Your anonymous identification number is ",div);
    label = doc.create('label', share.get('id'),div);
    label.style.color = this.idColor;
    doc.create('label','. Please keep this for your records. If you would like to withdraw from the study, just tell us with this id number', div)
    doc.create('hr',null,div);
    doc.create('label',"For this experiment, you will need to be able to hear audio and create audio.", div)
    doc.create('hr',null,div);

    //audio check
    doc.create('label', 'First, let\'s check your audio. When you click on the following button, you should hear some audio corresponding to someone saying "Hello" in Cantonese: ', div);
    const audioButton = doc.create('button', 'Play!',div);
    audioButton.onclick = function() {
      audioButton.disabled = true;
      let a = audio.hello();
      a.onended = function() {
        audioButton.disabled = false;
      }
      a.play();
    }
    doc.create('hr',null,div);

    //mic check
    doc.create('label', 'Now, let\'s check your microphone. Click the button, allow access to your microphone, and say "Hello" with ' + this.micDuration + ' seconds. You should see numbers appear to the right in ',div);
    let colorLabel = doc.create('label', this.micColor, div);
    colorLabel.style.color = this.micColor;
    doc.create('label', ': ', div);
    this.micButton = doc.create('button','Record', div);
    this.micButton.onclick = getAudioStream(function(audioContext, stream) {that.record(audioContext,stream)});
    this.micLabel = doc.create('label','', div);
    this.micLabel.style.color = this.micColor;
    doc.create('hr',null,div);

    //next
    this.nextButton = doc.create('button','Move on to next step!', div);
    this.nextButton.style.display = 'none';
    this.nextButton.onclick = function() {manager.next();};
  }

  ready() {
    this.nextButton.style.display = 'block';
  }

  record(audioContext, stream) {
    const that = this;

    this.share.save('audioContext', audioContext);
    this.share.save('stream',stream)

    this.micButton.disabled = true;

    let analyzer = getAnalyzer(audioContext, stream);
    const sampleRate = audioContext.sampleRate;

    const data = new Float32Array(analyzer.fftSize);

    var idx = 0;

    const stop = function() {
      that.micButton.disabled = false;
      that.share.clearTimeouts();
    }

    const intervalFn = function() {
      analyzer.getFloatTimeDomainData(data);
      //store f0
      const freq = yin(data, sampleRate);
      if(freq < that.maxFreq && freq > that.minFreq) {
        that.micLabel.innerHTML = freq.toFixed(2);
        that.ready();
      }
    }

    this.share.addTimeout(setInterval(intervalFn, this.measurementInterval));
    this.share.addTimeout(setTimeout(stop, this.micDuration*1000));
  }

  start() {
  }
}
