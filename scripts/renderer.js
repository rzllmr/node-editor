
(function($, window, document) {
  // Listen for the jQuery ready event on the document
  $(function() {
    const FileHandler = require('./scripts/filehandler.js');
    const Options = require('./scripts/options.js');
    const BoardTree = require('./scripts/boardtree.js');

    const boardTree = new BoardTree();
    new FileHandler(boardTree);
    new Options();

    // disable default drag events
    $(document).on('dragstart', (event) => {
      event.preventDefault();
      return false;
    });
  });
}(window.jQuery, window, document));
