class End {

  constructor(manager, doc, div, audio, share, status) {
    doc.create('h2','Done!',div);
    doc.create('hr',null,div);
    doc.create('p', 'Thank you for participating :D. You\'re finally done!', div);
    doc.create('p', 'If you came from Prolific, your completion code is ' + Config.prolificCompletion + '.', div);

    if(status != 'completed') uploadProgress(share.get('id'), 'end','completed', function() {});
  }
  
  start() {};
}
