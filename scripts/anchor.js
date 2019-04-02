
// allow for Graph objects to be resolved
// from HTML ids of .graph elements
const Proxy = require('./proxy.js');

const Graph = require('./graph.js');

/**
 * .anchor representative to handle links
 */
class Anchor extends Proxy {
  constructor(node, end, side, index, drag = false) {
    const id = node.id + side.charAt(0) + index;
    super(id);

    this.node = node;
    this.end = end;
    this.side = side;

    this.element = $('#template-anchor-' + end).clone();
    this.element.attr('id', this.id);
    this.element.addClass(side);
    this.element.appendTo(this.node.element);
    this.element.show();

    this.link = new Graph(this.id + '-', this);
    if (drag) this.dragNewLink();
  }

  changeIdx(idx) {
    const newId = this.id.match(/\d+\D/)[0] + idx;
    this.change(newId);
    this.element.attr('id', this.id);
  }

  destroy() {
    this.node.removeAnchor(this.side, this);
    this.node = undefined;
    this.side = undefined;

    if (this.link) {
      const linkedAnchor = this.link.otherAnchor(this);
      linkedAnchor.link = undefined;
      linkedAnchor.destroy();
      this.link.destroy();
    }
    this.link = undefined;

    this.element.remove();
    this.element = undefined;
    super.destroy();
  }

  // create and connect link
  connectLink(toAnchor) {
    this.link.connect(toAnchor);
    this.link.updateIdxs();
    toAnchor.link.destroy();
    toAnchor.link = this.link;
    let side;
    switch (toAnchor.side) {
      case 'top': side = 'down'; break;
      case 'right': side = 'left'; break;
      case 'bottom': side = 'up'; break;
      case 'left': side = 'right'; break;
    }
    if (toAnchor.end == 'target') {
      toAnchor.element.find('i').first()[0].className = 'fas fa-caret-' + side;
    }
  }

  cutLink() {
    const otherAnchor = this.link.otherAnchor(this);
    this.link.disconnect(otherAnchor);
    otherAnchor.removeLink();
  }

  removeLink() {
    this.link = undefined;
    this.node.removeAnchor(this.side, this);
    this.destroy();
  }

  position(side, percentage) {
    percentage += '%';
    switch (side) {
      case 'top':
        this.element[0].style.left = percentage; break;
      case 'right':
        this.element[0].style.top = percentage; break;
      case 'bottom':
        this.element[0].style.left = percentage; break;
      case 'left':
        this.element[0].style.top = percentage; break;
    }
  }

  // get coordinates for center of .anchor element
  locate() {
    const centerOffset = {x: 0, y: 0};
    if (this.side === 'right') centerOffset.x = this.element[0].offsetWidth;
    else if (this.side === 'bottom') centerOffset.y = this.element[0].offsetHeight;

    const node = this.element.parent();
    const position = {
      x: node[0].offsetLeft + this.element[0].offsetLeft + centerOffset.x,
      y: node[0].offsetTop + this.element[0].offsetTop + centerOffset.y
    };
    return position;
  }

  // drag Graph to establish new Link
  dragNewLink(end = 'target') {
    const thisNode = `#${this.node.id}.node`;
    const otherNodes = `.node:not(#${this.node.id})`;

    $(thisNode).css('pointer-events', 'none');

    // drag target point of graph
    $('.layer.graphs').on('mousemove', (event) => {
      this.link.update(this, {x: event.offsetX, y: event.offsetY});
    });

    // create and remove links when
    // entering and leaving nodes
    $(otherNodes).on({
      mouseenter: (event) => {
        $(event.currentTarget).removeClass('selected');
        $(event.currentTarget).addClass('target');

        const offset = {
          x: event.offsetX + event.target.offsetLeft,
          y: event.offsetY + event.target.offsetTop
        };
        const targetNode = this.resolve(event.currentTarget.id);
        const targetAnchor = targetNode.addAnchor(offset, end);
        this.connectLink(targetAnchor);
      },
      mouseleave: (event) => {
        $(event.currentTarget).removeClass('target');

        this.cutLink();
      }
    });

    // check for hit on anchor of another node
    $('.layer.graphs,' + otherNodes).one('mouseup', (event) => {
      $(event.currentTarget).removeClass('target');
      if (this.link.connected) {
        this.link.anchors.source.registerDragOut();
        this.link.anchors.target.registerDragOut();
      } else {
        this.link.destroy();
        this.removeLink();
      }
      $(thisNode).css('pointer-events', '');
      $(otherNodes).off('mouseenter mouseleave mouseup');
      $('.layer.graphs').off('mousemove mouseup');
    });
  }

  registerDragOut() {
    this.element.on('mousedown', (event) => {
      if (event.button != 2) return;
      // right click

      // restore state of link creation while preserving end type
      const otherAnchor = this.link.otherAnchor(this);
      otherAnchor.element.off('mousedown');
      otherAnchor.dragNewLink(this.end);

      event.stopPropagation();
    });
  }
};

module.exports = Anchor;
