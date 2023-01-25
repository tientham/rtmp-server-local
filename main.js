const {NodeMediaServer} = require('node-media-server');
const getPort = require('get-port');
const electron = require('electron');
const path = require('path');
const { menubar: Menubar } = require('menubar');

require('electron-context-menu')();

const { app, BrowserWindow, Tray, Menu, ipcMain } = electron;

const currentStreams = new Set();
const ASSET_PATH = path.join(app.getAppPath(), 'assets');

function changeMenubarState() {
  if (currentStreams.size > 0) {
    // set recording
    menubar.tray.setImage(path.resolve(ASSET_PATH, 'img/recording.png'));
  } else {
    // set normal
    menubar.tray.setImage(path.resolve(ASSET_PATH, 'img/readyTemplate.png'));
  }
}

const menubar = Menubar({
  dir: ASSET_PATH,
  icon: path.resolve(ASSET_PATH, 'img/readyTemplate.png'),
  height: 200,
  transparent: true,
  preloadWindow: true,
  browserWindow: {
    height: 200,
    webPreferences: {
      nodeIntegration: true
    }
  }
});

(async () => {
  const port = await getPort();

  const nms = new NodeMediaServer({
    rtmp: {
      port: 1935,
      chunk_size: 60000,
      gop_cache: true,
      ping: 60,
      ping_timeout: 30
    },
    http: {
      port,
      mediaroot: './media',
      allow_origin: '*'
    },
    trans: {
      ffmpeg: '/opt/homebrew/bin/ffmpeg',
      tasks: [
        {
          app: 'live',
          ac: 'aac',
          hls: true,
          hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]'
        }
      ]
    }
  });

  nms.on('prePublish', id => {
    if (!currentStreams.has(id)) {
      currentStreams.add(id);
    }
    changeMenubarState();
  });

  nms.on('donePublish', id => {
    currentStreams.delete(id);
    changeMenubarState();
  });

  nms.run();

  menubar.on('ready', () => {
    changeMenubarState();
  });

  ipcMain.on('app-ready', event => {
    event.sender.send('port-ready', port);
  });

  ipcMain.on('error', event => {
    console.error(event);
  });
})();
