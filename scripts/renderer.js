
(function($, window, document) {
  // Listen for the jQuery ready event on the document
  $(function() {
    const FileHandler = require('./scripts/filehandler.js');
    const Selection = require('./scripts/selection.js');
    const Options = require('./scripts/options.js');
    const Board = require('./scripts/board.js');

    new FileHandler();
    new Selection();
    new Options();
    new Board('main');
  });
}(window.jQuery, window, document));
