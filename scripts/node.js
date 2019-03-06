
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
    this.min_size = {x: 180, y: 120};
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
                  this.anchors[side][i].link.redraw();
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

    this.element.find('.resizer').on({
      mousedown: (event) => {
        this.cursorPosRel = {x: event.pageX, y: event.pageY};
        $(window).on({
          mousemove: (event) => {
            const width = this.element.width() + (event.pageX - this.cursorPosRel.x);
            const height = this.element.height() + (event.pageY - this.cursorPosRel.y);
            this.element.css({
              width: Math.max(width, this.min_size.x),
              height: Math.max(height, this.min_size.y)
            });
            this.cursorPosRel = {x: event.pageX, y: event.pageY};
            for (const side in this.anchors) {
              for (const i in this.anchors[side]) {
                this.anchors[side][i].link.redraw();
              }
            }
          },
          mouseup: (event) => {
            $(window).off('mousemove mouseup');
          }
        });
        event.stopPropagation();
      }
    });
  }

  // add anchor at evenly distributed slot closest to mouse position
  addAnchor(offset, drag) {
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
    this.anchors[side].splice(index, 0, new Anchor(this, side, percentage * (index + 1), drag));

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
      this.anchors[side][i].position(side, percentage * (parseInt(offset) + 1));
      this.anchors[side][i].link.redraw();
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
      }
    });
  }

  select() {
    this.element.addClass('selected');
  }
  deselect() {
    this.element.removeClass('selected');
  }
};

module.exports = Node;
