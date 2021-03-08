
// allow for Graph objects to be resolved
// from HTML ids of .graph elements
const Proxy = require('./proxy.js');

const Graph = require('./graph.js');

/**
 * .anchor representative to handle links
 */
class Anchor extends Proxy {
  constructor(node, end, side, index, drag = false) {
    const id = node.id + side.charAt(0) + index;
    super(id);

    this.node = node;
    this.end = end;
    this.side = side;

    this.element = $('#templates .anchor.' + end).clone();
    this.element.removeClass('template');
    this.element.attr('id', this.id);
    this.element.addClass(side);
    this.element.appendTo(this.node.element);

    this.registerToggle();
    if (drag) {
      this.link = new Graph(this.id + '-', this);
      this.dragNewLink();
    }
  }

  changeIdx(idx) {
    const newId = this.id.match(/\d+\D/)[0] + idx;
    this.change(newId);
    this.element.attr('id', this.id);
  }

  changeEnd(end) {
    if (end === this.end) return;
    this.element.removeClass(this.end).addClass(end);
    this.element.find('i').first()[0].className = end === 'source' ?
      'fa fa-circle' : 'fa fa-caret-' + this.caretSide(this.side);
    this.end = end;
  }

  destroy(clearLink = true) {
    this.node.removeAnchor(this.side, this);

    if (this.link && clearLink) {
      const linkedAnchor = this.link.otherAnchor(this);
      if (linkedAnchor != null) this.cutLink(this.link.otherAnchor(this));
      this.link.destroy();
    }
    this.link = undefined;

    this.element.remove();
    this.element = undefined;
    this.side = undefined;
    this.end = undefined;
    this.node = undefined;
    super.destroy();
  }

  // create and connect link
  connectLink(toAnchor) {
    if (!this.link) this.link = new Graph(this.id + '-', this);
    this.link.connect(toAnchor);
    this.link.updateIds();
    if (toAnchor.link) toAnchor.link.destroy();
    toAnchor.link = this.link;
    if (toAnchor.end == 'target') {
      toAnchor.element.find('i').first()[0].className =
        'fa fa-caret-' + this.caretSide(toAnchor.side);
    }
    this.link.highlight();
  }

  caretSide(side) {
    switch (side) {
      case 'top': return 'down';
      case 'right': return 'left';
      case 'bottom': return 'up';
      case 'left': return 'right';
    }
  }

  cutLink(toAnchor) {
    this.link.highlight(false);
    this.link.disconnect(toAnchor);
    toAnchor.destroy(false);
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
  dragNewLink(end = 'target') {
    const thisNode = `.node#${this.node.id}`;
    const otherNodes = `.node:not(#${this.node.id})`;

    $(thisNode).css('pointer-events', 'none');

    // drag target point of graph
    $(window).on('mousemove', (event) => {
      const offset = {
        x: event.pageX + this.node.board[0].scrollLeft,
        y: event.pageY + this.node.board[0].scrollTop
      };
      this.link.update(this, {
        x: offset.x * this.node.zoom.scale,
        y: offset.y * this.node.zoom.scale
      });
    });

    // create and remove links when entering and leaving nodes
    $(otherNodes).on({
      mouseenter: (event) => {
        const offset = {
          x: event.offsetX * this.node.zoom.scale,
          y: event.offsetY * this.node.zoom.scale
        };
        if (event.target != event.currentTarget) {
          // add offset of sub-element of node
          offset.x += event.target.offsetLeft;
          offset.y += event.target.offsetTop;
        }
        const targetNode = this.resolve(event.currentTarget.id);
        const targetAnchor = targetNode.addAnchor(offset, end);
        this.connectLink(targetAnchor);
      },
      mouseleave: (event) => {
        const otherAnchor = this.link.otherAnchor(this);
        this.cutLink(otherAnchor);
      }
    });

    // delete graph or finish link on mouseup
    $(window).one('mouseup', (event) => {
      $(window).off('mousemove');
      if (this.link.connected) {
        this.link.anchors.source.registerDragOut();
        this.link.anchors.target.registerDragOut();
      } else {
        this.link.destroy();
        this.destroy(false);
      }
      $(thisNode).css('pointer-events', '');
      $(otherNodes).off('mouseenter mouseleave');
    });
  }

  registerDragOut() {
    this.element.on('mousedown', (event) => {
      if (event.button != 2 && !(event.button == 0 && event.altKey) || event.shiftKey) return;
      // right click

      // restore state of link creation while preserving end type
      const otherAnchor = this.link.otherAnchor(this);
      otherAnchor.element.off('mousedown');
      otherAnchor.registerToggle();
      otherAnchor.dragNewLink(this.end);

      event.stopPropagation();
    });
  }

  registerToggle() {
    this.element.on('mousedown', (event) => {
      if (!(event.shiftKey && (event.button == 2 || event.button == 0 && event.altKey))) return;
      const newEnd = this.end == 'target' ? 'source' : 'target';
      this.changeEnd(newEnd);
      event.stopPropagation();
    });
  }
};

module.exports = Anchor;
