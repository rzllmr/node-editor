
const Proxy = require('./proxy.js');
const fs = require('fs');


class FileHandler {
  constructor() {
    this.proxy = new Proxy();
    this.saveButton = $('#save.tool');
    this.loadButton = $('#load.tool');

    this.filePath = './save.json';

    this.register();
  }

  register() {
    this.saveButton.click(this.save.bind(this));
    this.loadButton.click(this.load.bind(this));
  }

  save() {
    const board = [];

    for (const entry of this.proxy.mapping) {
      if (entry[0] == undefined || entry[1].export == undefined) continue;
      board.push(entry[1].export());
    }

    const content = JSON.stringify(board).replace(/},/g, '},\n');

    fs.writeFile(this.filePath, content, 'utf8', (error) => {
      if (error) {
        alert(`An error ocurred creating the file ${filePath}:\n${error.message}`);
      }
    });
  }

  load() {
    fs.readFile(this.filePath, 'utf8', (error, content) => {
      if (error) {
        alert(`An error ocurred reading the file ${filePath}:\n${error.message}`);
      } else {
        const classes = new Map();
        const board = JSON.parse(content);
        for (const entry of board) {
          if (!classes.has(entry.type)) classes.set(entry.type, require(`./${entry.type}.js`));
          classes.get(entry.type).import(entry);
        }
      }
    });
  }
}

module.exports = FileHandler;
