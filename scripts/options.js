
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
        this.themeButton.find('i')[0].className = 'fa fa-lightbulb-o';
      } else {
        root.className = 'dark';
        this.themeButton.find('i')[0].className = 'fa fa-lightbulb-o';
      }
    });

    $(document).on('hotkey:toggleTheme', (event) => {
      this.themeButton.click();
    });
  }
}

module.exports = Options;
