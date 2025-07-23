const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSetting: (key, defaultValue) => ipcRenderer.invoke('get-setting', key, defaultValue),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // PDF processing
  startProcessing: (urls, settings) => {
    console.log('Preload: startProcessing called with:', { urls, settings });
    return ipcRenderer.invoke('start-pdf-processing', urls, settings);
  },

  // Event listeners
  onProcessingProgress: (callback) => ipcRenderer.on('processing-progress', callback),
  onProcessingError: (callback) => ipcRenderer.on('processing-error', callback),
  onProcessingComplete: (callback) => ipcRenderer.on('processing-complete', callback),

  // Menu events
  onMenuNewJob: (callback) => ipcRenderer.on('menu-new-job', callback),
  onMenuOpenFolder: (callback) => ipcRenderer.on('menu-open-folder', callback),
  onMenuPauseAll: (callback) => ipcRenderer.on('menu-pause-all', callback),
  onMenuResumeAll: (callback) => ipcRenderer.on('menu-resume-all', callback),
  onMenuCancelAll: (callback) => ipcRenderer.on('menu-cancel-all', callback),
  onMenuOCRSettings: (callback) => ipcRenderer.on('menu-ocr-settings', callback),
  onMenuCorrectionSettings: (callback) => ipcRenderer.on('menu-correction-settings', callback),
  onMenuOutputSettings: (callback) => ipcRenderer.on('menu-output-settings', callback),
  onMenuHelp: (callback) => ipcRenderer.on('menu-help', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});