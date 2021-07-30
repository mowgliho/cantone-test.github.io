class Feedback {
  boxWidth = '500px';
  boxHeight = '100px';

  questions = [
    {text: 'How was your experience learning Cantonese tones?', audio: null, visual: null},
    {text: 'Did you find some tones easier to learn than others?', audio: null, visual: null},
    {text: 'Which was easier, perception or production? Why?', audio: null, visual: null},
    {text: 'How did you find the matching game for learning tones?', audio: null, visual: null},
    {text: 'How helpful were the provided tone charts?', audio: null, visual: ['idealized','data']},
    {text: 'How helpful were the tuning bars in learning pronunciation?', audio: 'vocoded',visual: null},
    {text: 'How helpful was the visual feedback on the contours that you made while training?', audio: 'vocoded', visual: ['idealized','data']},
    {text: 'How did you find the audio snippets that were adjusted to your vocal range?', audio: 'vocoded', visual: null},
    {text: 'Did you have issues with the system recognizing the contours that you produced?', audio: 'vocoded', visual: ['idealized','data']},
    {text: 'Do you feel that you had enough time to learn Cantonese tones?', audio: null, visual: null},
    {text: 'What other comments/feedback do you have?', audio: null, visual: null},
    {text: 'Did you come across any bugs/errors?', audio: null, visual: null}
  ];

  constructor(manager, doc, div, audio, share, status) {
    const that = this;

    this.manager = manager;
    this.share = share;

    doc.create('h2','Feedback',div);
    doc.create('hr',null,div);
    doc.create('p','Thanks for participating! Before you go, please answer some questions about your experience.',div);

    let visType = share.get('visual');
    let audioType = share.get('audio');

    this.data = []

    var num = 1;
    for(const question of this.questions) {
      if(this.validateQuestion(question, audioType, visType)) {
        this.addQuestion(this.data, doc, div, question, num); 
        num += 1;
      }
    }

    doc.create('hr',null,div);
    let submitButton = doc.create('button', 'Submit', div);
    submitButton.onclick = function() { that.submit()};
  }

  validateQuestion(question, audioType, visType) {
    if(question['audio'] != null && !question['audio'].includes(audioType)) return false;
    if(question['visual'] != null && !question['visual'].includes(visType)) return false;
    return true;
  }

  addQuestion(data, doc, parentDiv, question, qNumber) {
    const div = doc.create('div', null, parentDiv);
    const label = doc.create('p', 'Question ' + qNumber + ': ' + question['text'], div);
    const textarea = doc.create('textarea',null,div);
    textarea.style.width = this.boxWidth;
    textarea.style.height = this.boxHeight;
    doc.create('p',null,div);
    data.push({q: question['text'] , a: function() { return textarea.value}});
  }

  submit() {
    const that = this;

    const id = this.share.get('id');
    let filename = 'feedback.txt';
 
    let text = '';
    for(const q of this.data) {
      text += 'Q: ' + q['q'] + '\nA: ' + q['a']() + '\n\n';
    }
    uploadPlainTextFile(id, filename, text, false, null)
    uploadProgress(id, 'feedback','completed', function() {that.manager.next();});
  }

  start(){}
}
