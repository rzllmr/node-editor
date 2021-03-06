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
}( window.Utils = window.Utils || {}, jQuery ));

// namespace implementation
// (function( name, $, undefined ) {
//   const privateProperty = undefined;
//   name.publicProperty = undefined;
//   function privateMethod() {}
//   name.publicMethod = function() {};
// }( window.name = window.name || {}, jQuery ));
