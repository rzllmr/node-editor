
class Options {
  constructor() {
    this.options = new Map([
      ['lightTheme', false]
    ]);
    this.themeButton = $('#theme.tool');

    this.register();
  }

  register() {
    this.themeButton.click(() => {
      this.options.lightTheme = !this.options.lightTheme;
      const root = document.documentElement;
      if (this.options.lightTheme) {
        root.className = 'light';
        this.themeButton.find('i')[0].className = 'fas fa-lightbulb';
      } else {
        root.className = 'dark';
        this.themeButton.find('i')[0].className = 'far fa-lightbulb';
      }
    });
  }
}

module.exports = Options;
