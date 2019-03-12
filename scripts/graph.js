
// allow for Graph objects to be resolved
// from HTML ids of .graph elements
const Proxy = require('./proxy.js');

/**
 * .graph representative to handle drawing of vector lines
 */
class Graph extends Proxy {
  constructor(id = null, position = {x: 0, y: 0}, createHoverArea = true) {
    super(id);

    this.element = $('#template-graph').clone();
    this.element.attr('id', id);
    this.element.appendTo('.layer.graphs');
    this.element.show();

    if (createHoverArea) {
      this.addHoverArea();
    }

    this.update({x: position.x, y: position.y}, {x: position.x, y: position.y});
  }

  destroy() {
    this.element.remove();
    this.element = undefined;
    if (this.hoverArea != undefined) {
      this.hoverArea.remove();
      this.hoverArea = undefined;
    }
    if (this.sign != undefined) {
      this.sign.remove();
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

  addSign() {
    this.sign = $('#template-sign').clone();
    this.sign.attr('id', this.id + '_sign');
    this.sign.appendTo('.layer.nodes');
    this.sign.show();

    const middle = this.bezierMiddle(this.start, this.ctrl1, this.ctrl2, this.end);
    this.sign.css({left: middle.x, top: middle.y});

    this.makeEditableOnDblClick(this.sign.find('.details'), 'contentEditable', true);
    this.sign.find('.details').dblclick();
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
    if (this.hoverArea != undefined) {
      this.hoverArea.attr('d', path);
    }
    if (this.sign != undefined) {
      const middle = this.bezierMiddle(this.start, this.ctrl1, this.ctrl2, this.end);
      this.sign.css({left: middle.x, top: middle.y});
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
    // const t = 0.5;
    // return {
    //   x: cubicBezier(start.x, ctrl1.x, ctrl2.x, end.x, t),
    //   y: cubicBezier(start.y, ctrl1.y, ctrl2.y, end.y, t)
    // };
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

  makeEditableOnDblClick(element, property, editable) {
    element.on({
      mousedown: (event) => {
        let propertyValue = $(event.target).prop(property);
        if (typeof propertyValue == 'string') propertyValue = propertyValue === 'true';
        if (propertyValue === editable) {
          event.stopPropagation();
        } else {
          event.preventDefault();
        }
      },
      dblclick: (event) => {
        $(event.target).prop(property, editable);
        $(event.target).focus();
      },
      blur: (event, param) => {
        $(event.target).prop(property, !editable);
      },
      keydown: (event) => {
        // prevent Enter to create new div
        if (event.keyCode === 13) {
          document.execCommand('insertHTML', false, '<br><br>');
          return false;
        }
      }
    });
  }
};

module.exports = Graph;
