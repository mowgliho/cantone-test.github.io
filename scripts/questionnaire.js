class Questionnaire {
  questions = [
    {text: 'What is/are your native language(s)?', type: 'text', validate: true},
    {text: 'If you speak any other languages, what are they? Please indicate your proficiency.', type: 'text', validate: false},
    {text: 'How old are you?', type: 'radio', id: 'age', options: ['18-29','30-39','40-49','50-59','60-69','70+'], validate: true}
  ]

  constructor(manager, doc, div, audio, share, status) {
    const that = this;

    this.manager = manager;
    this.share = share;
    this.toValidate = [];

    doc.create('h2','Participant Questionnaire',div);

    const data = {};
    for(const [qId, question] of this.questions.entries()) {
      let answer = this.buildQuestion(doc, qId, question, div, data);
      if(question['validate']) this.toValidate.push(answer);
    }
    doc.create('hr',null,div);
    this.button = doc.create('button','Submit!', div);
    this.button.onclick = function() {
      that.finish(data);
    }
    this.validate();
  }

  buildQuestion(doc, qId, question, parentDiv, data) {
    const that = this;

    let div = doc.create('div', null, parentDiv);
    let p = doc.create('p', 'Question ' + (qId+1) + ': ' + question['text'], div);
    if(question['validate']) {
      let label = doc.create('label',' (Mandatory)', p);
      label.style.color = 'red';
    }
    if(question['type'] == 'text') {
      let answer = doc.create('textarea',null,div);
      answer.style.width = '500px';
      answer.style.height = '100px'
      data[question['text']] = function() { return answer.value == ''? null: answer.value};
      answer.onchange = function() {that.validate()};
      answer.onkeyup = function() {that.validate()};
      return data[question['text']];
    } else if(question['type'] == 'radio') {
      let options = [];
      for(const option of question['options']) {
        let optionDiv = doc.create('div', null, div);
        let input = doc.create('input',null,optionDiv);
        input.value = option;
        options.push(input);
        input.type = 'radio';
        input.onclick = function() {that.validate()};
        input.name = question['id'];
        doc.create('label',option, optionDiv);
      }
      data[question['text']] = function() {
        for(const option of options) {
          if(option.checked) return option.value;
        }
        return null;
      }
      return data[question['text']];
    }
  }

  validate() {
    for(const v of this.toValidate) {
      if(v() == null) return this.button.disabled = true;
    }
    return this.button.disabled = false;;
  }

  finish(data) {
    const id = this.share.get('id');
    let filename = 'questionnaire.txt';
 
    let text = '';
    for(const [q,a] of Object.entries(data)) {
      text += q + '\n' + a() + '\n\n';
    }
    uploadPlainTextFile(id, filename, text)
    uploadProgress(id, 'questionnaire','completed');
    this.manager.next();
  }

  start() {
  }
}
