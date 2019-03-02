
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

  update(start, end, startSide = null, endSide = null) {
    if (start) this.start = start;
    if (end) this.end = end;

    let path;
    if (startSide != null && endSide != null) {
      path = this.bezier(this.start, this.end, startSide, endSide);
    } else {
      path = this.line(this.start, this.end);
    }
    this.element.attr('d', path);
  }

  line(start, end) {
    return `M${start.x},${start.y} L${end.x},${end.y}`;
  }

  bezier(start, end, startSide, endSide) {
    // length the controls stick out of anchor side
    let ctrlLength = {
      x: Math.abs(end.x - start.x) / 2,
      y: Math.abs(end.y - start.y) / 2
    };
    // length allowed to shrink below minimum only at close distance between points
    const min = {x: Math.min(50, ctrlLength.y), y: Math.min(50, ctrlLength.x)};
    ctrlLength = {x: Math.max(ctrlLength.x, min.x), y: Math.max(ctrlLength.y, min.y)};

    const bezierControl = function(point, ctrlLength, side) {
      let control;
      switch (side) {
        case 'top':
          control = {x: point.x, y: point.y - ctrlLength.y};
          break;
        case 'bottom':
          control = {x: point.x, y: point.y + ctrlLength.y};
          break;
        case 'left':
          control = {x: point.x - ctrlLength.x, y: point.y};
          break;
        case 'right':
          control = {x: point.x + ctrlLength.x, y: point.y};
          break;
      }
      return control;
    };

    const ctrl1 = bezierControl(start, ctrlLength, startSide);
    const ctrl2 = bezierControl(end, ctrlLength, endSide);

    return `M${start.x},${start.y} C${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${end.x},${end.y}`;
  }
};

module.exports = Graph;
