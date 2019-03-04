
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

  // highlight .anchor element
  show(bool) {
    if (bool) this.element.addClass('linked');
    else this.element.removeClass('linked');
  }

  // add link and update anchor status
  addLink(link) {
    this.links.push(link);
  }

  // cut link and update anchor status
  cutLink(link) {
    const index = this.links.indexOf(link);
    if (index > -1) {
      this.links.splice(index, 1);
    }
  }

  // remove link on both ends
  removeLink(link) {
    link.startAnchor.cutLink(link);
    link.endAnchor.cutLink(link);
    link.destroy();
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

  // short identifier for link id
  get identifier() {
    const parts = this.id.split(' ');
    const identifier = parts[0].slice(1) + parts[1].split('.').pop().charAt(0);
    return identifier;
  }

  // get Anchor object for DOM element
  from(anchor) {
    const nodeId = anchor.parentNode.id;
    const anchorClass = anchor.className.replace(' ', '.');
    return this.resolve(`#${nodeId} .${anchorClass}`);
  }

  // drag Graph to establish new Link
  dragNewLink() {
    // add Graph as link to emulate behaviour of one sided link
    const anchorPos = this.locate();
    this.graph = new Graph(this.id + '-', {x: anchorPos.x, y: anchorPos.y});

    const otherNodes = `.node:not(#${this.node.id})`;

    // drag end point of graph
    $('.layer.nodes').on('mousemove', (event) => {
      this.graph.update(null, {x: event.pageX, y: event.pageY});
    });

    $(otherNodes).on({
      mouseenter: (event) => {
        $(event.currentTarget).addClass('selected');
        this.graph.element.hide();

        // create and connect link
        const offset = {
          x: event.offsetX + event.target.offsetLeft,
          y: event.offsetY + event.target.offsetTop
        };
        const targetNode = this.resolve(event.currentTarget.id);
        const endAnchor = targetNode.addAnchor(offset);

        const link = new Link(this, endAnchor);
        this.addLink(link);
        endAnchor.addLink(link);
      },
      mouseleave: (event) => {
        $(event.currentTarget).removeClass('selected');
        this.graph.element.show();

        const tempLink = this.links[this.links.length - 1];
        const endAnchor = tempLink.endAnchor;
        endAnchor.removeLink(tempLink);
        if (endAnchor.links.length == 0) {
          endAnchor.node.removeAnchor(endAnchor.side, endAnchor);
          endAnchor.destroy();
        }
      }
    });

    // check for hit on anchor of another node
    $('.layer.nodes,' + otherNodes).one('mouseup', (event) => {
      $(event.currentTarget).removeClass('selected');

      this.graph.destroy();
      this.graph = undefined;

      if (this.links.length === 0) {
        this.node.removeAnchor(this.side, this);
        this.destroy();
      }
      $(otherNodes).off('mouseenter mouseleave mouseup');
      $('.layer.nodes').off('mousemove mouseup');
    });

    // event.stopPropagation();
  }
};

module.exports = Anchor;
