
// allow for Node objects to be resolved
// from HTML ids of .node elements
const Proxy = require('./proxy.js');

const Anchor = require('./anchor.js');

/**
 * .node representative to handle content
 */
class Node extends Proxy {
  constructor(id = null, position = {x: 0, y: 0}) {
    super(id);

    this.minSize = {x: 180, y: 120};

    this.element = $('#template-node').clone();
    this.element.css({
      left: position.x - this.minSize.x / 2,
      top: position.y - this.minSize.y / 2,
      display: ''
    });
    if (id == null) {
      this.element.removeAttr('id');
    } else {
      this.element.attr('id', this.id);
    }
    this.element.appendTo('.layer.nodes');
    this.registerElement();

    this.position = position;
    this.cursorPosRel = {x: 0, y: 0};

    this.anchors = {
      top: [],
      right: [],
      bottom: [],
      left: []
    };

    $('.minimap').trigger('node:create', [this.id]);
  }

  destroy() {
    $('.minimap').trigger('node:delete', [this.id]);

    this.position = undefined;
    this.cursorPosRel = undefined;

    for (const side in this.anchors) {
      // copy anchors[side] array to remove elements while iterating
      for (const anchor of this.anchors[side].slice()) {
        anchor.destroy();
      }
    }
    this.anchors = undefined;

    this.element.remove();
    this.element = undefined;
    super.destroy();
  }

  registerElement() {
    this.element.on({
      mousedown: (event) => {
        if (event.button == 0) { // left click
          this.cursorPosRel.x = event.offsetX + event.target.offsetLeft;
          this.cursorPosRel.y = event.offsetY + event.target.offsetTop;

          $(window).on({
            mousemove: (event) => {
              this.element.offset({
                left: event.pageX - this.cursorPosRel.x,
                top: event.pageY - this.cursorPosRel.y
              });
              for (const side in this.anchors) {
                for (const i in this.anchors[side]) {
                  this.anchors[side][i].link.update();
                }
              }
            },
            mouseup: () => {
              $(window).off('mousemove mouseup');
              $('.minimap').trigger('node:update', [this.id]);
            }
          });
        } else if (event.button == 2) { // right click
          this.element.one('mouseleave', (event) => {
            const offset = {
              x: event.offsetX + event.target.offsetLeft,
              y: event.offsetY + event.target.offsetTop
            };
            this.addAnchor(offset, 'source', true);
          });
        }
      }
    });

    this.makeEditableOnDblClick(this.element.find('.label'), 'readonly', false);
    this.makeEditableOnDblClick(this.element.find('.details'), 'contentEditable', true);

    this.element.find('.resizer').on({
      mousedown: (event) => {
        this.cursorPosRel = {x: event.pageX, y: event.pageY};
        $(window).on({
          mousemove: (event) => {
            const width = this.element.width() + (event.pageX - this.cursorPosRel.x);
            const height = this.element.height() + (event.pageY - this.cursorPosRel.y);
            this.element.css({
              width: Math.max(width, this.minSize.x),
              height: Math.max(height, this.minSize.y)
            });
            this.cursorPosRel = {x: event.pageX, y: event.pageY};
            for (const side in this.anchors) {
              for (const i in this.anchors[side]) {
                this.anchors[side][i].link.update();
              }
            }
          },
          mouseup: (event) => {
            $(window).off('mousemove mouseup');
            $('.minimap').trigger('node:update', [this.id]);
          }
        });
        event.stopPropagation();
      }
    });
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
    index = Math.min(index, this.anchors[side].length);
    // distribute present anchors to slots besides insertion index
    const percentage = this.relocateAnchors(side, this.anchors[side].length + 1, index);
    // insert anchor at index and corresponding slot
    this.anchors[side].splice(index, 0,
        new Anchor(this, end, side, index, false));
    this.anchors[side][index].position(side, percentage * (index + 1));

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
      this.anchors[side][i].link.updateIdxs();
      this.anchors[side][i].link.update();
      offset++;
    }
    return percentage;
  }

  makeEditableOnDblClick(element, property, editable) {
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
      },
      blur: (event, param) => {
        $(event.target).prop(property, !editable);
      },
      keydown: (event) => {
        // prevent Enter to create new div
        if (event.keyCode === 13) {
          document.execCommand('insertHTML', false, '<br><br>');
          return false;
        }
      }
    });
  }

  select() {
    this.element.addClass('selected');
  }
  deselect() {
    this.element.removeClass('selected');
  }
  get selected() {
    return this.element[0].className.endsWith('selected');
  }

  export() {
    const element = this.element[0];
    const object = {
      type: element.className.split(' ')[0],
      posX: element.offsetLeft,
      posY: element.offsetTop,
      width: element.offsetWidth,
      height: element.offsetHeight,
      label: element.querySelector('input.label').value,
      details: element.querySelector('div.details').innerText
    };
    return object;
  }

  static import(object) {
    const board = this.proxy.resolve('main');
    const element = board.addNode().element;

    element.css({
      left: object.posX,
      top: object.posY,
      width: object.width,
      height: object.height
    });
    element.find('input.label').val(object.label);
    element.find('div.details').text(object.details);
    $('.minimap').trigger('node:update', [element[0].id]);
  }
};

Node.proxy = new Proxy();

module.exports = Node;
