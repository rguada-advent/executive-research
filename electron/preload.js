// Preload script — runs in renderer context before the page loads.
// contextBridge is the only safe channel between main and renderer with contextIsolation.

const { contextBridge } = require('electron');
let version = '1.4.9';
try { version = require('./package.json').version; } catch (_) {}

// Token is passed via additionalArguments — the only guaranteed delivery path
// from the main process to the preload. process.env inheritance is unreliable
// across Electron's renderer process boundary.
const tokenArg = process.argv.find(a => a.startsWith('--psg-token='));
const localToken = tokenArg ? tokenArg.slice('--psg-token='.length) : '';

contextBridge.exposeInMainWorld('psgApp', {
  platform: process.platform,
  // Hard-coded true — this file only loads inside the Electron preload.
  // Do NOT gate on a runtime condition; a failed preload leaves isElectron
  // undefined, causing all fetch calls to use '/api' (relative file:// path)
  // which silently fails with "Failed to fetch".
  isElectron: true,
  version,
  localToken,
});
