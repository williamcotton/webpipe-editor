"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const webpipe_js_1 = require("webpipe-js");
let counter = 0;
let mainWindow = null;
let currentFilePath = null;
function createApplicationMenu() {
    const template = [
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
                        if (!mainWindow)
                            return;
                        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
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
                                const content = await (0, promises_1.readFile)(filePath, 'utf-8');
                                currentFilePath = filePath;
                                mainWindow.webContents.send('file-opened', { filePath, content });
                                mainWindow.setTitle(`WebPipe Editor - ${filePath}`);
                            }
                            catch (error) {
                                electron_1.dialog.showErrorBox('Error', `Failed to open file: ${error}`);
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
            label: electron_1.app.getName(),
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
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, 'preload.js')
        }
    });
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile((0, path_1.join)(__dirname, './index.html'));
    }
}
electron_1.app.whenReady().then(() => {
    createApplicationMenu();
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
electron_1.ipcMain.handle('increment-counter', () => {
    counter++;
    return counter;
});
electron_1.ipcMain.handle('get-counter', () => {
    return counter;
});
electron_1.ipcMain.handle('load-file', async (event, filePath) => {
    try {
        const content = await (0, promises_1.readFile)(filePath, 'utf-8');
        return content;
    }
    catch (error) {
        console.error('Failed to load file:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('save-file', async (event, filePath, content) => {
    try {
        await (0, promises_1.writeFile)(filePath, content, 'utf-8');
    }
    catch (error) {
        console.error('Failed to save file:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('parse-webpipe', async (event, source) => {
    try {
        const parsed = (0, webpipe_js_1.parseProgram)(source);
        return parsed;
    }
    catch (error) {
        console.error('Failed to parse webpipe source:', error);
        throw error;
    }
});
electron_1.ipcMain.handle('format-webpipe', async (event, data) => {
    try {
        const formatted = (0, webpipe_js_1.prettyPrint)(data);
        return formatted;
    }
    catch (error) {
        console.error('Failed to format webpipe data:', error);
        throw error;
    }
});
// File dialog handlers
electron_1.ipcMain.handle('show-save-dialog', async (event, defaultPath) => {
    if (!mainWindow)
        return null;
    const result = await electron_1.dialog.showSaveDialog(mainWindow, {
        title: 'Save WebPipe File',
        defaultPath: defaultPath || 'untitled.wp',
        filters: [
            { name: 'WebPipe Files', extensions: ['wp'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result.canceled ? null : result.filePath;
});
electron_1.ipcMain.handle('save-file-to-path', async (event, filePath, content) => {
    try {
        await (0, promises_1.writeFile)(filePath, content, 'utf-8');
        currentFilePath = filePath;
        mainWindow?.setTitle(`WebPipe Editor - ${filePath}`);
        return true;
    }
    catch (error) {
        console.error('Failed to save file:', error);
        electron_1.dialog.showErrorBox('Error', `Failed to save file: ${error}`);
        return false;
    }
});
electron_1.ipcMain.handle('get-current-file-path', () => {
    return currentFilePath;
});
electron_1.ipcMain.handle('set-window-title', (event, title) => {
    mainWindow?.setTitle(title);
});
