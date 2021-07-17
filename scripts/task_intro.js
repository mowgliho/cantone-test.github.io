class TaskIntro {
  constructor(manager, doc, div, audio, share) {
    this.manager = manager;
    this.register(share, doc, div, audio);
    this.share = share;
  }

  build(doc, div, audio) {
    console.log(this.share);
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
          that.build(doc,div,audio)
        }
      })}).catch(
      (error) => {console.log("error", error)});
  }

  start() {}
}
