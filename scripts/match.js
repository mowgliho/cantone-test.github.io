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

  constructor(doc, audio, parent) {
    const that = this;

    this.div = doc.create('div');
    this.parent = parent;
    //canvas
    this.canvas = doc.create('canvas',null, this.div);
    //correct button
    this.nextButton = doc.create('button','Next', this.div);
    this.nextButton.style.display = 'block';
    this.nextButton.onclick = function() {that.next();}
  }

  set(sources, targets, maxPlay) {
    this.sources = sources.map(x => {return {fn: x['fn'],playCount:maxPlay, max:maxPlay}});
    this.targets = targets.map(x => {return {fn: x['fn'], tone: x['tone'],playCount:maxPlay, max:maxPlay}});
    this.setupCanvas();
    this.state = 'pick';
    this.lines = [];
    this.nextButton.disabled = this.lines.length != this.sources.length;
    this.paint();
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
        '',
        0, Match.buttonWidth, startY, endY,
        function() {return that.interpolateColor(Match.colorText['canPlay']['color'], Match.colorText['cantPlay']['color'], that.sources[boxId]['playCount'], that.sources[boxId]['max'])}, 
        function() {const count = that.sources[boxId]['playCount']; return count  > 0? Match.colorText['canPlay']['text']: ''}, 
        function() {that.play(that.sources[boxId])}
        )
      );
      //match boxes
      this.clickBoxes.push(Match.clickBox(
        boxId,
        Match.buttonWidth, 2*Match.buttonWidth, startY, endY,
        function() { return (that.state == 'mouse' && boxId == that.mouseStart)? Match.colorText['matching']['color']:Match.colorText['match']['color']},
        function() { return Match.colorText['match']['text']},
        function() {that.match(boxId, true);}
        )
      );
    }
    for(var i = 0; i < this.targets.length; i++) {
      const boxId = i;
      const startY = i*Match.boxHeight;
      const endY = (i+1)*Match.boxHeight;
      //target boxes
      this.clickBoxes.push(Match.clickBox(
        '',
        this.canvas.width - 2*Match.buttonWidth, this.canvas.width - Match.buttonWidth, startY, endY,
        function() { return Match.colorText['match']['color']},
        function() { return ''},
        function() {that.match(boxId, false);}
        )
      );
      //reference stimuli
      this.clickBoxes.push(Match.clickBox(
        '',
        this.canvas.width - Match.buttonWidth, this.canvas.width, startY, endY,
        function() {return that.interpolateColor(Match.colorText['canPlay']['color'], Match.colorText['cantPlay']['color'], that.targets[boxId]['playCount'], that.targets[boxId]['max'])}, 
        function() {const count = that.targets[boxId]['playCount']; return count  > 0? Match.colorText['canPlay']['text']: ''}, 
        function() {that.play(that.targets[boxId]);}
        )
      );
    }
  }

  play(info) {
    if(info['playCount'] > 0) (new Audio(info['fn'])).play();
    info['playCount'] -= 1;
  }

  //j is count from end, not from start
  interpolateColor(start, end, j, n) {
    let arr = [];
    for(var i = 0; i < start.length; i++) {
      arr.push(start[i] + (end[i]-start[i])*(n-j)/n);
    }
    return 'rgba(' + arr.join(',') + ')';
  }

  paint() {
    //paint
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    for(var clickBox of this.clickBoxes) {
      const color = clickBox['color']();
      const text = clickBox['text']();
      var dim = clickBox['dims'];
      //fill rectangle
      ctx.fillStyle = color; 
      ctx.fillRect(dim['minX'],dim['minY'],dim['maxX']-dim['minX'],dim['maxY']-dim['minY']);
      //border
      ctx.beginPath();
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
    for(var line of this.lines) {
      Match.drawLine(this.canvas, ctx, line);
    }
//    //buttons and divs
    this.nextButton.disabled = Match.numGuesses(this.lines) != this.sources.length;
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
          startY: Match.boxHeight*(0.5+this.mouseStart), 
          endY: Match.boxHeight*(0.5+id),
          start: this.sources[this.mouseStart],
          guess: this.targets[id],
          startInd: this.mouseStart,
          color: 'black',
          type: 'guess',
          dashed: false});
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

  next() {
    this.parent.next();
  }

  getGuesses() {
    return(this.lines.map(x => {return {start: x['start']['fn'], end: x['guess']['tone']}}));
  }

  static clickBox(id, minX, maxX, minY, maxY, colorFn, textFn, callback) {
    const cback = callback;
    return {
      id: id,
      dims:{minX:minX, maxX: maxX, minY:minY, maxY:maxY},
      color: colorFn,
      text: textFn,
      func: function(x,y) {
        if(x > minX && x < maxX && y > minY && y < maxY) {callback()};
      }
    }
  }

  static drawLine(canvas, ctx, line) {
    ctx.strokeStyle = line['color'];
    ctx.setLineDash(line['dashed']?[5,15]:[]);
    ctx.beginPath();
    ctx.moveTo(Match.buttonWidth*2, line['startY']);
    ctx.lineTo(canvas.width - Match.buttonWidth*2, line['endY']);
    ctx.stroke();
  }

  static numGuesses(lines) {
    var guesses = 0;
    for(var line of lines) {
      if(line['type'] == 'guess') guesses += 1;
    }
    return(guesses);
  }

}
