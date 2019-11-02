
const {TreeItem, TreeView} = require('./treeview.js');
const Board = require('./board.js');

class BoardItem extends TreeItem {
  constructor(type, name) {
    super(type, name);
    if (type === 'leaf') {
      this.data = new Board(this.toId(name));
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
    this.Item = BoardItem;

    this.createItem('leaf', 'main');
  }
}

module.exports = BoardTree;
