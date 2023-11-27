/* eslint no-extend-native: ["error", { "exceptions": ["Number"] }]*/

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

// namespace Utils
(function( Utils, $, undefined ) {
  Utils.arrayMode = function(array, defaultValue = null) {
    if (array.length == 0) return defaultValue;
    const modeMap = {};
    let mostElement = array[0];
    let mostCount = 1;
    for (const element of array) {
      if (modeMap[element] == null) modeMap[element] = 1;
      else modeMap[element]++;

      if (modeMap[element] > mostCount) {
        mostElement = element;
        mostCount = modeMap[element];
      }
    }
    return mostElement;
  };

  Utils.stringFormat = function(...args) {
    let text = args[0];
    for (let i = 1; i < arguments.length; i++) {
      text = text.replace(new RegExp('\\{' + (i-1).toString() + '\\}', 'g'), args[i]);
    }
    return text;
  };

  Utils.type = function(variable) {
    const typeName = typeof(variable) == 'object' ?
      variable.constructor.name : typeof(variable);
    return typeName.toLowerCase();
  };

  // TODO: to be extended for other types
  Utils.clone = function(variable) {
    let clone = null;
    switch (Utils.type(variable)) {
      case 'array':
        clone = variable.map((obj) => ({...obj}));
        break;
      default:
        clone = variable;
    }
    return clone;
  };
}( window.Utils = window.Utils || {}, jQuery ));

// namespace implementation
// (function( name, $, undefined ) {
//   const privateProperty = undefined;
//   name.publicProperty = undefined;
//   function privateMethod() {}
//   name.publicMethod = function() {};
// }( window.name = window.name || {}, jQuery ));
