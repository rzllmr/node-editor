const { clipboard } = require('electron');

class DomNode {
  constructor(node) {
    this.typeNode = DomNode.typeNode(node);
    this.textNode = DomNode.textNode(node);
    this.type = DomNode.type(node);
  }

  destroy(div) {
    div.removeChild(this.typeNode);
    this.typeNode = null;
    this.textNode = null;
    this.type = null;
  }

  static typeNode(node) {
    if (node.nodeName === '#text' &&
        node.parentNode != null &&
        node.parentNode.nodeName !== 'DIV') {
      node = node.parentNode;
    }
    return node;
  }

  static textNode(node) {
    if (node.nodeName !== '#text') {
      node = node.firstChild;
    }
    return node;
  }

  static type(node) {
    node = DomNode.typeNode(node);
    return {
      text: node.nodeName === '#text',
      em: node.nodeName === 'EM',
      br: node.nodeName === 'BR'
    };
  }

  static create(type) {
    let newNode;
    switch (type) {
      case 'text':
        newNode = document.createTextNode(DomNode.char.spaceZeroWidth);
        break;
      case 'br':
        newNode = document.createElement('br');
        break;
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strikethrough':
      case 'link':
        newNode = document.createElement('em');
        newNode.textContent = DomNode.char.spaceZeroWidth + type;
        newNode.className = type;
        break;
      default:
        throw new Error(`DomNode type unknown: ${type}`);
    }
    return new DomNode(newNode);
  }

  static current() {
    let focusNode = document.getSelection().focusNode;
    if (focusNode.nodeName == 'DIV') {
      focusNode = focusNode.firstChild;
    }
    const currentNode = new DomNode(focusNode);
    currentNode.fixStart();
    currentNode.fixCaret();
    return currentNode;
  }

  next() {
    const nextNode = this.typeNode.nextSibling;
    if (nextNode == null) return null;

    return new DomNode(nextNode);
  }

  previous() {
    const nextNode = this.typeNode.previousSibling;
    if (nextNode == null) return null;

    return new DomNode(nextNode);
  }

  insertNode(other) {
    if (this.caretAt(-1)) {
      this.insertAfter(other);
    } else if (this.caretAt(1)) {
      this.insertBefore(other);
    } else {
      this.insertWithin(other);
    }
  }

  insertBefore(other) {
    $(other.typeNode).insertBefore(this.typeNode);
  }

  insertAfter(other) {
    $(other.typeNode).insertAfter(this.typeNode);
  }

  insertWithin(other, caretIdx = null) {
    if (!this.type.text) return;
    if (caretIdx == null) caretIdx = this.caretIndex;

    const leftOfCaret = this.content.slice(0, caretIdx);
    const rightOfCaret = this.content.slice(caretIdx);
    this.content = leftOfCaret;
    const rightNode = DomNode.create('text');
    rightNode.content = rightOfCaret;
    $(rightNode.typeNode).insertAfter(this.typeNode);
    $(other.typeNode).insertAfter(this.typeNode);
  }

  mergeInto(other, div) {
    if (!this.type.text || !other.type.text) return;

    this.content = DomNode.fixSpaces(this.content + other.content);

    other.destroy(div);
  }

  insertText(text, caretIdx = null) {
    if (caretIdx == null) caretIdx = this.caretIndex;

    const leftOfCaret = this.content.slice(0, caretIdx);
    const rightOfCaret = this.content.slice(caretIdx);

    this.content = DomNode.fixSpaces(leftOfCaret + text + rightOfCaret);
    this.caretIndex = leftOfCaret.length + text.length;
  }

  get link() {
    if (this.type.em == false) {
      throw new StandardError('link only available to \'em\' nodes');
    }
    return this.typeNode.dataset.path;
  }

  set link(path) {
    if (this.type.em == false) {
      throw new StandardError('link only available to \'em\' nodes');
    }
    this.typeNode.dataset.path = path;
  }

  change(type) {
    if (!['bold', 'italic', 'underline', 'strikethrough', 'link'].includes(type)) return;
    this.typeNode.className = type;
  }

  get edit() {
    return this.typeNode.className.includes('edit');
  }

  set edit(bool) {
    const classes = new Set(this.typeNode.className.split(' '));
    if (bool == true) classes.add('edit');
    else classes.delete('edit');
    this.typeNode.className = Array.from(classes).join(' ');
  }

  select(start, end) {
    const selection = window.getSelection();
    selection.removeAllRanges();

    const range = document.createRange();
    range.setStart(this.textNode, this.convertIdx(start));
    range.setEnd(this.textNode, this.convertIdx(end));
    selection.addRange(range);
  }

  // content handling ////////////////////////////////////////////////////////////

  static get char() {
    return {
      spaceZeroWidth: '\u200B',
      spaceNoBreak: '\u00A0',
      space: '\u0020'
    };
  }

  // private
  get _realContent() {
    return this.textNode.textContent;
  }

  get content() {
    let content = this._realContent;
    if (this.hasZeroSpace()) content = content.slice(1);
    return content;
  }

  set _realContent(text) {
    this.textNode.textContent = text;
  }

  set content(text) {
    if (this.hasZeroSpace()) text = DomNode.char.spaceZeroWidth + text;
    this._realContent = text;
    this.fixStart();
  }

  get _realCaretIndex() {
    let caretIdx = 0;
    const selection = window.getSelection();
    if (selection.rangeCount !== 0) {
      const range = window.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(this.textNode);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretIdx = preCaretRange.toString().length;
    }
    return caretIdx;
  }

  get caretIndex() {
    let caretIdx = this._realCaretIndex;
    if (this.hasZeroSpace()) caretIdx--;
    return caretIdx;
  }

  set _realCaretIndex(caretIdx) {
    if (caretIdx < 0) {
      caretIdx += this._realContent.length + 1;
    }

    const sel = window.getSelection();
    const range = document.createRange();
    range.setStart(this.textNode, caretIdx);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  set caretIndex(caretIdx) {
    if (caretIdx >= 0 && this.hasZeroSpace()) caretIdx++;
    this._realCaretIndex = caretIdx;
  }

  _realCaretAt(caretIdx) {
    if (caretIdx < 0) {
      caretIdx += this._realContent.length + 1;
    }
    return this._realCaretIndex == caretIdx;
  }

  caretAt(caretIdx) {
    if (caretIdx < 0) {
      caretIdx += this.content.length + 1;
    }
    return this.caretIndex == caretIdx;
  }

  fixCaret() {
    if (this.hasZeroSpace() && this._realCaretAt(0)) this._realCaretIndex = 1;
  }

  fixStart() {
    if (this.type.text && !this.hasZeroSpace()) {
      this._realContent = DomNode.char.spaceZeroWidth + this._realContent;
    }
  }

  static fixSpaces(text) {
    return text.replace(/\s+/g, (match) => {
      if (match.length == 1) return DomNode.char.space;
      else return ''.padStart(match.length, DomNode.char.spaceNoBreak + DomNode.char.space);
    });
  }

  hasZeroSpace() {
    const zeroSpaceAtStart = new RegExp(`^${DomNode.char.spaceZeroWidth}`);
    return zeroSpaceAtStart.test(this._realContent);
  }
}

class DivEdit {
  constructor(divNode, multiline = true) {
    this.div = divNode;
    this.multiline = multiline;

    // nodes require content, so we use
    // the zero width space character
    this.zeroSpace = '\u200B';
    this.space = '\u00A0';
  }

  bindings() {
    return {
      'text': {
        'escape': this.exitEdit,
        'ctrl+l|ctrl+b|ctrl+i|ctrl+u|ctrl+s': this.insertEm,
        'enter': this.insertBreak,
        'arrowleft|arrowright': this.navigate,
        'delete|backspace': this.removeNonText
      },
      'em': {
        'delete|backspace': this.removeNonText,
        'arrowleft|arrowright': this.navigate,
        'other': (node, key) => { return true; }
      },
      'editEm': {
        'escape|enter|tab|backspace': this.finishEm
      },
      'all': {
        'ctrl+c': this.copyText,
        'ctrl+v': this.insertText
      }
    };
  }

  registerKeys(emClick) {
    this.emClick = emClick;
    this.editEm = false;

    this.bindings = this.bindings();

    // split key alternatives to multiple entries
    for (const mode of Object.values(this.bindings)) {
      for (const [keys, func] of Object.entries(mode)) {
        if (!keys.includes('|')) continue;

        for (const key of keys.split('|')) {
          mode[key] = func;
        }
        delete mode[keys];
      }
    }

    // classify control events for handle()
    $(this.div).on({
      keydown: (event) => {
        return !this.handle(this.modifiedKey(event), 'down');
      },
      keyup: (event) => {
        // pass
      },
      focus: () => {
        let domNode;
        if (this.div.firstChild == null) {
          domNode = DomNode.create('text');
          this.div.appendChild(domNode.typeNode);
        } else {
          domNode = DomNode.current();
        }
        domNode.fixCaret();
      },
      blur: (event) => {
        if (this.editEm) {
          const currentNode = DomNode.current();
          const handled = this.finishEm(currentNode, 'enter');
          this.editEm = !handled;
        }
        if (DivEdit.isEmpty(this.div)) {
          this.div.removeChild(this.div.firstChild);
        }
        this.div.scrollTop = 0;
        this.div.scrollLeft = 0;
      }
    });
    return this;
  }

  modifiedKey(event) {
    let key = event.key;
    key = key.toLowerCase();
    if (event.ctrlKey && key != 'control') key = 'ctrl+' + key;
    if (event.metaKey && key != 'meta') key = 'ctrl+' + key;
    if (event.altKey && key != 'alt') key = 'alt+' + key;
    return key;
  }

  handle(key) {
    const domNode = DomNode.current();

    let mode = '';
    if (this.editEm) {
      mode = 'editEm';
    } else {
      if (domNode.type.text) {
        mode = 'text';
      } else {
        mode = 'em';
      }
    }

    console.log(mode, key);
    let handled = false;
    if (mode in this.bindings) {
      if (key in this.bindings[mode]) {
        handled = this.bindings[mode][key].bind(this)(domNode, key);
      } else if ('other' in this.bindings[mode]) {
        handled = this.bindings[mode]['other'].bind(this)(domNode, key);
      }
    }
    if ('all' in this.bindings) {
      if (key in this.bindings['all']) {
        handled = this.bindings['all'][key].bind(this)(domNode, key);
      }
    }
    return handled;
  }

  static isEmpty(div) {
    if (div.childNodes.length == 1 &&
      div.firstChild.textContent == '\u200B') {
      return true;
    }
    return false;
  }

  exitEdit(domNode) {
    this.div.blur();
    return true;
  }

  insertEm(domNode, key) {
    const selectedContent = this.selectedContent();
    this.deleteSelected();

    key = key.replace('ctrl+', '');
    const type = {
      'l': 'link', 'b': 'bold', 'i': 'italic',
      'u': 'underline', 's': 'strikethrough'
    };
    const emNode = DomNode.create(type[key]);

    if (domNode.caretAt(-1)) {
      domNode.insertAfter(emNode);
    } else if (domNode.caretAt(0)) {
      domNode.insertBefore(DomNode.create('text'));
      domNode.insertBefore(emNode);
    } else {
      domNode.insertWithin(emNode, domNode.caretIndex);
    }
    emNode.content += selectedContent;
    emNode.caretIndex = -1;
    this.editEm = true;

    return true;
  }

  finishEm(domNode, key) {
    if (key == 'backspace' && domNode.content.length > 1) return false;

    this.editEm = false;

    if (domNode.content.length == 1) {
      this.removeNonText(domNode, key);
      return true;
    }

    if (domNode.typeNode.className == 'link') {
      // remove link symbol and dir path for display
      const path = domNode.content.trim();
      domNode.link = path.replace(/\/+/, '/');
      domNode.content = path.replace(/.*\//, '');

      // register click event for Node class
      $(domNode.typeNode).on('click', (event) => {
        this.emClick(event.target);
      });
    } else {
      domNode.content = domNode.content.trim();
    }

    let nextNode = domNode.next();
    if (nextNode == null || nextNode.type.text == false) {
      const newNode = DomNode.create('text');
      domNode.insertAfter(newNode);
      nextNode = newNode;
    }

    if (key == 'tab') {
      if (!nextNode.content.startsWith(' ')) {
        nextNode.content = DomNode.char.spaceNoBreak + nextNode.content;
      }
      nextNode.caretIndex = 1;
    } else {
      nextNode.caretIndex = 0;
    }
    return true;
  }

  removeNonText(domNode, key) {
    if (domNode.type.text) {
      if (key == 'delete' && domNode.caretAt(-1)) {
        domNode = domNode.next();
      } else if (key == 'backspace' && domNode.caretAt(0)) {
        domNode = domNode.previous();
      } else {
        return false;
      }
    }
    if (domNode == null) return true;

    const before = domNode.previous();
    const after = domNode.next();
    domNode.destroy(this.div);

    if (before != null && after != null) {
      const caretIdx = before.content.length;
      before.mergeInto(after, this.div);
      before.caretIndex = caretIdx;
    } else if (after != null) {
      after.caretIndex = 0;
    } else if (before != null) {
      before.caretIndex = -1;
    }
    return true;
  }

  navigate(domNode, key) {
    if (key == 'arrowleft') {
      let nonTextNode;
      if (domNode.type.text && domNode.caretAt(0)) {
        nonTextNode = domNode.previous();
        if (nonTextNode == null) return true;
      } else if (!domNode.type.text) {
        nonTextNode = domNode;
      } else {
        return false;
      }

      let prevTextNode = nonTextNode.previous();
      if (prevTextNode == null) {
        prevTextNode = DomNode.create('text');
        nonTextNode.insertBefore(prevTextNode);
      }
      prevTextNode.caretIndex = -1;
    } else if (key == 'arrowright') {
      let nonTextNode;
      if (domNode.type.text && domNode.caretAt(-1)) {
        nonTextNode = domNode.next();
        if (nonTextNode == null) return true;
      } else if (!domNode.type.text) {
        nonTextNode = domNode;
      } else {
        return false;
      }

      let nextTextNode = nonTextNode.next();
      if (nextTextNode == null) {
        nextTextNode = DomNode.create('text');
        nonTextNode.insertAfter(nextTextNode);
      }
      nextTextNode.caretIndex = 0;
    } else {
      return false;
    }

    return true;
  }

  insertBreak(domNode, key) {
    const brNode = DomNode.create('br');

    let targetNode = domNode;
    if (domNode.caretAt(-1)) {
      targetNode = DomNode.create('text');
      domNode.insertAfter(targetNode);
      domNode.insertAfter(brNode);
    } else if (domNode.caretAt(0)) {
      const textNode = DomNode.create('text');
      domNode.insertBefore(textNode);
      domNode.insertBefore(brNode);
    } else {
      const caretIdx = domNode.caretIndex;
      domNode.insertWithin(brNode, caretIdx);
      targetNode = brNode.next();
    }
    targetNode.caretIndex = 0;

    return true;
  }

  copyText(domNode, key) {
    clipboard.writeText(this.selectedContent());
    return true;
  }

  insertText(domNode, key) {
    let currentNode = this.deleteSelected();

    const text = clipboard.readText();
    const parts = text.split('\n');
    for (const line in parts) {
      currentNode.insertText(parts[line]);
      if (line < parts.length - 1) {
        this.insertBreak(currentNode);
        currentNode = DomNode.current();
      }
    }

    return true;
  }

  selectedContent() {
    return window.getSelection().toString();
  }

  deleteSelected() {
    window.getSelection().deleteFromDocument();
    const currentNode = DomNode.current();

    const nextNode = currentNode.next();
    if (nextNode != null && nextNode.type.text) {
      const caretIdx = currentNode.caretIndex;
      currentNode.mergeInto(nextNode, this.div);
      currentNode.caretIndex = caretIdx;
    }
    return currentNode;
  }
}

module.exports = DivEdit;
