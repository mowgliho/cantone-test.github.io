class Consent {
  consentForm = 'resources/consent.pdf';

  consentQs = [
    'I consent to take part in the above study, including audio recording.',
    'I agree that recordings of my voice can be shared with other researchers and used for teaching or research purposes (e.g., presentations and publications).',
    'I agree that recordings of my voice may be made publicly available for general use (e.g. used in radio or television broadcasts, or put on the world-wide web).',
    'I do not have a hearing impairment.'
    'I do not speak a tonal language (A language where pitch differentiates between word meaning e.g. Chinese, Thai, Vietnamese, etc).'
  ];

  constructor(manager, doc, div, audio, share, status) {
    const that = this;
    this.share = share;
    this.manager = manager;

    this.inputs = [];

    doc.create('h2','Consent Form',div);
    doc.create('label','Thanks for taking part in the Cantone experiment! Before beginning, please read the following participant consent and data usage points. ', div);
    doc.create('label', 'The form in pdf format can be found ', div);
    let link = doc.create('a','here',div);
    doc.create('label', ':', div);
    link.href = this.consentForm;
    doc.create('p', null, div);

    for(const q of this.consentQs) {
      const qDiv = doc.create('div',null,div);
      let input = doc.create('input', null, qDiv);
      input.type = 'checkbox';
      input.onclick = function() { that.update()};
      doc.create('label',q,qDiv);
      qDiv.style.border = '1px solid';
      this.inputs.push(input);
    }

    doc.create('p', null, div);

    this.nextButton = doc.create('button','Accept',div);
    this.nextButton.onclick = function() {that.finish()};
    this.update();
  }

  update() {
    var allTrue = true;
    for(var input of this.inputs) {
      allTrue = allTrue & input.checked;
    }
    this.nextButton.disabled = !allTrue;
  }

  finish() {
    const that = this;

    fetch(Config.assignCgi, { method: 'GET'}).then(
      (response) => {response.text().then(function(x) {
        let params = JSON.parse(x);
        for(x of ['id','visual','audio']) {
          that.share.save(x,params[x]);
        }
        uploadProgress(that.share.get('id'), 'consent','completed', function() { that.manager.next();});
      })}).catch(
      (error) => {console.log("error", error)});
  }

  start() {}
}
