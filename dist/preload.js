"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    incrementCounter: () => electron_1.ipcRenderer.invoke('increment-counter'),
    getCounter: () => electron_1.ipcRenderer.invoke('get-counter')
});
