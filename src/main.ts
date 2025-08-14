import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { parseProgram, prettyPrint } from 'webpipe-js';

let counter = 0;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    }
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, './index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('increment-counter', () => {
  counter++;
  return counter;
});

ipcMain.handle('get-counter', () => {
  return counter;
});

ipcMain.handle('load-file', async (event, filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Failed to load file:', error);
    throw error;
  }
});

ipcMain.handle('save-file', async (event, filePath: string, content: string) => {
  try {
    await writeFile(filePath, content, 'utf-8');
  } catch (error) {
    console.error('Failed to save file:', error);
    throw error;
  }
});

ipcMain.handle('parse-webpipe', async (event, source: string) => {
  try {
    const parsed = parseProgram(source);
    return parsed;
  } catch (error) {
    console.error('Failed to parse webpipe source:', error);
    throw error;
  }
});

ipcMain.handle('format-webpipe', async (event, data: any) => {
  try {
    const formatted = prettyPrint(data);
    return formatted;
  } catch (error) {
    console.error('Failed to format webpipe data:', error);
    throw error;
  }
});