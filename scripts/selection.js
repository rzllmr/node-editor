
const Proxy = require('./proxy.js');

class Selection {
  constructor() {
    this.proxy = new Proxy();
    this.selection = new Set();
    this.removeButton = $('#remove.tool');

    this.register();
  }

  register() {
    $(window).on({
      mousedown: (event) => {
        // catch left click
        if (event.button != 0) return;
        const multiSelect = event.ctrlKey;

        const target = $(event.target).closest('.layer, .node, .sign');
        if (target.length == 0) return;
        if (target[0].tagName == 'svg') {
          if (!multiSelect) this.clearSelection();
          // rectangle selection
        } else {
          const object = this.proxy.resolve(target[0].id);

          if (!multiSelect) {
            this.clearSelection();
            object.select();
            this.selection.add(object);
          } else {
            if (this.selection.has(object)) {
              object.deselect();
              this.selection.delete(object);
            } else {
              object.select();
              this.selection.add(object);
            }
          }
        }

        if (this.selection.size > 0) {
          this.removeButton.prop('disabled', false);
        } else {
          this.removeButton.prop('disabled', true);
        }
      }
    });

    this.removeButton.click(this.deleteSelection.bind(this));
  }

  clearSelection() {
    this.selection.forEach((_, element) => {
      element.deselect();
    });
    this.selection.clear();
  }

  deleteSelection() {
    this.selection.forEach((_, element) => {
      element.destroy();
    });
    this.selection.clear();
  }
}

module.exports = Selection;
