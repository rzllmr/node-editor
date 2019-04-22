
/**
 * .color-picker representative to handle color selection for nodes
 * used colors are tracked to be selectable directly
 */
class ColorPicker {
  constructor(board) {
    this.element = board.element.find('.color-picker');
    this.dividerPreview = this.element.find('.divider');
    this.slider = this.element.find('.color-slider');
    this.presetContainer = this.element.find('.color-presets');
    this.presetTemplate = this.element.find('#color-preset-template');
    this.reset = this.element.find('#color-reset');

    this.presets = new Map();
    this.attachedDivider = null;
    this.currentHue = 0;

    this.register();
  }

  register() {
    // update divider preview with slider
    this.slider.on('input', (event) => {
      const hue = event.target.value;
      this.dividerPreview[0].style.setProperty('--hue', hue);
    });

    // discard color changes of divider preview
    this.reset.on('click', (event) => {
      const hue = event.target.style.getPropertyValue('--hue');
      this.slider[0].value = hue;
      this.slider.trigger('input');
    });
  }

  attach(divider) {
    const node = divider.parentNode;

    // overlay color picker menu
    this.element.css({
      left: node.offsetLeft + divider.offsetLeft,
      top: node.offsetTop + divider.offsetTop,
      width: divider.offsetWidth
    });
    // assign node hue to reset preview
    const hue = divider.style.getPropertyValue('--hue');
    this.reset[0].style.setProperty('--hue', hue);
    this.reset.click();
    this.element.show();

    this.attachedDivider = divider;

    // apply changes when clicking outside of color menu
    const picker = this;
    $(window).on('mousedown', function clickOutside(event) {
      if ($(event.target).closest('.color-picker').length == 0) {
        $(window).off('mousedown', clickOutside);
        picker.apply();
      }
    });
  }

  apply() {
    const nodeId = Number(this.attachedDivider.parentNode.id);
    const oldHue = Number(this.attachedDivider.style.getPropertyValue('--hue'));
    const newHue = Number(this.dividerPreview[0].style.getPropertyValue('--hue'));

    if (oldHue != newHue) {
      // update color presets
      this.removeNode(nodeId, oldHue);
      this.addNode(nodeId, newHue);

      // change hue of node's divider
      this.attachedDivider.style.setProperty('--hue', newHue);
      this.currentHue = newHue;
    }

    this.element.hide();
  }

  addNode(id, hue = this.currentHue) {
    id = Number(id);
    hue = Number(hue);
    if (!this.presets.has(hue)) {
      this.presets.set(hue, new Set());
      this.addPreset(hue);
    }
    this.presets.get(hue).add(id);
  }

  removeNode(id, hue = null) {
    id = Number(id);
    hue = Number(hue == null ? $(`#${id} .divider`)[0].style.getPropertyValue('--hue') : hue);
    if (this.presets.has(hue)) {
      this.presets.get(hue).delete(id);
      if (this.presets.get(hue).size == 0) {
        this.presets.delete(hue);
        this.removePreset(hue);
      }
    }
  }

  addPreset(hue) {
    const newPreset = this.presetTemplate.clone();
    newPreset[0].id = 'hue' + hue;
    newPreset[0].style.setProperty('--hue', hue);
    newPreset.show();
    newPreset.appendTo(this.presetContainer);

    newPreset.on('click', (event) => {
      const hue = event.target.style.getPropertyValue('--hue');
      this.slider[0].value = hue;
      this.slider.trigger('input');
    });
  }

  removePreset(hue) {
    this.presetContainer.find('#hue' + hue).remove();
    this.presets.delete(hue);
  }
}

module.exports = ColorPicker;
