class Intro {
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
    let label = doc.create('label', "Thanks for taking part in the Cantone experiment! For this experiment, you will need to be able to hear audio and create audio.")
    div.appendChild(label);
    div.appendChild(doc.create('hr'));

    //audio check
    label = doc.create('label', 'First, let\'s check your audio. When you click on the following button, you should hear some audio corresponding to someone saying "Hello" in Cantonese: ');
    div.appendChild(label);
    const audioButton = doc.create('button', 'Play!');
    audioButton.onclick = function() {
      audioButton.disabled = true;
      let a = audio.hello();
      a.onended = function() {
        audioButton.disabled = false;
      }
      a.play();
    }
    div.appendChild(audioButton);
    div.appendChild(doc.create('hr'));

    //mic check
    label = doc.create('label', 'Now, let\'s check your microphone. Click the button, allow access to your microphone, and say "Hello" with ' + this.micDuration + ' seconds. You should see numbers appear to the right in ');
    div.appendChild(label);
    let colorLabel = doc.create('label', this.micColor);
    colorLabel.style.color = this.micColor;
    div.appendChild(colorLabel);
    label = doc.create('label', ': ');
    div.appendChild(label);
    this.micButton = doc.create('button','Record');
    div.appendChild(this.micButton);
    this.micButton.onclick = getAudioStream(function(audioContext, stream) {that.record(audioContext,stream)});
    this.micLabel = doc.create('label','');
    this.micLabel.style.color = this.micColor;
    div.appendChild(this.micLabel);
    div.appendChild(doc.create('hr'));

    //next
    this.nextButton = doc.create('button','Move on to next step!');
    this.nextButton.style.display = 'none';
    this.nextButton.onclick = function() {manager.next();};
    div.appendChild(this.nextButton);
  }

  ready() {
    this.nextButton.style.display = 'block';
  }

  record(audioContext, stream) {
    const that = this;

    this.share.save('audioContext', audioContext);
    this.share.save('stream',stream)

    this.micButton.disabled = true;

    const analyzer = audioContext.createAnalyser();
    analyzer.fftsize = Math.pow(2,9);
    const sampleRate = audioContext.sampleRate;
    audioContext.createMediaStreamSource(stream).connect(analyzer);

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
