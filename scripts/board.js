
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

    this.element = $('#' + this.id);
    this.nodes = [];

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

    $(window).trigger('resize');
  }

  register() {
    $(window).on({
      mousewheel: (event) => {
        const scaleBefore = this.zoom.scale;

        const scroll = event.originalEvent.wheelDeltaY / 120;
        this.zoom.change(scroll);

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
        this.scrollPos = {x: event.clientX, y: event.clientY};
        const originalTarget = event.target;
        originalTarget.style.cursor = 'grabbing';

        $(window).on({
          mousemove: (event) => {
            this.element[0].scrollLeft += this.scrollPos.x - event.clientX;
            this.element[0].scrollTop += this.scrollPos.y - event.clientY;
            this.scrollPos = {x: event.clientX, y: event.clientY};

            $('.minimap').trigger('window:update', [this.id]);
          },
          mouseup: (event) => {
            originalTarget.style.cursor = 'default';
            $(window).off('mousemove mouseup');
          }
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
        this.addNode({x: event.offsetX * this.zoom.scale, y: event.offsetY * this.zoom.scale});
      }
    });
  }

  addNode(offset = {x: 0, y: 0}) {
    const newNode = new Node(this.nodes.length, this.zoom, offset);
    this.nodes.push(newNode);
    return this.nodes[this.nodes.length - 1];
  }
  removeNode(node) {
    this.nodes = this.nodes.filter((value) => {
      return value != node;
    });
  }
}

module.exports = Board;
