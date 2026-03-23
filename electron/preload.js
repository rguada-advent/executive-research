// Preload script - runs in renderer process before web page loads
// Provides a secure bridge between the Electron main process and the web page

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('psgApp', {
  platform: process.platform,
  isElectron: true,
});
