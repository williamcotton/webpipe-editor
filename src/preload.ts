import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  incrementCounter: () => ipcRenderer.invoke('increment-counter'),
  getCounter: () => ipcRenderer.invoke('get-counter'),
  loadFile: (filePath: string) => ipcRenderer.invoke('load-file', filePath),
  saveFile: (filePath: string, content: string) => ipcRenderer.invoke('save-file', filePath, content),
  parseWebpipe: (source: string) => ipcRenderer.invoke('parse-webpipe', source),
  formatWebpipe: (data: any) => ipcRenderer.invoke('format-webpipe', data)
});

declare global {
  interface Window {
    electronAPI: {
      incrementCounter: () => Promise<number>;
      getCounter: () => Promise<number>;
      loadFile: (filePath: string) => Promise<string>;
      saveFile: (filePath: string, content: string) => Promise<void>;
      parseWebpipe: (source: string) => Promise<any>;
      formatWebpipe: (data: any) => Promise<string>;
    };
  }
}