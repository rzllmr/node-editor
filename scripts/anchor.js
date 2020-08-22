
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
    this.element.removeClass(this.end);
    this.element.addClass(end);
    this.end = end;
    if (this.end === 'source') {
      this.element.find('i').first()[0].className = 'fa fa-circle';
    } else {
      this.element.find('i').first()[0].className = 'fa fa-caret-' + this.caretSide(this.side);
    }
  }

  destroy() {
    this.node.removeAnchor(this.side, this);
    this.node = undefined;
    this.side = undefined;

    if (this.link) {
      const linkedAnchor = this.link.otherAnchor(this);
      linkedAnchor.link = undefined;
      linkedAnchor.destroy();
      this.link.destroy();
    }
    this.link = undefined;

    this.element.remove();
    this.element = undefined;
    super.destroy();
  }

  // create and connect link
  connectLink(toAnchor) {
    if (!this.link) this.link = new Graph(this.id + '-', this);
    this.link.connect(toAnchor);
    this.link.updateIdxs();
    if (toAnchor.link) toAnchor.link.destroy();
    toAnchor.link = this.link;
    if (toAnchor.end == 'target') {
      toAnchor.element.find('i').first()[0].className =
        'fa fa-caret-' + this.caretSide(toAnchor.side);
    }
  }

  caretSide(side) {
    switch (side) {
      case 'top': return 'down';
      case 'right': return 'left';
      case 'bottom': return 'up';
      case 'left': return 'right';
    }
  }

  cutLink() {
    const otherAnchor = this.link.otherAnchor(this);
    this.link.disconnect(otherAnchor);
    otherAnchor.removeLink();
  }

  removeLink() {
    this.link = undefined;
    this.node.removeAnchor(this.side, this);
    this.destroy();
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
    const thisNode = `#${this.node.id}.node`;
    const otherNodes = `.node:not(#${this.node.id})`;

    $(thisNode).css('pointer-events', 'none');

    // drag target point of graph
    this.node.board.find('.layer.graphs').on('mousemove', (event) => {
      this.link.update(this, {
        x: event.offsetX * this.node.zoom.scale,
        y: event.offsetY * this.node.zoom.scale
      });
    });

    // create and remove links when
    // entering and leaving nodes
    $(otherNodes).on({
      mouseenter: (event) => {
        $(event.currentTarget).removeClass('selected');
        $(event.currentTarget).addClass('target');

        const offset = {
          x: event.offsetX * this.node.zoom.scale,
          y: event.offsetY * this.node.zoom.scale
        };
        if (event.target != event.currentTarget) {
          offset.x += event.target.offsetLeft;
          offset.y += event.target.offsetTop;
        }
        const targetNode = this.resolve(event.currentTarget.id);
        const targetAnchor = targetNode.addAnchor(offset, end);
        this.connectLink(targetAnchor);
      },
      mouseleave: (event) => {
        $(event.currentTarget).removeClass('target');

        this.cutLink();
      }
    });

    // check for hit on anchor of another node
    this.node.board.find('.layer.graphs,' + otherNodes).one('mouseup', (event) => {
      this.node.board.find('.layer.graphs').off('mousemove mouseup');
      $(event.currentTarget).removeClass('target');
      if (this.link.connected) {
        this.link.anchors.source.registerDragOut();
        this.link.anchors.target.registerDragOut();
      } else {
        this.link.destroy();
        this.removeLink();
      }
      $(thisNode).css('pointer-events', '');
      $(otherNodes).off('mouseenter mouseleave mouseup');
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
