class Questionnaire {

  constructor(manager, doc, div, audio, share) {
    doc.create('h2','Participant Questionnaire',div);
    let button = doc.create('button','TODO later', div);
    button.onclick = function() {
      manager.next();
    }
    console.log(button);
  }

  start() {
  }
}
