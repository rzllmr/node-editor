
// allow for Sign objects to be resolved
// from HTML ids of .sign elements
const Proxy = require('./proxy.js');

const DivEdit = require('./divedit.js');

/**
 * graph extension to monitor connected Anchors
 */
class Sign extends Proxy {
  constructor(graph, position) {
    super(graph.id + '_sign');
    this.element = $('#templates .sign').clone();
    this.element.removeClass('template');
    this.element.attr('id', this.id);
    this.element.appendTo(`#${graph.boardId} .layer.nodes`);

    this.graph = graph;

    this.position(position);
    this.makeEditableOnDblClick(this.element.find('.details'), 'contentEditable', true);
  }

  updateId() {
    this.change(this.graph.id + '_sign');
    this.element.attr('id', this.id);
  }

  destroy() {
    this.graph.sign = undefined;

    this.element.remove();
    this.element = undefined;
    super.destroy();
  }

  position(offset = null) {
    if (offset) this.offset = offset;
    this.element.css({
      left: this.offset.x - this.element[0].offsetWidth / 2,
      top: this.offset.y - this.element[0].offsetHeight / 2
    });
  }

  focus() {
    this.element.find('.details').dblclick();
  }

  select() {
    this.element.addClass('selected');
  }
  deselect() {
    this.element.removeClass('selected');
  }
  get selected() {
    return this.element[0].className.endsWith('selected');
  }

  makeEditableOnDblClick(element, property, editable) {
    element.on({
      mousedown: (event) => {
        let propertyValue = $(event.target).prop(property);
        if (typeof propertyValue == 'string') propertyValue = propertyValue === 'true';
        if (propertyValue === editable) {
          event.stopPropagation();
        } else {
          event.preventDefault();
        }
      },
      dblclick: (event) => {
        $(event.target).prop(property, editable);
        $(event.target).focus();
        this.position();
      },
      blur: (event, param) => {
        $(event.target).prop(property, !editable);
        if (DivEdit.isEmpty(element[0])) {
          this.destroy();
        }
      },
      keyup: () => {
        this.position();
      }
    });
    const onEmClick = (emNode) => {
      $('#board-tree').trigger('treeview:createFromLink', [emNode]);
    };
    new DivEdit(element[0], true).registerKeys(onEmClick);
  }

  export() {
    const element = this.element[0];
    const properties = {
      board: this.graph.boardId,
      type: element.className.split(' ')[0],
      graph: element.id.replace('_sign', ''),
      details: element.querySelector('div.details').innerHTML.replace(/<br>/g, '\n')
    };
    return properties;
  }

  static import(properties) {
    if (!Proxy.setDefaults(properties, {graph: undefined, details: ''})) return;
    const proxy = new Proxy();

    const graph = proxy.resolve(properties.graph);
    if (graph == undefined) return;

    const sign = graph.addSign();
    sign.element.find('div.details').html(properties.details.replace(/\n/g, '<br>'));
    sign.position();
  }
};

module.exports = Sign;
