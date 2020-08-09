
class Options {
  constructor() {
    this.options = new Map([
      ['lightTheme', false]
    ]);
    this.themeButton = $('#theme.tool');
    this.helpButton = $('#help.tool');

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
    this.helpButton.click(() => {
      const helpPanel = $('div#help-panel');
      if (helpPanel.is(':visible')) {
        helpPanel.hide();
      } else {
        helpPanel.show();
      }
    });
  }
}

module.exports = Options;
