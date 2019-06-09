
// allow for Board objects to be resolved
// from HTML ids of .board elements
const Proxy = require('./proxy.js');

const Node = require('./node.js');
const Selection = require('./selection.js');
const Minimap = require('./minimap.js');
const Zoom = require('./zoom.js');
const ColorPicker = require('./color-picker.js');

/**
 * .board representative to handle nodes
 */
class Board extends Proxy {
  constructor(id = null) {
    super(id);

    this.element = $('#' + this.id);
    this.nodes = new Map();
    this.nodeIdxMax = -1;

    this.register();

    this.scrollPos = {
      x: $('.layer').width() / 2 - $(window).width() / 2,
      y: $('.layer').height() / 2 - $(window).height() / 2
    };
    this.element[0].scrollLeft = this.scrollPos.x;
    this.element[0].scrollTop = this.scrollPos.y;

    this.zoom = new Zoom(this.element.find('.layer'), 100, 10);

    this.selection = new Selection(this);
    this.minimap = new Minimap(this);
    $('.minimap').trigger('window:update', [this.id]);

    this.colorPicker = new ColorPicker(this);

    $(window).trigger('resize');
  }

  clear() {
    this.nodes.forEach((node) => {
      this.colorPicker.removeNode(node.id);
      this.nodes.delete(Number(node.id));
      node.destroy();
    });
    this.nodeIdxMax = -1;
  }

  register() {
    $(window).on({
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

        $('.minimap').trigger('window:update', [this.id]);
      },
      mousedown: (event) => {
        if (event.button != 1) return;
        // middle click

        this.scrollPos = {x: event.clientX, y: event.clientY};
        event.target.style.cursor = 'grabbing';

        $(window).on('mousemove', (event) => {
          this.element[0].scrollLeft += this.scrollPos.x - event.clientX;
          this.element[0].scrollTop += this.scrollPos.y - event.clientY;
          this.scrollPos = {x: event.clientX, y: event.clientY};

          $('.minimap').trigger('window:update', [this.id]);
        });
        $(window).one('mouseup', (event) => {
          event.target.style.cursor = 'default';
          $(window).off('mousemove');
        });
        event.preventDefault();
        event.stopPropagation();
      },
      resize: (event) => {
        this.zoom.check();
        $('.minimap').trigger('window:update', [this.id]);
      }
    });
    $('.layer.graphs').on({
      dblclick: (event) => {
        if (event.target !== $('.layer.graphs')[0]) return;
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
    if (!id) id = ++this.nodeIdxMax;
    else if (id > this.nodeIdxMax) this.nodeIdxMax = id;

    if (hue == null) this.colorPicker.addNode(id);
    else this.colorPicker.addNode(id, hue);
    this.nodes.set(id, new Node(id, this.zoom, this.colorPicker));
    return this.nodes.get(id);
  }
  removeNode(node) {
    this.colorPicker.removeNode(node.id);
    this.nodes.delete(Number(node.id));
  }
}

module.exports = Board;
