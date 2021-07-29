class ToneContours {
  static tones = ['t1','t2','t3','t4','t5','t6'];
  static margin = 0.1;

  static idealizedChao = {
    t1: [5,5],
    t2: [2,5],
    t3: [3,3],
    t4: [2,1],
    t5: [2,3],
    t6: [2,2]
  };

  static dataCubics = {
    t1: {max: 0.785, coefs: [1.348,-0.0176,-0.458,0.7109]},
    t2: {max: 0.745, coefs: [-0.202,-5.415,19.535,-13.921]},
    t3: {max: 0.86, coefs: [0.384,-0.710,1.038,-0.211]},
    t4: {max: 0.725, coefs: [-0.286,-1.699,-2.697,3.240]},
    t5: {max: 0.58, coefs: [-0.614,-0.912,1.982,0.664]},
    t6: {max: 0.93, coefs: [-0.306,-0.357,-0.908,1.018]}
  };

  static getIdealizedContour(tone, numPts, sd) {
    let pts = ToneContours.idealizedChao[tone];
    let contourPts = [];
    for(var i = 0; i <= numPts; i++) {
      let p = i/numPts;
      contourPts.push([p,((1-p)*(pts[0]-3) + p*(pts[1]-3))*sd]);
    }
    return contourPts;
  }

  //stuff was calculated with humanum st as 5.2, so we have to adjust to the St sd that we use here.
  static getCubicContour(tone, pts, sd) {
    let max = ToneContours.dataCubics[tone]['max'];
    let coefs = ToneContours.dataCubics[tone]['coefs'];
    let contourPts = [];
    for(var i = 0; i <= pts; i++) {
      let t = max*(i/pts);
      contourPts.push([t, (5.2/Config.stSd)*sd*(coefs[0] + coefs[1]*t + coefs[2]*(t**2) + coefs[3]*(t**3))])
    }
    return contourPts;
  }

  //tone can be highlighted (for production)
  static getVisual(doc, type, width, height, tones, textSize) {
    //define canvas
    let div = doc.create('div',null);
    let canvas = doc.create('canvas',null,div);
    canvas.width = width;
    canvas.height = height;
    div.style.width = width + 'px';
    div.style.height = height + 'px';
    if(type != 'none')div.style.border = '1px solid';

    ToneContours.paintContour(canvas, type, tones, textSize);
    return div;
  }

  static paintContour(canvas, type, tones, textSize) {
    //plot
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(type == 'none') {//do nothing
    } else if(type == 'idealized' || type == 'data') {
      let numPts = Math.floor(canvas.width/2);
      let contours = ToneContours.tones.map((t) => type == 'idealized'? ToneContours.getIdealizedContour(t, numPts, 1): ToneContours.getCubicContour(t, numPts, 1));
      const maxT = contours.reduce((a,contour) => Math.max(a, contour.reduce((b,c) => Math.max(b,c[0]),0)),0)
      const maxY = contours.reduce((a,contour) => Math.max(a, contour.reduce((b,c) => Math.max(b,c[1]),0)),0)
      const minY = contours.reduce((a,contour) => Math.min(a, contour.reduce((b,c) => Math.min(b,c[1]),0)),0)
      let x = (t) => (ToneContours.margin/2 + (t/maxT)*(1-ToneContours.margin - textSize/canvas.width))*canvas.width;
      let y = (st) => (1-(0.5 + (st)/(Config.canvasHeightSd)))*canvas.height;
      for(var i = 0; i < ToneContours.tones.length; i++) {
        let t = ToneContours.tones[i];
        let contour = contours[i];
        ctx.setLineDash((tones != null && !(tones.includes(t)))?[5,15]:[]);
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(x(contour[0][0]), y(contour[0][1]));
        for(var j = 1; j < contour.length; j++) {
          ctx.lineTo(x(contour[j][0]), y(contour[j][1]));
          ctx.stroke();
        }
        let textIdx = type == 'idealized'? Math.floor(contour.length*0.5): contour.length -1;
        ctx.font = textSize + 'px serif';
        ctx.textBaseline = type == 'idealized'? 'top':'middle';
        ctx.fillText(t, x(contour[textIdx][0]), y(contour[textIdx][1]));
      }
      let maxTs = {};
      for(var [i,tone] of ToneContours.tones.entries()) maxTs[tone] = contours[i].reduce((a,b) => Math.max(a,b[0]),0);
      return {x: x, y: y, maxTs: maxTs};
    }
  }

  static freqToSemitone(freq) {
    return Math.log2(freq/440)*12 + 49;
  }

  static semitoneArrayToFreq(st) {
    const ret = new Array(st.length);
    for(var i = 0; i < st.length; i++) {
      ret[i] = ToneContours.semitoneToFreq(st[i]);
    }
    return ret;
  }

  static semitoneToFreq(st) {
    return Math.pow(2,(st - 49)/12)*440;
  }

  static freqArrayToSemitone(freq, shift) {//shift in semitones
    const ret = new Array(freq.length);
    for(var i = 0; i < freq.length; i++) {
      ret[i] = ToneContours.freqToSemitone(freq[i]) + shift;
    }
    return ret;
  }

  //from looking at humanum data
  static humanumMean = 38.1//in semitones

  static humanumTuneSts = {
    start:{'1':45, '2':35,'3':40,'4':37,'5':34,'6':37},
    end:{'1':45, '2':42.5,'3':40,'4':29,'5':37.5,'6':35}
  }
  
  static getHumanumShift(st) {
    return st - ToneContours.humanumMean 
  }

  static getTuningHumanumSt(st, tone, type, visType) {
    if(visType == 'data') {
      let shift = ToneContours.getHumanumShift(st);
      return ToneContours.humanumTuneSts[type][tone] + shift;
    } else if(visType == 'idealized') {
      return st + (ToneContours.idealizedChao['t' + tone][type == 'start'?0:1] - 3)*Config.stSd;
    }
  }

}
