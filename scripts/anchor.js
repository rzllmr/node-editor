
// allow for Graph objects to be resolved
// from HTML ids of .graph elements
const Proxy = require('./proxy.js');

const Graph = require('./graph.js');

/**
 * .anchor representative to handle links
 */
class Anchor extends Proxy {
  constructor(node, side, percentage, drag = false) {
    const id = node.id + side.charAt(0) + node.anchors[side].length;
    super(id);

    this.node = node;
    this.side = side;
    this.endType = 'circle';

    this.element = $('#template-anchor').clone();
    this.element.attr('id', this.id);
    this.element.addClass(side);
    this.element.appendTo(this.node.element);
    this.position(side, percentage);
    this.element.show();

    this.link = new Graph(this.id + '-', this);
    if (drag) this.dragNewLink();
  }

  destroy() {
    this.side = undefined;
    this.link = undefined;

    this.element.remove();
    this.element = undefined;
    super.destroy();
  }

  // create and connect link
  connectLink(toAnchor, endType) {
    this.link.connect(toAnchor);
    toAnchor.link = this.link;
    let side;
    switch (toAnchor.side) {
      case 'top': side = 'down'; break;
      case 'right': side = 'left'; break;
      case 'bottom': side = 'up'; break;
      case 'left': side = 'right'; break;
    }
    if (endType == 'arrow') {
      toAnchor.element.find('i').first()[0].className = 'fas fa-angle-' + side;
      toAnchor.element.css('font-size', '20px');
      toAnchor.endType = 'arrow';
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
  dragNewLink(endType = 'arrow') {
    const thisNode = `#${this.node.id}.node`;
    const otherNodes = `.node:not(#${this.node.id})`;

    $(thisNode).css('pointer-events', 'none');

    // drag end point of graph
    $('.layer.graphs').on('mousemove', (event) => {
      this.link.update(this, {x: event.offsetX, y: event.offsetY});
    });

    // create and remove links when
    // entering and leaving nodes
    $(otherNodes).on({
      mouseenter: (event) => {
        $(event.currentTarget).addClass('selected');

        const offset = {
          x: event.offsetX + event.target.offsetLeft,
          y: event.offsetY + event.target.offsetTop
        };
        const targetNode = this.resolve(event.currentTarget.id);
        const endAnchor = targetNode.addAnchor(offset);
        this.connectLink(endAnchor, endType);
      },
      mouseleave: (event) => {
        $(event.currentTarget).removeClass('selected');

        this.cutLink();
      }
    });

    // check for hit on anchor of another node
    $('.layer.graphs,' + otherNodes).one('mouseup', (event) => {
      $(event.currentTarget).removeClass('selected');
      if (this.link.connected) {
        this.link.anchors.start.registerDragOut();
        this.link.anchors.end.registerDragOut();
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

      // restore state of link creation while preserving endType
      const otherAnchor = this.link.otherAnchor(this);
      otherAnchor.element.off('mousedown');
      otherAnchor.dragNewLink(this.endType);
      this.node.select();

      event.stopPropagation();
    });
  }
};

module.exports = Anchor;
