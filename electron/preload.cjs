const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  appVersion: '1.0.0',
  print: (options) => ipcRenderer.send('electron-print', options),
  printToPDF: (options) => ipcRenderer.invoke('electron-print-to-pdf', options),
  openExternal: (url) => ipcRenderer.send('electron-open-external', url),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  showNotification: (payload) => ipcRenderer.send('electron-notification', payload),
});
