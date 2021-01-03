
class Options {
  constructor() {
    this.options = new Map([
      ['lightTheme', false]
    ]);
    this.collapser = $('#collapser');
    this.collapseButton = $('#collapse.tool');
    this.themeButton = $('#theme.tool');
    this.helpButton = $('#help.tool');

    this.register();
  }

  register() {
    this.collapseButton.click(() => {
      this.collapser.toggleClass('collapsed');
    });
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

    $(document).on('hotkey:toggleTheme', (event) => {
      this.themeButton.click();
    });
  }
}

module.exports = Options;
