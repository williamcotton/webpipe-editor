"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    incrementCounter: () => electron_1.ipcRenderer.invoke('increment-counter'),
    getCounter: () => electron_1.ipcRenderer.invoke('get-counter'),
    loadFile: (filePath) => electron_1.ipcRenderer.invoke('load-file', filePath),
    saveFile: (filePath, content) => electron_1.ipcRenderer.invoke('save-file', filePath, content),
    parseWebpipe: (source) => electron_1.ipcRenderer.invoke('parse-webpipe', source),
    formatWebpipe: (data) => electron_1.ipcRenderer.invoke('format-webpipe', data)
});
