import { app, BrowserWindow, ipcMain, shell, Menu, dialog, Notification } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

// Determine environment
const isDev = process.env.NODE_ENV === 'development' ||
  process.argv.includes('--dev') ||
  (!app.isPackaged && !process.env.ELECTRON_PROD);

const DEV_URL = process.env.ELECTRON_DEV_URL || 'http://localhost:3000';

// Ensure single instance of the application
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Helper to check if Vite dev server is responding
function checkServer(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.get(
        {
          hostname: u.hostname,
          port: u.port || 3000,
          path: u.pathname,
          timeout: 1500,
        },
        (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 500);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

// Fallback HTML when dev server is waiting or files are not yet built
function getWaitingHtml(message, submessage, isDevWait = false) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>منصة تسيير عطل المستخدمين</title>
  <style>
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
      direction: rtl;
    }
    .box {
      max-width: 520px;
      padding: 32px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h2 { color: #34d399; margin-top: 0; font-size: 22px; }
    p { color: #cbd5e1; font-size: 14px; line-height: 1.6; }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #334155;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s infinite linear;
      margin: 0 auto 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    code {
      display: block;
      background: #090d16;
      color: #38bdf8;
      padding: 10px;
      border-radius: 8px;
      font-family: monospace;
      margin-top: 14px;
      direction: ltr;
      font-size: 13px;
    }
  </style>
  ${isDevWait ? '<meta http-equiv="refresh" content="2">' : ''}
</head>
<body>
  <div class="box">
    ${isDevWait ? '<div class="spinner"></div>' : '⚠️'}
    <h2>${message}</h2>
    <p>${submessage}</p>
    ${isDevWait ? '<p style="color:#94a3b8;font-size:12px;">جاري الفحص التلقائي كل ثانيتين للاتصال بالسيرفر...</p>' : ''}
  </div>
</body>
</html>`;
}

function createMainWindow() {
  const iconPath = fs.existsSync(path.join(__dirname, 'public', 'pwa-512x512.png'))
    ? path.join(__dirname, 'public', 'pwa-512x512.png')
    : path.join(__dirname, 'dist', 'pwa-512x512.png');

  const preloadPath = path.join(__dirname, 'electron', 'preload.cjs');

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1024,
    minHeight: 720,
    title: 'منصة تسيير عطل ومداومات المستخدمين - كلية الرياضيات وعلوم المادة',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#f8fafc',
    show: false,
    webPreferences: {
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // Build Arabic menu
  setupApplicationMenu();

  // Load appropriate content
  loadApplicationContent();

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links safely in system default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function loadApplicationContent() {
  if (!mainWindow) return;

  const distPath = path.join(__dirname, 'dist', 'index.html');

  if (isDev) {
    const isServerUp = await checkServer(DEV_URL);
    if (isServerUp) {
      mainWindow.loadURL(DEV_URL);
    } else if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(
        getWaitingHtml(
          'في انتظار تشغيل سيرفر التطوير (Vite Dev Server)...',
          'يرجى التأكد من تشغيل أمر التطوير في الطرفية أولاً:',
          true
        ) + `<code>npm run dev</code>`
      )}`);

      // Retry loading every 1.5 seconds in dev
      const retryInterval = setInterval(async () => {
        if (!mainWindow) {
          clearInterval(retryInterval);
          return;
        }
        const ready = await checkServer(DEV_URL);
        if (ready) {
          clearInterval(retryInterval);
          mainWindow.loadURL(DEV_URL);
        }
      }, 1500);
    }
  } else {
    // Production mode
    if (fs.existsSync(distPath)) {
      mainWindow.loadFile(distPath);
    } else {
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(
        getWaitingHtml(
          'ملفات البناء غير موجودة (dist)',
          'يرجى إنشاء نسخة الإنتاج أولاً بتنفيذ الأمر التالي:',
          false
        ) + `<code>npm run build</code>`
      )}`);
    }
  }
}

// Setup full Arabic application menu
function setupApplicationMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac
      ? [
          {
            label: 'إدارة العطل',
            submenu: [
              { role: 'about', label: 'حول التطبيق' },
              { type: 'separator' },
              { role: 'services', label: 'خدمات' },
              { type: 'separator' },
              { role: 'hide', label: 'إخفاء التطبيق' },
              { role: 'hideOthers', label: 'إخفاء البقية' },
              { role: 'unhide', label: 'إظهار الكل' },
              { type: 'separator' },
              { role: 'quit', label: 'إنهاء التطبيق' },
            ],
          },
        ]
      : []),
    {
      label: 'ملف',
      submenu: [
        {
          label: 'طباعة الاستمارة / الرخصة (Ctrl + P)',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow?.webContents.print({ silent: false, printBackground: true });
          },
        },
        {
          label: 'تصدير الوثيقة كملف PDF...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            if (!mainWindow) return;
            try {
              const data = await mainWindow.webContents.printToPDF({
                landscape: false,
                printBackground: true,
                pageSize: 'A4',
              });
              const { filePath } = await dialog.showSaveDialog(mainWindow, {
                title: 'تصدير وحفظ الاستمارة بصيغة PDF',
                defaultPath: 'رخصة_عطلة_رسمية.pdf',
                filters: [{ name: 'ملفات PDF', extensions: ['pdf'] }],
              });
              if (filePath) {
                await fs.promises.writeFile(filePath, data);
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'تم الحفظ بنجاح',
                  message: 'تم حفظ الملف بنجاح في المسار المحدد:',
                  detail: filePath,
                  buttons: ['فتح المجلد', 'تم'],
                }).then(({ response }) => {
                  if (response === 0) shell.showItemInFolder(filePath);
                });
              }
            } catch (err) {
              dialog.showErrorBox('خطأ في تصدير PDF', err.message);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'إعادة تحميل الصفحة',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.reload(),
        },
        {
          label: 'فرض إعادة التحميل (تحديث الكاش)',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow?.webContents.reloadIgnoringCache(),
        },
        { type: 'separator' },
        {
          label: 'خروج من التطبيق',
          accelerator: isMac ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'تحرير',
      submenu: [
        { label: 'تراجع', role: 'undo' },
        { label: 'إعادة', role: 'redo' },
        { type: 'separator' },
        { label: 'قص', role: 'cut' },
        { label: 'نسخ', role: 'copy' },
        { label: 'لصق', role: 'paste' },
        { label: 'تحديد الكل', role: 'selectAll' },
      ],
    },
    {
      label: 'عرض',
      submenu: [
        { label: 'تكبير', role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { label: 'تصغير', role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { label: 'الحجم الأصلي (100%)', role: 'resetZoom', accelerator: 'CmdOrCtrl+0' },
        { type: 'separator' },
        { label: 'وضع ملء الشاشة', role: 'togglefullscreen', accelerator: 'F11' },
        {
          label: 'أدوات المطور (DevTools)',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'حول منصة تسيير عطل المستخدمين',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'حول المنصة',
              message: 'المنصة الداخلية لتسيير عطل ومداومات المستخدمين',
              detail: 'كلية الرياضيات وعلوم المادة - جامعة قاصدي مرباح ورقلة\n\nتطبيق مكتبي متكامل مبني بواسطة Electron.js و React لتسيير ومتابعة عطل ومداومات الموظفين، إصدار الرخص الإدارية الرسمية (FOR.GRH.010)، ومزامنة البيانات اللحظية.\n\nالإصدار: 1.0.0 (نسخة سطح المكتب)',
              buttons: ['حسناً'],
            });
          },
        },
        {
          label: 'موقع جامعة قاصدي مرباح ورقلة',
          click: () => shell.openExternal('https://univ-ouargla.dz'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers for communication between Renderer & Main
ipcMain.on('electron-print', (event, options) => {
  mainWindow?.webContents.print({ silent: false, printBackground: true, ...options });
});

ipcMain.handle('electron-print-to-pdf', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'No main window' };
  try {
    const data = await mainWindow.webContents.printToPDF({
      landscape: false,
      printBackground: true,
      pageSize: 'A4',
      ...options,
    });
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ رخصة / استمارة العطلة بصيغة PDF',
      defaultPath: 'وثيقة_عطلة_رسمية.pdf',
      filters: [{ name: 'ملفات PDF', extensions: ['pdf'] }],
    });
    if (filePath) {
      await fs.promises.writeFile(filePath, data);
      return { success: true, filePath };
    }
    return { success: false, canceled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.on('electron-open-external', (event, url) => {
  if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
    shell.openExternal(url);
  }
});

ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.on('window-close', () => mainWindow?.close());

ipcMain.on('electron-notification', (event, { title, body }) => {
  if (Notification.isSupported()) {
    const iconPath = path.join(__dirname, 'public', 'pwa-512x512.png');
    new Notification({
      title: title || 'منصة تسيير عطل المستخدمين',
      body: body || '',
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
    }).show();
  }
});

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
