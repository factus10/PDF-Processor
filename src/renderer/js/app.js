class PDFProcessorApp {
  constructor() {
    this.urls = [];
    this.activeJobs = new Map();
    this.settings = this.getDefaultSettings();
    
    this.initializeApp();
  }

  async initializeApp() {
    // Load settings
    await this.loadSettings();
    
    // Initialize UI components
    this.initializeEventListeners();
    this.initializeIPCListeners();
    
    // Set default output path
    this.setDefaultOutputPath();
    
    // Update UI state
    this.updateUIState();
    
    console.log('PDF Processor App initialized');
  }

  getDefaultSettings() {
    return {
      ocrLanguage: 'eng',
      confidenceThreshold: 60,
      preserveLayout: true,
      enableSpellCheck: true,
      aggressiveCorrection: false,
      customDictionary: '',
      outputFormat: 'markdown',
      includeMetadata: true,
      preserveFormatting: true,
      outputPath: ''
    };
  }

  async loadSettings() {
    try {
      for (const [key, defaultValue] of Object.entries(this.settings)) {
        const value = await window.electronAPI.getSetting(key, defaultValue);
        this.settings[key] = value;
      }
      this.updateSettingsUI();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      for (const [key, value] of Object.entries(this.settings)) {
        await window.electronAPI.setSetting(key, value);
      }
      this.showNotification('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showNotification('Failed to save settings', 'error');
    }
  }

  initializeEventListeners() {
    // URL input
    const urlInput = document.getElementById('urlInput');
    const addUrlBtn = document.getElementById('addUrlBtn');
    
    addUrlBtn.addEventListener('click', () => this.addURL());
    urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addURL();
    });

    // Batch input
    document.getElementById('batchInputBtn').addEventListener('click', () => {
      this.showModal('batchModal');
    });

    // File input
    document.getElementById('loadFileBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileLoad(e.target.files[0]);
    });

    // Processing controls
    document.getElementById('startBtn').addEventListener('click', () => {
      this.startProcessing();
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
      this.pauseProcessing();
    });

    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stopProcessing();
    });

    // Output path
    document.getElementById('browseOutputBtn').addEventListener('click', () => {
      this.browseOutputPath();
    });

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.showModal('settingsModal');
    });

    // Clear all
    document.getElementById('clearAllBtn').addEventListener('click', () => {
      this.clearAllURLs();
    });

    // Modal handlers
    this.initializeModalHandlers();
    
    // Settings handlers
    this.initializeSettingsHandlers();
    
    // Preview handlers
    this.initializePreviewHandlers();
  }

  initializeModalHandlers() {
    // Close modal when clicking close button or outside
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        this.hideModal(modal.id);
      });
    });

    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });

    // Batch modal
    document.getElementById('addBatchUrlsBtn').addEventListener('click', () => {
      this.addBatchURLs();
    });

    document.getElementById('cancelBatchBtn').addEventListener('click', () => {
      this.hideModal('batchModal');
    });

    // Settings modal
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveSettingsFromUI();
    });

    document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
      this.hideModal('settingsModal');
      this.updateSettingsUI(); // Reset to saved values
    });
  }

  initializeSettingsHandlers() {
    // Tab switching
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchSettingsTab(tabName);
      });
    });

    // Range input updates
    document.getElementById('confidenceThreshold').addEventListener('input', (e) => {
      document.querySelector('.range-value').textContent = e.target.value + '%';
    });
  }

  initializePreviewHandlers() {
    // Preview toggle
    document.getElementById('previewToggleBtn').addEventListener('click', () => {
      this.togglePreview();
    });

    // Preview tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchPreviewTab(tabName);
      });
    });

    // Preview selection
    document.getElementById('previewSelect').addEventListener('change', (e) => {
      this.loadPreview(e.target.value);
    });
  }

  initializeIPCListeners() {
    // Processing progress
    window.electronAPI.onProcessingProgress((event, data) => {
      this.updateJobProgress(data);
    });

    // Processing error
    window.electronAPI.onProcessingError((event, data) => {
      this.handleProcessingError(data);
    });

    // Processing complete
    window.electronAPI.onProcessingComplete((event, data) => {
      this.handleProcessingComplete(data);
    });

    // Menu events
    window.electronAPI.onMenuNewJob(() => {
      document.getElementById('urlInput').focus();
    });

    window.electronAPI.onMenuPauseAll(() => {
      this.pauseProcessing();
    });

    window.electronAPI.onMenuResumeAll(() => {
      this.resumeProcessing();
    });

    window.electronAPI.onMenuCancelAll(() => {
      this.stopProcessing();
    });

    window.electronAPI.onMenuOCRSettings(() => {
      this.showModal('settingsModal');
      this.switchSettingsTab('ocr');
    });
  }

  addURL() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();

    if (!url) {
      this.showNotification('Please enter a URL', 'warning');
      return;
    }

    if (!this.isValidURL(url)) {
      this.showNotification('Please enter a valid PDF URL', 'error');
      return;
    }

    if (this.urls.includes(url)) {
      this.showNotification('URL already added', 'warning');
      return;
    }

    this.urls.push(url);
    urlInput.value = '';
    this.updateURLList();
    this.updateUIState();
  }

  addBatchURLs() {
    const batchInput = document.getElementById('batchUrlInput');
    const urls = batchInput.value.split('\n')
      .map(url => url.trim())
      .filter(url => url && this.isValidURL(url));

    let addedCount = 0;
    for (const url of urls) {
      if (!this.urls.includes(url)) {
        this.urls.push(url);
        addedCount++;
      }
    }

    this.hideModal('batchModal');
    batchInput.value = '';
    
    this.showNotification(`Added ${addedCount} URLs`, 'success');
    this.updateURLList();
    this.updateUIState();
  }

  async handleFileLoad(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const urls = text.split('\n')
        .map(url => url.trim())
        .filter(url => url && this.isValidURL(url));

      let addedCount = 0;
      for (const url of urls) {
        if (!this.urls.includes(url)) {
          this.urls.push(url);
          addedCount++;
        }
      }

      this.showNotification(`Loaded ${addedCount} URLs from file`, 'success');
      this.updateURLList();
      this.updateUIState();
    } catch (error) {
      this.showNotification('Failed to load file', 'error');
    }
  }

  removeURL(index) {
    this.urls.splice(index, 1);
    this.updateURLList();
    this.updateUIState();
  }

  clearAllURLs() {
    this.urls = [];
    this.updateURLList();
    this.updateUIState();
  }

  async startProcessing() {
    console.log('Start processing clicked');
    console.log('Current URLs:', this.urls);
    console.log('Current settings:', this.settings);

    if (this.urls.length === 0) {
      this.showNotification('Please add URLs to process', 'warning');
      return;
    }

    if (!this.settings.outputPath) {
      this.showNotification('Please select an output folder', 'warning');
      return;
    }

    try {
      this.setProcessingState(true);
      console.log('Calling electronAPI.startProcessing...');
      
      const result = await window.electronAPI.startProcessing(this.urls, this.settings);
      console.log('Processing result:', result);
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Unknown processing error');
      }

      this.showNotification('Processing started successfully!', 'success');
    } catch (error) {
      console.error('Processing error:', error);
      this.showNotification(`Failed to start processing: ${error.message}`, 'error');
      this.setProcessingState(false);
    }
  }

  pauseProcessing() {
    // Implementation would send pause signal to main process
    this.showNotification('Processing paused', 'info');
  }

  resumeProcessing() {
    // Implementation would send resume signal to main process
    this.showNotification('Processing resumed', 'info');
  }

  stopProcessing() {
    // Implementation would send stop signal to main process
    this.setProcessingState(false);
    this.showNotification('Processing stopped', 'info');
  }

  async browseOutputPath() {
    try {
      const result = await window.electronAPI.showOpenDialog({
        properties: ['openDirectory'],
        title: 'Select Output Folder'
      });

      if (!result.canceled && result.filePaths.length > 0) {
        this.settings.outputPath = result.filePaths[0];
        document.getElementById('outputPath').value = this.settings.outputPath;
        await this.saveSettings();
      }
    } catch (error) {
      console.error('Browse folder error:', error);
    }
  }

  setDefaultOutputPath() {
    const outputPathInput = document.getElementById('outputPath');
    if (outputPathInput) {
      if (this.settings.outputPath) {
        outputPathInput.value = this.settings.outputPath;
      } else {
        // Set a default path for testing
        this.settings.outputPath = './output';
        outputPathInput.value = this.settings.outputPath;
      }
    }
  }

  updateURLList() {
    const urlList = document.getElementById('urlList');
    
    if (this.urls.length === 0) {
      urlList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <div class="empty-state-title">No URLs Added</div>
          <div class="empty-state-message">Add PDF URLs to start processing</div>
        </div>
      `;
      return;
    }

    urlList.innerHTML = this.urls.map((url, index) => `
      <div class="url-item">
        <span class="url-text" title="${url}">${url}</span>
        <div class="url-actions">
          <button class="btn btn-small btn-outline" onclick="app.editURL(${index})">Edit</button>
          <button class="btn btn-small btn-danger" onclick="app.removeURL(${index})">Remove</button>
        </div>
      </div>
    `).join('');
  }

  updateUIState() {
    const hasUrls = this.urls.length > 0;
    const hasOutputPath = !!this.settings.outputPath;
    
    console.log('Updating UI state:', { hasUrls, hasOutputPath, urls: this.urls, outputPath: this.settings.outputPath });
    
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.disabled = !hasUrls || !hasOutputPath;
      console.log('Start button disabled:', startBtn.disabled);
    }
    
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
      clearAllBtn.disabled = !hasUrls;
    }
    
    // Update status
    const statusText = document.getElementById('statusText');
    if (statusText) {
      if (!hasUrls) {
        statusText.textContent = 'Add URLs to begin';
      } else if (!hasOutputPath) {
        statusText.textContent = 'Select output folder';
      } else {
        statusText.textContent = `Ready to process ${this.urls.length} PDF${this.urls.length > 1 ? 's' : ''}`;
      }
    }
  }

  updateJobProgress(data) {
    const { jobId, status, progress, message } = data;
    console.log(`[UI] Progress update for ${jobId}: ${status} (${progress}%) - ${message}`);
    
    // Update or create job entry in processing list
    this.updateJobInList(jobId, status, progress, message);
    
    // Update overall progress
    this.updateOverallProgress();
    
    // Update preview if this job is selected
    this.updatePreviewIfSelected(jobId, data);
    
    // Use the progress component if available
    if (window.progressViewComponent) {
      window.progressViewComponent.updateJobProgress(jobId, data);
    }
  }

  updateJobInList(jobId, status, progress, message) {
    const processingList = document.getElementById('processingList');
    let jobElement = document.getElementById(`job-${jobId}`);
    
    if (!jobElement) {
      // Create new job element
      const jobUrl = this.getJobURL(jobId);
      jobElement = document.createElement('div');
      jobElement.id = `job-${jobId}`;
      jobElement.className = 'processing-item';
      processingList.appendChild(jobElement);
    }

    const jobUrl = this.getJobURL(jobId);
    jobElement.innerHTML = `
      <div class="processing-header">
        <div class="processing-url">${jobUrl}</div>
        <div class="processing-status status-${status}">${this.getStatusText(status)}</div>
      </div>
      <div class="processing-progress">
        <div class="progress-text">
          <span>${message || 'Processing...'}</span>
          <span>${progress ? progress + '%' : ''}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress || 0}%"></div>
        </div>
      </div>
    `;

    // Store job data
    this.activeJobs.set(jobId, { status, progress, message, url: jobUrl });
  }

  updateOverallProgress() {
    const jobs = Array.from(this.activeJobs.values());
    if (jobs.length === 0) return;

    const completedJobs = jobs.filter(job => job.status === 'complete').length;
    const totalJobs = jobs.length;
    const overallProgress = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    document.getElementById('overallProgressText').textContent = 
      `${completedJobs}/${totalJobs} completed`;
    document.getElementById('overallProgressBar').style.width = overallProgress + '%';
  }

  getJobURL(jobId) {
    // Try to find the URL from active jobs first
    const job = this.activeJobs.get(jobId);
    if (job && job.url) {
      return job.url;
    }
    
    // Fallback: if we only have one URL, assume it's that one
    if (this.urls.length === 1) {
      return this.urls[0];
    }
    
    // Extract URL from jobId if it contains URL info (some job IDs might)
    return 'Processing...';
  }

  getStatusText(status) {
    const statusMap = {
      pending: 'Pending',
      downloading: 'Downloading',
      converting: 'Converting',
      ocr: 'OCR Processing',
      correcting: 'Text Correction',
      generating: 'Generating Output',
      complete: 'Complete',
      error: 'Error',
      paused: 'Paused',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  }

  handleProcessingError(data) {
    this.showNotification(`Processing error: ${data.message}`, 'error');
    this.updateJobProgress({ ...data, status: 'error' });
  }

  handleProcessingComplete(data) {
    this.showNotification('Processing completed successfully!', 'success');
    this.setProcessingState(false);
    this.updateJobProgress({ ...data, status: 'complete', progress: 100 });
  }

  setProcessingState(isProcessing) {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (isProcessing) {
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-flex';
      stopBtn.style.display = 'inline-flex';
    } else {
      startBtn.style.display = 'inline-flex';
      pauseBtn.style.display = 'none';
      stopBtn.style.display = 'none';
    }
  }

  // Settings methods
  switchSettingsTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });

    // Update tab content
    document.querySelectorAll('.settings-tab-content').forEach(content => {
      content.classList.remove('active');
      if (content.id === tabName + 'Settings') {
        content.classList.add('active');
      }
    });
  }

  updateSettingsUI() {
    document.getElementById('ocrLanguage').value = this.settings.ocrLanguage;
    document.getElementById('confidenceThreshold').value = this.settings.confidenceThreshold;
    document.querySelector('.range-value').textContent = this.settings.confidenceThreshold + '%';
    document.getElementById('preserveLayout').checked = this.settings.preserveLayout;
    document.getElementById('enableSpellCheck').checked = this.settings.enableSpellCheck;
    document.getElementById('aggressiveCorrection').checked = this.settings.aggressiveCorrection;
    document.getElementById('customDictionary').value = this.settings.customDictionary;
    document.getElementById('outputFormat').value = this.settings.outputFormat;
    document.getElementById('includeMetadata').checked = this.settings.includeMetadata;
    document.getElementById('preserveFormatting').checked = this.settings.preserveFormatting;
  }

  async saveSettingsFromUI() {
    this.settings.ocrLanguage = document.getElementById('ocrLanguage').value;
    this.settings.confidenceThreshold = parseInt(document.getElementById('confidenceThreshold').value);
    this.settings.preserveLayout = document.getElementById('preserveLayout').checked;
    this.settings.enableSpellCheck = document.getElementById('enableSpellCheck').checked;
    this.settings.aggressiveCorrection = document.getElementById('aggressiveCorrection').checked;
    this.settings.customDictionary = document.getElementById('customDictionary').value;
    this.settings.outputFormat = document.getElementById('outputFormat').value;
    this.settings.includeMetadata = document.getElementById('includeMetadata').checked;
    this.settings.preserveFormatting = document.getElementById('preserveFormatting').checked;

    await this.saveSettings();
    this.hideModal('settingsModal');
  }

  // Preview methods
  togglePreview() {
    const container = document.getElementById('previewContainer');
    const btn = document.getElementById('previewToggleBtn');
    const isVisible = container.style.display !== 'none';

    if (isVisible) {
      container.style.display = 'none';
      btn.innerHTML = '<span class="icon">👁️</span> Show Preview';
    } else {
      container.style.display = 'block';
      btn.innerHTML = '<span class="icon">👁️</span> Hide Preview';
    }
  }

  switchPreviewTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
      if (content.id === tabName + 'Tab') {
        content.classList.add('active');
      }
    });
  }

  loadPreview(jobId) {
    // Implementation would load preview data for the selected job
    // This is a placeholder
    document.getElementById('originalText').value = 'Original OCR text would appear here...';
    document.getElementById('correctedText').value = 'Corrected text would appear here...';
    document.getElementById('markdownText').value = '# Markdown Output\n\nFormatted markdown would appear here...';
  }

  updatePreviewIfSelected(jobId, data) {
    const select = document.getElementById('previewSelect');
    if (select.value === jobId) {
      // Update preview with new data
      this.loadPreview(jobId);
    }
  }

  // Utility methods
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
  }

  isValidURL(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-text">
          <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">&times;</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Auto hide after 5 seconds
    setTimeout(() => this.hideNotification(notification), 5000);

    // Close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.hideNotification(notification);
    });
  }

  hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  editURL(index) {
    const newUrl = prompt('Edit URL:', this.urls[index]);
    if (newUrl && this.isValidURL(newUrl)) {
      this.urls[index] = newUrl;
      this.updateURLList();
    }
  }

  // Helper method to add a test URL for development
  addTestURL() {
    const testUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    if (!this.urls.includes(testUrl)) {
      this.urls.push(testUrl);
      this.updateURLList();
      this.updateUIState();
      console.log('Added test URL:', testUrl);
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PDFProcessorApp();
  
  // For development/testing - add test URL and path
  console.log('PDF Processor loaded! Try these commands in the console:');
  console.log('app.addTestURL() - Add a test PDF URL');
  console.log('app.updateUIState() - Refresh UI state');
  console.log('app.startProcessing() - Start processing (if button is disabled)');
});