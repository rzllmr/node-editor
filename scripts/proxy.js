
// extend Static class to hold variable for Proxy
const Static = require('./static.js');
Static.prototype.domJsMap = new Map();

/**
 * base class for representatives
 * of document objects
 */
class Proxy {
  // associate DOM id with JS object
  constructor(id) {
    this.mapping = (new Static).domJsMap;
    this.mapping.set(id, this);
  }

  // resolve DOM id to JS object
  resolve(id) {
    return this.mapping.get(id);
  }
}

module.exports = Proxy;
