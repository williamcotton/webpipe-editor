import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { parseProgram, prettyPrint } from 'webpipe-js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let counter = 0;
let mainWindow: BrowserWindow | null = null;
let currentFilePath: string | null = null;

function createApplicationMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('file-new');
          }
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            if (!mainWindow) return;
            
            const result = await dialog.showOpenDialog(mainWindow, {
              title: 'Open WebPipe File',
              filters: [
                { name: 'WebPipe Files', extensions: ['wp'] },
                { name: 'All Files', extensions: ['*'] }
              ],
              properties: ['openFile']
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              try {
                const content = await readFile(filePath, 'utf-8');
                currentFilePath = filePath;
                mainWindow.webContents.send('file-opened', { filePath, content });
                mainWindow.setTitle(`WebPipe Editor - ${filePath}`);
              } catch (error) {
                dialog.showErrorBox('Error', `Failed to open file: ${error}`);
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('file-save');
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow?.webContents.send('file-save-as');
          }
        },
        { type: 'separator' },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow?.webContents.send('file-close');
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
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

app.whenReady().then(() => {
  createApplicationMenu();
  createWindow();
});

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

ipcMain.handle('load-file', async (_event, filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Failed to load file:', error);
    throw error;
  }
});

ipcMain.handle('save-file', async (_event, filePath: string, content: string) => {
  try {
    await writeFile(filePath, content, 'utf-8');
  } catch (error) {
    console.error('Failed to save file:', error);
    throw error;
  }
});

ipcMain.handle('parse-webpipe', async (_event, source: string) => {
  try {
    const parsed = parseProgram(source);
    return parsed;
  } catch (error) {
    console.error('Failed to parse webpipe source:', error);
    throw error;
  }
});

ipcMain.handle('format-webpipe', async (_event, data: any) => {
  try {
    const formatted = prettyPrint(data);
    return formatted;
  } catch (error) {
    console.error('Failed to format webpipe data:', error);
    throw error;
  }
});

// File dialog handlers
ipcMain.handle('show-save-dialog', async (_event, defaultPath?: string) => {
  if (!mainWindow) return null;
  
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save WebPipe File',
    defaultPath: defaultPath || 'untitled.wp',
    filters: [
      { name: 'WebPipe Files', extensions: ['wp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('save-file-to-path', async (_event, filePath: string, content: string) => {
  try {
    await writeFile(filePath, content, 'utf-8');
    currentFilePath = filePath;
    mainWindow?.setTitle(`WebPipe Editor - ${filePath}`);
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    dialog.showErrorBox('Error', `Failed to save file: ${error}`);
    return false;
  }
});

ipcMain.handle('get-current-file-path', () => {
  return currentFilePath;
});

ipcMain.handle('set-window-title', (_event, title: string) => {
  mainWindow?.setTitle(title);
});

// Simple HTTP GET proxy to avoid renderer CORS issues
ipcMain.handle('http-get', async (_event, url: string) => {
  try {
    const response = await fetch(url);
    const textBody = await response.text();
    let parsedBody: any = textBody;
    try {
      parsedBody = JSON.parse(textBody);
    } catch (_) {
      // non-JSON body, keep as text
    }
    const headersObj = Object.fromEntries(response.headers.entries());
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: headersObj,
      body: parsedBody
    };
  } catch (error: any) {
    return {
      ok: false,
      error: String(error)
    };
  }
});

// Execute shell command handler
ipcMain.handle('execute-command', async (_event, command: string) => {
  try {
    const { stdout, stderr } = await execAsync(command);
    return stdout;
  } catch (error: any) {
    console.error('Failed to execute command:', error);
    throw new Error(`Command failed: ${error.message}`);
  }
});