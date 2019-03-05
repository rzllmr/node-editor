
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

    this.element = $('#template-node').clone();
    this.element.css({left: position.x, top: position.y, display: 'block'});
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
  }

  destroy() {
    this.position = undefined;
    this.cursorPosRel = undefined;

    for (const side in this.anchors) {
      this.anchors[side].destroy();
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
          this.cursorPosRel.x = event.pageX - this.element[0].offsetLeft;
          this.cursorPosRel.y = event.pageY - this.element[0].offsetTop;

          $(window).on({
            mousemove: (event) => {
              this.element.offset({
                left: event.pageX - this.cursorPosRel.x,
                top: event.pageY - this.cursorPosRel.y
              });
              for (const side in this.anchors) {
                for (const i in this.anchors[side]) {
                  this.anchors[side][i].links.forEach((link) => {
                    link.redraw();
                  });
                }
              }
            },
            mouseup: () => {
              $(window).off('mousemove mouseup');
            }
          });
        } else if (event.button == 2) { // right click
          this.element.one('mouseleave', (event) => {
            const offset = {
              x: event.offsetX + event.target.offsetLeft,
              y: event.offsetY + event.target.offsetTop
            };
            this.addAnchor(offset, true);
          });
        }
      }
    });

    this.makeEditableOnDblClick(this.element.find('.label'), 'readonly', false);
    this.makeEditableOnDblClick(this.element.find('.details'), 'contentEditable', true);
  }

  addAnchor(offset, drag) {
    const limit = {
      x: this.element[0].offsetWidth,
      y: this.element[0].offsetHeight
    };
    const sides = ['left', 'top', 'right', 'bottom'];
    const distances = [offset.x, offset.y, limit.x - offset.x, limit.y - offset.y];
    const side = sides[distances.indexOf(Math.min(...distances))];

    if (this.anchors[side].length == 0) {
      this.anchors[side].push(new Anchor(this, side, drag));
    } else if (drag) {
      this.anchors[side][this.anchors[side].length - 1].dragNewLink();
    }

    return this.anchors[side][this.anchors[side].length - 1];
  }

  removeAnchor(side, anchor) {
    const index = this.anchors[side].indexOf(anchor);
    if (index > -1) {
      this.anchors[side].splice(index, 1);
    }
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
      }
    });
  }

  positionAnchor(anchor, side) {
    switch (side) {
      case 'top':
        anchor[0].style.left = '50%'; break;
      case 'right':
        anchor[0].style.top = '50%'; break;
      case 'bottom':
        anchor[0].style.left = '50%'; break;
      case 'left':
        anchor[0].style.top = '50%'; break;
    }
  }

  select() {
    this.element.addClass('selected');
  }
  deselect() {
    this.element.removeClass('selected');
  }
};

module.exports = Node;
