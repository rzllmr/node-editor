class Clipboard {
  constructor() {
    if (!Clipboard._instance) {
      Clipboard._instance = this;
    }

    this.data = [];

    return Clipboard._instance;
  }

  set(data) {
    this.data = Utils.clone(data);
  }

  get() {
    return Utils.clone(this.data);
  }

}

module.exports = Clipboard;
