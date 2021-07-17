class ToneContours {
  static idealizedChao = {
    t1: [5,5],
    t2: [2,5],
    t3: [3,3],
    t4: [2,1],
    t5: [2,3],
    t6: [2,2]
  }

  static dataCubics = {
    t1: {max: 0.785, coefs: [1.348,-0.0176,-0.458,0.7109]},
    t2: {max: 0.745, coefs: [-0.202,-5.415,19.535,-13.921]},
    t3: {max: 0.86, coefs: [0.384,-0.710,1.038,-0.211]},
    t4: {max: 0.725, coefs: [-0.286,-1.699,-2.697,3.240]},
    t5: {max: 0.58, coefs: [-0.614,-0.912,1.982,0.664]},
    t6: {max: 0.93, coefs: [-0.306,-0.357,-0.908,1.018]}
  }

  static getIdealizedContour(tone, sd) {
    let pts = ToneContours.idealizedChao[tone];
    return [[0,sd*(pts[0]-3)], [1,sd*(pts[1]-3)]];
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
}
