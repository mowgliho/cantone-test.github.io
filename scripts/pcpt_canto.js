class PcptCanto {
  maxPlay = 3;

  constructor(manager, doc, div, audio, share, status) {
    const that = this;
    this.manager = manager;
    this.share = share;

    //trial
    this.buildTrials(audio,doc);

    //Instructions
    doc.create('h2','Perception Warmup', div);
    doc.create('label', 'Let\'s match sounds with similar pitch contours. There will be ' + this.trials.length + ' rounds.', div);
    let list = doc.create('ul', null, div);
    doc.create('li','Click "Play" to hear sounds. You can play each up to ' + this.maxPlay + ' times.',list);
    doc.create('li','Click "Match" to link a sound to a target. The button will change color. You can click again to deactivate.',list);
    doc.create('li','Once a "Match" button is active, you can click on a blue column on the right to match to a target. A line will appear between the boxes.',list);
    doc.create('label', 'After assigning each sound to a target, you can click "Next" to move on to the next round. You can change your answers around before clicking "Next".',div);

    doc.create('hr',null,div);

    //trial
    this.roundHeader = doc.create('h4',null,div);
    this.trialLabel = doc.create('p',null,div);
    this.round = status == null? 0: parseInt(status)+1;
    this.match = new Match(doc,audio, this, {text: 'Next', fn: function() {that.next()}});
    div.appendChild(this.match.getDiv());
    this.initiateTrial();
  }

  initiateTrial() {
    let info = this.trials[this.round];

    this.roundHeader.innerHTML = 'Round ' + (this.round + 1) + ' of ' + this.trials.length + '.';
    this.trialLabel.innerHTML = info['text'];
    this.trialLabel.style.backgroundColor = info['color'];
    this.match.set(this.round, shuffleArray(info['sources']),shuffleArray(info['targets']), this.maxPlay, false, false)
  }

  buildTrials(audio,doc) {
    this.trials = [
      {
        text: 'In this round, the sets of source and target sounds are the same. Connect sources to their corresponding targets.',
        sources: Stimuli.pcptCanto(true, false, true),
        targets: Stimuli.pcptCanto(true, false, true),
        color: 'lavender'
      }, {
        text: 'In this round, the sets of source and target sounds are the same. Connect sources to their corresponding targets.',
        sources: Stimuli.pcptCanto(true, true, true),
        targets: Stimuli.pcptCanto(true, true, true),
        color: 'lavender'
      }, {
        text: 'Now, the sets of source and target sounds are different. Each target can also correspond to multiple sources, so that deduction by elimination may not work.',
        sources: Stimuli.pcptCanto(false, false, false),
        targets: Stimuli.pcptCanto(true, false, true),
        color: 'darksalmon'
      }, {
        text: 'Now, the sets of source and target sounds are different. Each target can also correspond to multiple sources, so that deduction by elimination may not work.',
        sources: Stimuli.pcptCanto(false, true, false),
        targets: Stimuli.pcptCanto(true, true, true),
        color: 'darksalmon'
      }
    ];
  }

  next() {
    const answers = this.match.getGuesses();
    const id = this.share.get('id');
    const filename = 'pcpt_canto.tsv';
    let text = this.round == 0? 'round\tfile\tguessed_tone\n':'';
    for(var i = 0; i < answers.length; i++) {
      text += [this.round,answers[i]['start'], answers[i]['end']].join('\t') + '\n';
    }
    uploadPlainTextFile(id, filename, text, this.round == 0? false: true)
    uploadProgress(id, 'pcpt_canto',this.round);

    this.round += 1;
    if(this.round < this.trials.length) {
      this.initiateTrial();
    } else {
      this.end();
    }
  }

  end() {
    uploadProgress(this.share.get('id'), 'pcpt_canto','completed');
    this.manager.next();
  }

  start() {}
}
