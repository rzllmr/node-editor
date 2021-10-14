
const {TreeItem, TreeView} = require('./treeview.js');
const Board = require('./board.js');

class BoardItem extends TreeItem {
  constructor(type, name, id = null) {
    super(type, name);
    if (type === 'leaf') {
      if (id == null) id = 'b' + ++BoardItem.boardIdxMax;
      this.data = new Board(id);
      // make new board invisible first
      this.select(false);
    }
  }

  delete() {
    if (this.data != null) this.data.destroy();
    super.delete();
  }

  select(doSelect) {
    super.select(doSelect);
    if (this.data != null) {
      this.data.element.css('visibility', doSelect ? 'visible' : 'hidden');
    }
  }
}

BoardItem.boardIdxMax = -1;

class BoardTree extends TreeView {
  constructor() {
    super('board-tree');
    this.ItemType = BoardItem;

    this.createDefault();
  }

  createDefault() {
    const mainItem = this.createItemAtPath('/Untitled', 'leaf');
    this.selectItem(mainItem);
  }

  export() {
    const itemList = [];
    for (let i = 0; i < this.items.length-1; i++) {
      const item = this.items[i];
      const board = {
        level: item.level,
        type: item.type,
        name: item.name,
        id: item.type == 'leaf' ? item.data.id : ''
      };
      itemList.push(board);
    }
    return itemList;
  }

  import(itemList) {
    let lastItem = null;
    BoardItem.boardIdxMax = -1;
    for (const entry of itemList) {
      if (!this.constructor.setDefaults(entry, {
        level: 1, type: undefined, name: 'Untitled', id: null
      })) return;

      const id = entry.id == null ? -1 : parseInt(entry.id.slice(1));
      if (id > BoardItem.boardIdxMax) BoardItem.boardIdxMax = id;
      const item = new this.ItemType(entry.type, entry.name, entry.id);
      this.addItem([item], lastItem, entry.level);
      if (this.selected == null && entry.type == 'leaf' && entry.level == 1) {
        this.selectItem(item);
      }
      lastItem = item;
    }
  }
}

module.exports = BoardTree;
