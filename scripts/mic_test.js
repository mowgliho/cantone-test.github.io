class MicTest {
  ambientTime = 5;
  measurementInterval = 20;
  maxDbfs = -5;
  minDbfs = -20;
  minSt = 49 + 12*Math.log2(75/440);//Boermsa 1993
  maxSt = 49 + 12*Math.log2(500/440);
  checkTuneTime = 2;
  checkMatchTime = 1;
  checkMatchMaxTime = 10;
 
  calibrationSentences = [
    'Hurdle the pit with the aid of a long pole.',
    'A strong bid may scare your partner stiff.',
    'Even a just cause needs power to win.',
    'Peep under the tent and see the clowns.',
    'The leaf drifts along with a slow spin.'
  ]
  constructor(manager, doc, div, audio, share, status) {
    const that = this;

    this.manager = manager;
    this.share = share;

    //intro
    doc.create('h2','Calibration and Mic Test',div);
    doc.create('label','Let\'s check that your microphone works, that there isn\'t too much background noise, and calibrate to your vocal range.', div);
    doc.create('hr',null,div);

    //ambient
    this.ambientDiv = doc.create('div',null,div);
    doc.create('label','Let\'s check for ambient noise. Click the button and wait for ' + this.ambientTime + ' seconds. ',this.ambientDiv);
    let ambientButton = doc.create('button','Start',this.ambientDiv);
    this.ambientLabel = doc.create('label', null, this.ambientDiv);
    ambientButton.onclick = getAudioStream(function(audioContext, stream) {that.ambientNoise(audioContext,stream, ambientButton)});

    //calibration
    this.calibDiv = doc.create('div',null,div);
    doc.create('label','Let\'s calibrate to your vocal range. Press "Record" and say the words below. Then click "Done" (the "Record" button will change). You may recalibrate if you mess up. Finally, click "Continue"',this.calibDiv);
    let textArea = doc.create('textarea',this.calibrationSentences.join('\n'),this.calibDiv);
    textArea.rows = this.calibrationSentences.length;
    textArea.cols = this.calibrationSentences.reduce((a,x) => Math.max(a,x.length),0);
    textArea.style.display = 'block';
    let recordButton = doc.create('button','Record',this.calibDiv);
    recordButton.onclick = getAudioStream(function(audioContext, stream) {that.calibrate(audioContext, stream, recordButton)});
    this.calibReadyLabel = doc.create('label',' Thanks! ',this.calibDiv);
    this.calibReadyLabel.style.color = 'green';
    this.calibReadyLabel.style.visibility = 'hidden';
    this.calibNextButton = doc.create('button','Continue',this.calibDiv);
    this.calibNextButton.disabled = true;
    this.calibDiv.style.display = 'none';
    
    //vocal check
    this.vocalDiv = doc.create('div',null,div);
    doc.create('p', 'Let\'s check the calibration by trying to match pitches. Below are 5 pitches represented by black lines. On clicking "Start", you will hear a tone, which will last for ' + this.checkTuneTime + ' seconds. When the tone ends, match (hum or sing) the tone. A line should appear with your pitch - match the black line. When you have approximately matched for ' + this.checkMatchTime + ' seconds, recording will stop.', this.vocalDiv);
    doc.create('p', 'Match all 5 to go on. If the pitches are too high or too low for you, you may click the "Shift pitches up/down" buttons. Note that when you do this you will have to do all 5 again with the new pitches.',this.vocalDiv);
    doc.create('p','Then click "Next".', this.vocalDiv);
    doc.create('hr',null,this.vocalDiv);
    const upButton = doc.create('button', 'Shift pitches up',this.vocalDiv);
    upButton.onclick = function() { that.startTuning(that.meanSt+1) };
    let span = doc.create('span',null,this.vocalDiv);
    span.style.width = '10px';
    span.style.display = 'inline-block';
    doc.create('label','  ',this.vocalDiv);
    const downButton = doc.create('button', 'Shift pitches Down',this.vocalDiv);
    downButton.onclick = function() { that.startTuning(that.meanSt-1) };
    doc.create('hr',null,this.vocalDiv);
    let matchDiv = doc.create('div',null,this.vocalDiv);
    this.tuners = [];
    for(var i = 0; i < 5; i++) {
      let tuner = new Tuning(doc, share, this.checkTuneTime, this.checkMatchTime, this.checkMatchMaxTime, this);
      matchDiv.appendChild(tuner.getDiv());
      if(i != 4) {
        let span = doc.create('span', null, matchDiv);
        span.style.width = '25px';
        span.style.display = 'inline-block';
      }
      this.tuners.push(tuner);
    }

    doc.create('hr',null,this.vocalDiv);
    this.vocalNextButton = doc.create('button','Next',this.vocalDiv);
    this.vocalDiv.style.display = 'none';

    this.attemptContours = [];
  }

  ambientNoise(audioContext, stream, button) {
    let that = this;

    button.disabled = true;
    let analyzer = getAnalyzer(audioContext, stream);
    let data = new Float32Array(analyzer.fftSize)

    const vols = [];

    let calc = function() {
      analyzer.getFloatTimeDomainData(data);
      vols.push(Math.sqrt(data.reduce((a, x) => a + x**2)/data.length));
    }

    this.share.addTimeout(setInterval(calc, that.measurementInterval));
    this.share.addTimeout(setTimeout(function() {that.stopAmbient(vols, button);}, that.ambientTime * 1000));
  }

  stopAmbient(vols, button) {
    this.share.clearTimeouts();
    let dbfs = 20*Math.log10(Math.sqrt(vols.reduce((a,b) => a + b**2,0)/vols.length));
    dbfs = Math.max(dbfs, this.minDbfs);
    if(dbfs < this.maxDbfs) {
      this.share.save('ambientDbfs',dbfs);
      this.ambientDiv.style.display = 'none';
      this.calibDiv.style.display = 'block';
    } else {
      this.ambientLabel.style.color = 'red';
      this.ambientLabel.innerHTML = ' Too much noise detected. Please try again or find a quieter place.';
      button.disabled = false;
    }
  }

  calibrate(audioContext, stream, button) {
    const that = this;

    const oldParams = {
      bgColor: button.style.backgroundColor,
      text: button.innerHTML,
      fn: button.onclick
    };

    let analyzer = getAnalyzer(audioContext, stream);
    let data = new Float32Array(analyzer.fftSize)
    const sampleRate = audioContext.sampleRate;

    const sts = [];

    let calc = function() {
      analyzer.getFloatTimeDomainData(data);
      let st = 49 + 12*Math.log2(yin(data, sampleRate)/440);
      if(st > that.minSt && st < that.maxSt) sts.push(st);
    }

    button.style.backgroundColor = 'lawngreen';
    button.innerHTML = 'Done!';
    button.onclick = function() {that.stopCalibration(sts, button, oldParams)};

    this.share.addTimeout(setInterval(calc, that.measurementInterval));
  }

  stopCalibration(sts, button, oldParams) {
    const that = this;

    let meanSt = sts.reduce((a,b) => a + b,0)/sts.length;
    let valid = (meanSt > this.minSt && meanSt < this.maxSt);

    this.calibReadyLabel.style.visibility = valid?'visible':'hidden';
    this.calibNextButton.disabled = valid?false:true;
    this.calibNextButton.onclick = valid?function() {
      that.calibDiv.style.display = 'none';
      that.vocalDiv.style.display = 'block';
      that.startTuning(meanSt);
    }:function() {};

    button.style.backgroundColor = oldParams['bgColor'];
    button.innerHTML = oldParams['text'];
    button.onclick = oldParams['fn'];
    this.share.clearTimeouts();
  }

  startTuning(meanSt) {
    this.share.save('st',meanSt);
    this.meanSt = meanSt;
    for(var i = 0; i < this.tuners.length; i++) {
      const sign = (i % 2)*2-1;
      const offset = Math.floor((i+1) / 2)
      this.tuners[i].set(meanSt, sign*offset, Config.stSd);
      this.vocalNextButton.disabled = true;
    }
  }

  tunerStarted(t) {
    for(var tuner of this.tuners) {
      if(tuner != t) tuner.deactivate();
    }
  }

  tunerFinished(t, mean, z, contour) {
    this.attemptContours.push({
      id: this.attemptContours.length,
      mean: mean,
      z: z,
      contour:contour
    })
    this.attemptCount += 1;

    var finished = true;
    for(var tuner of this.tuners) {
      tuner.reactivate();
      if(!tuner.tuned()) finished = false;
    }
    if(finished) {
      const that = this;
      this.vocalNextButton.disabled = false;
      this.vocalNextButton.onclick = function() {that.next();};
    }
  }

  next() {
    const that = this;

    const id = this.share.get('id');
    const filename = 'mic_test.tsv';
    var text = '';
    for(var contour of this.attemptContours) {
      text += 'New Contour:\n';
      text += [contour['id'],contour['mean'].toFixed(3),contour['z'].toFixed(3)].join('\t') + '\n';
      text += 'time\tst\ttarget\n';
      for(var row of contour['contour']) {
        text += row.join('\t') + '\n';
      }
      text += '\n';
    }

    uploadPlainTextFile(id, filename, text, false, function() {
      const filename = 'info.txt';
      var text = '';
      for(const x of ['ambientDbfs','st']) text += x + '\t' + that.share.get(x) + '\n';
      uploadPlainTextFile(id, filename, text, true, function() {
        uploadProgress(id, 'mic_test','completed', function() {that.manager.next();});
      });
    });
  }

  start() {}
}
