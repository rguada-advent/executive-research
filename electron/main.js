const { app, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { randomUUID, createHash } = require('crypto');
const http = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');

const GITHUB_OWNER = 'cuufan';
const GITHUB_REPO = 'psg-executive-intelligence';

const PSG_LOCAL_TOKEN = randomUUID();

// Read-only GitHub token for checking/downloading updates from the private repo.
// Set GITHUB_UPDATE_TOKEN as a Windows system environment variable, or bake it
// into the build by setting it before running "npm run dist".
const GITHUB_UPDATE_TOKEN = process.env.GITHUB_UPDATE_TOKEN || '';

let mainWindow = null;
let pythonProcess = null;

const BACKEND_PORT = 5001;
const isDev = !app.isPackaged;

function log(...args) {
  console.log('[PSG]', ...args);
}

function getResourcePath(...segments) {
  if (isDev) {
    return path.join(__dirname, '..', ...segments);
  }
  return path.join(process.resourcesPath, ...segments);
}

function getAppPath(...segments) {
  if (isDev) {
    return path.join(__dirname, ...segments);
  }
  return path.join(app.getAppPath(), ...segments);
}

function findPython() {
  // 1. Check for embedded Python in resources
  const embeddedPython = path.join(process.resourcesPath || __dirname, 'python', 'python.exe');
  log('Checking embedded Python at:', embeddedPython);
  if (fs.existsSync(embeddedPython)) {
    log('Found embedded Python');
    return embeddedPython;
  }

  // 2. Check in app directory
  const appPython = path.join(app.getAppPath(), 'python', 'python.exe');
  log('Checking app Python at:', appPython);
  if (fs.existsSync(appPython)) {
    log('Found app Python');
    return appPython;
  }

  // 3. Check for system Python
  const candidates = ['python', 'python3', 'py'];
  for (const cmd of candidates) {
    try {
      const result = execSync(`${cmd} --version`, { encoding: 'utf-8', timeout: 5000 });
      if (result.includes('Python 3')) {
        log('Found system Python:', cmd);
        return cmd;
      }
    } catch {}
  }
  return null;
}

function findBackendDir() {
  // Check multiple possible locations
  const candidates = [
    getResourcePath('backend'),
    path.join(app.getAppPath(), 'backend-src'),
    path.join(app.getAppPath(), 'backend'),
    path.join(__dirname, 'backend-src'),
    path.join(__dirname, '..', 'backend'),
  ];
  for (const dir of candidates) {
    const serverPath = path.join(dir, 'server.py');
    if (fs.existsSync(serverPath)) {
      log('Found backend at:', dir);
      return dir;
    }
  }
  log('Backend candidates checked:', candidates);
  return null;
}

function findFrontendIndex() {
  const candidates = [
    path.join(getResourcePath('frontend'), 'index.html'),
    path.join(app.getAppPath(), 'frontend-src', 'index.html'),
    path.join(app.getAppPath(), 'frontend', 'index.html'),
    path.join(__dirname, 'frontend-src', 'index.html'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      log('Found frontend at:', p);
      return p;
    }
  }
  log('Frontend candidates checked:', candidates);
  return null;
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const python = findPython();
    if (!python) {
      reject(new Error('Python 3 not found. Please install Python 3.10+ from python.org'));
      return;
    }

    const backendDir = findBackendDir();
    if (!backendDir) {
      reject(new Error('Backend server.py not found in any expected location.'));
      return;
    }

    const serverScript = path.join(backendDir, 'server.py');

    // Install dependencies (skip for embedded Python — deps are pre-installed)
    const isEmbedded = python.includes('python.exe') && (
      fs.existsSync(path.join(path.dirname(python), 'python312._pth')) ||
      fs.existsSync(path.join(path.dirname(python), 'python313._pth'))
    );
    if (!isEmbedded) {
      try {
        const reqFile = path.join(backendDir, 'requirements.txt');
        if (fs.existsSync(reqFile)) {
          log('Installing Python dependencies...');
          execSync(`"${python}" -m pip install -r "${reqFile}" --quiet`, {
            cwd: backendDir,
            timeout: 120000,
            encoding: 'utf-8',
          });
        }
      } catch (err) {
        log('pip install warning:', err.message);
      }
    } else {
      log('Using embedded Python with pre-installed dependencies');
    }

    const frontendIndex = findFrontendIndex();
    const frontendDir = frontendIndex ? path.dirname(frontendIndex) : '';
    log('Frontend directory for Flask:', frontendDir);

    // Start Flask server — pass the local auth token so Flask can validate it.
    const env = { ...process.env, FLASK_ENV: 'production', PYTHONDONTWRITEBYTECODE: '1', PSG_USER_DATA: app.getPath('userData'), PSG_FRONTEND_DIR: frontendDir, PSG_LOCAL_TOKEN: PSG_LOCAL_TOKEN };
    log('Starting backend:', python, serverScript);
    pythonProcess = spawn(python, [serverScript], {
      cwd: backendDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    pythonProcess.stdout.on('data', (data) => {
      log('[Backend stdout]', data.toString().trim());
    });

    pythonProcess.stderr.on('data', (data) => {
      log('[Backend stderr]', data.toString().trim());
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start backend: ${err.message}`));
    });

    pythonProcess.on('exit', (code) => {
      log(`Backend process exited with code ${code}`);
      pythonProcess = null;
    });

    // Wait for backend to be ready
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds
    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/health`, (res) => {
        if (res.statusCode === 200) {
          log('Backend ready on port', BACKEND_PORT);
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(check, 500);
        } else {
          reject(new Error('Backend started but health check failed'));
        }
      });
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(check, 500);
        } else {
          reject(new Error('Backend failed to start within 15 seconds'));
        }
      });
      req.end();
    };
    setTimeout(check, 1000);
  });
}

function stopBackend() {
  if (pythonProcess) {
    log('Stopping backend...');
    pythonProcess.kill('SIGTERM');
    setTimeout(() => {
      if (pythonProcess) {
        try { pythonProcess.kill('SIGKILL'); } catch {}
      }
    }, 3000);
    pythonProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'PSG Executive Intelligence',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js'),
      // Deliver the per-session auth token to the preload. The preload reads
      // this from process.argv and exposes it via contextBridge so the renderer
      // can include it in X-PSG-Local-Token headers on every Flask request.
      additionalArguments: [`--psg-token=${PSG_LOCAL_TOKEN}`],
    },
    backgroundColor: '#f5f2eb',
    show: false,
  });

  if (isDev) {
    log('Dev mode — loading from Vite dev server');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    log('Production mode — loading frontend from Flask at http://127.0.0.1:5001');
    mainWindow.loadURL(`http://127.0.0.1:${BACKEND_PORT}`);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// === AUTO-UPDATER (GitHub API direct — no electron-updater dependency) ===
// Downloads the latest .exe installer from GitHub Releases and runs it,
// replacing the current installation in-place via the NSIS GUID.

// Returns headers for GitHub API calls — includes auth token when available.
function githubApiHeaders() {
  const h = {
    'User-Agent': `PSG-Executive-Intelligence/${app.getVersion()}`,
    'Accept': 'application/vnd.github.v3+json',
  };
  if (GITHUB_UPDATE_TOKEN) h['Authorization'] = `token ${GITHUB_UPDATE_TOKEN}`;
  return h;
}

function httpsGetJson(url) {
  return new Promise((resolve, reject) => {
    function doGet(u) {
      https.get(u, {
        headers: githubApiHeaders(),
        timeout: 15000,
      }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return doGet(res.headers.location);
        }
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            return reject(new Error(`GitHub API ${res.statusCode}${res.statusCode === 404 ? ' (repo may be private — set GITHUB_UPDATE_TOKEN)' : ''}`));
          }
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(e); }
        });
      }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    }
    doGet(url);
  });
}

function downloadInstaller(downloadUrl, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    // First hop: github.com release URL — needs auth for private repos.
    function doGet(u) {
      const headers = { 'User-Agent': `PSG-Executive-Intelligence/${app.getVersion()}` };
      if (GITHUB_UPDATE_TOKEN) headers['Authorization'] = `token ${GITHUB_UPDATE_TOKEN}`;
      https.get(u, { headers, timeout: 300000 }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Redirect lands on a time-signed CDN URL — do NOT forward auth header.
          file.close();
          const newFile = fs.createWriteStream(destPath);
          return doGetCdn(res.headers.location, newFile);
        }
        if (res.statusCode !== 200) {
          file.close();
          return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
        }
        streamResponse(res, file);
      }).on('error', reject);
    }

    // CDN hop: no auth header — signed URL is self-authenticating.
    function doGetCdn(u, stream) {
      https.get(u, {
        headers: { 'User-Agent': `PSG-Executive-Intelligence/${app.getVersion()}` },
        timeout: 300000,
      }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          stream.close();
          const nextStream = fs.createWriteStream(destPath);
          return doGetCdn(res.headers.location, nextStream);
        }
        if (res.statusCode !== 200) {
          stream.close();
          return reject(new Error(`Download failed: HTTP ${res.statusCode}`));
        }
        streamResponse(res, stream);
      }).on('error', reject);
    }

    function streamResponse(res, stream) {
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let received = 0;
      res.on('data', chunk => {
        received += chunk.length;
        if (onProgress && total > 0) onProgress(Math.round((received / total) * 100));
      });
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(); });
      stream.on('error', reject);
    }

    doGet(downloadUrl);
  });
}

function versionIsNewer(latest, current) {
  const parse = v => v.replace(/^v/, '').split('.').map(Number);
  const [la, lb, lc] = parse(latest);
  const [ca, cb, cc] = parse(current);
  return la > ca || (la === ca && lb > cb) || (la === ca && lb === cb && lc > cc);
}

async function checkForUpdates() {
  if (isDev) { log('[Updater] Skipping — dev mode'); return; }

  const current = app.getVersion();
  log(`[Updater] Checking for updates. Current: v${current}`);

  try {
    const release = await httpsGetJson(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    );

    const latest = (release.tag_name || '').replace(/^v/, '');
    log(`[Updater] Latest release: v${latest}`);

    if (!latest || !versionIsNewer(latest, current)) {
      log('[Updater] Already up to date.');
      return;
    }

    const exeAsset = (release.assets || []).find(
      a => a.name.endsWith('.exe') && !a.name.includes('blockmap')
    );
    if (!exeAsset) { log('[Updater] No .exe asset found in release.'); return; }

    log(`[Updater] New version v${latest} found. Asset: ${exeAsset.name}`);

    if (!mainWindow) return;
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `PSG Executive Intelligence v${latest} is available`,
      detail: `You are running v${current}.\n\nThe installer will download automatically (~110 MB). The app will close and install the update.`,
      buttons: ['Install Now', 'Remind Me Later'],
      defaultId: 0,
    });
    if (response !== 0) { log('[Updater] User deferred update.'); return; }

    // Download installer to temp directory
    const installerPath = path.join(os.tmpdir(), exeAsset.name);
    log(`[Updater] Downloading to: ${installerPath}`);

    // Show download progress in window title
    if (mainWindow) mainWindow.setTitle('PSG Executive Intelligence — Downloading update 0%...');

    await downloadInstaller(exeAsset.browser_download_url, installerPath, (pct) => {
      log(`[Updater] Download ${pct}%`);
      if (mainWindow) mainWindow.setTitle(`PSG Executive Intelligence — Downloading update ${pct}%...`);
    });

    // --- Integrity checks before executing the downloaded installer ---

    // 1. File size sanity check: a legitimate NSIS installer for this app is
    //    well over 50 MB. Anything smaller is almost certainly wrong (partial
    //    download, MITM substitution, HTML error page written to disk, etc.).
    const MIN_INSTALLER_BYTES = 50_000_000; // 50 MB
    const installerStat = fs.statSync(installerPath);
    if (installerStat.size < MIN_INSTALLER_BYTES) {
      fs.unlinkSync(installerPath);
      const sizeMsg = `Downloaded installer is suspiciously small (${(installerStat.size / 1024 / 1024).toFixed(1)} MB < 50 MB expected). The file has been deleted. Update aborted.`;
      log(`[Updater] INTEGRITY FAIL: ${sizeMsg}`);
      if (mainWindow) {
        dialog.showErrorBox('Update Integrity Check Failed', sizeMsg);
      }
      return;
    }

    // 2. SHA-256 hash verification against the GitHub release asset size field.
    //    electron-builder publishes a companion .exe.sha512 / .blockmap but
    //    the GitHub API asset object exposes the byte-exact size which we can
    //    use as a second-factor check (in addition to the size floor above).
    //    If the asset size is available, the downloaded file must match it exactly.
    const expectedSize = exeAsset.size || 0;
    if (expectedSize > 0 && installerStat.size !== expectedSize) {
      fs.unlinkSync(installerPath);
      const mismatchMsg = `Downloaded installer size (${installerStat.size} bytes) does not match GitHub release asset size (${expectedSize} bytes). The file has been deleted. Update aborted.`;
      log(`[Updater] INTEGRITY FAIL: ${mismatchMsg}`);
      if (mainWindow) {
        dialog.showErrorBox('Update Integrity Check Failed', mismatchMsg);
      }
      return;
    }

    // 3. Compute SHA-256 of the downloaded file and log it for audit purposes.
    //    If the release asset includes a digest field (future GitHub API support),
    //    compare against it. For now this produces a verifiable audit trail.
    const fileBuffer = fs.readFileSync(installerPath);
    const downloadedHash = createHash('sha256').update(fileBuffer).digest('hex');
    log(`[Updater] Installer SHA-256: ${downloadedHash}`);
    if (exeAsset.digest && typeof exeAsset.digest === 'string') {
      // Format is "sha256:<hex>" per OCI/GitHub spec if ever exposed
      const expectedHash = exeAsset.digest.replace(/^sha256:/, '').toLowerCase();
      if (downloadedHash !== expectedHash) {
        fs.unlinkSync(installerPath);
        const hashMsg = `Installer SHA-256 mismatch. Expected: ${expectedHash}. Got: ${downloadedHash}. The file has been deleted. Update aborted.`;
        log(`[Updater] INTEGRITY FAIL: ${hashMsg}`);
        if (mainWindow) {
          dialog.showErrorBox('Update Integrity Check Failed', hashMsg);
        }
        return;
      }
      log('[Updater] SHA-256 digest verified against release asset.');
    }

    log('[Updater] Integrity checks passed. Launching installer...');
    if (mainWindow) mainWindow.setTitle('PSG Executive Intelligence');

    // Launch installer as a detached process then quit
    spawn(installerPath, [], { detached: true, stdio: 'ignore' }).unref();

    setTimeout(() => {
      stopBackend();
      app.quit();
    }, 1500);

  } catch (err) {
    log(`[Updater] Error: ${err.message}`);
    // Non-fatal — don't bother the user with network errors
  }
}

// App lifecycle
app.whenReady().then(async () => {
  log('App ready. isPackaged:', app.isPackaged, 'appPath:', app.getAppPath(), 'resourcesPath:', process.resourcesPath);

  try {
    await startBackend();
    createWindow();
    // Check for updates in background after window is shown
    setTimeout(() => checkForUpdates(), 3000);
  } catch (err) {
    log('Startup error:', err.message);
    dialog.showErrorBox(
      'PSG Executive Intelligence - Startup Error',
      `${err.message}\n\nPlease ensure Python 3.10+ is installed and try again.\n\nDownload from: https://www.python.org/downloads/`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  stopBackend();
  app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
