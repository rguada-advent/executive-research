const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let pythonProcess = null;

const BACKEND_PORT = 5001;
const isDev = !app.isPackaged;

function getResourcePath(...segments) {
  if (isDev) {
    return path.join(__dirname, '..', ...segments);
  }
  return path.join(process.resourcesPath, ...segments);
}

function findPython() {
  // 1. Check for embedded Python in resources
  const embeddedPython = path.join(process.resourcesPath || '', 'python', 'python.exe');
  if (fs.existsSync(embeddedPython)) return embeddedPython;

  // 2. Check for system Python
  const candidates = ['python', 'python3', 'py'];
  for (const cmd of candidates) {
    try {
      const result = execSync(`${cmd} --version`, { encoding: 'utf-8', timeout: 5000 });
      if (result.includes('Python 3')) return cmd;
    } catch {}
  }
  return null;
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const python = findPython();
    if (!python) {
      reject(new Error('Python 3 not found. Please install Python 3.10+ from python.org'));
      return;
    }

    const backendDir = getResourcePath('backend');
    const serverScript = path.join(backendDir, 'server.py');

    if (!fs.existsSync(serverScript)) {
      reject(new Error(`Backend not found at: ${serverScript}`));
      return;
    }

    // Install dependencies first (quick if already installed)
    try {
      const reqFile = path.join(backendDir, 'requirements.txt');
      if (fs.existsSync(reqFile)) {
        execSync(`${python} -m pip install -r "${reqFile}" --quiet`, {
          cwd: backendDir,
          timeout: 120000,
          encoding: 'utf-8',
        });
      }
    } catch (err) {
      console.warn('pip install warning:', err.message);
    }

    // Start Flask server
    const env = { ...process.env, FLASK_ENV: 'production', PYTHONDONTWRITEBYTECODE: '1' };
    pythonProcess = spawn(python, [serverScript], {
      cwd: backendDir,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    pythonProcess.stdout.on('data', (data) => {
      console.log('[Backend]', data.toString().trim());
    });

    pythonProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      console.error('[Backend]', msg);
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to start backend: ${err.message}`));
    });

    pythonProcess.on('exit', (code) => {
      console.log(`[Backend] Process exited with code ${code}`);
      pythonProcess = null;
    });

    // Wait for backend to be ready
    let attempts = 0;
    const maxAttempts = 30; // 15 seconds
    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/health`, (res) => {
        if (res.statusCode === 200) {
          console.log('[Backend] Ready on port', BACKEND_PORT);
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
    setTimeout(check, 1000); // Give it a second to start
  });
}

function stopBackend() {
  if (pythonProcess) {
    console.log('[Backend] Stopping...');
    pythonProcess.kill('SIGTERM');
    // Force kill after 3 seconds if still running
    setTimeout(() => {
      if (pythonProcess) {
        try { pythonProcess.kill('SIGKILL'); } catch {}
      }
    }, 3000);
    pythonProcess = null;
  }
}

function createWindow() {
  const frontendPath = getResourcePath('frontend');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'PSG Executive Intelligence',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    backgroundColor: '#f5f2eb', // Advent bg color
    show: false,
  });

  // Load the frontend
  if (isDev) {
    // In dev mode, try Vite dev server first, fall back to built files
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(path.join(frontendPath, 'dist', 'index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(frontendPath, 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    await startBackend();
    createWindow();
  } catch (err) {
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
