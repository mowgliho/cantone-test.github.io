class PcptCanto {
  maxPlay = 3;

  constructor(manager, doc, div, audio, share) {
    const that = this;
    this.manager = manager;
    this.share = share;

    //trial
    this.buildTrials(audio,doc);

    //Instructions
    doc.create('h2','Perception Test 2:', div);
    doc.create('label', 'In this second perception test, you will match sounds that have similar pitch contours. There will be ' + this.trials.length + ' rounds.', div);
    let list = doc.create('ul', null, div);
    doc.create('li','In the far left column, you can click "Play" to hear stimuli. You can listen up to ' + this.maxPlay + ' times.',list);
    doc.create('li','In the next column, you can click to start matching a sound to a target. When you click on a button, it will change color, indicating that it is ready to be matched with a target. You can click it again to deactivate.',list);
    doc.create('li','In the first column on the right, you can click to match an activated sound to a target. After clicking a box in the second column, you can click a box in this column to indicate a match. A line will appear between the boxes.',list);
    doc.create('li','In the last column, you can play target stimuli. Again, you can listen up to ' + this.maxPlay + ' times',list);
    doc.create('label', 'After assigning each stimulus, you can click "Next" to move on to the next round.',div);

    doc.create('hr',null,div);

    //trial
    this.roundHeader = doc.create('h4',null,div);
    this.trialDiv = doc.create('div',null,div);
    this.round = 0;
    this.match = new Match(doc,audio, this, {text: 'Next', fn: function() {that.next()}});
    this.initiateTrial();
    this.answers = [];
  }

  initiateTrial() {
    let info = this.trials[this.round];

    this.roundHeader.innerHTML = 'Round ' + (this.round + 1) + ' of ' + this.trials.length + '.';
    this.trialDiv.innerHTML = '';
    this.trialDiv.appendChild(info['text']);
    this.match.set(shuffleArray(info['sources']),shuffleArray(info['targets']), this.maxPlay, false, false)
    this.trialDiv.appendChild(this.match.getDiv());
  }

  buildTrials(audio,doc) {
    this.trials = [
      {
        text: doc.create('label','In this round, the sets of source and target sounds are the same. Connect sources to their corresponding targets.'),
        sources: audio.pcptCanto(true, true, true),
        targets: audio.pcptCanto(true, true, true),
      }, {
        text: doc.create('label','In this round, the sets of source and target sounds are the same. Connect sources to their corresponding targets.'),
        sources: audio.pcptCanto(true, false, true),
        targets: audio.pcptCanto(true, false, true),
      }, {
        text: doc.create('label','Now, the sets of source and target sounds are different. In addition, each target can correspond to multiple sources, so that deduction by elimination does not work. Connect sources to their corresponding targets.'),
        sources: audio.pcptCanto(false, true, false),
        targets: audio.pcptCanto(true, true, true),
      }, {
        text: doc.create('label','Now, the sets of source and target sounds are different. In addition, each target can correspond to multiple sources, so that deduction by elimination does not work. Connect sources to their corresponding targets.'),
        sources: audio.pcptCanto(false, false, false),
        targets: audio.pcptCanto(true, false, true),
      }
    ];
  }

  next() {
    this.answers.push(this.match.getGuesses());
    this.round += 1;
    if(this.round < this.trials.length) {
      this.initiateTrial();
    } else {
      this.end();
    }
  }

  end() {
    const id = this.share.get('id');
    var body = id + '_pcpt_canto.tsv\n';
    body += 'round\tfile\tguessed_tone\n';
    for(var round = 0;round < this.answers.length; round++) {
      var roundAnswers = this.answers[round];
      for(var i = 0; i < roundAnswers.length; i++) {
        body += [round,roundAnswers[i]['start'], roundAnswers[i]['end']].join('\t') + '\n';
      }
    }
    
    fetch(Config.plainTextCgi, { method: 'POST', body: body}).then(
      (response) => {response.text().then(function(x) {console.log(x)})}).catch(
      (error) => {console.log("error", error)});

    this.manager.next();
  }

  start() {}
}
