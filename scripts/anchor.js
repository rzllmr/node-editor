
// allow for Graph objects to be resolved
// from HTML ids of .graph elements
const Proxy = require('./proxy.js');

const Graph = require('./graph.js');
const Link = require('./link.js');

/**
 * .anchor representative to handle links
 */
class Anchor extends Proxy {
  constructor(id = null, position = {x: 0, y: 0}) {
    super(id);

    this.element = $(this.id);
    this.side = id.split('.').pop();
    this.links = [];

    this.element.on({
      mousedown: this.dragNewLink.bind(this)
    });
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
    if (this.links.length === 1) {
      this.show(true);
    }
  }

  // cut link and update anchor status
  cutLink(link) {
    const index = this.links.indexOf(link);
    if (index > -1) {
      this.links.splice(index, 1);
    }
    if (this.links.length === 0) {
      this.show(false);
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
  dragNewLink(event) {
    // add Graph as link to emulate behaviour of one sided link
    const token = this.side.charAt(0);
    const anchorPos = this.locate();
    const graph = new Graph(this.identifier + token + '-', {x: anchorPos.x, y: anchorPos.y});
    this.addLink(graph);

    // drag end point of graph
    $(window).on('mousemove', {graph: graph}, (event) => {
      const graph = event.data.graph;
      graph.update(null, {x: event.pageX, y: event.pageY});
    });

    // check for hit on anchor of another node
    $(window).on('mouseup', {graph: graph, anchor: this}, (event) => {
      const graph = event.data.graph;
      const startAnchor = event.data.anchor;

      const endAnchor = startAnchor.from(event.target);

      // delete graph to replace with link or nothing if no anchor was hit
      this.cutLink(graph);
      graph.destroy();

      if (endAnchor !== undefined &&
          endAnchor.element.parent()[0] !== startAnchor.element.parent()[0]) {
        // create and connect link
        const link = new Link(startAnchor, endAnchor);
        startAnchor.addLink(link);
        endAnchor.addLink(link);
      }
      $(window).off('mousemove mouseup');
    });

    event.stopPropagation();
  }
};

module.exports = Anchor;
