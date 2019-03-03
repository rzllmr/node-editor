
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
      top: new Anchor(`#${id} .anchor.top`),
      right: new Anchor(`#${id} .anchor.right`),
      bottom: new Anchor(`#${id} .anchor.bottom`),
      left: new Anchor(`#${id} .anchor.left`)
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
        this.cursorPosRel.x = event.offsetX;
        this.cursorPosRel.y = event.offsetY;

        $(window).on({
          mousemove: (event) => {
            this.element.offset({
              left: event.pageX - this.cursorPosRel.x,
              top: event.pageY - this.cursorPosRel.y
            });
            for (const side in this.anchors) {
              this.anchors[side].links.forEach((link) => {
                link.redraw();
              });
            }
          },
          mouseup: () => {
            $(window).off('mousemove mouseup');
          }
        });
      }
    });

    this.makeEditableOnDblClick(this.element.find('.label'), 'readonly', false);
    this.makeEditableOnDblClick(this.element.find('.details'), 'contentEditable', true);
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
