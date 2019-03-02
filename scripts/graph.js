
// allow for Graph objects to be resolved
// from HTML ids of .graph elements
const Proxy = require('./proxy.js');

/**
 * .graph representative to handle drawing of vector lines
 */
class Graph extends Proxy {
  constructor(id = null, position = {x: 0, y: 0}) {
    super(id);

    this.element = $('#template-graph').clone();
    this.element.attr('id', id);
    this.update({x: position.x, y: position.y}, {x: position.x, y: position.y});
    this.element.appendTo('.layer.graphs');
    this.element.show();
  }

  destroy() {
    this.element.remove();
    this.element = undefined;
    super.destroy();
  }

  update(start, end) {
    if (start) this.start = start;
    if (end) this.end = end;

    const path = this.calculate(this.start.x, this.start.y, this.end.x, this.end.y);
    this.element.attr('d', path);
  }

  calculate(startX, startY, endX, endY) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }
};

module.exports = Graph;
