const { app, BrowserWindow, session, shell } = require('electron');
const path = require('path');

function createWindow() {
  const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
    title: 'Saheb Paper Pvt. Ltd. (Beta 1.10)',
    icon: path.join(__dirname, 'build/icon.png'),
  });

  // Strict Content Security Policy
  // Note: 'unsafe-inline' justified for scripts by inline head theme bootstrap and Vite dev client;
  // justified for styles by dynamic Tailwind utility classes and chart canvas styling. No unsafe-eval.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
          "font-src 'self' data: https://fonts.gstatic.com; " +
          "connect-src 'self' https://znyvmlwggwckjxxsxiwq.supabase.co wss://znyvmlwggwckjxxsxiwq.supabase.co https://scyiwfqkknuphzhvklok.supabase.co wss://scyiwfqkknuphzhvklok.supabase.co https://sahebpaper.github.io https://*.supabase.co wss://*.supabase.co; " +
          "img-src 'self' data: blob: https:; " +
          "object-src 'none'; " +
          "base-uri 'self'; " +
          "frame-src 'none';"
        ],
      },
    });
  });

  // Navigation guard: prevent navigation away from the app origin
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);
      if (isDev) {
        const devUrl = new URL(process.env.VITE_DEV_SERVER_URL);
        if (parsedUrl.origin !== devUrl.origin) {
          event.preventDefault();
        }
      } else {
        if (parsedUrl.protocol !== 'file:') {
          event.preventDefault();
        }
      }
    } catch {
      event.preventDefault();
    }
  });

  // Disable DevTools in production
  if (!isDev) {
    win.webContents.on('devtools-opened', () => {
      win.webContents.closeDevTools();
    });
  }

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Open external links in default web browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
