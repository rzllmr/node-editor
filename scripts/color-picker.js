
/**
 * .color-picker representative to handle color selection for nodes
 * used colors are tracked to be selectable directly
 */
class ColorPicker {
  constructor(selection) {
    this.element = $('#menu .color-picker');
    this.dividerPreview = this.element.find('.divider');
    this.slider = this.element.find('.color-slider');
    this.presetContainer = this.element.find('.color-presets');
    this.presetTemplate = this.element.find('#color-preset-template');
    this.reset = this.element.find('#color-reset');

    this.presets = new Map();
    this.selection = selection;
    this.currentHue = '0';

    this.lastSelection = new Set();
    this.initialHue = new Map();

    this.register();
  }

  register() {
    // update divider preview with slider
    this.slider.on('input', (event) => {
      this.currentHue = event.target.value;
      this.dividerPreview[0].style.setProperty('--hue', this.currentHue);
      this.apply();
    });

    // discard color changes of divider preview
    this.reset.on('click', () => {
      for (const [node, hue] of this.initialHue.entries()) {
        node.color = hue;
        this.setSlider(node);
      }
      this.initialHue.clear();
    });
  }

  apply() {
    const initialChange = this.initialHue.size === 0;
    this.selection.forEach((_, node) => {
      if (node.element[0].className.split(' ')[0] === 'node') {
        // store initial color at first change
        if (initialChange) this.initialHue.set(node, node.color);
        // change hue of node's divider
        node.color = this.currentHue;
      }
    });
  }

  setSlider(node) {
    this.slider[0].value = node.color;
    this.currentHue = this.slider[0].value;
    this.dividerPreview[0].style.setProperty('--hue', this.currentHue);
  }

  updatePresets() {
    for (const [node, hue] of this.initialHue.entries()) {
      this.removeNode(node.id, hue);
      this.addNode(node.id);
    }
    this.initialHue.clear();
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
