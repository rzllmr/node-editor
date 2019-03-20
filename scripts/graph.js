
// allow for Graph objects to be resolved
// from HTML ids of .graph elements
const Proxy = require('./proxy.js');

const Connection = require('./connection.js');
const Sign = require('./sign.js');

/**
 * .graph representative to handle drawing of vector lines
 */
class Graph extends Proxy {
  constructor(id = null, anchor) {
    super(id);

    this.element = $('#template-graph').clone();
    this.element.attr('id', id);
    this.element.appendTo('.layer.graphs');
    this.element.show();

    this.anchors = new Connection(anchor);

    this.update(this.anchors.start, this.anchors.start.locate());
  }

  destroy() {
    this.anchors = undefined;

    this.element.remove();
    this.element = undefined;
    if (this.hoverArea != undefined) {
      this.hoverArea.remove();
      this.hoverArea = undefined;
    }
    if (this.sign != undefined) {
      this.sign.destroy();
      this.sign = undefined;
    }
    super.destroy();
  }

  addHoverArea() {
    this.hoverArea = $('#template-graph-area').clone();
    this.hoverArea.attr('id', this.id + '_hover');
    this.hoverArea.appendTo('.layer.graphs');
    this.hoverArea.show();

    this.hoverArea.on({
      mouseenter: () => {
        this.element.addClass('selected');
      },
      mouseleave: () => {
        this.element.removeClass('selected');
      },
      dblclick: () => {
        if (this.sign == undefined) {
          this.addSign();
        }
      }
    });
  }

  removeHoverArea() {
    this.hoverArea.remove();
    this.hoverArea = undefined;
  }

  addSign() {
    const middle = this.bezierMiddle(this.start, this.ctrl1, this.ctrl2, this.end);
    this.sign = new Sign(this, middle);
    this.sign.focus();
  }

  connect(anchor) {
    this.anchors.add(anchor);
    if (this.connected) {
      this.change(this.anchors.start.id + '-' + this.anchors.end.id);
      this.element.attr('id', this.id);
      this.addHoverArea();
      this.update();
    }
  }

  disconnect(anchor) {
    this.anchors.remove(anchor);
    if (!this.connected) {
      this.removeHoverArea();
    }
  }

  get connected() {
    return this.anchors.count == 2;
  }

  otherAnchor(anchor) {
    return this.anchors.other(anchor);
  }

  update(startAnchor = null, end = null) {
    if (this.anchors.start) this.start = this.anchors.start.locate();
    if (this.anchors.end) this.end = this.anchors.end.locate();
    if (!this.connected) {
      const otherSlot = this.anchors.otherSlot(startAnchor);
      this[otherSlot] = end;
    }

    let path;
    if (this.connected) {
      const startSide = this.anchors.start.side;
      const endSide = this.anchors.end.side;
      path = this.bezier(this.start, this.end, startSide, endSide);
    } else {
      path = this.line(this.start, this.end);
    }
    this.element.attr('d', path);

    if (this.hoverArea != undefined) {
      this.hoverArea.attr('d', path);
    }

    if (this.sign != undefined) {
      let middle;
      if (this.connected) {
        middle = this.bezierMiddle(this.start, this.ctrl1, this.ctrl2, this.end);
      } else {
        middle = this.lineMiddle(this.start, this.end);
      }
      this.sign.position(middle);
    }
  }

  lineMiddle(start, end) {
    return {
      x: this.start.x + (this.end.x - this.start.x) / 2,
      y: this.start.y + (this.end.y - this.start.y) / 2
    };
  }

  bezierMiddle(start, ctrl1, ctrl2, end) {
    // const cubicBezier = function(p0, p1, p2, p3, t) {
    //   return Math.pow(1-t, 3)*p0 + 3*Math.pow(1-t, 2)*t*p1 +
    //       3*(1-t)*Math.pow(t, 2)*p2 + Math.pow(t, 3)*p3;
    // };
    // const Vector = require('./vector.js');
    // const startV = new Vector(start.x, start.y);
    // const ctrl1V = new Vector(ctrl1.x, ctrl1.y);
    // const ctrl2V = new Vector(ctrl2.x, ctrl2.y);
    // const endV = new Vector(end.x, end.y);
    // const ctrl1Dot = Math.sign(ctrl1V.subtract(startV).dot(endV.subtract(startV)));
    // const ctrl2Dot = Math.sign(ctrl2V.subtract(endV).dot(startV.subtract(endV)));
    // const part = 0.5 + 0.25 * (ctrl2Dot - ctrl1Dot);
    // const t = 0.25 + part / 2;
    // return {
    //   x: cubicBezier(start.x, ctrl1.x, ctrl2.x, end.x, t),
    //   y: cubicBezier(start.y, ctrl1.y, ctrl2.y, end.y, t)
    // };

    // reduced term for t = 0.5
    return {
      x: 0.125*(start.x + 3*ctrl1.x + 3*ctrl2.x + end.x),
      y: 0.125*(start.y + 3*ctrl1.y + 3*ctrl2.y + end.y)
    };
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

    this.ctrl1 = ctrl1;
    this.ctrl2 = ctrl2;

    return `M${start.x},${start.y} C${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${end.x},${end.y}`;
  }
};

module.exports = Graph;
