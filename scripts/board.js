
// allow for Board objects to be resolved
// from HTML ids of .board elements
const Proxy = require('./proxy.js');

const Node = require('./node.js');
const Minimap = require('./minimap.js');

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

    this.minimap = new Minimap(this.element);
    $('.minimap').trigger('window:update', [this.id]);

    this.zoomFactor = 100;
    this.browserWindow = require('electron').remote.getCurrentWindow();
    this.browserWindow.webContents.setZoomFactor(this.zoomFactor / 100);
  }

  register() {
    $(window).on({
      mousewheel: (event) => {
        const scroll = event.originalEvent.wheelDeltaY / 120;
        this.zoomFactor = (this.zoomFactor + scroll * 10).clamp(10, 200);
        this.browserWindow.webContents.setZoomFactor(this.zoomFactor / 100);
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
        $('.minimap').trigger('window:update', [this.id]);
      }
    });
    $('.layer.graphs').on({
      dblclick: (event) => {
        if (event.target !== $('.layer.graphs')[0]) return;
        this.addNode({x: event.offsetX, y: event.offsetY});
      }
    });
  }

  addNode(offset = {x: 0, y: 0}) {
    const newNode = new Node(this.nodes.length, offset);
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
