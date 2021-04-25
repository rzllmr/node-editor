
// extend Static class to hold variable for Proxy
const Static = require('./static.js');
Static.prototype.domJsMap = new Map();

/**
 * base class for representatives of document objects
 */
class Proxy {
  constructor(id) {
    // associate DOM id with JS object
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

  resolve(id) {
    // resolve DOM id to JS object
    return this.mapping.get(id);
  }

  static setDefaults(object, defaults) {
    let requiredsSet = true;
    for (const key of Object.keys(defaults)) {
      if (object[key] == undefined) {
        object[key] = defaults[key];
        if (defaults[key] == undefined) {
          requiredsSet = false;
        }
      }
    }
    return requiredsSet;
  }
}

module.exports = Proxy;
