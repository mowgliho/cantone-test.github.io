class TaskIntro {
  exWidth = 500;
  exHeight = 500;
  exCount = 2;

  examples = {
    t1: {char: '詩', translation: 'poetry'},
    t2: {char: '史', translation: 'history'},
    t3: {char: '試', translation: 'try'},
    t4: {char: '時', translation: 'time'},
    t5: {char: '市', translation: 'city'},
    t6: {char: '是', translation: 'yes'}
  }

  constructor(manager, doc, div, audio, share) {
    this.manager = manager;
    this.audio = audio;
    this.register(share, doc, div, audio);
    this.share = share;
  }

  build(doc, div, audio) {
    const that = this;

    let visType = this.share.get('visual');

    //introduction
    doc.create('h2', 'Task Introduction',div);
    doc.create('label', 'Again, thanks for participating in this study! Here, we will tell you a little more about what the study is about and what you will do.', div);
    doc.create('hr',null,div);

    this.buildToneIntro(doc, div, audio, visType);

    doc.create('hr',null,div);

    this.buildTaskIntro(doc, div);

    doc.create('hr', null,div);

    let button = doc.create('button','Start!', div);
    button.onclick = function() {that.manager.next()};
  }

  buildToneIntro(doc, parentDiv, audio, visType) {
    const that = this;

    let div = doc.create('div',null,parentDiv);

    //intro to tones
    doc.create('h3', 'Tones', div);
    doc.create('label', 'Cantonese is a language spoken by over 80 million people in Southern China, Hong Kong, Macao, and around the world. Like the majority of the world\'s languages, it is a tonal language. This means that the "same" syllable can have different meanings when pronounced with different pitch contours.',div);
    doc.create('p',null,div);
    doc.create('label','Cantonese is generally thought of as having 6 tones, with tones 1, 3, and 6 being classified as "level" tones, and tones 2, 4, and 5 being classified as "contour" tones.' + (visType == 'none'? '':' You can see them depicted in the diagram below. The x-axis represents time and the y-axis represents pitch.'),div);
    doc.create('p',null,div);
    
    //diagram if applicable
    if(visType != 'none') {
      let visDiv = ToneContours.getVisual(doc, visType, this.exWidth, this.exHeight, null, 20);
      visDiv.style.display = 'inline-block';
      div.appendChild(visDiv);
    }

    //example div
    let exampleDiv = doc.create('div',null,div);
    //list of examples
    doc.create('p','For example, consider the Cantonese syllable /si/, which rhymes with the English words "see" and "sea." Saying this word with the six different tones results in the following different meanings (Note that you can play each example a maximum of ' + this.exCount + ' times):',exampleDiv);
    let list = doc.create('ul',null,exampleDiv);
    for(const [tone, info] of Object.entries(this.examples)) {
      let itemDiv = doc.create('li',null,list);
      doc.create('label', tone + ' (' + info['char'] + ') ', itemDiv);
      const button = doc.create('button','Play',itemDiv);
      button.onclick = function() {that.playEx(button, tone, that.exCount)};
      doc.create('label', ' : ' + info['translation'] + '.',itemDiv);
    }
    doc.create('p','In fact, it\'s a bit more complicated than this: each syllable and tone pair can represent a number of different homophones which have to be disambiguated with the help of context.',exampleDiv);
  }

  buildTaskIntro(doc, div) {
    doc.create('h3', 'Task', div);
    doc.create('p', 'This study investigates how people learn to perceive, produce, and internalize Cantonese tones. It will consists of 4 parts:', div);
    let list = doc.create('ul',null,div);
    doc.create('li','Perception Training: You will match audio snippets to their corresponding tone labels, in a fashion similar to the matching game that you\'ve already played. The difficulty of the game will increase as you play.', list)
    doc.create('li','Perception Test: You will hear an audio snippet. We will ask you which tone(s) was(were) produced; you will enter in the tone number(s) of your guess into a text box.', list)
    doc.create('li','Production Training: ' + (this.share.get('audio') == 'exemplar'?
      'You will hear an audio sample and will attempt to imitate the pronunciation. You will be able to hear your attempts and the sample multiple times.':
      'You will hear an audio sample where the audio has been manipulated to match your own vocal range. You will be able to "tune" your pitch to the starting and ending pitches of the syllable and see your attempted pitch contours mapped against a target contour'
    ), list)
    doc.create('li','Production Test: You will be asked to record a particular syllable and tone combination (e.g. "say /si3/". You will be able to reattempt a question if you don\'t like your answer.', list)

    doc.create('p', 'After completing these parts, we will ask you to fill out a short questionnaire on your experience with the study. If you\'ve been inspired to learn Cantonese by the end of the study, we\'ll also provide you with a list of learning resources (and martial arts films) for you to continue learning.',div);
  }

  playEx(button, tone, remaining) {
    const that = this;

    this.audio.taskIntro(tone.slice(-1)).play();
    remaining -= 1;
    if(remaining == 0) button.disabled = true;
    else {
      button.disabled = false;
      button.onclick = function() { that.playEx(button, tone, remaining)}
    }
  }

  register(share, doc, div, audio) {
    const that = this;

    let fd = new FormData();
    for(var x of ['id','st','ambientDbfs']) {
      fd.append(x, share.get(x));
    }

    fetch(Config.registerCgi, { method: 'POST', body: fd}).then(
      (response) => {response.text().then(function(x) {
        let params = JSON.parse(x);
        for(x of ['visual','audio']) {
          that.share.save(x,params[x]);
        }
        that.build(doc,div,audio)
      })}).catch(
      (error) => {console.log("error", error)});
  }

  start() {}
}
