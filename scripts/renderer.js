
(function($, window, document) {
  // Listen for the jQuery ready event on the document
  $(function() {
    const FileHandler = require('./scripts/filehandler.js');
    const Options = require('./scripts/options.js');
    const TreeView = require('./scripts/treeview.js');
    const Board = require('./scripts/board.js');

    new FileHandler();
    new Options();
    new TreeView('#board-tree');
    new Board('main');

    // disable default drag events
    $(document).on('dragstart', (event) => {
      event.preventDefault();
      return false;
    });
  });
}(window.jQuery, window, document));
