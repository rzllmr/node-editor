
const Proxy = require('./proxy.js');

class Selection {
  constructor(board) {
    this.board = board;
    this.proxy = new Proxy();
    this.selection = new Set();
    this.removeButton = $('#remove.tool');

    this.rect = $('rect#selection');
    this.rectOrigin = {x: 0, y: 0};
    this.rectSelection = new Map();

    this.register();
  }

  register() {
    $(window).on({
      mousedown: (event) => {
        // left click
        if (event.button != 0) return;

        const target = $(event.target).closest('.layer, .node, .sign');
        if (target.length == 0) return;

        if (target[0].tagName == 'svg') {
          if (!event.ctrlKey) this.clearSelection();
          this.rectangleSelect({x: event.offsetX, y: event.offsetY});
        } else {
          if (event.ctrlKey) this.multiSelect(target[0].id);
          else this.singleSelect(target[0].id);
        }
      }
    });
    this.removeButton.click(this.deleteSelection.bind(this));
  }

  singleSelect(id) {
    this.clearSelection();
    const object = this.proxy.resolve(id);
    object.select();
    this.selection.add(object);
    this.updateButton();
  }

  multiSelect(id) {
    const object = this.proxy.resolve(id);
    if (this.selection.has(object)) {
      object.deselect();
      this.selection.delete(object);
    } else {
      object.select();
      this.selection.add(object);
    }
    this.updateButton();
  }

  clearSelection() {
    this.selection.forEach((_, element) => {
      element.deselect();
    });
    this.selection.clear();
    this.updateButton();
  }

  deleteSelection() {
    this.selection.forEach((_, element) => {
      if (element.element[0].className.split(' ')[0] === 'node') {
        this.board.removeNode(element);
      }
      element.destroy();
    });
    this.selection.clear();
    this.updateButton();
  }

  updateButton() {
    if (this.selection.size > 0) {
      this.removeButton.prop('disabled', false);
    } else {
      this.removeButton.prop('disabled', true);
    }
  }

  rectangleSelect(origin) {
    this.rectOrigin = origin;
    this.rect.show();

    // ignore element events during selection
    $('.node, .sign').css('pointer-events', 'none');
    $('.node:not(:first), .sign:not(:first)').each((_, element) => {
      this.rectSelection.set(element.id, $(element).hasClass('.selected'));
    });

    $(window).on({
      mousemove: (event) => {
        if (event.target.tagName == 'HTML') return;

        // draw rectangle
        const difference = {
          x: event.offsetX - this.rectOrigin.x,
          y: event.offsetY - this.rectOrigin.y
        };
        const selectionRect = {
          x: (difference.x < 0) ? event.offsetX : this.rectOrigin.x,
          y: (difference.y < 0) ? event.offsetY : this.rectOrigin.y,
          width: Math.abs(difference.x),
          height: Math.abs(difference.y)
        };
        this.rect.attr(selectionRect);

        // select contained elements
        $('.node:not(:first), .sign:not(:first)').each((_, element) => {
          // check collision
          const elementRect = {
            x: element.offsetLeft,
            y: element.offsetTop,
            width: element.offsetWidth,
            height: element.offsetHeight
          };
          const selected = this.checkCollision(selectionRect, elementRect);

          // update selection
          if (selected != this.rectSelection.get(element.id)) {
            this.rectSelection.set(element.id, selected);
            this.multiSelect(element.id);
          }
        });
      },
      mouseup: (event) => {
        this.rect.hide();
        this.rect.attr({width: 0, height: 0});

        // re-enable element events
        $('.node, .sign').css('pointer-events', '');
        $(window).off('mousemove mouseup');
      }
    });
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
}

module.exports = Selection;
