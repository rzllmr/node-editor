
/**
 * .minimap representative to visualize board layout and view window
 */
class Minimap {
  constructor(board) {
    this.board = board.element;
    this.element = board.element.find('.minimap');
    this.miniWindow = board.element.find('.mini.window');

    this.zoom = board.zoom;
    this.zoomInfo = this.element.find('.zoominfo');

    const layer = board.element.find('.layer');
    this.scaleFactor = {
      x: this.element.width() / layer.width(),
      y: this.element.height() / layer.height()
    };

    this.updateWindow(board.id);
    this.registerMonitors();
  }

  registerMonitors() {
    // move window position with left click in minimap
    this.element.on({
      'mousedown': (event) => {
        if (event.button != 0) return;
        this.moveWindow(event.pageX, event.pageY);
        this.element.on('mousemove', (event) => {
          this.moveWindow(event.pageX, event.pageY);
        });
      },
      'mouseup mouseleave': (event) => {
        this.element.off('mousemove');
      }
    });

    // catch custom events that notify changes
    this.element.on({
      'window:update': (event) => {
        this.updateWindow();
      },
      'node:create': (event, id) => {
        const node = $('#' + id);
        const miniNode = $('#templates .mini-node').clone();
        miniNode.removeClass('template');
        miniNode.attr('id', node[0].id + '-mini');
        miniNode.appendTo(this.element[0]);

        this.updateNode(id);
      },
      'node:update': (event, id) => {
        this.updateNode(id);
      },
      'node:delete': (event, id) => {
        this.element.find('#' + id + '-mini').remove();
      },
      'node:highlight': (event, id) => {
        const nodeClass = $('#' + id)[0].className.split(' ');
        if (nodeClass.length > 1) {
          this.element.find('#' + id + '-mini')[0].className = 'mini mini-node ' + nodeClass.pop();
        } else {
          this.element.find('#' + id + '-mini')[0].className = 'mini mini-node';
        }
      }
    });
  }

  updateWindow() {
    // update window representation in minimap
    this.zoomInfo.text(this.zoom.percent + '%');
    const layer = this.board.find('.layer');
    this.scaleFactor = {
      x: this.element.width() / layer.width() / this.zoom.factor,
      y: this.element.height() / layer.height() / this.zoom.factor
    };
    this.miniWindow.css({
      left: this.board[0].scrollLeft * this.scaleFactor.x,
      top: this.board[0].scrollTop * this.scaleFactor.y,
      width: $(window).width() * this.scaleFactor.x,
      height: $(window).height() * this.scaleFactor.y
    });
  }

  updateNode(id) {
    // update node representation in minimap
    const node = $('#' + id);
    const miniNode = this.element.find('#' + id + '-mini');
    miniNode.css({
      left: node[0].offsetLeft / this.zoom.scale * this.scaleFactor.x,
      top: node[0].offsetTop / this.zoom.scale * this.scaleFactor.y,
      width: node[0].offsetWidth / this.zoom.scale * this.scaleFactor.x,
      height: node[0].offsetHeight / this.zoom.scale * this.scaleFactor.y
    });
  }

  moveWindow(pageX, pageY) {
    // mouse offset relative to minimap
    const mouseOffset = {
      x: pageX - this.element[0].offsetLeft,
      y: pageY - this.element[0].offsetTop
    };
    // limit offset to keep window in minimap
    const mouseLimit = {
      minX: this.miniWindow[0].offsetWidth / 2,
      minY: this.miniWindow[0].offsetHeight / 2,
      maxX: this.element[0].offsetWidth - this.miniWindow[0].offsetWidth/2,
      maxY: this.element[0].offsetHeight - this.miniWindow[0].offsetHeight/2
    };
    mouseOffset.x = Math.min(Math.max(mouseOffset.x, mouseLimit.minX), mouseLimit.maxX);
    mouseOffset.y = Math.min(Math.max(mouseOffset.y, mouseLimit.minY), mouseLimit.maxY);
    // change window position
    const scrollPos = {
      x: mouseOffset.x / this.scaleFactor.x - $(window).width() / 2,
      y: mouseOffset.y / this.scaleFactor.y - $(window).height() / 2
    };
    this.board[0].scrollLeft = scrollPos.x;
    this.board[0].scrollTop = scrollPos.y;
    // update window representation in minimap
    this.updateWindow();
  }
}

module.exports = Minimap;
