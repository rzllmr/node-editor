
class DomNode {
  constructor(node) {
    this.typeNode = DomNode.typeNode(node);
    this.textNode = DomNode.textNode(node);
    this.type = DomNode.type(node);
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
      em: node.nodeName === 'EM'
    };
  }

  static create(type, content = '') {
    let newNode;
    switch (type) {
      case 'text':
        const zeroSpace = '\u200B';
        newNode = document.createTextNode(zeroSpace + content);
        break;
      case 'em':
        newNode = document.createElement('em');
        newNode.className = 'link';
        newNode.textContent = '#' + content;
        break;
    }
    return new DomNode(newNode);
  }

  static current() {
    return new DomNode(document.getSelection().focusNode);
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
    const rightNode = DomNode.create('text', rightOfCaret);
    $(rightNode.typeNode).insertAfter(this.typeNode);
    $(other.typeNode).insertAfter(this.typeNode);
  }

  get content() {
    return this.textNode.textContent;
  }

  set content(text) {
    this.textNode.textContent = text;
  }

  get caretIndex() {
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

  set caretIndex(caretIdx) {
    if (caretIdx < 0) {
      caretIdx += this.textNode.nodeValue.length + 1;
    }

    const sel = window.getSelection();
    const range = document.createRange();
    range.setStart(this.textNode, caretIdx);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  caretAt(caretIdx) {
    if (caretIdx < 0) {
      caretIdx += this.textNode.nodeValue.length + 1;
    }
    return this.caretIndex == caretIdx;
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

  handle(key) {
    const domNode = this.currentDomNode();

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
    if (mode in this.bindings && key in this.bindings[mode]) {
      handled = this.bindings[mode][key].bind(this)(domNode, key);
    }
    return handled;
  }

  modifiedKey(event) {
    let key = event.key;
    key = key.toLowerCase();
    if (event.ctrlKey && key != 'control') key = 'ctrl+' + key;
    if (event.metaKey && key != 'meta') key = 'ctrl+' + key;
    if (event.altKey && key != 'alt') key = 'alt+' + key;
    return key;
  }

  registerKeys(emClick) {
    this.emClick = emClick;
    this.editEm = false;

    this.bindings = {
      'text': {
        'escape': this.exitEdit,
        '#': this.insertEm
      },
      'em': {

      },
      'editEm': {
        'escape|enter|tab': this.finishEm
      }
    };
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
          domNode = DomNode.create('text')
          this.div.appendChild(domNode.typeNode);
        } else {
          domNode = DomNode.current();
        }
        if (domNode.caretAt(0)) {
          domNode.caretIndex = 1;
        }
      },
      blur: (event) => {
        if (this.editEm) {
          const emNode = $(event.target).find('em').filter(
              (_, em) => em.textContent.startsWith('#'))[0];
          if (emNode == undefined) return false;
          const handled = this.finishEmphasis('Enter', emNode);
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

  insertEm(domNode) {
    const emNode = DomNode.create('em');

    if (domNode.caretAt(-1)) {
      domNode.insertAfter(emNode);
    } else if (domNode.caretAt(1)) {
      domNode.insertBefore(DomNode.create('text'));
      domNode.insertBefore(emNode);
    } else {
      domNode.insertWithin(emNode, domNode.caretIndex);
    }
    emNode.caretIndex = 1;
    this.editEm = true;

    return true;
  }

  finishEm(domNode, key) {
    console.log(key);

    this.editEm = false;
    if (domNode.content == '#') {
      this.removeEmphasis(node);
      return true;
    }

    // remove link symbol and dir path for display
    const path = domNode.content.trim().substring(1);
    domNode.link = path.replace(/\/+/, '/');
    domNode.content = path.replace(/.*\//, '');

    // register click event for Node class
    $(domNode.typeNode).on('click', (event) => {
      this.emClick(event.target);
    });

    let nextNode = domNode.next();
    if (nextNode == null || nextNode.type.text == false) {
      const newNode = DomNode.create('text');
      domNode.insertAfter(newNode);
      nextNode = newNode;
    }

    if (key == 'tab') {
      if (!nextNode.content.startsWith(this.zeroSpace + ' ')) {
        nextNode.content = this.zeroSpace + this.space + nextNode.content.substring(1);
      }
      nextNode.caretIndex = 2;
    } else {
      nextNode.caretIndex = 1;
    }
    return true;
  }

  handleNavigation(key, node) {
    if (key == 'ArrowLeft') {
      let prevNode;
      if (node.nodeName == '#text' && this.caretAt(node, 1)) {
        prevNode = node.previousSibling;
      } else if (node.nodeName == 'EM') {
        prevNode = node;
      } else {
        return false;
      }

      if (prevNode == null || prevNode.nodeName == '#text') {
        return true;
      }
      let textNode = prevNode.previousSibling;
      if (textNode == null || textNode.nodeName != '#text') {
        textNode = this.createTextNode();
        this.insertBefore(prevNode, textNode);
      }
      this.setCaretIndex(textNode, -1);
    } else if (key == 'ArrowRight') {
      let emNode;
      if (node.nodeName == '#text' && this.caretAt(node, -1)) {
        emNode = node.nextSibling;
      } else if (node.nodeName == 'EM') {
        emNode = node;
      } else {
        return false;
      }

      if (emNode == null || emNode.nodeName == '#text') {
        return false;
      }
      let textNode = emNode.nextSibling;
      if (textNode == null || textNode.nodeName != '#text') {
        textNode = this.createTextNode();
        this.insertAfter(emNode, textNode);
      }
      this.setCaretIndex(textNode, 1);
    } else {
      return false;
    }

    return true;
  }

  insertBreak(key, node) {
    const brNode = document.createElement('br');

    let targetNode = node;
    if (this.caretAt(node, -1)) {
      targetNode = this.createTextNode();
      this.insertAfter(node, targetNode);
      this.insertAfter(node, brNode);
    } else if (this.caretAt(node, 1)) {
      const textNode = this.createTextNode();
      this.insertBefore(node, textNode);
      this.insertBefore(node, brNode);
    } else {
      const caretIdx = this.getCaretIndex(node);
      this.insertWithin(node, brNode, caretIdx);
      targetNode = brNode.nextSibling;
    }
    this.setCaretIndex(targetNode, 1);

    return true;
  }

  insertEmphasis(key, node) {
    const emNode = document.createElement('em');
    emNode.className = 'link';
    emNode.textContent = '#';

    if (this.caretAt(node, -1)) {
      this.insertAfter(node, emNode);
    } else if (this.caretAt(node, 1)) {
      this.insertBefore(node, this.createTextNode());
      this.insertBefore(node, emNode);
    } else {
      const caretIdx = this.getCaretIndex(node);
      this.insertWithin(node, emNode, caretIdx);
    }
    this.setCaretIndex(emNode, 1);

    return true;
  }

  insertText(text) {
    let node = document.getSelection().focusNode;
    if (!this.multiline) text = text.replace(/\n/g, ' ');

    if (node.nodeName == '#text') {
      const caretIdx = this.getCaretIndex(node);
      const leftOfCaret = node.textContent.slice(0, caretIdx);
      const rightOfCaret = node.textContent.slice(caretIdx);
      node.nodeValue = leftOfCaret + text + rightOfCaret;

      while (node.nodeValue.includes('\n')) {
        const breakIdx = node.nodeValue.indexOf('\n');
        this.setCaretIndex(node, breakIdx);
        this.insertBreak('', node);
        node = document.getSelection().focusNode;
        node.nodeValue = node.nodeValue.replace('\n', '');
      }
    }

    return true;
  }

  insertTextAtCursor(text) {
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection.getRangeAt && selection.rangeCount) {
        const range = selection.getRangeAt(0).cloneRange();
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);

        // move caret to the end of the newly inserted text node
        range.setStart(textNode, textNode.length);
        range.setEnd(textNode, textNode.length);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else if (document.selection && document.selection.createRange) {
      const range = document.selection.createRange();
      range.pasteHTML(text);
    }
  }

  finishEmphasis(key, node) {
    if (node.nodeValue == '#') {
      this.removeEmphasis(node);
      return true;
    }

    // remove link symbol and dir path for display
    const path = node.textContent.trim().substring(1);
    node.dataset.path = path.replace(/\/+/, '/');
    node.textContent = path.replace(/.*\//, '');

    // register click event for Node class
    $(node).on('click', (event) => {
      this.emClick(event.target);
    });

    let nextNode = node.nextSibling;
    if (nextNode == null || nextNode.nodeName != '#text') {
      const newNode = this.createTextNode();
      this.insertAfter(node, newNode);
      nextNode = newNode;
    }

    if (key == 'Tab') {
      if (!nextNode.textContent.startsWith(this.zeroSpace + ' ')) {
        nextNode.textContent = this.zeroSpace + this.space + nextNode.textContent.substring(1);
      }
      this.setCaretIndex(nextNode, 2);
    } else {
      this.setCaretIndex(nextNode, 1);
    }
    return true;
  }

  removeEmphasis(key, node) {
    if (node.nodeName == 'EM') {
      if (this.editEm && key == 'Backspace' && !this.caretAt(node, 1)) {
        return false;
      }
    } else if (node.nodeName == '#text' && key == 'Backspace' && this.caretAt(node, 1)) {
      node = node.previousSibling;
      if (node == null || node.nodeName == '#text') {
        return node == null;
      }
    } else if (node.nodeName == '#text' && key == 'Delete' && this.caretAt(node, -1)) {
      node = node.nextSibling;
      if (node == null || node.nodeName == '#text') {
        return false;
      }
    } else {
      return false;
    }

    const before = node.previousSibling;
    const after = node.nextSibling;
    this.div.removeChild(node);

    if (before != null && after != null) {
      const caretIdx = before.textContent.length;
      this.mergeInto(before, after);
      this.setCaretIndex(before, caretIdx);
    } else if (after != null) {
      this.setCaretIndex(after, 0);
    } else if (before != null) {
      this.setCaretIndex(before, -1);
    }
    return true;
  }

  typeNode(node) {
    if (node.nodeName === '#text' && node.parentNode.nodeName !== 'DIV') {
      node = node.parentNode;
    }
    return node;
  }

  textNode(node) {
    if (node.nodeName !== '#text') {
      node = node.firstChild;
    }
    return node;
  }

  getCaretIndex(node) {
    node = this.textNode(node);

    let caretIdx = 0;
    const selection = window.getSelection();
    if (selection.rangeCount !== 0) {
      const range = window.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(node);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretIdx = preCaretRange.toString().length;
    }
    return caretIdx;
  }

  setCaretIndex(node, caretIdx) {
    node = this.textNode(node);
    if (caretIdx < 0) {
      caretIdx += node.nodeValue.length + 1;
    }

    const sel = window.getSelection();
    const range = document.createRange();
    range.setStart(node, caretIdx);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  caretAt(node, caretIdx) {
    node = this.textNode(node);
    if (caretIdx < 0) {
      caretIdx += node.nodeValue.length + 1;
    }
    return this.getCaretIndex(node) == caretIdx;
  }

  createTextNode(content = '') {
    return document.createTextNode(this.zeroSpace + content);
  }

  insertBefore(node, before) {
    return this.div.insertBefore(before, node);
  }

  insertAfter(node, after) {
    const nextNode = node.nextSibling;
    if (nextNode == null) {
      return this.div.appendChild(after);
    } else {
      return this.div.insertBefore(after, nextNode);
    }
  }

  insertWithin(node, newNode, caretIdx) {
    if (node.nodeName != '#text') return null;

    const leftOfCaret = node.textContent.slice(0, caretIdx);
    const rightOfCaret = node.textContent.slice(caretIdx);
    node.textContent = leftOfCaret;
    const nextNode = this.createTextNode(rightOfCaret);
    this.insertAfter(node, nextNode);
    this.insertAfter(node, newNode);
    return newNode;
  }

  mergeInto(leftNode, rightNode) {
    if (leftNode.nodeName != '#text' ||
        rightNode.nodeName != '#text') return null;

    leftNode.nodeValue = leftNode.nodeValue.replace(/\s$/, ' ');
    leftNode.nodeValue += rightNode.nodeValue.replace(this.zeroSpace, '');
    this.div.removeChild(rightNode);
    return leftNode;
  }

  findDuplicate(tagType) {
    let lastNode = null;
    for (const node of this.div.childNodes) {
      if (lastNode != null &&
          lastNode.nodeName == tagType &&
          node.nodeName == tagType) break;
      lastNode = node;
    }
    return lastNode.nextSibling;
  }

  getSelected() {
    let selectedText = window.getSelection().toString();
    selectedText = selectedText.replace(new RegExp(this.zeroSpace, 'g'), '');
    selectedText = selectedText.replace(new RegExp(this.space, 'g'), ' ');
    return selectedText;
  }

  deleteSelected() {
    window.getSelection().deleteFromDocument();
    let node = document.getSelection().focusNode;
    node = this.textNode(node);

    const nextNode = node.nextSibling;
    if (this.caretAt(node, -1) && nextNode != null && nextNode.nodeName == '#text') {
      const caretIdx = this.getCaretIndex(node);
      this.mergeInto(node, nextNode);
      this.setCaretIndex(node, caretIdx);
    }
  }
}

module.exports = DivEdit;
