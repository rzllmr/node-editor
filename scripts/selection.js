
const Proxy = require('./proxy.js');
const ColorPicker = require('./colorpicker.js');
const Clipboard = require('./clipboard.js');

/**
 * handle selection for the board element
 */
class Selection {
  constructor(board) {
    this.board = board;
    this.zoom = board.zoom;

    this.proxy = new Proxy();
    this.selection = new Set();
    this.nodeInfo = $('h1#node-info');
    this.nodeTools = $('#node-tools');
    this.removeButton = $('#remove.tool.small');
    this.minimizeButton = $('#minimize.tool.small');
    this.maximizeButton = $('#maximize.tool.small');
    this.colorPicker = new ColorPicker(this.selection);

    this.rect = board.element.find('rect.selection');
    this.rectOrigin = {x: 0, y: 0};
    this.rectSelection = new Map();

    this.drawingRectangle = false;
    this.draggingSelection = false;

    this.clipboard = new Clipboard();

    this.register();
    this.toggleNodeTools();
  }

  register() {
    this.board.element.on('mousedown', (event) => {
      if (event.button != 0 || event.altKey || event.ctrlKey || event.metaKey) return;
      // left click alone

      const target = $(event.target).closest('.layer, .node, .sign');
      if (target.length == 0) return;

      if (target[0].tagName == 'svg') {
        if (!(event.ctrlKey || event.metaKey)) this.clearSelection();

        // rectangleSelect
        this.rectOrigin = {
          x: event.offsetX * this.zoom.scale,
          y: event.offsetY * this.zoom.scale
        };
        this.rect.show();

        $('.layer.nodes .node:not(:first), .layer.nodes .sign:not(:first)').each((_, element) => {
          this.rectSelection.set(element.id, $(element).hasClass('selected'));
        });

        this.drawingRectangle = true;
        $(window).on('mousemove', this.rectangleSelect.bind(this));
      } else if (target.hasClass('node')) {
        if ($(event.target).hasClass('resizer')) {
          this.resizeNodes(target);
        } else {
          this.moveNodes(target, event);
        }
      }
    });

    $([this.board.element, window]).on('mouseup', (event) => {
      if (event.button != 0 || event.altKey || !this.board.visible()) return;
      // left click

      const target = event.target.tagName == 'HTML' ? $(event.target) :
        $(event.target).closest('.layer, .node, .sign');
      if (target.length == 0) return;

      this.colorPicker.updatePresets();

      if (this.drawingRectangle) {
        this.drawingRectangle = false;

        this.rect.hide();
        this.rect.attr({width: 0, height: 0});
      } else if (this.draggingSelection) {
        this.draggingSelection = false;
      } else if (['svg', 'HTML'].includes(target[0].tagName) == false) {
        if (event.ctrlKey || event.metaKey) this.multiSelect(target[0].id);
        else this.singleSelect(target[0].id);
      }
      $(window).off('mousemove');
    });

    this.removeButton.on('click', this.deleteSelection.bind(this));
    this.minimizeButton.on('click', this.minimizeSelection.bind(this, true));
    this.maximizeButton.on('click', this.minimizeSelection.bind(this, false));

    const eventCallback = (eventName, callback) => {
      $(document).on(eventName, () => {
        if (this.board.visible()) callback();
      });
    };
    eventCallback('hotkey:clearSelection', this.clearSelection.bind(this));
    eventCallback('hotkey:deleteSelection', this.deleteSelection.bind(this));
    eventCallback('hotkey:deleteSelection', this.deleteHoveredGraph.bind(this));
    eventCallback('hotkey:copySelection', this.copySelection.bind(this));
    eventCallback('hotkey:cutSelection', this.cutSelection.bind(this));
    eventCallback('hotkey:insertSelection', this.insertSelection.bind(this));
  }

  deleteHoveredGraph() {
    const hoveredGraph = $('path.graph-area:hover')[0];
    if (hoveredGraph == undefined) return;

    const graphId = hoveredGraph.id.replace('_hover', '');
    const graph = this.proxy.resolve(graphId);
    graph.anchors.source.destroy();
  }

  singleSelect(id) {
    const object = this.proxy.resolve(id);
    if (this.selection.size == 1 && this.selection.has(object)) return;

    this.clearSelection();
    object.select();
    this.selection.add(object);
    if (this.selection.size == 1) this.colorPicker.setSlider(object);
    this.toggleNodeTools();
  }

  multiSelect(id) {
    const object = this.proxy.resolve(id);
    if (this.selection.has(object)) {
      object.deselect();
      this.selection.delete(object);
    } else {
      object.select();
      this.selection.add(object);
      if (this.selection.size == 1) this.colorPicker.setSlider(object);
    }
    this.toggleNodeTools();
  }

  clearSelection() {
    this.selection.forEach((_, element) => {
      element.deselect();
    });
    this.selection.clear();
    this.toggleNodeTools();
  }

  deleteSelection() {
    if (this.selection.size == 0) return;

    this.selection.forEach((_, item) => {
      if (item.id == undefined) return;
      if (item.element[0].className.split(' ')[0] === 'node') {
        this.board.removeNode(item);
      }
      item.destroy();
    });
    this.selection.clear();
    this.toggleNodeTools();
  }

  copySelection() {
    if (this.selection.size == 0) return;

    // collect properties of nodes, graphs and signs
    const nodes = new Map();
    let allGraphs = new Map();
    const signs = [];
    this.selection.forEach((_, item) => {
      if (item.id == undefined) return;
      const className = item.element[0].className.split(' ')[0];
      if (className === 'node') {
        nodes.set(item.id, item.export());
        allGraphs = new Map([...allGraphs, ...item.connections()]);
      } else if (className == 'sign') {
        signs.push(item.export());
      }
    });

    // keep only graphs between included nodes
    const graphs = [];
    for (const graph of allGraphs.values()) {
      const sourceId = graph.anchors.source.node.id;
      const targetId = graph.anchors.target.node.id;
      if (nodes.has(sourceId) && nodes.has(targetId)) {
        graphs.push(graph.export());
      }
    }

    // store elements in order best for creation
    const sortedNodes = Array.from(nodes.values()).sort(
        (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
    const propertiesList = sortedNodes.concat(graphs).concat(signs);
    this.clipboard.set(propertiesList);
  }

  cutSelection() {
    this.copySelection();
    this.deleteSelection();
  }

  insertSelection() {
    const propertiesList = this.clipboard.get();

    // allot new node ids
    const nodeIds = propertiesList.
        filter((props) => props.type == 'node').
        map((props) => parseInt(props.id, 10)).
        sort((a, b) => a - b);

    let firstFreeId = this.board.constructor.nodeIdxMax + 1;
    const newNodeIds = new Map();
    for (const nodeId of nodeIds) {
      newNodeIds.set(nodeId.toString(), (firstFreeId++).toString());
    }

    // calculate position correction
    const posCorrection = this.posCorrection(propertiesList);

    // change properties
    const classes = new Map();
    for (const properties of propertiesList) {
      if (!classes.has(properties.type)) {
        classes.set(properties.type, require(`./${properties.type}.js`));
      }
      const class_ = classes.get(properties.type);

      switch (properties.type) {
        case 'node':
          properties.id = newNodeIds.get(properties.id);
          properties.posX = (parseInt(properties.posX, 10) + posCorrection.x) + 'px';
          properties.posY = (parseInt(properties.posY, 10) + posCorrection.y) + 'px';
          break;
        case 'graph':
          let parsedGraphId = class_.parseId(properties.source);
          parsedGraphId.nodeId = newNodeIds.get(parsedGraphId.nodeId);
          properties.source = class_.createId(parsedGraphId);
          parsedGraphId = class_.parseId(properties.target);
          parsedGraphId.nodeId = newNodeIds.get(parsedGraphId.nodeId);
          properties.target = class_.createId(parsedGraphId);
          break;
        case 'sign':
          const parsedSignId = class_.parseId(properties.graph);
          parsedSignId.sNodeId = newNodeIds.get(parsedSignId.sNodeId);
          parsedSignId.tNodeId = newNodeIds.get(parsedSignId.tNodeId);
          properties.graph = class_.createId(parsedSignId);
          break;
      }

      // create new elements
      class_.import(properties, this.board.id);
    }
  }

  posCorrection(propertiesList) {
    const outerRect = {l: 1e4, t: 1e4, r: 0, b: 0};
    for (const props of propertiesList) {
      if (props.type != 'node') continue;
      outerRect.l = Math.min(outerRect.l, parseInt(props.posX, 10));
      outerRect.t = Math.min(outerRect.t, parseInt(props.posY, 10));
      outerRect.r = Math.max(outerRect.r, parseInt(props.posX, 10) + parseInt(props.width, 10));
      outerRect.b = Math.max(outerRect.b, parseInt(props.posY, 10) + parseInt(props.height, 10));
    }
    const windowCenter = this.board.windowCenter();
    const mousePosition = this.board.mousePosition();
    const outerRectCenter = {
      x: outerRect.l + (outerRect.r - outerRect.l) / 2,
      y: outerRect.t + (outerRect.b - outerRect.t) / 2
    };

    const correctionVariants = new Map();
    correctionVariants.set('window:center', {
      x: windowCenter.x - outerRectCenter.x,
      y: windowCenter.y - outerRectCenter.y
    });
    correctionVariants.set('mouse:center', {
      x: mousePosition.x - outerRectCenter.x,
      y: mousePosition.y - outerRectCenter.y
    });
    correctionVariants.set('mouse:corner', {
      x: mousePosition.x - outerRect.l,
      y: mousePosition.y - outerRect.t
    });

    return correctionVariants.get('mouse:center');
  }

  minimizeSelection(toggle) {
    this.selection.forEach((_, item) => {
      if (item.element[0].className.split(' ')[0] === 'node') {
        item.minimize(toggle);
      }
    });
  }

  toggleNodeTools() {
    if (this.selection.size > 0) {
      this.nodeTools.removeClass('collapsed');
    } else {
      this.nodeTools.addClass('collapsed');
    }
  }

  rectangleSelect(event) {
    this.drawingRectangle = true;

    const offset = {
      x: event.pageX + this.board.element[0].scrollLeft,
      y: event.pageY + this.board.element[0].scrollTop
    };

    // draw rectangle
    const difference = {
      x: offset.x * this.zoom.scale - this.rectOrigin.x,
      y: offset.y * this.zoom.scale - this.rectOrigin.y
    };
    const selectionRect = {
      x: (difference.x < 0) ? offset.x * this.zoom.scale : this.rectOrigin.x,
      y: (difference.y < 0) ? offset.y * this.zoom.scale : this.rectOrigin.y,
      width: Math.abs(difference.x),
      height: Math.abs(difference.y)
    };
    this.rect.attr(selectionRect);

    // select contained elements
    this.board.element.find('.node, .sign').each((_, element) => {
      // check collision
      const elementRect = {
        x: element.offsetLeft,
        y: element.offsetTop,
        width: element.offsetWidth,
        height: element.offsetHeight
      };
      const selected = this.checkCollision(selectionRect, elementRect);

      // update selection
      if (selected != this.rectSelection.get(element.id)) {
        this.rectSelection.set(element.id, selected);
        this.multiSelect(element.id);
      }
    });
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  resizeNodes(target) {
    $(window).on('mousemove', (event) => {
      this.draggingSelection = true;
      const dim = {
        width: event.pageX * this.zoom.scale - target.offset().left + 6,
        height: event.pageY * this.zoom.scale - target.offset().top + 6
      };
      if (target.hasClass('selected')) {
        // resize all selected nodes
        this.selection.forEach((node) => {
          if (node.constructor.name != 'Node') return;
          node.resize(dim.width, dim.height);
        });
      } else {
        // resize node
        this.proxy.resolve(target.attr('id')).resize(dim.width, dim.height);
      }
    });
  }

  moveNodes(target, event) {
    const cursorPosRel = {
      left: event.offsetX * this.zoom.scale + event.target.offsetLeft,
      top: event.offsetY * this.zoom.scale + event.target.offsetTop
    };
    $(window).on('mousemove', (event) => {
      this.draggingSelection = true;
      const newPos = {
        left: event.pageX * this.zoom.scale - cursorPosRel.left,
        top: event.pageY * this.zoom.scale - cursorPosRel.top
      };
      if (target.hasClass('selected')) {
        // move all selected nodes
        const posDelta = {
          left: newPos.left - target.offset().left,
          top: newPos.top - target.offset().top
        };
        this.selection.forEach((node) => {
          if (node.constructor.name != 'Node') return;
          node.move(
              node.element.offset().left + posDelta.left,
              node.element.offset().top + posDelta.top
          );
        });
      } else {
        // move node
        this.proxy.resolve(target.attr('id')).move(newPos.left, newPos.top);
      }
    });
  }
}

module.exports = Selection;
