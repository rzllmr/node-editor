
// allow for Node objects to be resolved
// from HTML ids of .node elements
const Proxy = require('./proxy.js');

/**
 * management of .node elements
 */
class Node extends Proxy {
  constructor(id = null, position = {x: 0, y: 0}) {
    if (typeof id === 'number') id = id.toString();
    super(id);
    this.id = id;
    this.position = position;

    this.element = $('#template-node').clone();
    this.element.css({left: position.x, top: position.y, display: 'block'});
    if (id == null) {
      this.element.removeAttr('id');
    } else {
      this.element.attr('id', this.id);
    }
    this.element.appendTo('.layer.nodes');
    this.registerElement();

    this.cursorPosRel = {x: 0, y: 0};

    this.links = {
      top: [],
      right: [],
      bottom: [],
      left: []
    };
  }

  registerElement() {
    this.element.on({
      mousedown: (event) => {
        this.cursorPosRel.x = event.offsetX;
        this.cursorPosRel.y = event.offsetY;

        $(window).on({
          mousemove: (event) => {
            this.element.offset({
              left: event.pageX - this.cursorPosRel.x,
              top: event.pageY - this.cursorPosRel.y
            });
            for (const side in this.links) {
              if ({}.hasOwnProperty.call(this.links, side)) {
                this.links[side].forEach((graph) => {
                  const splitAt = (index) => (x) => [x.slice(0, index), x.slice(index)];
                  let oldPath = graph.attr('d');
                  oldPath = splitAt(oldPath.indexOf('L'))(oldPath);
                  const anchor = $(`#${this.id} .anchor.${side}`)[0];
                  const newPos = this.anchorPos(anchor);
                  if (graph[0].id.indexOf(this.id + side.charAt(0)) === 0) {
                    graph.attr('d', `M ${newPos.x} ${newPos.y} ` + oldPath[1]);
                  } else {
                    graph.attr('d', oldPath[0] + `L ${newPos.x} ${newPos.y}`);
                  }
                });
              }
            }
          },
          mouseup: () => {
            $(window).off('mousemove mouseup');
          }
        });
      }
    });

    this.element.find('input,textarea').on({
      click: (event) => {
        console.log('clicked', event.currentTarget);
      },
      dblclick: (event) => {
        console.log('dblclicked', event.currentTarget);
        $(event.target).attr('readonly', false);
        $(event.target).trigger('blur', ['custom']);
        $(event.target).focus();
      },
      blur: (event, param) => {
        console.log('blur', param);
        $(event.target).attr('readonly', true);
      }
    });

    this.element.find('.anchor').on({
      mousedown: this.drawGraph.bind(this)
    });
  }

  select() {
    this.element.addClass('selected');
  }
  deselect() {
    this.element.removeClass('selected');
  }

  calcGraph(startX, startY, endX, endY) {
    return `M ${startX} ${startY} L ${endX} ${endY}`;
  }

  drawGraph(event) {
    const anchor = event.target;
    const token = anchor.className.match(/anchor ([a-z])/)[1];

    $(anchor).addClass('linked');

    const graph = $('#template-graph').clone();
    graph.attr('id', this.id + token + '-');

    const anchorPos = this.anchorPos(anchor);
    graph.attr('d',
        this.calcGraph(anchorPos.x, anchorPos.y, event.pageX, event.pageY));

    graph.show();
    graph.appendTo('.layer.graphs');

    $(window).on('mousemove', {graph: graph, anchorPos: anchorPos}, (event) => {
      const graph = event.data.graph;
      const anchorPos = event.data.anchorPos;
      graph.attr('d',
          this.calcGraph(anchorPos.x, anchorPos.y, event.pageX, event.pageY));
    });
    $(window).on('mouseup', {graph: graph, anchor: anchor}, (event) => {
      const startSide = anchor.className.split(' ')[1];

      if (!event.target.className.startsWith('anchor') ||
          event.target.parentNode === this.element[0]) {
        graph.remove();
        if (this.links[startSide].length === 0) {
          $(anchor).removeClass('linked');
        }
      } else {
        const endAnchor = event.target;
        const endSide = endAnchor.className.split(' ')[1];
        const endToken = endAnchor.className.match(/anchor ([a-z])/)[1];

        const endNode = this.resolve(endAnchor.parentNode.id);
        this.links[startSide].push(graph);
        endNode.links[endSide].push(graph);

        const startPos = this.anchorPos(anchor);
        const endPos = endNode.anchorPos(endAnchor);
        graph.attr('d', this.calcGraph(startPos.x, startPos.y, endPos.x, endPos.y));
        graph.attr('id', this.id + token + '-' + endNode.id + endToken);
        $(endAnchor).addClass('linked');
      }
      $(window).off('mousemove mouseup');
    });

    event.stopPropagation();
  }

  anchorPos(anchor) {
    const side = anchor.className.split(' ')[1];
    const centerOffset = {x: 0, y: 0};
    if (side === 'right') centerOffset.x = anchor.offsetWidth;
    else if (side === 'bottom') centerOffset.y = anchor.offsetHeight;
    const anchorPos = {
      x: this.element[0].offsetLeft + anchor.offsetLeft + centerOffset.x,
      y: this.element[0].offsetTop + anchor.offsetTop + centerOffset.y,
    };
    return anchorPos;
  }
};

module.exports = Node;
