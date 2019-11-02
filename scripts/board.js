
// allow for Board objects to be resolved
// from HTML ids of .board elements
const Proxy = require('./proxy.js');

const Node = require('./node.js');
const Selection = require('./selection.js');
const Minimap = require('./minimap.js');
const Zoom = require('./zoom.js');

/**
 * .board representative to handle nodes
 */
class Board extends Proxy {
  constructor(id = null) {
    super(id);

    this.element = $('.board.template').clone();
    this.element.attr('id', this.id);
    this.element.removeClass('template');
    this.element.find('.template').remove();
    this.element.appendTo('body');

    this.nodes = new Map();

    this.register();

    this.scrollPos = {
      x: this.element.find('.layer').width() / 2 - $(window).width() / 2,
      y: this.element.find('.layer').height() / 2 - $(window).height() / 2
    };
    this.element[0].scrollLeft = this.scrollPos.x;
    this.element[0].scrollTop = this.scrollPos.y;

    this.zoom = new Zoom(this.element.find('.layer'), 100, 10);

    this.selection = new Selection(this);
    this.minimap = new Minimap(this);

    this.element.trigger('resize');
  }

  destroy() {
    this.clear();
    this.element.remove();
  }

  clear() {
    this.nodes.forEach((node) => {
      this.nodes.delete(Number(node.id));
      node.destroy();
    });
  }

  register() {
    this.element.on({
      mousewheel: (event) => {
        const scaleBefore = this.zoom.scale;

        this.zoom.change(Math.sign(event.originalEvent.wheelDeltaY));

        // adjust window scrolling to zoom to mouse position
        const scrollShift = {
          x: (this.element[0].scrollLeft + event.pageX)
            * (scaleBefore - this.zoom.scale) / this.zoom.scale,
          y: (this.element[0].scrollTop + event.pageY)
            * (scaleBefore - this.zoom.scale) / this.zoom.scale
        };
        this.element[0].scrollLeft += scrollShift.x;
        this.element[0].scrollTop += scrollShift.y;

        this.minimap.element.trigger('window:update');
      },
      mousedown: (event) => {
        if (event.button != 1) return;
        // middle click

        this.scrollPos = {x: event.clientX, y: event.clientY};
        event.target.style.cursor = 'grabbing';

        this.element.on('mousemove', (event) => {
          this.element[0].scrollLeft += this.scrollPos.x - event.clientX;
          this.element[0].scrollTop += this.scrollPos.y - event.clientY;
          this.scrollPos = {x: event.clientX, y: event.clientY};

          this.minimap.element.trigger('window:update');
        });
        this.element.one('mouseup', (event) => {
          event.target.style.cursor = 'default';
          this.element.off('mousemove');
        });
        event.preventDefault();
        event.stopPropagation();
      },
      resize: (event) => {
        this.zoom.check();
        this.minimap.element.trigger('window:update');
      }
    });
    this.element.find('.layer.graphs').on({
      dblclick: (event) => {
        if (event.target !== this.element.find('.layer.graphs')[0]) return;
        const newNode = this.addNode();
        newNode.move({
          left: event.offsetX * this.zoom.scale,
          top: event.offsetY * this.zoom.scale
        }, false);
      }
    });
  }

  addNode(id = null, hue = null) {
    id = id == null ? null : Number(id);
    if (!id) id = ++Board.nodeIdxMax;
    else if (id > Board.nodeIdxMax) Board.nodeIdxMax = id;

    const currentHue = this.selection.colorPicker.currentHue;
    this.selection.colorPicker.addNode(id, hue === null ? currentHue : hue);
    this.nodes.set(id, new Node(id, this.element, this.zoom, currentHue));
    return this.nodes.get(id);
  }
  removeNode(node) {
    this.selection.colorPicker.removeNode(node.id);
    this.nodes.delete(Number(node.id));
  }
}
Board.nodeIdxMax = -1;

module.exports = Board;
