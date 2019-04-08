
/**
 * handle zoom for the board element
 * working in percent
 */
class Zoom {
  constructor(element, startZoom = 100, stepSize = 10) {
    this.element = element;
    this.window = $(window);

    this.zoom = startZoom;
    this.step = stepSize;

    this.limit = {
      min: 10,
      max: 200
    };
  }

  get percent() {
    return this.zoom;
  }

  get factor() {
    return this.zoom / 100;
  }

  get scale() {
    return 100 / this.zoom;
  }

  change(stepCount) {
    this.zoom = (this.zoom + this.step * stepCount).clamp(this.limit.min, this.limit.max);
    this.element.css('zoom', this.zoom / 100);
  }

  check() {
    this.limit.min = Math.max(
        Math.ceil(this.window.width() / this.element.width() * 100 / this.step) * this.step,
        Math.ceil(this.window.height() / this.element.height() * 100 / this.step) * this.step
    );
    if (this.zoom < this.limit.min) {
      this.zoom = this.limit.min;
      this.element.css('zoom', this.zoom / 100);
    }
  }
}

module.exports = Zoom;
