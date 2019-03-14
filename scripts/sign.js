
// allow for Sign objects to be resolved
// from HTML ids of .sign elements
const Proxy = require('./proxy.js');

/**
 * graph extension to monitor connected Anchors
 */
class Sign extends Proxy {
  constructor(id = null, position) {
    super(id);
    this.element = $('#template-sign').clone();
    this.element.attr('id', this.id);
    this.element.appendTo('.layer.nodes');
    this.element.show();

    this.position(position);
    this.makeEditableOnDblClick(this.element.find('.details'), 'contentEditable', true);
  }

  destroy() {
    this.element.remove();
    this.element = undefined;
    super.destroy();
  }

  position(offset) {
    this.element.css({left: offset.x, top: offset.y});
  }

  focus() {
    this.element.find('.details').dblclick();
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
      }
    });
  }
};

module.exports = Sign;
