class ToneContours {
  static tones = ['t1','t2','t3','t4','t5','t6'];

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

  static getCubicContour(tone, pts, sd) {
    let max = ToneContours.dataCubics[tone]['max'];
    let coefs = ToneContours.dataCubics[tone]['coefs'];
    let contourPts = [];
    for(var i = 0; i <= pts; i++) {
      let t = max*(i/pts);
      contourPts.push([t, (4/2.6)*sd*(coefs[0] + coefs[1]*t + coefs[2]*(t**2) + coefs[3]*(t**3))])//4/2.6 to scale with idealized
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

    //plot
    let margin = 0.1;
    let ctx = canvas.getContext('2d');
    if(type == 'none') {//do nothing
    } else if(type == 'idealized' || type == 'data') {
      let numPts = Math.floor(width/2);
      let contours = ToneContours.tones.map((t) => type == 'idealized'? ToneContours.getIdealizedContour(t, numPts, 1): ToneContours.getCubicContour(t, numPts, 1));
      const maxT = contours.reduce((a,contour) => Math.max(a, contour.reduce((b,c) => Math.max(b,c[0]),0)),0)
      const maxY = contours.reduce((a,contour) => Math.max(a, contour.reduce((b,c) => Math.max(b,c[1]),0)),0)
      const minY = contours.reduce((a,contour) => Math.min(a, contour.reduce((b,c) => Math.min(b,c[1]),0)),0)
      let x = (t) => (margin/2 + (t/maxT)*(1-margin - textSize/canvas.width))*canvas.width;
      let y = (st) => (1-(margin/2 + (st-minY)/(maxY-minY)*(1-margin)))*canvas.height;
      for(var i = 0; i < ToneContours.tones.length; i++) {
        let t = ToneContours.tones[i];
        let contour = contours[i];
        ctx.setLineDash((tones != null && !(tones.includes(t)))?[5,15]:[]);
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
    }
    return div;
  }
}
