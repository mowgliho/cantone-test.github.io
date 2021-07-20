class Match {
  static width = 800;
  static boxHeight = 60;
  static buttonWidth = 75;

  static colorText = {
    canPlay: {color:[124,252,0],text:'Play'},
    cantPlay: {color:[255,255,255],text:''},
    match: {color:'skyblue',text:'Match'},
    matching: {color:'blue',text:'Match'},
  }

  static correctInfo = {
    guess: {color: 'black', text: null, dash: []},
    correct: {color: 'green', text: 'Correct answers are in ', dash: []},
    incorrect: {color: 'red', text: 'Incorrect answers are in ',dash: []},
    missed: {color: 'blue', text: 'Missed correct answers are in dashed ', dash: [5,15]}
  }

  //next is a dict of text and function
  constructor(doc, audio, parent, next) {
    const that = this;

    this.div = doc.create('div');
    this.parent = parent;
    //canvas
    this.canvas = doc.create('canvas',null, this.div);
    //correct
    let correctDiv = doc.create('div',null, this.div);
    this.correctLegend = doc.create('div',null, correctDiv);
    for(const [key,val] of Object.entries(Match.correctInfo)) {
      if(val['text'] != null) {
        let label = doc.create('label', val['text'] + val['color'] + ' ', this.correctLegend);
        label.style.color = val['color'];
      }
    }
    doc.create('p','You may click on the stimuli or references to play audio again before continuing.',this.correctLegend);
    this.nextButton = doc.create('button',next['text'], correctDiv);
    this.nextButton.onclick = function() {next['fn']();}
  }

  //maxPlay = -1 means infinite playing
  set(id, sources, targets, maxPlay, labelTones, refOnlyAtCorrect) {
    this.refOnlyAtCorrect = refOnlyAtCorrect;
    this.labelTones = labelTones;
    this.sources = sources.map(x => {return {fn: x['fn'], tone: x['tone'],playCount:maxPlay == -1?1:maxPlay, max:maxPlay}});
    this.targets = targets.map(x => {return {fn: x['fn'], tone: x['tone'],playCount:maxPlay == -1?1:maxPlay, max:maxPlay}});
    this.setupCanvas();
    this.state = 'pick';
    this.lines = [];
    this.nextButton.disabled = this.lines.length != this.sources.length;
    this.paint();
    this.usageData = {play:[],line:[]};
    this.id = id;
  }

  setupCanvas() {
    const that = this;

    this.canvas.height = Match.boxHeight * Math.max(this.sources.length, this.targets.length);
    this.canvas.width = Match.width;
    this.canvas.style.display = 'block';
    this.canvas.onclick = function(e) { const rect = that.canvas.getBoundingClientRect(); that.click(e.clientX - rect.left, e.clientY - rect.top);};
    //clickboxes
    this.clickBoxes = [];
    for(var i = 0; i < this.sources.length; i++) {
      const boxId = i;
      const startY = i*Match.boxHeight;
      const endY = (i+1)*Match.boxHeight;
      //play stimuli
      this.clickBoxes.push(Match.clickBox(
        'source',
        0, Match.buttonWidth, startY, endY,
        function() {return interpolateColor(Match.colorText['canPlay']['color'], Match.colorText['cantPlay']['color'], that.sources[boxId]['playCount'], that.sources[boxId]['max'])}, 
        function() {const count = that.sources[boxId]['playCount']; return count  > 0? Match.colorText['canPlay']['text']: ''}, 
        function() {that.play('source',boxId,that.sources[boxId])},
        function() {return true;}
        )
      );
      //match boxes
      this.clickBoxes.push(Match.clickBox(
        boxId,
        Match.buttonWidth, 2*Match.buttonWidth, startY, endY,
        function() { return (that.state == 'mouse' && boxId == that.mouseStart)? Match.colorText['matching']['color']:Match.colorText['match']['color']},
        function() { return Match.colorText['match']['text']},
        function() { if(that.state != 'correct') that.match(boxId, true);},
        function() { return true;}
        )
      );
    }
    for(var i = 0; i < this.targets.length; i++) {
      const boxId = i;
      const startY = i*Match.boxHeight;
      const endY = (i+1)*Match.boxHeight;
      //target boxes
      this.clickBoxes.push(Match.clickBox(
        'target',
        this.canvas.width - 2*Match.buttonWidth, this.canvas.width - Match.buttonWidth, startY, endY,
        function() { return Match.colorText['match']['color']},
        function() { return that.labelTones?'t' + that.targets[boxId]['tone']:''},
        function() { if(that.state != 'correct') that.match(boxId, false);},
        function() { return true;}
        )
      );
      //reference stimuli
      this.clickBoxes.push(Match.clickBox(
        'ref',
        this.canvas.width - Match.buttonWidth, this.canvas.width, startY, endY,
        function() {return interpolateColor(Match.colorText['canPlay']['color'], Match.colorText['cantPlay']['color'], that.targets[boxId]['playCount'], that.targets[boxId]['max'])}, 
        function() {const count = that.targets[boxId]['playCount']; return count  > 0? Match.colorText['canPlay']['text']: ''}, 
        function() { if(!that.refOnlyAtCorrect || that.state == 'correct') that.play('target',boxId,that.targets[boxId]);},
        function() { return (!that.refOnlyAtCorrect || that.state == 'correct');}
        )
      );
    }
  }

  play(type, boxId, info) {
    if(info['playCount'] > 0 || info['max'] == -1) {
      (new Audio(info['fn'])).play();
      let syl = info['fn'].split(/[\\/]/).pop().split('.')[0];
      this.usageData['play'].push({id: this.id, type: type, boxId: boxId, syl: syl, time: (new Date()).getTime()});
    }
    if(info['playCount'] > 0 && info['max'] != -1) info['playCount'] -= 1;
  }

  paint() {
    //paint
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    for(var clickBox of this.clickBoxes) {
      if(!clickBox['paint']()) continue;
      const color = clickBox['color']();
      const text = clickBox['text']();
      var dim = clickBox['dims'];
      //fill rectangle
      ctx.fillStyle = color; 
      ctx.fillRect(dim['minX'],dim['minY'],dim['maxX']-dim['minX'],dim['maxY']-dim['minY']);
      //border
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'black';
      ctx.rect(dim['minX'],dim['minY'],dim['maxX']-dim['minX'],dim['maxY']-dim['minY']);
      ctx.stroke();
      //text
      ctx.fillStyle = 'black';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.font = '12px Arial';
      ctx.fillText(text,(dim['minX'] + dim['maxX'])/2,(dim['minY']+dim['maxY'])/2);
    }
    this.drawLines(ctx);
    //buttons and divs
    this.nextButton.disabled = (this.lines.length != this.sources.length) || (this.state == 'correct');
    this.nextButton.style.display = this.state == 'correct'?'none':'block';
    this.correctLegend.style.display= this.state == 'correct'? 'block':'none';
  }

  drawLines(ctx) {
    if(this.state != 'correct') {
      let params = Match.correctInfo['guess'];
      for(var line of this.lines) {
        Match.drawLine(this.canvas, ctx, line, params['color'], params['dash']);
      }
    } else {
      for(var line of this.lines) {
        let correct = line['start']['tone'] == line['guess']['tone'];
        let params = correct? Match.correctInfo['correct']:Match.correctInfo['incorrect'];
        Match.drawLine(this.canvas, ctx, line, params['color'], params['dash']);
        if(!correct) {
          params = Match.correctInfo['missed'];
          for(var i = 0; i < this.targets.length; i++) {
            if(line['start']['tone'] == this.targets[i]['tone']) {
              let missedLine = {startIdx: line['startIdx'], endIdx: i};
              Match.drawLine(this.canvas, ctx, missedLine, params['color'], params['dash']);
            }
          }
        }
      }
    }
  }

  //id of box, start is whether is start of arrow or end
  match(id, start) {
    if(this.state == 'pick' && start) {
      this.state = 'mouse';
      this.mouseStart = id;
    } else if(this.state == 'mouse') {
      if(start && id == this.mouseStart) {
        this.state = 'pick';
      } else if(!start) {
        this.state = 'pick';
        var newLines = []
        for(var line of this.lines) if(this.mouseStart != line['startInd']) newLines.push(line);
        this.lines = newLines;
        this.lines.push({
          startIdx: this.mouseStart, 
          endIdx: id,
          start: this.sources[this.mouseStart],
          guess: this.targets[id],
          startInd: this.mouseStart,
          });
        let syl = this.sources[this.mouseStart]['fn'].split(/[\\/]/).pop().split('.')[0];
        this.usageData['line'].push({id:this.id, time: (new Date()).getTime(), startIdx: this.mouseStart, endIdx: id, syl: syl, guess: this.targets[id]['tone']});
      }
    }
    this.paint();
  }

  click(x,y) {
    for(const clickBox of this.clickBoxes) {
      clickBox['func'](x,y);
    }
    this.paint();
  }

  getDiv() {
    return this.div;
  }

  getGuesses() {
    return(this.lines.map(x => {return {start: x['start']['fn'], end: x['guess']['tone']}}));
  }

  getUsageData() {
    return this.usageData;
  }

  correct() {
    this.state = 'correct';
    this.paint();
  }

  static clickBox(id, minX, maxX, minY, maxY, colorFn, textFn, callback, paintFn) {
    const cback = callback;
    return {
      id: id,
      dims:{minX:minX, maxX: maxX, minY:minY, maxY:maxY},
      color: colorFn,
      text: textFn,
      paint: paintFn,
      func: function(x,y) {
        if(x > minX && x < maxX && y > minY && y < maxY) {callback()};
      }
    }
  }

  static drawLine(canvas, ctx, line, color, dash) {
    ctx.strokeStyle = color;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(Match.buttonWidth*2, Match.boxHeight*(0.5+line['startIdx']));
    ctx.lineTo(canvas.width - Match.buttonWidth*2, Match.boxHeight*(0.5+line['endIdx']));
    ctx.stroke();
  }
}
