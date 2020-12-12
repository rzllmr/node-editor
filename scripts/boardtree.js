
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

    this.createItem('leaf', 'main');
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
    for (const entry of itemList) {
      this.createItem(entry.type, entry.name, entry.level);
    }
  }
}

module.exports = BoardTree;
