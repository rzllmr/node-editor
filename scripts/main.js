
const {app, BrowserWindow} = require('electron');
const env = require('./env.js');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      nodeIntegration: true
    }
  });
  win.setMenuBarVisibility(false);
  win.webContents.session.clearCache(() => {});

  win.loadFile('index.html');

  if (env.debug) {
    win.webContents.openDevTools();
  }

  win.on('closed', () => {
    win = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // support macOS standard to keep application running until quit explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // support macOS standard to open a new window when none is present
  if (win === null) {
    createWindow();
  }
});
