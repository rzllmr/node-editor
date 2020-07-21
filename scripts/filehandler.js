
const Proxy = require('./proxy.js');
const fs = require('fs');


class FileHandler {
  constructor(boardTree) {
    this.boardTree = boardTree;

    this.proxy = new Proxy();
    this.newButton = $('#new.tool');
    this.saveButton = $('#save.tool');
    this.saveAsButton = $('#save-as.tool');
    this.loadButton = $('#load.tool');

    this.dialog = require('electron').remote.dialog;
    this.window = require('electron').remote.getCurrentWindow();
    this.title = this.window.getTitle();
    this.current = null;

    this.contentChanged = true;
    // TODO: consider content changes

    this.register();
  }

  register() {
    this.newButton.click(this.new.bind(this));
    this.saveButton.click(this.save.bind(this));
    this.saveAsButton.click(this.saveAs.bind(this));
    this.loadButton.click(this.load.bind(this));
  }

  new() {
    if (this.clear()) {
      this.boardTree.createItem('leaf', 'main');
    }
  }

  clear() {
    let cancel = false;
    if (this.contentChanged) {
      cancel = this.dialog.showMessageBoxSync(null, {
        type: 'warning',
        title: 'Warning',
        message: 'Discard changes?',
        detail: 'Your unsaved data will be lost.',
        buttons: ['OK', 'Cancel']
      }) == 1;
    }
    if (!cancel) {
      this.current = null;
      this.boardTree.clear();
      this.window.setTitle(this.title);
    }
    return !cancel;
  }

  gatherContent() {
    const boards = {};

    boards['TOC'] = this.boardTree.export();

    for (const entry of this.proxy.mapping) {
      if (entry[0] == undefined || entry[1].export == undefined ||
        entry[1].constructor.name === 'BoardTree') continue;
      const data = entry[1].export();
      const boardId = data.board;
      delete data.board;
      if (!boards[boardId]) boards[boardId] = [];
      boards[boardId].push(data);
    }
    return JSON.stringify(boards).replace(/(},|\[)/g, '$1\n  ').replace(/(],)/g, '$1\n');
  }

  save() {
    let filePath = this.current;
    if (!filePath) {
      filePath = this.dialog.showSaveDialogSync({
        filters: [{name: 'Save File', extensions: ['json']}]
      });
      if (!filePath) return;
    }

    fs.writeFile(filePath, this.gatherContent(), 'utf8', (error) => {
      if (error) {
        alert(`An error ocurred creating the file ${filePath}:\n${error.message}`);
      } else {
        this.current = filePath;
        this.window.setTitle(this.title + ' - ' + this.current);
      }
    });
  }

  saveAs() {
    const filePath = this.dialog.showSaveDialogSync({
      filters: [{name: 'Save File', extensions: ['json']}]
    });
    if (!filePath) return;
    fs.writeFile(filePath, this.gatherContent(), 'utf8', (error) => {
      if (error) {
        alert(`An error ocurred creating the file ${filePath}:\n${error.message}`);
      } else {
        this.current = filePath;
        this.window.setTitle(this.title + ' - ' + this.current);
      }
    });
  }

  load() {
    if (!this.clear()) return;

    const filePaths = this.dialog.showOpenDialogSync({
      properties: ['openFile'],
      filters: [{name: 'Save File', extensions: ['json']}]
    });
    if (!filePaths) {
      this.boardTree.createItem('leaf', 'main');
      return;
    }
    fs.readFile(filePaths[0], 'utf8', (error, content) => {
      if (error) {
        alert(`An error ocurred reading the file ${filePaths[0]}:\n${error.message}`);
      } else {
        const classes = new Map();
        const boards = JSON.parse(content);
        if (boards.TOC) {
          this.boardTree.import(boards.TOC);
          delete boards.TOC;
        }
        for (const [boardId, entries] of Object.entries(boards)) {
          for (const entry of entries) {
            if (!classes.has(entry.type)) classes.set(entry.type, require(`./${entry.type}.js`));
            classes.get(entry.type).import(entry, boardId);
          }
        }
        this.current = filePaths[0];
        this.window.setTitle(this.title + ' - ' + this.current);
      }
    });
  }
}

module.exports = FileHandler;
