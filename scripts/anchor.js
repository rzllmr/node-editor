
// allow for Graph objects to be resolved
// from HTML ids of .graph elements
const Proxy = require('./proxy.js');

const Graph = require('./graph.js');
const Link = require('./link.js');

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

    this.link;
    this.graph;
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
  connect(toAnchor, endType) {
    const link = new Link(this, toAnchor);
    this.link = link;
    toAnchor.link = link;
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

  // cut and delete link
  cutLink(link) {
    link.startAnchor.removeLink(link);
    link.endAnchor.removeLink(link);
    link.destroy();
  }

  removeLink(link) {
    this.link = undefined;
    if (!this.link && !this.graph) {
      this.node.removeAnchor(this.side, this);
      this.destroy();
    }
  }

  createGraph() {
    const anchorPos = this.locate();
    this.graph = new Graph(this.id + '-', {x: anchorPos.x, y: anchorPos.y}, false);
  }

  removeGraph() {
    this.graph.destroy();
    this.graph = undefined;
    if (!this.link && !this.graph) {
      this.node.removeAnchor(this.side, this);
      this.destroy();
    }
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
    // graph for feedback of drawing connection
    this.createGraph();

    const thisNode = `#${this.node.id}.node`;
    const otherNodes = `.node:not(#${this.node.id})`;

    $(thisNode).css('pointer-events', 'none');

    // drag end point of graph
    $('.layer.graphs').on('mousemove', (event) => {
      this.graph.update(null, {x: event.offsetX, y: event.offsetY});
    });

    // create and remove links when
    // entering and leaving nodes
    $(otherNodes).on({
      mouseenter: (event) => {
        $(event.currentTarget).addClass('selected');
        this.graph.element.hide();

        // create link
        const offset = {
          x: event.offsetX + event.target.offsetLeft,
          y: event.offsetY + event.target.offsetTop
        };
        const targetNode = this.resolve(event.currentTarget.id);
        const endAnchor = targetNode.addAnchor(offset);
        this.connect(endAnchor, endType);
      },
      mouseleave: (event) => {
        $(event.currentTarget).removeClass('selected');
        this.graph.element.show();

        // remove link
        this.cutLink(this.link);
      }
    });

    // check for hit on anchor of another node
    $('.layer.graphs,' + otherNodes).one('mouseup', (event) => {
      $(event.currentTarget).removeClass('selected');

      this.removeGraph();
      // will cause destruction of anchor when no link left

      if (this.link) {
        this.link.startAnchor.registerDragOut();
        this.link.endAnchor.registerDragOut();
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
      otherAnchor.graph.element.hide();
      this.node.select();

      event.stopPropagation();
    });
  }
};

module.exports = Anchor;
