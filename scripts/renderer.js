
(function($, window, document) {
  // Listen for the jQuery ready event on the document
  $(function() {
    const FileHandler = require('./scripts/filehandler.js');
    const Selection = require('./scripts/selection.js');
    const Options = require('./scripts/options.js');
    const Board = require('./scripts/board.js');

    new FileHandler();
    new Options();

    const mainBoard = new Board('main');
    new Selection(mainBoard);
  });
}(window.jQuery, window, document));
