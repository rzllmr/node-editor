
const Graph = require('./graph.js');

/**
 * graph extension to monitor connected Anchors
 */
class Link extends Graph {
  constructor(startAnchor, endAnchor) {
    const id = `#${startAnchor.id}-${endAnchor.id}`;
    super(id);

    this.startAnchor = startAnchor;
    this.endAnchor = endAnchor;

    this.redraw();
  }

  destroy() {
    this.startAnchor = undefined;
    this.endAnchor = undefined;
    super.destroy();
  }

  redraw() {
    this.update(this.startAnchor.locate(), this.endAnchor.locate(),
        this.startAnchor.side, this.endAnchor.side);
  }
};

module.exports = Link;
