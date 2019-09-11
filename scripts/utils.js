/* eslint no-extend-native: ["error", { "exceptions": ["Number"] }]*/

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};
