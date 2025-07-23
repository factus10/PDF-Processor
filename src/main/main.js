const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize app store for settings
const store = new Store({
  // Add schema for better validation (optional)
  schema: {
    ocrLanguage: {
      type: 'string',
      default: 'eng'
    },
    confidenceThreshold: {
      type: 'number',
      default: 60,
      minimum: 0,
      maximum: 100
    },
    outputPath: {
      type: 'string',
      default: ''
    }
  }
});

class PDFProcessorApp {
  constructor() {
    this.mainWindow = null;
    this.isDevMode = process.argv.includes('--dev');
    this.setupApp();
  }

  setupApp() {
    // App event handlers
    app.whenReady().then(() => this.createWindow());
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    // Setup IPC handlers
    this.setupIpcHandlers();
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        preload: path.join(__dirname, '../renderer/js/preload.js')
      },
      icon: path.join(__dirname, '../renderer/assets/icon.png'),
      show: false, // Don't show until ready
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
    });

    // Load the main HTML file
    this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();
      
      // Open DevTools in development
      if (this.isDevMode) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Setup application menu
    this.setupMenu();
  }

  setupMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Processing Job',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.mainWindow.webContents.send('menu-new-job');
            }
          },
          {
            label: 'Open Results Folder',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory']
              });
              if (!result.canceled) {
                this.mainWindow.webContents.send('menu-open-folder', result.filePaths[0]);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectall' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Processing',
        submenu: [
          {
            label: 'Pause All',
            accelerator: 'CmdOrCtrl+P',
            click: () => {
              this.mainWindow.webContents.send('menu-pause-all');
            }
          },
          {
            label: 'Resume All',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              this.mainWindow.webContents.send('menu-resume-all');
            }
          },
          {
            label: 'Cancel All',
            accelerator: 'CmdOrCtrl+Shift+C',
            click: () => {
              this.mainWindow.webContents.send('menu-cancel-all');
            }
          }
        ]
      },
      {
        label: 'Settings',
        submenu: [
          {
            label: 'OCR Settings',
            click: () => {
              this.mainWindow.webContents.send('menu-ocr-settings');
            }
          },
          {
            label: 'Text Correction Settings',
            click: () => {
              this.mainWindow.webContents.send('menu-correction-settings');
            }
          },
          {
            label: 'Output Settings',
            click: () => {
              this.mainWindow.webContents.send('menu-output-settings');
            }
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              this.showAboutDialog();
            }
          },
          {
            label: 'User Guide',
            click: () => {
              this.mainWindow.webContents.send('menu-help');
            }
          }
        ]
      }
    ];

    // macOS specific menu adjustments
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  showAboutDialog() {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'About PDF Processor',
      message: 'PDF Processor v1.0.0',
      detail: 'Advanced OCR processing for PDF files with intelligent text correction and Markdown export.',
      buttons: ['OK']
    });
  }

  setupIpcHandlers() {
    // Settings management
    ipcMain.handle('get-setting', (event, key, defaultValue) => {
      return store.get(key, defaultValue);
    });

    ipcMain.handle('set-setting', (event, key, value) => {
      store.set(key, value);
      return true;
    });

    // File dialog handlers
    ipcMain.handle('show-save-dialog', async (event, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow, options);
      return result;
    });

    ipcMain.handle('show-open-dialog', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow, options);
      return result;
    });

    // Process management
    ipcMain.handle('start-pdf-processing', async (event, urls, settings) => {
      console.log('PDF processing requested:', { urls, settings });
      try {
        // Import and use PDF processor
        const PDFProcessor = require('./workers/pdf-processor');
        const processor = new PDFProcessor(this.mainWindow);
        
        console.log('Starting PDF processing...');
        const results = await processor.processURLs(urls, settings);
        console.log('PDF processing completed:', results);
        
        // Send completion event
        this.mainWindow.webContents.send('processing-complete', { 
          success: true, 
          results 
        });
        
        return { success: true, results };
      } catch (error) {
        console.error('PDF processing error:', error);
        
        // Send error event
        this.mainWindow.webContents.send('processing-error', { 
          success: false, 
          error: error.message 
        });
        
        return { success: false, error: error.message };
      }
    });

    // Progress reporting
    ipcMain.on('processing-progress', (event, data) => {
      this.mainWindow.webContents.send('processing-progress', data);
    });

    // Error reporting
    ipcMain.on('processing-error', (event, data) => {
      this.mainWindow.webContents.send('processing-error', data);
    });

    // Completion notification
    ipcMain.on('processing-complete', (event, data) => {
      this.mainWindow.webContents.send('processing-complete', data);
    });
  }
}

// Create app instance
new PDFProcessorApp();