
/**
 * singleton to store static fields for classes
 */
class Static {
  // constructor restricted to create only one instance
  constructor() {
    const instance = this.constructor.instance;
    if (instance) {
      return instance;
    }
    this.constructor.instance = this;
  }
}

module.exports = Static;
