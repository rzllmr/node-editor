
// extend Static class to hold variable for Proxy
const Static = require('./static.js');
Static.prototype.domJsMap = new Map();

/**
 * base class for representatives of document objects
 */
class Proxy {
  // associate DOM id with JS object
  constructor(id) {
    if (typeof id === 'number') id = id.toString();
    this.mapping = (new Static).domJsMap;
    this.mapping.set(id, this);

    this.id = id;
  }

  destroy() {
    // clear association
    this.mapping.delete(this.id);
    this.id = undefined;
  }

  change(id) {
    this.mapping.delete(this.id);
    this.mapping.set(id, this);
    this.id = id;
  }

  // resolve DOM id to JS object
  resolve(id) {
    return this.mapping.get(id);
  }
}

module.exports = Proxy;
