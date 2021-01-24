
class DivEdit {
  constructor(divNode, multiline = true) {
    this.div = divNode;
    this.multiline = multiline;

    // nodes require content, so we use
    // the zero width space character
    this.zeroSpace = '\u200B';
    this.space = '\u00A0';
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
                  key == 'ArrowLeft' && this.caretAt(node, 1) ||
                  key == 'ArrowRight' && this.caretAt(node, -1)) {
                handled = true;
              }
            } else if (key == '/') {
              // prevent multiple consecutive slashes
              const caretIdx = this.getCaretIndex(node);
              const surroundingChars = [
                node.textContent.charAt(caretIdx-1),
                node.textContent.charAt(caretIdx)
              ];
              handled = surroundingChars.includes('/');
            } else {
              const ignoredKeys = ['#'];
              handled = ignoredKeys.includes(key);
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
          } else if (['Enter', 'Escape'].includes(key)) {
            if (!(this.multiline && key == 'Enter' && !event.ctrlKey)) {
              this.div.blur();
              handled = true;
            } else {
              handled = this.insertBreak(key, node);
            }
          }
        } else if (node.nodeName == 'DIV') {
          if (key == '#') {
            handled = this.insertEmphasis(key, node);
            this.editEm = true;
          }
        }
        return !handled;
      },
      keyup: (event) => {
        const key = event.key;
        let node = document.getSelection().focusNode;
        node = this.typeNode(node);

        if (['ArrowUp', 'ArrowDown'].includes(key)) {
          if (this.caretAt(node, 0)) {
            this.setCaretIndex(node, 1);
          }
        } else if (['Backspace', 'Delete'].includes(key)) {
          if (node == this.div) {
            let newNode;
            if (this.div.firstChild == null) {
              newNode = this.createTextNode();
              this.div.appendChild(newNode);
            } else {
              const brNode = this.findDuplicate('BR');
              if (brNode != null) {
                newNode = this.createTextNode();
                this.insertBefore(brNode, newNode);
                if (brNode == this.div.lastChild) {
                  this.div.removeChild(brNode);
                }
              }
            }
            this.setCaretIndex(newNode, 1);
          } else if (this.caretAt(node, -1)) {
            const nextNode = node.nextSibling;
            if (nextNode != null && nextNode.nodeName == '#text') {
              const caretIdx = this.getCaretIndex(node);
              this.mergeInto(node, nextNode);
              this.setCaretIndex(node, caretIdx);
            }
          } else if (this.caretAt(node, 0)) {
            node.nodeValue = this.zeroSpace + node.nodeValue;
            this.setCaretIndex(node, 1);
          }
        }
      },
      focus: () => {
        let node = document.getSelection().focusNode;
        node = this.typeNode(node);

        if (this.div.firstChild == null) {
          node = this.div.appendChild(this.createTextNode());
        }
        if (this.caretAt(node, 0)) {
          this.setCaretIndex(node, 1);
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
  }

  static isEmpty(div) {
    if (div.childNodes.length == 1 &&
      div.firstChild.textContent == '\u200B') {
      return true;
    }
    return false;
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
}

module.exports = DivEdit;
