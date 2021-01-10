
const Proxy = require('./proxy.js');
const ColorPicker = require('./colorpicker.js');

/**
 * handle selection for the board element
 */
class Selection {
  constructor(board) {
    this.board = board;
    this.zoom = board.zoom;

    this.proxy = new Proxy();
    this.selection = new Set();
    this.nodeInfo = $('h1#node-info');
    this.nodeTools = $('#node-tools');
    this.removeButton = $('#remove.tool.small');
    this.minimizeButton = $('#minimize.tool.small');
    this.maximizeButton = $('#maximize.tool.small');
    this.colorPicker = new ColorPicker(this.selection);

    this.rect = board.element.find('rect.selection');
    this.rectOrigin = {x: 0, y: 0};
    this.rectSelection = new Map();

    this.drawingRectangle = false;
    this.movingSelection = false;

    this.register();
    this.toggleNodeTools();
  }

  register() {
    this.board.element.on({
      mousedown: (event) => {
        if (event.button != 0 || event.altKey || event.ctrlKey) return;
        // left click alone

        const target = $(event.target).closest('.layer, .node, .sign');
        if (target.length == 0) return;

        if (target[0].tagName == 'svg') {
          if (!event.ctrlKey) this.clearSelection();

          // rectangleSelect
          this.rectOrigin = {
            x: event.offsetX * this.zoom.scale,
            y: event.offsetY * this.zoom.scale
          };
          this.rect.show();

          $('.layer.nodes .node:not(:first), .layer.nodes .sign:not(:first)').each((_, element) => {
            this.rectSelection.set(element.id, $(element).hasClass('.selected'));
          });

          this.drawingRectangle = true;
          $(window).on('mousemove', this.rectangleSelect.bind(this));
        } else if (target.hasClass('node')) {
          this.cursorPosRel = {
            x: event.offsetX * this.zoom.scale + event.target.offsetLeft,
            y: event.offsetY * this.zoom.scale + event.target.offsetTop
          };

          if (target.hasClass('selected')) {
            $(window).on('mousemove', (event) => {
              this.moveSelection(target, {x: event.pageX, y: event.pageY});
            });
          } else {
            $(window).on('mousemove', (event) => {
              this.moveNode(target, {x: event.pageX, y: event.pageY});
            });
          }
        }
      },
      mouseup: (event) => {
        if (event.button != 0 || event.altKey) return;
        // left click

        const target = $(event.target).closest('.layer, .node, .sign');
        if (target.length == 0) return;

        this.colorPicker.updatePresets();

        if (this.drawingRectangle) {
          this.drawingRectangle = false;

          this.rect.hide();
          this.rect.attr({width: 0, height: 0});
        } else if (this.movingSelection) {
          this.movingSelection = false;

          this.board.element.find('.minimap').trigger('node:update', [target[0].id]);
        } else if (target[0].tagName != 'svg') {
          if (event.ctrlKey) this.multiSelect(target[0].id);
          else this.singleSelect(target[0].id);
        }
        $(window).off('mousemove');
      }
    });
    this.removeButton.click(this.deleteSelection.bind(this));
    this.minimizeButton.click(this.minimizeSelection.bind(this, true));
    this.maximizeButton.click(this.minimizeSelection.bind(this, false));

    $(document).on('hotkey:blurInput', (event) => {
      document.activeElement.blur();
    });
    $(document).on('hotkey:deleteSelection', (event) => {
      this.deleteSelection();
    });
  }

  singleSelect(id) {
    this.clearSelection();
    const object = this.proxy.resolve(id);
    object.select();
    this.selection.add(object);
    if (this.selection.size == 1) this.colorPicker.setSlider(object);
    this.toggleNodeTools();
  }

  multiSelect(id) {
    const object = this.proxy.resolve(id);
    if (this.selection.has(object)) {
      object.deselect();
      this.selection.delete(object);
    } else {
      object.select();
      this.selection.add(object);
      if (this.selection.size == 1) this.colorPicker.setSlider(object);
    }
    this.toggleNodeTools();
  }

  clearSelection() {
    this.selection.forEach((_, element) => {
      element.deselect();
    });
    this.selection.clear();
    this.toggleNodeTools();
  }

  deleteSelection() {
    this.selection.forEach((_, item) => {
      if (item.element[0].className.split(' ')[0] === 'node') {
        this.board.removeNode(item);
      }
      item.destroy();
    });
    this.selection.clear();
    this.toggleNodeTools();
  }

  minimizeSelection(toggle) {
    this.selection.forEach((_, item) => {
      if (item.element[0].className.split(' ')[0] === 'node') {
        item.minimize(toggle);
      }
    });
  }

  toggleNodeTools() {
    if (this.selection.size > 0) {
      this.nodeTools.removeClass('collapsed');
    } else {
      this.nodeTools.addClass('collapsed');
    }
  }

  rectangleSelect(event) {
    this.drawingRectangle = true;

    const offset = {
      x: event.pageX + this.board.element[0].scrollLeft,
      y: event.pageY + this.board.element[0].scrollTop
    };

    // draw rectangle
    const difference = {
      x: offset.x * this.zoom.scale - this.rectOrigin.x,
      y: offset.y * this.zoom.scale - this.rectOrigin.y
    };
    const selectionRect = {
      x: (difference.x < 0) ? offset.x * this.zoom.scale : this.rectOrigin.x,
      y: (difference.y < 0) ? offset.y * this.zoom.scale : this.rectOrigin.y,
      width: Math.abs(difference.x),
      height: Math.abs(difference.y)
    };
    this.rect.attr(selectionRect);

    // select contained elements
    this.board.element.find('.node, .sign').each((_, element) => {
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
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  moveNode(target, newPos) {
    this.movingSelection = true;

    const node = this.proxy.resolve(target[0].id);
    node.move({
      left: (newPos.x * this.zoom.scale - this.cursorPosRel.x),
      top: (newPos.y * this.zoom.scale - this.cursorPosRel.y)
    });
  }

  moveSelection(target, newPos) {
    this.movingSelection = true;

    const relOffset = {
      left: (newPos.x * this.zoom.scale - this.cursorPosRel.x) - target.offset().left,
      top: (newPos.y * this.zoom.scale - this.cursorPosRel.y) - target.offset().top
    };

    this.selection.forEach((_, node) => {
      if (node.constructor.name != 'Node') return;
      node.move({
        left: node.element.offset().left + relOffset.left,
        top: node.element.offset().top + relOffset.top
      });
    });
  }
}

module.exports = Selection;
