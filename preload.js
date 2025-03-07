const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onFileNew: (callback) => ipcRenderer.on('file-new', callback),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', callback),
  onFileSave: (callback) => ipcRenderer.on('file-save', callback),
  saveContent: (filePath, content) => ipcRenderer.send('save-content', { filePath, content })
});