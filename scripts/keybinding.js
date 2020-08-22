
class KeyBinding {
  constructor() {
    // table of mode's key reactions in priority order
    this.binding = {
      'input': {
        'check': () => {
          return $(document.activeElement).is(
              'div.head input, div.body div.details, div.sign div.details'
          );
        },
        'escape': 'hotkey:blurInput'
      },
      'default': {
        'check': () => {
          return true;
        },
        't': 'hotkey:toggleTheme',
        'delete': 'hotkey:deleteSelection',
        'insert': 'hotkey:createNode'
      }
    };

    this.recognizedKeys = [];
    for (const mode in this.binding) {
      this.recognizedKeys = this.recognizedKeys.concat(Object.keys(this.binding[mode]));
    }
    this.recognizedKeys = Array.from(new Set(this.recognizedKeys));
  }

  handleKey(key, ctrl, shift) {
    key = key.toLowerCase();
    if (shift) key = 'shift+' + key;
    if (ctrl) key = 'ctrl+' + key;
    if (!this.recognizedKeys.includes(key)) return;

    // Pass key to top-most active mode
    for (const mode in this.binding) {
      if (this.binding[mode]['check']()) {
        if (key in this.binding[mode]) {
          this.callEvent(this.binding[mode][key]);
        }
        break;
      }
    }
  }

  callEvent(eventName) {
    $(document).trigger(eventName);
  }
}

module.exports = KeyBinding;
