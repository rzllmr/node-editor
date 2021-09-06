
class KeyBinding {
  constructor() {
    // table of mode's key reactions in priority order
    this.binding = {
      'input': {
        'check': () => {
          return $(document.activeElement).is(
            'div.head div.label, div.body div.details, div.sign div.details'
          );
        },
        'escape': 'hotkey:blurInput'
      },
      'window': {
        'check': () => {
          return $(document.activeElement).is('body');
        },
        'ctrl+t': 'hotkey:toggleTheme',
        'escape': 'hotkey:clearSelection',
        'delete': 'hotkey:deleteSelection',
        'backspace': 'hotkey:deleteSelection',
        'ctrl+n': 'hotkey:createNode',
        'ctrl+c': 'hotkey:copySelection',
        'ctrl+x': 'hotkey:cutSelection',
        'ctrl+v': 'hotkey:insertSelection'
      },
      'default': {
        'check': () => {
          return true;
        }
      }
    };

    this.recognizedKeys = [];
    for (const mode in this.binding) {
      this.recognizedKeys = this.recognizedKeys.concat(Object.keys(this.binding[mode]));
    }
    this.recognizedKeys = Array.from(new Set(this.recognizedKeys));

    this.ignoredKeys = ['home', 'end', 'pageup', 'pagedown'];
  }

  handleKey(key, ctrl, shift, alt, meta) {
    key = key.toLowerCase();
    if (key == 'control') key = 'ctrl';
    if (meta && key != 'meta') key = 'ctrl+' + key;
    if (alt && key != 'alt') key = 'alt+' + key;
    if (shift && key != 'shift') key = 'shift+' + key;
    if (ctrl && key != 'ctrl') key = 'ctrl+' + key;

    if (this.ignoredKeys.includes(key)) return false;
    if (!this.recognizedKeys.includes(key)) return true;

    // Pass key to top-most active mode
    for (const mode in this.binding) {
      if (this.binding[mode]['check']()) {
        if (key in this.binding[mode]) {
          this.callEvent(this.binding[mode][key]);
        }
        break;
      }
    }
    return true;
  }

  callEvent(eventName) {
    $(document).trigger(eventName);
  }
}

module.exports = KeyBinding;
