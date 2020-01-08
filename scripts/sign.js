
// allow for Sign objects to be resolved
// from HTML ids of .sign elements
const Proxy = require('./proxy.js');

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
      },
      blur: (event, param) => {
        $(event.target).prop(property, !editable);
      },
      keydown: (event) => {
        // prevent Enter to create new div
        if (event.keyCode === 13) {
          document.execCommand('insertHTML', false, '<br><br>');
          return false;
        }
      },
      keyup: () => {
        this.position();
      }
    });
  }

  export() {
    const element = this.element[0];
    const object = {
      board: this.graph.boardId,
      type: element.className.split(' ')[0],
      graph: element.id.replace('_sign', ''),
      details: element.querySelector('div.details').innerText
    };
    return object;
  }

  static import(object) {
    const graph = this.proxy.resolve(object.graph);
    const element = graph.addSign().element;

    element.find('div.details').text(object.details);
  }
};

Sign.proxy = new Proxy();

module.exports = Sign;
