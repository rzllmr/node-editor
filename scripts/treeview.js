
const Proxy = require('./proxy.js');

class TreeItem {
  constructor(type, name) {
    this.type = type;
    this.element = $(`#${type}-template`).clone();
    this.element.removeAttr('id');
    this.element.removeAttr('style');
    this.icon = this.element.find('i');

    this.setName(name);
    this.parent = null;
    this.level = 0;

    if (type === 'branch') {
      this.expanded = false;
      this.nested = this.element.find('ul.nested');
    }
    this.data = null;
  }

  delete() {
    this.element.remove();
    this.setName('');
    this.level = 0;
    this.element = null;
    this.icon = null;
    this.nested = null;
  }

  setName(name) {
    this.element.find('span.selector:first').text(name);
    this._name = name;
  }
  get name() {
    return this._name;
  }

  set level(level) {
    this.icon.css('margin-left', ((level-1) * 15 + 5) +'px');
    this._level = level;
  }
  get level() {
    return this._level;
  }

  get label() {
    return this.element.find('span.selector')[0];
  }

  select(doSelect) {
    if (doSelect) this.element.addClass('selected');
    else this.element.removeClass('selected');
  }

  hasParent(parent) {
    if (this.parent === null || this.parent.parent === undefined) return false;
    else if (this.parent === parent) return true;
    else return this.parent.hasParent(parent);
  }
}

class TreeView extends Proxy {
  constructor(selector = null) {
    super(selector);

    this.element = $(selector);
    this.nested = this.element.find('.treeview');
    this.level = 0;
    this.items = [];
    this.selected = null;
    this.hovered = null;
    this.dragged = null;
    this.insertLevel = 1;

    this.toolbar = $('#tree-tools');
    this.rnmInput = this.toolbar.find('input.selector');
    this.insertLine = this.element.find('.insert-line');
    this.menuCover = $('#menu .overlay');
    this.registerTools();

    this.ItemType = TreeItem;

    const lastItem = new TreeItem('leaf', 'add item...');
    lastItem.element.find('i')[0].className = 'fa fa-plus';
    this.addItem([lastItem], this, 1);
  }

  clear() {
    const leaves = [];
    const branches = [];
    for (let i = 0; i < this.items.length-1; i++) {
      const item = this.items[i];
      if (item.type === 'leaf') {
        leaves.push(item);
      } else {
        branches.push(item);
      }
    }
    this.selectItem(null);
    for (const item of leaves) {
      this.removeItem(item);
      item.delete();
    }
    for (const item of branches) {
      this.removeItem(item);
    }
  }

  createItem(type, name, level = 1) {
    const item = new this.ItemType(type, name);
    const lastItem = this.items[this.items.length - 2];
    this.addItem([item], lastItem, level);
    this.toolbar.find('#new-board, #new-folder').hide();
    if (type === 'leaf') this.selectItem(item);
  }

  registerTools() {
    // adding items
    this.toolbar.find('#new-board').click(() => {
      this.createItem('leaf', 'new item');
    });
    this.toolbar.find('#new-folder').click(() => {
      this.createItem('branch', 'new item');
    });

    // renaming items
    this.toolbar.find('#rnm-board').click(() => {
      // overlay renaming input
      this.rnmInput.width(140 - this.hovered.label.offsetLeft);
      this.rnmInput.val(this.hovered.name);
      this.rnmInput.show();
      this.rnmInput.focus();
      this.rnmInput.select();
      this.menuCover.show();
      this.toolbar.find('#rnm-board, #del-board').hide();
    });
    this.rnmInput.on('change blur', (event) => {
      this.hovered.setName(this.rnmInput.val());
      this.rnmInput.hide();
      this.menuCover.hide();
      this.toolbar.find('#rnm-board, #del-board').show();
    });

    // deleting items
    this.toolbar.find('#del-board').click(() => {
      this.menuCover.show();
      this.toolbar.find('#rnm-board, #del-board').hide();
      this.toolbar.find('#del-confirm').show();
    });
    this.toolbar.find('#apply-del, #discard-del').click((event) => {
      if (event.currentTarget.id === 'apply-del') {
        this.removeItem(this.hovered);
        this.hovered.delete();
        this.hovered = null;
      }
      this.toolbar.find('#del-confirm').hide();
      this.toolbar.find('#rnm-board, #del-board').show();
      this.menuCover.hide();
    });

    // register general mouseleave
    this.toolbar.on('mouseleave', (event) => {
      if (event.toElement.tagName === 'svg') {
        this.hoverItem(null);
      }
    });
  }

  registerItem(item) {
    let element = item.element;
    if (item.type === 'leaf') {
      element.click(() => {
        if (this.items.indexOf(item) !== this.items.length-1) {
          this.selectItem(item);
        }
      });
    } else {
      element = element.find('span.branch');
      element.off('click');
      element.click(() => {
        if (item.expanded) {
          item.nested.hide();
          item.icon[0].className = 'fa fa-folder';
        } else {
          item.nested.show();
          item.icon[0].className = 'fa fa-folder-open-o';
        }
        item.expanded = !item.expanded;
      });
    }
    element.on({
      'mouseenter': (event) => {
        if (event.buttons === 1) {
          element.addClass('insert');
          this.drawInsertLine(item, event.offsetX);
          return;
        }
        this.hoverItem(item);
      },
      'mouseleave': (event) => {
        if (event.toElement &&
          (['BUTTON', 'I'].includes(event.toElement.tagName) ||
          event.toElement.className === 'overlay')) return;
        if (event.buttons === 1) {
          element.removeClass('insert');
          this.insertLine.hide();
          return;
        }
        this.hoverItem(null);
      },
      'mousedown': (event) => {
        if (event.buttons !== 1) return;
        this.dragged = item;
      },
      'mouseup': (event) => {
        if (event.button !== 0 || !element.hasClass('insert')) return;
        element.removeClass('insert');
        this.insertLine.hide();

        let itemBefore = this.getItemBefore(item);
        if (itemBefore !== null) {
          // prevent insert at same position or in itself
          if ((item === this.dragged && this.insertLevel <= this.dragged.level) ||
              (itemBefore === this.dragged || itemBefore.hasParent(this.dragged)) &&
              this.insertLevel >= this.dragged.level) {
            this.dragged = null;
            return;
          }
          // enable insertion after own parent or itself
          if (itemBefore === this.dragged) {
            itemBefore = this.getItemBefore(itemBefore);
          } else if (itemBefore.hasParent(this.dragged)) {
            itemBefore = this.getItemBefore(this.dragged);
          }
        }
        const removed = this.removeItem(this.dragged);
        this.addItem(removed, itemBefore);
        this.dragged = null;
      },
      'mouseover': (event) => {
        if (event.button !== 0 || !element.hasClass('insert')) return;
        this.drawInsertLine(item, event.offsetX);
      }
    });
  }

  removeItem(item) {
    const idx = this.items.indexOf(item);
    if (idx === -1) return;

    const toRemove = [];
    toRemove.push(idx);
    if (this.items[idx].type === 'branch') {
      let idxIt = idx;
      while (this.items[++idxIt].level > this.items[idx].level) {
        toRemove.push(idxIt);
      }
    }

    const removed = [];
    for (const i of toRemove.reverse()) {
      removed.push(this.items[i]);
      this.items[i].element.remove();
      this.items.splice(i, 1);
    }

    return removed.reverse();
  }

  addItem(itemList, itemBefore, level = null) {
    if (level === null) level = this.insertLevel;

    let idxBefore = this.items.indexOf(itemBefore);

    let idxIt = idxBefore;
    while (idxIt >= 0 && this.items[idxIt].level > level) idxIt--;
    itemBefore = idxIt < 0 ? this : this.items[idxIt];

    const levelDiff = level - itemList[0].level;
    for (const item of itemList) {
      item.level += levelDiff;
      if (itemBefore.level < item.level) {
        item.element.prependTo(itemBefore.nested);
        item.parent = itemBefore;
      } else {
        item.element.insertAfter(itemBefore.element);
        item.parent = itemBefore.parent;
      }
      this.items.splice(++idxBefore, 0, item);
      this.registerItem(item);
      itemBefore = item;
    }
  }

  drawInsertLine(item, offsetX) {
    // determine insert level
    const itemBefore = this.getItemBefore(item);
    let levelBefore = 0;
    if (itemBefore !== null) levelBefore = itemBefore.level + (itemBefore.type === 'leaf' ? 0 : 1);
    const levelAfter = item.level;
    let level = levelAfter;
    if (levelBefore > levelAfter) {
      const offsetLevel = Math.floor((offsetX - 5) / 15) + 1;
      level = offsetLevel.clamp(levelAfter, levelBefore);
    }
    this.insertLevel = level;

    let element = item.element;
    if (item.type === 'branch') element = element.find('span.branch');

    this.insertLine.show();
    this.insertLine.offset({top: element.offset().top - 1});
    this.insertLine.width(element.width() - ((level-1) * 15 + 5));
  }

  getItem(name) {
    for (const item of this.items) {
      if (item.name === name) return item;
    }
    return null;
  }

  getItemBefore(item) {
    const idx = this.items.indexOf(item);
    return idx > 0 ? this.items[idx-1] : null;
  }

  selectItem(item) {
    if (this.selected === item) return;
    if (this.selected !== null) this.selected.select(false);
    if (item !== null) item.select(true);
    this.selected = item;
  }

  hoverItem(item) {
    if (this.hovered !== null) {
      this.hovered.element.removeClass('hovered');
      this.hovered = null;
      this.toolbar.hide();
      this.toolbar.find('> button.tool').hide();
    }
    if (item !== null) {
      this.hovered = item;
      item.element.addClass('hovered');

      // overlay tools
      this.toolbar[0].style.top = item.element[0].offsetTop + 'px';
      this.toolbar.show();
      if (this.items.indexOf(item) === this.items.length-1) {
        this.toolbar.find('#new-board, #new-folder').show();
      } else {
        this.toolbar.find('#rnm-board, #del-board').show();
      }
    }
  }
}

module.exports = {TreeItem, TreeView};
