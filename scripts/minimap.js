
class Minimap {
  constructor(board) {
    this.minimap = board.find('.minimap');
    this.miniWindow = board.find('.mini.window');

    const layer = board.find('.layer');
    this.scaleFactor = {
      x: this.minimap.width() / layer.width(),
      y: this.minimap.height() / layer.height()
    };

    this.updateWindow('main');
    this.registerMonitors();
  }

  registerMonitors() {
    // move window position with left click in minimap
    this.minimap.on({
      mousedown: (event) => {
        if (event.button != 0) return;
        this.moveWindow(event.pageX, event.pageY);
        this.minimap.on('mousemove', (event) => {
          this.moveWindow(event.pageX, event.pageY);
        });
      },
      mouseup: (event) => {
        this.minimap.off('mousemove');
      }
    });

    // catch custom events that notify changes
    this.minimap.on({
      'window:update': (event, id) => {
        this.updateWindow(id);
      },
      'node:create': (event, id) => {
        const node = $('#' + id);
        const miniNode = this.minimap.find('#mini-node-template').clone();
        miniNode.attr('id', node[0].id + '-mini');
        miniNode.appendTo(this.minimap[0]);

        this.updateNode(id);
        miniNode.show();
      },
      'node:update': (event, id) => {
        this.updateNode(id);
      },
      'node:delete': (event, id) => {
        this.minimap.find('#' + id + '-mini').remove();
      }
    });
  }

  updateWindow(id) {
    // update window representation in minimap
    const board = $('#' + id);
    this.miniWindow.css({
      left: board[0].scrollLeft * this.scaleFactor.x,
      top: board[0].scrollTop * this.scaleFactor.y,
      width: $(window).width() * this.scaleFactor.x,
      height: $(window).height() * this.scaleFactor.y
    });
  }

  updateNode(id) {
    // update node representation in minimap
    const node = $('#' + id);
    const miniNode = this.minimap.find('#' + id + '-mini');
    miniNode.css({
      left: node[0].offsetLeft * this.scaleFactor.x,
      top: node[0].offsetTop * this.scaleFactor.y,
      width: node[0].offsetWidth * this.scaleFactor.x,
      height: node[0].offsetHeight * this.scaleFactor.y
    });
  }

  moveWindow(pageX, pageY) {
    // mouse offset relative to minimap
    const mouseOffset = {
      x: pageX - this.minimap[0].offsetLeft,
      y: pageY - this.minimap[0].offsetTop
    };
    // limit offset to keep window in minimap
    const mouseLimit = {
      minX: this.miniWindow[0].offsetWidth / 2,
      minY: this.miniWindow[0].offsetHeight / 2,
      maxX: this.minimap[0].offsetWidth - this.miniWindow[0].offsetWidth/2,
      maxY: this.minimap[0].offsetHeight - this.miniWindow[0].offsetHeight/2
    };
    mouseOffset.x = Math.min(Math.max(mouseOffset.x, mouseLimit.minX), mouseLimit.maxX);
    mouseOffset.y = Math.min(Math.max(mouseOffset.y, mouseLimit.minY), mouseLimit.maxY);
    // change window position
    const scrollPos = {
      x: mouseOffset.x / this.scaleFactor.x - $(window).width() / 2,
      y: mouseOffset.y / this.scaleFactor.y - $(window).height() / 2
    };
    $('#main')[0].scrollLeft = scrollPos.x;
    $('#main')[0].scrollTop = scrollPos.y;
    // update window representation in minimap
    this.updateWindow('main');
  }
}

module.exports = Minimap;
