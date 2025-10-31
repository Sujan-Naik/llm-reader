import 'dotenv/config';
import { app, BrowserWindow, ipcMain, globalShortcut, clipboard } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { queryLLM } from './api/llm';

if (started) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const CLICK_THROUGH_DURATION = 2000; // ms

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    transparent: true,
    frame: true,
    backgroundColor: '#00000000',
    fullscreen: false,
    alwaysOnTop: true,
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong');
  ipcMain.handle('query', async (_event, args) => {
    return await queryLLM(args);
  });

  createWindow();
});

ipcMain.on('set-ignore-mouse-events', (event, ignore: boolean) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.setIgnoreMouseEvents(ignore);
  console.log('ignore set:', ignore);
});

// Safely manages click-through lifetime entirely in main
ipcMain.on('request-click-through', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  win.setIgnoreMouseEvents(true);
  console.log('click-through enabled');

  setTimeout(() => {
    if (!win.isDestroyed()) {
      win.setIgnoreMouseEvents(false);
      console.log('click-through disabled');
    }
  }, CLICK_THROUGH_DURATION);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});