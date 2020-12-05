
class DivEdit {
  constructor(divNode) {
    this.div = divNode;

    this.char = {
      space: '\u00A0',
      zeroSpace: '\u200B',
      zeroAndSpace: '\u200B\u00A0'
    };
  }

  registerKeys(emClick) {
    this.emClick = emClick;
    this.editEm = false;
    $(this.div).on({
      keydown: (event) => {
        const key = event.key;
        let node = document.getSelection().focusNode;
        node = this.typeNode(node);

        let handled = false;
        if (node.nodeName == 'EM') {
          if (this.editEm) {
            if (['Tab', 'Enter'].includes(key)) {
              handled = this.finishEmphasis(key, node);
              this.editEm = !handled;
            } else if (['Escape', 'Backspace'].includes(key)) {
              handled = this.removeEmphasis(key, node);
              this.editEm = !handled;
            } else if (key.startsWith('Arrow')) {
              if (['ArrowUp', 'ArrowDown'].includes(key) ||
                  key == 'ArrowLeft' && this.getCaretIndex(node) == 1 ||
                  key == 'ArrowRight' && this.getCaretIndex(node) == node.textContent.length) {
                handled = true;
              }
            }
          } else {
            if (key.startsWith('Arrow')) {
              handled = this.handleNavigation(key, node);
            } else if (['Backspace', 'Delete'].includes(key)) {
              handled = this.removeEmphasis(key, node);
            } else {
              handled = true;
            }
          }
        } else if (node.nodeName == '#text') {
          if (['ArrowLeft', 'ArrowRight'].includes(key)) {
            handled = this.handleNavigation(key, node);
          } else if (key == '#') {
            handled = this.insertEmphasis(key, node);
            this.editEm = handled;
          } else if (['Backspace', 'Delete'].includes(key)) {
            handled = this.removeEmphasis(key, node);
          }
        } else if (node.nodeName == 'DIV') {
          if (key == '#') {
            handled = this.insertEmphasis(key, node);
            this.editEm = true;
          }
        }
        return !handled;
      }
    });
  }

  handleNavigation(key, node) {
    if (key == 'ArrowLeft') {
      let emNode;
      if (node.nodeName == '#text' && this.getCaretIndex(node) == 1) {
        emNode = node.previousSibling;
      } else if (node.nodeName == 'EM') {
        emNode = node;
      } else {
        return false;
      }

      if (emNode == null || emNode.nodeName != 'EM') {
        return false;
      }
      let textNode = emNode.previousSibling;
      if (textNode == null || textNode.nodeName != '#text') {
        textNode = this.createTextNode();
        this.insertBefore(emNode, textNode);
      } else if (textNode.nodeValue.length == 0) {
        textNode.textContent = this.char.zeroSpace;
      }
      this.setCaretIndex(textNode, textNode.textContent.length);
      if (node.textContent == this.char.zeroSpace) {
        this.div.removeChild(node);
      }
    } else if (key == 'ArrowRight') {
      let emNode;
      if (node.nodeName == '#text' && this.getCaretIndex(node) == node.nodeValue.length) {
        emNode = node.nextSibling;
      } else if (node.nodeName == 'EM') {
        emNode = node;
      } else {
        return false;
      }

      if (emNode == null || emNode.nodeName != 'EM') {
        return false;
      }
      let textNode = emNode.nextSibling;
      if (textNode == null || textNode.nodeName != '#text') {
        textNode = this.createTextNode();
        this.insertAfter(emNode, textNode);
      } else if (textNode.nodeValue.length == 0) {
        textNode.textContent = this.char.zeroSpace;
      }
      this.setCaretIndex(textNode, 1);
      if (node.textContent == this.char.zeroSpace) {
        this.div.removeChild(node);
      }
    } else {
      return false;
    }

    return true;
  }

  insertEmphasis(key, node) {
    const emNode = document.createElement('em');
    emNode.className = 'link';
    // setting the caret inside requires content
    emNode.textContent = '#'; // alt: zero-width space '\u200B'

    if (node == this.div) {
      this.div.appendChild(emNode);
      this.setCaretIndex(emNode, 1);
      return true;
    }

    const caretPosition = this.getCaretIndex(node);

    if (caretPosition == 1) {
      this.insertBefore(node, emNode);
      if (!node.textContent.startsWith(this.char.zeroSpace)) {
        node.textContent = this.char.zeroSpace + node.textContent;
      }
    } else if (caretPosition == node.nodeValue.length) {
      this.insertAfter(node, emNode);
    } else {
      // split text node and insert between
      const leftOfCaret = node.textContent.slice(0, caretPosition);
      const rightOfCaret = node.textContent.slice(caretPosition);
      node.textContent = leftOfCaret;
      const nextNode = this.createTextNode(rightOfCaret);
      this.insertAfter(node, nextNode);
      this.insertAfter(node, emNode);
    }
    this.setCaretIndex(emNode, 1);

    return true;
  }

  finishEmphasis(key, node) {
    if (node.nodeValue == '#') {
      this.removeEmphasis(node);
      return true;
    }

    // remove link symbol and dir path for display
    const path = node.textContent.trim().substring(1);
    node.dataset.path = path;
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
      if (!nextNode.textContent.startsWith(this.char.zeroAndSpace)) {
        nextNode.textContent = this.char.zeroAndSpace + nextNode.textContent.substring(1);
      }
      this.setCaretIndex(nextNode, 2);
    } else {
      this.setCaretIndex(nextNode, 1);
    }
    return true;
  }

  removeEmphasis(key, node) {
    if (node.nodeName == 'EM') {
      if (this.editEm && key == 'Backspace' && this.getCaretIndex(node) != 1) {
        return false;
      }
      // node already is em
    } else if (node.nodeName == '#text' && key == 'Backspace' &&
               this.getCaretIndex(node) == 1) {
      node = node.previousSibling;
      if (node == null || node.nodeName != 'EM') {
        return false;
      }
    } else if (node.nodeName == '#text' && key == 'Delete' &&
               this.getCaretIndex(node) == node.textContent.length) {
      node = node.nextSibling;
      if (node == null || node.nodeName != 'EM') {
        return false;
      }
    } else {
      return false;
    }

    const before = node.previousSibling;
    const after = node.nextSibling;

    this.div.removeChild(node);

    if (before != null && after != null) {
      // merge node after into node before
      const caretPosition = before.textContent.length;
      before.nodeValue += after.nodeValue.substring(1);
      this.div.removeChild(after);
      this.setCaretIndex(before, caretPosition);
    } else if (after != null) {
      this.setCaretIndex(after, 0);
    } else if (before != null) {
      this.setCaretIndex(before, before.textContent.length);
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

    let position = 0;
    const selection = window.getSelection();
    if (selection.rangeCount !== 0) {
      const range = window.getSelection().getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(node);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      position = preCaretRange.toString().length;
    }
    return position;
  }

  setCaretIndex(node, position) {
    node = this.textNode(node);

    const sel = window.getSelection();
    const range = document.createRange();
    range.setStart(node, position);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  createTextNode(content = '') {
    content = content.replace(' ', this.char.space);
    return document.createTextNode(this.char.zeroSpace + content);
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
}

module.exports = DivEdit;
