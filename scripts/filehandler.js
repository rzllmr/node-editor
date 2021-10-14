
const Proxy = require('./proxy.js');
const fs = require('fs');
const path = require('path');


class FileHandler {
  constructor(boardTree) {
    this.boardTree = boardTree;

    this.proxy = new Proxy();
    this.newButton = $('#new.tool');
    this.saveButton = $('#save.tool');
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
    this.saveButton.click(this.saveAs.bind(this));
    this.loadButton.click(this.load.bind(this));
  }

  new() {
    if (this.clear()) {
      this.boardTree.createDefault();
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

  relativePaths(data, filePath) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof(value) == 'string' && value.startsWith('file://')) {
        const fileDir = path.dirname(filePath);
        const imagePath = value.replace('file://', '');
        let relativePath = path.relative(fileDir, imagePath);
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        data[key] = 'file://' + relativePath;
        console.log('save', data[key]);
      }
    }
    return data;
  }

  absolutePaths(data, filePath) {
    for (const [key, value] of Object.entries(data)) {
      if (typeof(value) == 'string' && value.startsWith('file://')) {
        const fileDir = path.dirname(filePath);
        const imagePath = value.replace('file://', '');
        data[key] = path.resolve(fileDir, imagePath);
        console.log('load', data[key]);
      }
    }
    return data;
  }

  gatherContent(filePath) {
    const boards = {};

    boards['TOC'] = this.boardTree.export();

    for (const entry of this.proxy.mapping) {
      if (entry[0] == undefined || entry[1].export == undefined ||
        entry[1].constructor.name === 'BoardTree') continue;
      let data = entry[1].export();
      data = this.relativePaths(data, filePath);
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
        filters: [{name: 'Project', extensions: ['json']}],
        defaultPath: this.current || ''
      });
      if (!filePath) return;
    }

    fs.writeFile(filePath, this.gatherContent(filePath), 'utf8', (error) => {
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
      filters: [{name: 'Project', extensions: ['json']}],
      defaultPath: this.current || ''
    });
    if (!filePath) return;
    fs.writeFile(filePath, this.gatherContent(filePath), 'utf8', (error) => {
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
      filters: [{name: 'Project', extensions: ['json']}]
    });
    if (!filePaths) {
      this.boardTree.createDefault();
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
          for (let entry of entries) {
            entry = this.absolutePaths(entry, filePaths[0]);
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
