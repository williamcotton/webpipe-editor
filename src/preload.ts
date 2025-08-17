import { contextBridge, ipcRenderer } from 'electron';
import { Program } from 'webpipe-js';

contextBridge.exposeInMainWorld('electronAPI', {
  incrementCounter: () => ipcRenderer.invoke('increment-counter'),
  getCounter: () => ipcRenderer.invoke('get-counter'),
  loadFile: (filePath: string) => ipcRenderer.invoke('load-file', filePath),
  saveFile: (filePath: string, content: string) => ipcRenderer.invoke('save-file', filePath, content),
  parseWebpipe: (source: string) => ipcRenderer.invoke('parse-webpipe', source),
  formatWebpipe: (data: any) => ipcRenderer.invoke('format-webpipe', data),
  
  // File dialog operations
  showSaveDialog: (defaultPath?: string) => ipcRenderer.invoke('show-save-dialog', defaultPath),
  saveFileToPath: (filePath: string, content: string) => ipcRenderer.invoke('save-file-to-path', filePath, content),
  getCurrentFilePath: () => ipcRenderer.invoke('get-current-file-path'),
  setWindowTitle: (title: string) => ipcRenderer.invoke('set-window-title', title),
  httpGet: (url: string) => ipcRenderer.invoke('http-get', url),
  executeCommand: (command: string) => ipcRenderer.invoke('execute-command', command),
  
  // Menu event listeners
  onFileNew: (callback: () => void) => ipcRenderer.on('file-new', callback),
  onFileOpened: (callback: (data: { filePath: string; content: string }) => void) => 
    ipcRenderer.on('file-opened', (_event, data) => callback(data)),
  onFileSave: (callback: () => void) => ipcRenderer.on('file-save', callback),
  onFileSaveAs: (callback: () => void) => ipcRenderer.on('file-save-as', callback),
  onFileClose: (callback: () => void) => ipcRenderer.on('file-close', callback),
  onFileChangedExternally: (callback: (data: { filePath: string; content: string }) => void) => 
    ipcRenderer.on('file-changed-externally', (_event, data) => callback(data)),
  
  // Remove event listeners
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
});

declare global {
  interface Window {
    electronAPI: {
      incrementCounter: () => Promise<number>;
      getCounter: () => Promise<number>;
      loadFile: (filePath: string) => Promise<string>;
      saveFile: (filePath: string, content: string) => Promise<void>;
      parseWebpipe: (source: string) => Promise<Program>;
      formatWebpipe: (data: Program) => Promise<string>;
      
      // File dialog operations
      showSaveDialog: (defaultPath?: string) => Promise<string | null>;
      saveFileToPath: (filePath: string, content: string) => Promise<boolean>;
      getCurrentFilePath: () => Promise<string | null>;
      setWindowTitle: (title: string) => Promise<void>;
      httpGet: (url: string) => Promise<{
        ok: boolean;
        status?: number;
        statusText?: string;
        headers?: Record<string, string>;
        body?: any;
        error?: string;
      }>;
      executeCommand: (command: string) => Promise<string>;
      
      // Menu event listeners
      onFileNew: (callback: () => void) => void;
      onFileOpened: (callback: (data: { filePath: string; content: string }) => void) => void;
      onFileSave: (callback: () => void) => void;
      onFileSaveAs: (callback: () => void) => void;
      onFileClose: (callback: () => void) => void;
      onFileChangedExternally: (callback: (data: { filePath: string; content: string }) => void) => void;
      
      // Remove event listeners
      removeAllListeners: (channel: string) => void;
    };
  }
}