
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
    this.icon.css('margin-left', ((level-1) * 20 + 10) +'px');
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

  expand(toggle = true) {
    if (this.type !== 'branch') return;
    if (toggle) {
      this.nested.show();
      this.icon[0].className = 'fa fa-folder-open-o';
    } else {
      this.nested.hide();
      this.icon[0].className = 'fa fa-folder';
    }
    this.expanded = toggle;
  }
}

class TreeView extends Proxy {
  constructor(id = null) {
    super(id);

    this.element = $('#' + id);
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

    const lastItem = new TreeItem('leaf', 'add new...');
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

  createItemAtPath(path, lastType) {
    path = path.split('/').filter((str) => str != '');

    let pathIdx = 0;
    let lastBefore = null;
    for (let itemIdx = 0; itemIdx < this.items.length - 1; itemIdx++) {
      const item = this.items[itemIdx];
      if (item.level == pathIdx + 1 && item.name == path[pathIdx] &&
          item.type == (pathIdx < path.length-1 ? 'branch' : lastType)) {
        pathIdx++;
        if (pathIdx == path.length) {
          path[--pathIdx] = this.uniqueName(this.siblingItems(item, true), path[pathIdx]);
        }
      } else if (item.level < pathIdx + 1) {
        break;
      }
      lastBefore = item;
    }

    for (; pathIdx < path.length; pathIdx++) {
      const level = pathIdx + 1;
      const name = path[pathIdx];
      const type = pathIdx == path.length-1 ? lastType : 'branch';
      const newItem = new this.ItemType(type, name);
      this.addItem([newItem], lastBefore, level);
      lastBefore = newItem;
    }
    return lastBefore;
  }

  siblingItems(item, includeSelf = false) {
    let itemIdx = item.parent instanceof TreeView ? 0 :
      this.items.indexOf(item.parent) + 1;
    const items = [];
    for (; itemIdx < this.items.length; itemIdx++) {
      const currentItem = this.items[itemIdx];
      if (currentItem.level > item.level ||
        currentItem.type != item.type ||
        !includeSelf && currentItem == item) continue;
      else if (currentItem.level < item.level) break;
      else items.push(currentItem);
    }
    return items;
  }

  uniqueName(items, name) {
    // generate names until unique
    const itemNames = items.map((item) => item.name);
    let changed;
    do {
      changed = false;
      if (itemNames.includes(name)) {
        const match = name.match(/\s*\(([0-9]+)\)$/);
        if (match == null) {
          name += ' (1)';
        } else {
          const increment = Number(match[1]) + 1;
          name = name.replace(match[0], ` (${increment})`);
        }
        changed = true;
      }
    } while (changed);
    return name;
  }

  registerTools() {
    // adding items
    this.toolbar.find('#new-board').click(() => {
      this.createItemAtPath('/new item', 'leaf');
      this.toolbar.find('#new-board, #new-folder').hide();
    });
    this.toolbar.find('#new-folder').click(() => {
      this.createItemAtPath('/new folder', 'branch');
      this.toolbar.find('#new-board, #new-folder').hide();
    });

    // renaming items
    this.toolbar.find('#rnm-board').click(() => {
      // overlay renaming input
      this.rnmInput.width(203 - this.hovered.label.offsetLeft);
      this.rnmInput.val(this.hovered.name);
      this.rnmInput.show();
      this.rnmInput.focus();
      this.rnmInput.select();
      this.menuCover.show();
      this.toolbar.find('#rnm-board, #del-board').hide();
    });
    this.rnmInput.on('change blur keydown', (event) => {
      if (event.type === 'keydown' && !['Enter', 'Escape'].includes(event.key)) return;

      const newName = this.rnmInput.val();
      const uniqueName = this.uniqueName(this.siblingItems(this.hovered), newName);
      if (newName !== uniqueName) {
        this.rnmInput.val(uniqueName);
        this.rnmInput.select();
        return false;
      }

      const oldPath = this.getItemPath(this.hovered);
      this.hovered.setName(this.rnmInput.val());
      const newPath = this.getItemPath(this.hovered);
      this.updateBoardLinks(oldPath, newPath);

      this.rnmInput.hide();
      this.menuCover.hide();
      this.toolbar.find('#rnm-board, #del-board').show();
    });

    // deleting items
    this.toolbar.find('#del-board')[0].disabled = true;
    this.toolbar.find('#del-board').click(() => {
      this.menuCover.show();
      this.toolbar.find('#rnm-board, #del-board').hide();
      this.toolbar.find('#del-confirm span').css(
          'margin-right', 67 - this.hovered.label.offsetLeft);
      this.toolbar.find('#del-confirm').show();
    });
    this.toolbar.find('#apply-del, #discard-del').click((event) => {
      if (event.currentTarget.id === 'apply-del') {
        if (this.hovered == this.selected) this.selectItem(this.items[0]);
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

    this.element.on('treeview:createFromLink', (event, emNode) => {
      const path = emNode.dataset.path;
      let item = this.getItem(path, 'leaf');
      if (item == null || item.type == 'branch') {
        item = this.createItemAtPath(path, 'leaf');
      }
      this.selectItem(item);
      emNode.dataset.path = this.getItemPath(item);
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
        item.expand(!item.expanded);
      });
    }
    element.on({
      'mouseenter': (event) => {
        if (event.buttons === 1 && this.dragged != null) {
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
        if (item == this.items[this.items.length-1]) return;
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
        const oldPaths = removed.filter((i) => i.type == 'leaf').map((i) => this.getItemPath(i));
        this.addItem(removed, itemBefore);
        const uniqueName = this.uniqueName(this.siblingItems(removed[0]), removed[0].name);
        removed[0].setName(uniqueName);
        const newPaths = removed.filter((i) => i.type == 'leaf').map((i) => this.getItemPath(i));
        oldPaths.forEach((_, idx) => this.updateBoardLinks(oldPaths[idx], newPaths[idx]));
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

    if (this.items.length == 2) {
      this.toolbar.find('#del-board')[0].disabled = true;
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
    if (this.items.length > 2) {
      this.toolbar.find('#del-board')[0].disabled = false;
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
      const offsetLevel = Math.floor((offsetX - 10) / 20) + 1;
      level = offsetLevel.clamp(levelAfter, levelBefore);
    }
    this.insertLevel = level;

    let element = item.element;
    if (item.type === 'branch') element = element.find('span.branch');

    this.insertLine.show();
    this.insertLine.offset({top: element.offset().top - 1});
    this.insertLine.width(element.width() - ((level-1) * 20 + 10));
  }

  getItem(path, type = null) {
    const name = path.replace(/.*\//, '');
    const checkPath = name !== path;
    for (const item of this.items) {
      if (item.name === name && (type == null || item.type === type)) {
        if (checkPath && !('/' + this.getItemPath(item)).endsWith('/' + path)) {
          continue;
        }
        return item;
      }
    }
    return null;
  }

  getItemBefore(item) {
    const idx = this.items.indexOf(item);
    return idx > 0 ? this.items[idx-1] : null;
  }

  getItemPath(item) {
    const path = [];
    while (item instanceof TreeItem) {
      path.push(item.name);
      item = item.parent;
    }
    return '/' + path.reverse().join('/');
  }

  updateBoardLinks(oldPath, newPath) {
    $('em.link').each((_, emNode) => {
      if (emNode.dataset.path == oldPath) {
        emNode.dataset.path = newPath;
        emNode.textContent = newPath.replace(/.*\//, '');
      }
    });
  }

  selectItem(item) {
    if (this.selected === item) return;
    if (this.selected !== null) this.selected.select(false);
    if (item !== null) item.select(true);
    this.selected = item;

    this.expandPath(item);
  }

  expandPath(item, toggle = true) {
    while (item instanceof TreeItem) {
      if (item.type === 'branch') {
        item.expand(toggle);
      }
      item = item.parent;
    }
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
