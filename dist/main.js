"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const webpipe_js_1 = require("webpipe-js");
let counter = 0;
function createWindow() {
    const mainWindow = new electron_1.BrowserWindow({
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
electron_1.app.whenReady().then(createWindow);
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
