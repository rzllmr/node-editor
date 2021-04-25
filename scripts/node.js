
// allow for Node objects to be resolved
// from HTML ids of .node elements
const Proxy = require('./proxy.js');

const Anchor = require('./anchor.js');
const DivEdit = require('./divedit.js');

/**
 * .node representative to handle content
 */
class Node extends Proxy {
  constructor(id = null, board, zoom, hue) {
    super(id);

    this.board = board;
    this.minimap = board.find('.minimap');
    this.zoom = zoom;
    this.minSize = {x: 80, y: 70};

    this.element = $('#templates .node').clone();
    this.element.removeClass('template');
    if (id !== null) {
      this.element.attr('id', this.id);
    }
    this.element.appendTo(board.find('.layer.nodes'));
    this.resizer = this.element.find('.resizer');
    this.registerElement();

    this.color = hue;
    this.minimize(false);

    this.anchors = {
      top: [],
      right: [],
      bottom: [],
      left: []
    };

    this.minimap.trigger('node:create', [this.id]);
  }

  destroy() {
    for (const side in this.anchors) {
      // copy anchors[side] array to remove elements while iterating
      for (const anchor of this.anchors[side].slice()) {
        anchor.destroy();
      }
    }
    this.anchors = undefined;

    this.minimap.trigger('node:delete', [this.id]);

    this.element.remove();
    this.element = undefined;
    super.destroy();
  }

  registerElement() {
    this.element.on({
      mousedown: (event) => {
        if (!(event.button == 2 || event.button == 0 && event.altKey)) return;
        // right click OR left click + alt

        this.element.one('mouseleave', (event) => {
          const offset = {
            x: event.offsetX * this.zoom.scale + event.target.offsetLeft,
            y: event.offsetY * this.zoom.scale + event.target.offsetTop
          };
          this.addAnchor(offset, 'source', true);
        });
        this.element.one('mouseup', (event) => {
          this.element.off('mouseleave');
        });
      }
    });

    this.makeEditableOnDblClick(this.element.find('.label'), 'contentEditable', true, false);
    this.makeEditableOnDblClick(this.element.find('.details'), 'contentEditable', true, true);

    this.element.css('width', this.element[0].offsetWidth);
    this.element.css('height', this.element[0].offsetHeight);
  }

  // add anchor at evenly distributed slot closest to mouse position
  addAnchor(offset, end, drag) {
    const limit = {x: this.element[0].offsetWidth, y: this.element[0].offsetHeight};

    // calculate side closest to mouse position
    const sides = ['left', 'top', 'right', 'bottom'];
    const distances = [offset.x, offset.y, limit.x - offset.x, limit.y - offset.y];
    const side = sides[distances.indexOf(Math.min(...distances))];

    // calculate insertion index based on mouse position
    const partPrct = 1 / (this.anchors[side].length + 1);
    const offsetPrct = ['top', 'bottom'].includes(side) ? offset.x / limit.x : offset.y / limit.y;
    const index = Math.floor(offsetPrct / partPrct);

    // distribute present anchors to slots besides insertion index
    const percentage = this.relocateAnchors(side, this.anchors[side].length + 1, index);
    // insert anchor at index and corresponding slot
    this.anchors[side].splice(index, 0,
        new Anchor(this, end, side, index, drag));
    this.anchors[side][index].position(side, percentage * (index + 1));

    return this.anchors[side][index];
  }

  addAnchorDirectly(end, side, index) {
    // add placeholder anchors up to index
    for (let i = this.anchors[side].length; i <= index; i++) {
      // distribute present anchors to slots besides insertion index
      const percentage = this.relocateAnchors(side, this.anchors[side].length + 1, i);
      this.anchors[side].push(new Anchor(this, 'source', side, i, false));
      this.anchors[side][i].position(side, percentage * (i + 1));
    }
    // adjust placeholder anchor
    this.anchors[side][index].changeEnd(end);
    return this.anchors[side][index];
  }

  // remove anchor and redistribute remaining
  removeAnchor(side, anchor) {
    const index = this.anchors[side].indexOf(anchor);
    if (index > -1) {
      this.anchors[side].splice(index, 1);
    }

    // distribute anchors to remaining slots
    this.relocateAnchors(side, this.anchors[side].length);
  }

  // distribute registered anchors to available slots
  relocateAnchors(side, slots, skip = -1) {
    const percentage = Math.floor(100 / (slots + 1));
    let offset = 0;
    for (const i in this.anchors[side]) {
      if (i == skip) offset++;
      this.anchors[side][i].changeIdx(offset);
      this.anchors[side][i].position(side, percentage * (parseInt(offset) + 1));
      if (this.anchors[side][i].link) {
        this.anchors[side][i].link.updateIds();
        this.anchors[side][i].link.update();
      }
      offset++;
    }
    return percentage;
  }

  makeEditableOnDblClick(element, property, editable, multiline) {
    // works for input element with 'readonly' and false
    const updateAnchors = this.updateAnchors.bind(this);
    element.on({
      mousedown: (event) => {
        let propertyValue = $(event.target).prop(property);
        if (typeof propertyValue == 'string') propertyValue = propertyValue === 'true';
        if (propertyValue === editable) {
          event.stopPropagation();
        } else {
          event.preventDefault();
        }
      },
      dblclick: (event) => {
        $(event.target).prop(property, editable);
        $(event.target).focus();
        if (!multiline) {
          this.element.css({
            'width': 'auto',
            'min-width': this.element[0].clientWidth
          });
          event.target.addEventListener('DOMCharacterDataModified', updateAnchors);
          this.updateAnchors();
        }
      },
      blur: (event, param) => {
        const borderWidth = parseInt(this.element.css('border-width')) * 2;
        $(event.target).prop(property, !editable);
        if (!multiline) {
          this.element.css({
            'width': Math.ceil(this.element[0].getBoundingClientRect().width - borderWidth),
            'min-width': ''
          });
          event.target.removeEventListener('DOMCharacterDataModified', updateAnchors);
        }
      }
    });
    const onEmClick = (emNode) => {
      $('#board-tree').trigger('treeview:createFromLink', [emNode]);
    };
    new DivEdit(element[0], multiline).registerKeys(onEmClick);
  }

  select() {
    this.element.removeClass('in out same').addClass('selected');
    for (const side in this.anchors) {
      for (const i in this.anchors[side]) {
        this.anchors[side][i].link.highlight();
      }
    }
    this.minimap.trigger('node:highlight', [this.id]);
  }
  deselect() {
    this.element.removeClass('selected');
    for (const side in this.anchors) {
      for (const i in this.anchors[side]) {
        this.anchors[side][i].link.highlight();
      }
    }
    this.minimap.trigger('node:highlight', [this.id]);
  }
  get selected() {
    return this.element.hasClass('selected');
  }

  move(offsetX, offsetY, useOffset = true) {
    if (useOffset) {
      this.element.offset({left: offsetX, top: offsetY});
    } else {
      this.element.css({
        left: offsetX - this.element[0].offsetWidth / 2,
        top: offsetY - this.element[0].offsetHeight / 2
      });
    }
    this.updateAnchors();
  }

  resize(width, height) {
    this.element.css('width', Math.max(width, this.minSize.x));
    if (!this.minimized) {
      this.element.css('height', Math.max(height, this.minSize.y));
    }
    this.updateAnchors();
  }

  minimize(toggle) {
    if (toggle) {
      this.resizer.addClass('resize-width');
      this.resizer.find('i')[0].className = 'fa fa-align-justify';
      this.element.addClass('minimized');
    } else {
      this.resizer.removeClass('resize-width');
      this.resizer.find('i')[0].className = 'fa fa-wifi';
      this.element.removeClass('minimized');
    }
    this.updateAnchors();
    this.minimized = toggle;
  }

  updateAnchors() {
    for (const side in this.anchors) {
      for (const i in this.anchors[side]) {
        this.anchors[side][i].link.update();
      }
    }
    this.minimap.trigger('node:update', [this.id]);
  }

  set color(hue) {
    this.hue = hue;
    this.element.find('.divider')[0].style.setProperty('--hue', this.hue);
  }

  get color() {
    return this.hue;
  }

  updateHighlight() {
    if (this.selected) return;
    const highlightedAnchors = this.element.find('.anchor.in, .anchor.out, .anchor.same');
    const directions = highlightedAnchors.toArray().map((anchor) => {
      return anchor.className.split(' ').pop();
    });
    const majorDirection = Utils.arrayMode(directions, '');
    this.element.removeClass('in out same').addClass(majorDirection);
    this.minimap.trigger('node:highlight', [this.id]);
  }

  export() {
    const element = this.element[0];
    const object = {
      board: this.board[0].id,
      type: element.className.split(' ')[0],
      id: element.id,
      posX: element.style.left,
      posY: element.style.top,
      width: element.style.width,
      height: element.style.height,
      hue: element.querySelector('.divider').style.getPropertyValue('--hue'),
      minimized: this.minimized,
      label: element.querySelector('div.label').innerHTML.replace(/<br>/g, '\n'),
      details: element.querySelector('div.details').innerHTML.replace(/<br>/g, '\n')
    };
    return object;
  }

  static import(object, boardId) {
    if (!Proxy.setDefaults(object, {
      id: null, hue: null, posX: null, posY: null, width: null, height: null,
      label: '', details: '', minimized: false
    })) return;
    const proxy = new Proxy();

    const board = proxy.resolve(boardId);
    if (board == undefined) return;

    const node = board.addNode(object.id, object.hue);
    node.element.css({
      left: object.posX,
      top: object.posY,
      width: object.width,
      height: object.height
    });
    node.element.find('.divider')[0].style.setProperty('--hue', object.hue);
    node.element.find('div.label').html(object.label.replace(/\n/g, '<br>'));
    node.element.find('div.details').html(object.details.replace(/\n/g, '<br>'));
    node.element.find('div.label em, div.details em').on('click', (event) => {
      $('#board-tree').trigger('treeview:createFromLink', [event.target]);
    });
    node.minimize(object.minimized);
    node.minimap.trigger('node:update', [node.element[0].id]);
  }
};

module.exports = Node;
