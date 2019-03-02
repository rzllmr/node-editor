
(function($, window, document) {
  // The $ is now locally scoped
  let g;

  // Listen for the jQuery ready event on the document
  $(function() {
    g = {
      elem: {
        browserWindow: require('electron').remote.getCurrentWindow(),
        nodes: []
      },
      var: {
        zoomFactor: 100
      }
    };

    const Node = require('./scripts/node.js');

    g.elem.browserWindow.webContents.setZoomFactor(1);
    $(document).on({
      mousewheel: (event) => {
        const scroll = event.originalEvent.wheelDeltaY / 120;
        g.var.zoomFactor = (g.var.zoomFactor + scroll * 10).clamp(10, 200);
        g.elem.browserWindow.webContents.setZoomFactor(g.var.zoomFactor / 100);
      }
    });
    $('.layer.nodes').on({
      dblclick: (event) => {
        if (event.target !== $('.layer.nodes')[0]) return;
        const newNode = new Node(g.elem.nodes.length, {x: event.pageX, y: event.pageY});
        g.elem.nodes.push(newNode);
      }
    });
  });
}(window.jQuery, window, document));
