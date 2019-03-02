
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

    this.element.find('input,textarea').on({
      click: (event) => {
        console.log('clicked', event.currentTarget);
      },
      dblclick: (event) => {
        console.log('dblclicked', event.currentTarget);
        $(event.target).attr('readonly', false);
        $(event.target).trigger('blur', ['custom']);
        $(event.target).focus();
      },
      blur: (event, param) => {
        console.log('blur', param);
        $(event.target).attr('readonly', true);
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
