
const Proxy = require('./proxy.js');
const fs = require('fs');


class FileHandler {
  constructor() {
    this.proxy = new Proxy();
    this.newButton = $('#new.tool');
    this.saveButton = $('#save.tool');
    this.saveAsButton = $('#save-as.tool');
    this.loadButton = $('#load.tool');

    this.dialog = require('electron').remote.dialog;
    this.window = require('electron').remote.getCurrentWindow();
    this.title = this.window.getTitle();
    this.current = null;

    this.register();
  }

  register() {
    this.newButton.click(this.clear.bind(this));
    this.saveButton.click(this.save.bind(this));
    this.saveAsButton.click(this.saveAs.bind(this));
    this.loadButton.click(this.load.bind(this));
  }

  clear() {
    const board = this.proxy.resolve('main');
    let cancel = false;
    console.log(board.nodes);
    if (board.nodes.size > 0) {
      cancel = this.dialog.showMessageBox(null, {
        type: 'warning',
        title: 'Warning',
        message: 'Clear board?',
        detail: 'Your unsaved data will be lost.',
        buttons: ['OK', 'Cancel']
      }) == 1;
    }
    if (!cancel) {
      board.clear();
      this.current = null;
      this.window.setTitle(this.title);
    }
  }

  gatherContent() {
    const board = [];
    for (const entry of this.proxy.mapping) {
      if (entry[0] == undefined || entry[1].export == undefined) continue;
      board.push(entry[1].export());
    }
    return JSON.stringify(board).replace(/},/g, '},\n');
  }

  save() {
    let filePath = this.current;
    if (!filePath) {
      filePath = this.dialog.showSaveDialog({
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
    const filePath = this.dialog.showSaveDialog({
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
    this.clear();

    const filePaths = this.dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{name: 'Save File', extensions: ['json']}]
    });
    if (!filePaths) return;
    fs.readFile(filePaths[0], 'utf8', (error, content) => {
      if (error) {
        alert(`An error ocurred reading the file ${filePaths[0]}:\n${error.message}`);
      } else {
        const classes = new Map();
        const board = JSON.parse(content);
        for (const entry of board) {
          if (!classes.has(entry.type)) classes.set(entry.type, require(`./${entry.type}.js`));
          classes.get(entry.type).import(entry);
        }
        this.current = filePaths[0];
        this.window.setTitle(this.title + ' - ' + this.current);
      }
    });
  }
}

module.exports = FileHandler;
