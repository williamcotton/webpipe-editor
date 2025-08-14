import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  incrementCounter: () => ipcRenderer.invoke('increment-counter'),
  getCounter: () => ipcRenderer.invoke('get-counter')
});

declare global {
  interface Window {
    electronAPI: {
      incrementCounter: () => Promise<number>;
      getCounter: () => Promise<number>;
    };
  }
}