
const {TreeItem, TreeView} = require('./treeview.js');
const Board = require('./board.js');

class BoardItem extends TreeItem {
  constructor(type, name) {
    super(type, name);
    if (type === 'leaf') {
      this.data = new Board(this.toId(name));
      // make new board invisible first
      this.select(false);
    }
  }

  delete() {
    if (this.data != null) this.data.destroy();
    super.delete();
  }

  setName(name) {
    super.setName(name);
    if (this.data != null) this.data.element.attr('id', this.toId(name));
  }

  toId(name) {
    return name.length > 0 ? name.replace(' ', '_') : 'null';
  }

  select(doSelect) {
    super.select(doSelect);
    if (this.data != null) {
      this.data.element.css('visibility', doSelect ? 'visible' : 'hidden');
    }
  }
}

class BoardTree extends TreeView {
  constructor() {
    super('#board-tree');
    this.ItemType = BoardItem;

    this.createDefault();
  }

  createDefault() {
    const mainItem = this.createItemAtPath('/main', 'leaf');
    this.selectItem(mainItem);
  }

  export() {
    const itemList = [];
    for (let i = 0; i < this.items.length-1; i++) {
      const item = this.items[i];
      const board = {
        level: item.level,
        type: item.type,
        name: item.name
      };
      itemList.push(board);
    }
    return itemList;
  }

  import(itemList) {
    this.selectItem(null);
    let lastItem = null;
    for (const entry of itemList) {
      const item = new this.ItemType(entry.type, entry.name);
      this.addItem([item], lastItem, entry.level);
      if (this.selected == null && entry.type == 'leaf' && entry.level == 1) {
        this.selectItem(item);
      }
      lastItem = item;
    }
  }
}

module.exports = BoardTree;
