
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

    this.anchors = new Connection(anchor);

    this.element = $('#templates .graph').clone();
    this.element.removeClass('template');
    this.element.attr('id', id);
    this.element.appendTo(`#${this.boardId} .layer.graphs`);

    this.update(this.anchors.source, this.anchors.source.locate());
  }

  get boardId() {
    return this.anchors.source.node.board[0].id;
  }

  updateIds() {
    const newId = this.anchors.source.id + '-' + this.anchors.target.id;
    this.change(newId);
    this.element.attr('id', this.id);
    this.hoverArea.attr('id', this.id + '_hover');
    if (this.sign != undefined) this.sign.updateId();
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
    this.hoverArea = $('#templates .graph-area').clone();
    this.hoverArea.removeClass('template');
    this.hoverArea.attr('id', this.id + '_hover');
    this.hoverArea.insertBefore(this.element);

    $([this.element[0], this.hoverArea[0]]).on({
      dblclick: () => {
        if (this.sign == undefined) {
          this.addSign();
          this.sign.focus();
        }
      }
    });
  }

  removeHoverArea() {
    this.hoverArea.remove();
    this.hoverArea = undefined;
  }

  addSign() {
    const middle = this.bezierMiddle(this.source, this.ctrl1, this.ctrl2, this.target);
    this.sign = new Sign(this, middle);
    return this.sign;
  }

  connect(anchor) {
    this.anchors.add(anchor);
    if (this.connected) {
      this.change(this.anchors.source.id + '-' + this.anchors.target.id);
      this.element.attr('id', this.id);
      this.addHoverArea();
      this.update();
    }
  }

  disconnect(anchor) {
    this.anchors.remove(anchor);
    if (!this.connected) {
      const sourceId = this.anchors.source ? this.anchors.source.id : '';
      const targetId = this.anchors.target ? this.anchors.target.id : '';
      this.change(sourceId + '-' + targetId);
      this.element.attr('id', this.id);
      this.removeHoverArea();
    }
  }

  get connected() {
    return this.anchors.count == 2;
  }

  otherAnchor(anchor) {
    return this.anchors.other(anchor);
  }

  update(sourceAnchor = null, target = null) {
    if (this.anchors.source) this.source = this.anchors.source.locate();
    if (this.anchors.target) this.target = this.anchors.target.locate();
    if (!this.connected) {
      const otherSlot = this.anchors.otherSlot(sourceAnchor);
      this[otherSlot] = target;
    }

    let path;
    if (this.connected) {
      const sourceSide = this.anchors.source.side;
      const targetSide = this.anchors.target.side;
      path = this.bezier(this.source, this.target, sourceSide, targetSide);
    } else {
      path = this.line(this.source, this.target);
    }
    this.element.attr('d', path);

    if (this.hoverArea != undefined) {
      this.hoverArea.attr('d', path);
    }

    if (this.sign != undefined) {
      let middle;
      if (this.connected) {
        middle = this.bezierMiddle(this.source, this.ctrl1, this.ctrl2, this.target);
      } else {
        middle = this.lineMiddle(this.source, this.target);
      }
      this.sign.position(middle);
    }
  }

  lineMiddle(source, target) {
    return {
      x: source.x + (target.x - source.x) / 2,
      y: source.y + (target.y - source.y) / 2
    };
  }

  bezierMiddle(source, ctrl1, ctrl2, target) {
    // const cubicBezier = function(p0, p1, p2, p3, t) {
    //   return Math.pow(1-t, 3)*p0 + 3*Math.pow(1-t, 2)*t*p1 +
    //       3*(1-t)*Math.pow(t, 2)*p2 + Math.pow(t, 3)*p3;
    // };
    // const Vector = require('./vector.js');
    // const sourceV = new Vector(source.x, source.y);
    // const ctrl1V = new Vector(ctrl1.x, ctrl1.y);
    // const ctrl2V = new Vector(ctrl2.x, ctrl2.y);
    // const targetV = new Vector(target.x, target.y);
    // const ctrl1Dot = Math.sign(ctrl1V.subtract(sourceV).dot(targetV.subtract(sourceV)));
    // const ctrl2Dot = Math.sign(ctrl2V.subtract(targetV).dot(sourceV.subtract(targetV)));
    // const part = 0.5 + 0.25 * (ctrl2Dot - ctrl1Dot);
    // const t = 0.25 + part / 2;
    // return {
    //   x: cubicBezier(source.x, ctrl1.x, ctrl2.x, target.x, t),
    //   y: cubicBezier(source.y, ctrl1.y, ctrl2.y, target.y, t)
    // };

    // reduced term for t = 0.5
    return {
      x: 0.125*(source.x + 3*ctrl1.x + 3*ctrl2.x + target.x),
      y: 0.125*(source.y + 3*ctrl1.y + 3*ctrl2.y + target.y)
    };
  }

  line(source, target) {
    return `M${source.x},${source.y} L${target.x},${target.y}`;
  }

  bezier(source, target, sourceSide, targetSide) {
    // length the controls stick out of anchor side
    let ctrlLength = {
      x: Math.abs(target.x - source.x) / 2,
      y: Math.abs(target.y - source.y) / 2
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

    const ctrl1 = bezierControl(source, ctrlLength, sourceSide);
    const ctrl2 = bezierControl(target, ctrlLength, targetSide);

    this.ctrl1 = ctrl1;
    this.ctrl2 = ctrl2;

    return `M${source.x},${source.y} \
C${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${target.x},${target.y}`;
  }

  highlight(linked = true) {
    let direction;
    const first = this.anchors.source;
    const second = this.anchors.target;
    if (first.node.selected == second.node.selected) {
      direction = first.node.selected ? 'selected' : '';
    } else {
      const selected = first.node.selected ? first : second;
      direction = first.end == second.end ? ' same' :
                  selected.end == 'target' ? 'in' : 'out';
    }

    const highlights = 'in out same selected';
    this.element.removeClass(highlights);
    first.element.removeClass(highlights);
    second.element.removeClass(highlights);
    if (linked) {
      this.element.addClass(direction);
      first.element.addClass(direction);
      second.element.addClass(direction);
    }
    first.node.updateHighlight();
    second.node.updateHighlight();
  }

  static parseId(id) {
    const pattern = /(\d+)([trbl])(\d+)\.([st])/;
    const match = id.match(pattern);
    const idParts = {
      nodeId: match[1],
      anchorSide: match[2],
      anchorId: match[3],
      endType: match[4]
    };
    return idParts;
  }

  static createId(parsedId) {
    return Utils.stringFormat('{0}{1}{2}.{3}',
        parsedId.nodeId, parsedId.anchorSide, parsedId.anchorId, parsedId.endType
    );
  }

  export() {
    const element = this.element[0];
    const source = this.anchors.source;
    const target = this.anchors.target;
    const properties = {
      board: this.boardId,
      type: element.className.baseVal.split(' ')[0],
      source: source.id + '.' + source.end.charAt(0),
      target: target.id + '.' + target.end.charAt(0)
    };
    return properties;
  }

  static import(properties) {
    if (!Proxy.setDefaults(properties, {source: undefined, target: undefined})) return;
    const proxy = new Proxy();

    const sides = {'t': 'top', 'r': 'right', 'b': 'bottom', 'l': 'left'};

    // create source anchor
    const sourceMatch = properties.source.match(/(\d+)(\w)(\d+)\.(\w)/);
    const source = {id: sourceMatch[1], side: sides[sourceMatch[2]], index: sourceMatch[3],
      end: sourceMatch[4] == 's' ? 'source' : 'target'};
    const sourceNode = proxy.resolve(source.id);
    if (sourceNode == undefined) return;
    const sourceAnchor = sourceNode.addAnchorDirectly(source.end, source.side, source.index);
    sourceAnchor.registerDragOut();

    // create target anchor
    const targetMatch = properties.target.match(/(\d+)(\w)(\d+)\.(\w)/);
    const target = {id: targetMatch[1], side: sides[targetMatch[2]], index: targetMatch[3],
      end: targetMatch[4] == 's' ? 'source' : 'target'};
    const targetNode = proxy.resolve(target.id);
    if (targetNode == undefined) return;
    const targetAnchor = targetNode.addAnchorDirectly(target.end, target.side, target.index);
    targetAnchor.registerDragOut();

    // connect source to target anchor
    sourceAnchor.connectLink(targetAnchor);
  }
};

module.exports = Graph;
