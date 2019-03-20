
(function($, window, document) {
  // The $ is now locally scoped
  let g;

  // Listen for the jQuery ready event on the document
  $(function() {
    const Node = require('./scripts/node.js');
    const Selection = require('./scripts/selection.js');
    g = {
      elem: {
        browserWindow: require('electron').remote.getCurrentWindow(),
        nodes: []
      },
      var: {
        zoomFactor: 100,
        scrollPos: {x: 0, y: 0},
        selection: new Selection()
      }
    };

    $('#desk')[0].scrollLeft = $('.layer').width() / 2;
    $('#desk')[0].scrollTop = $('.layer').height() / 2;

    g.elem.browserWindow.webContents.setZoomFactor(1);
    $(document).on({
      mousewheel: (event) => {
        const scroll = event.originalEvent.wheelDeltaY / 120;
        g.var.zoomFactor = (g.var.zoomFactor + scroll * 10).clamp(10, 200);
        g.elem.browserWindow.webContents.setZoomFactor(g.var.zoomFactor / 100);
      },
      mousedown: (event) => {
        if (event.button != 1) return;
        g.var.scrollPos = {x: event.clientX, y: event.clientY};
        const originalTarget = event.target;
        originalTarget.style.cursor = 'grabbing';

        $(window).on({
          mousemove: (event) => {
            $('#desk')[0].scrollLeft += g.var.scrollPos.x - event.clientX;
            $('#desk')[0].scrollTop += g.var.scrollPos.y - event.clientY;
            g.var.scrollPos = {x: event.clientX, y: event.clientY};
          },
          mouseup: (event) => {
            originalTarget.style.cursor = 'default';
            $(window).off('mousemove mouseup');
          }
        });
        event.preventDefault();
        event.stopPropagation();
      }
    });
    $('.layer.graphs').on({
      dblclick: (event) => {
        if (event.target !== $('.layer.graphs')[0]) return;
        const newNode = new Node(g.elem.nodes.length, {x: event.offsetX, y: event.offsetY});
        g.elem.nodes.push(newNode);
      }
    });
  });
}(window.jQuery, window, document));
