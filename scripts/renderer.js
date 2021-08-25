
(function($, window, document) {
  // Listen for the jQuery ready event on the document
  $(function() {
    const FileHandler = require('./scripts/filehandler.js');
    const Options = require('./scripts/options.js');
    const BoardTree = require('./scripts/boardtree.js');
    const KeyBinding = require('./scripts/keybinding.js');

    const boardTree = new BoardTree();
    new FileHandler(boardTree);
    new Options();
    const keybinding = new KeyBinding();

    // disable default drag events
    $(document).on('dragstart', (event) => {
      event.preventDefault();
      return false;
    });
    $(document).keydown(function(event) {
      return keybinding.handleKey(event.key, event.ctrlKey, event.shiftKey, event.altKey, event.metaKey);
    });
  });
}(window.jQuery, window, document));
