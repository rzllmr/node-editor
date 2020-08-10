
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
    $(document).keypress(function(event) {
      if (event.key.length === 1) {
        keybinding.handleKey(event.key, event.ctrlKey, event.shiftKey);
      }
    });
    $(document).keydown(function(event) {
      if (event.key.length > 1) {
        keybinding.handleKey(event.key, event.ctrlKey, event.shiftKey);
      }
    });
  });
}(window.jQuery, window, document));
