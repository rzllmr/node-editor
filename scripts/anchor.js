
// allow for Graph objects to be resolved
// from HTML ids of .graph elements
const Proxy = require('./proxy.js');

const Graph = require('./graph.js');
const Link = require('./link.js');

/**
 * .anchor representative to handle links
 */
class Anchor extends Proxy {
  constructor(node, side, drag = false) {
    const id = node.id + side.charAt(0) + node.anchors[side].length;
    super(id);

    this.node = node;
    this.side = side;

    this.element = $('#template-anchor').clone();
    this.element.attr('id', this.id);
    this.element.addClass(side);
    this.element.appendTo(this.node.element);
    node.positionAnchor(this.element, side);
    this.element.show();

    this.links = [];
    this.graph;
    if (drag) this.dragNewLink();
  }

  destroy() {
    this.side = undefined;

    for (const i in this.links) {
      this.removeLink(this.links[i]);
    }
    this.links = undefined;

    this.element.remove();
    this.element = undefined;
    super.destroy();
  }

  // create and connect link
  link(toAnchor) {
    const link = new Link(this, toAnchor);
    this.links.push(link);
    toAnchor.links.push(link);
  }

  // cut and delete link
  cut(link) {
    link.startAnchor.removeLink(link);
    link.endAnchor.removeLink(link);
    link.destroy();
  }

  removeLink(link) {
    const index = this.links.indexOf(link);
    if (index > -1) {
      this.links.splice(index, 1);
    }
    if (this.links.length == 0 && this.graph == undefined) {
      this.node.removeAnchor(this.side, this);
      this.destroy();
    }
  }

  createGraph() {
    const anchorPos = this.locate();
    this.graph = new Graph(this.id + '-', {x: anchorPos.x, y: anchorPos.y});
  }

  removeGraph() {
    this.graph.destroy();
    this.graph = undefined;
    if (this.links.length == 0 && this.graph == undefined) {
      this.node.removeAnchor(this.side, this);
      this.destroy();
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
  dragNewLink() {
    // graph for feedback of drawing connection
    this.createGraph();

    const otherNodes = `.node:not(#${this.node.id})`;

    // drag end point of graph
    $('.layer.nodes').on('mousemove', (event) => {
      this.graph.update(null, {x: event.pageX, y: event.pageY});
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
        this.link(endAnchor);
      },
      mouseleave: (event) => {
        $(event.currentTarget).removeClass('selected');
        this.graph.element.show();

        // remove link
        const tempLink = this.links[this.links.length - 1];
        this.cut(tempLink);
      }
    });

    // check for hit on anchor of another node
    $('.layer.nodes,' + otherNodes).one('mouseup', (event) => {
      $(event.currentTarget).removeClass('selected');

      this.removeGraph();
      // will cause destruction of anchor when no link left

      $(otherNodes).off('mouseenter mouseleave mouseup');
      $('.layer.nodes').off('mousemove mouseup');
    });
  }
};

module.exports = Anchor;
