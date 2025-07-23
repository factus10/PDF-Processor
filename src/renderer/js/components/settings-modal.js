// Settings Modal Component
class SettingsModalComponent {
  constructor() {
    this.settings = {};
    this.initializeComponent();
  }

  initializeComponent() {
    this.setupModalEvents();
    this.setupTabSwitching();
    this.setupRangeInputs();
  }

  setupModalEvents() {
    // Modal close events
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(closeBtn => {
      closeBtn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) this.hideModal(modal.id);
      });
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.hideModal(e.target.id);
      }
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.show');
        if (openModal) this.hideModal(openModal.id);
      }
    });
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.settings-tab-btn');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchSettingsTab(tabName);
      });
    });
  }

  setupRangeInputs() {
    const confidenceSlider = document.getElementById('confidenceThreshold');
    if (confidenceSlider) {
      confidenceSlider.addEventListener('input', (e) => {
        const valueDisplay = document.querySelector('.range-value');
        if (valueDisplay) {
          valueDisplay.textContent = e.target.value + '%';
        }
      });
    }
  }

  switchSettingsTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // Update tab content
    document.querySelectorAll('.settings-tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`${tabName}Settings`);
    if (activeContent) {
      activeContent.classList.add('active');
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      // Focus first input in modal
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  loadSettings(settings) {
    this.settings = { ...settings };
    
    // OCR Settings
    const ocrLanguage = document.getElementById('ocrLanguage');
    if (ocrLanguage) ocrLanguage.value = settings.ocrLanguage || 'eng';
    
    const confidenceThreshold = document.getElementById('confidenceThreshold');
    if (confidenceThreshold) {
      confidenceThreshold.value = settings.confidenceThreshold || 60;
      const valueDisplay = document.querySelector('.range-value');
      if (valueDisplay) valueDisplay.textContent = (settings.confidenceThreshold || 60) + '%';
    }
    
    const preserveLayout = document.getElementById('preserveLayout');
    if (preserveLayout) preserveLayout.checked = settings.preserveLayout !== false;
    
    // Text Correction Settings
    const enableSpellCheck = document.getElementById('enableSpellCheck');
    if (enableSpellCheck) enableSpellCheck.checked = settings.enableSpellCheck !== false;
    
    const aggressiveCorrection = document.getElementById('aggressiveCorrection');
    if (aggressiveCorrection) aggressiveCorrection.checked = settings.aggressiveCorrection || false;
    
    const customDictionary = document.getElementById('customDictionary');
    if (customDictionary) customDictionary.value = settings.customDictionary || '';
    
    // Output Settings
    const outputFormat = document.getElementById('outputFormat');
    if (outputFormat) outputFormat.value = settings.outputFormat || 'markdown';
    
    const includeMetadata = document.getElementById('includeMetadata');
    if (includeMetadata) includeMetadata.checked = settings.includeMetadata !== false;
    
    const preserveFormatting = document.getElementById('preserveFormatting');
    if (preserveFormatting) preserveFormatting.checked = settings.preserveFormatting !== false;
  }

  saveSettings() {
    const newSettings = {
      // OCR Settings
      ocrLanguage: this.getFieldValue('ocrLanguage', 'eng'),
      confidenceThreshold: parseInt(this.getFieldValue('confidenceThreshold', '60')),
      preserveLayout: this.getCheckboxValue('preserveLayout', true),
      
      // Text Correction Settings
      enableSpellCheck: this.getCheckboxValue('enableSpellCheck', true),
      aggressiveCorrection: this.getCheckboxValue('aggressiveCorrection', false),
      customDictionary: this.getFieldValue('customDictionary', ''),
      
      // Output Settings
      outputFormat: this.getFieldValue('outputFormat', 'markdown'),
      includeMetadata: this.getCheckboxValue('includeMetadata', true),
      preserveFormatting: this.getCheckboxValue('preserveFormatting', true)
    };

    this.settings = { ...newSettings };
    return newSettings;
  }

  getFieldValue(fieldId, defaultValue) {
    const field = document.getElementById(fieldId);
    return field ? field.value : defaultValue;
  }

  getCheckboxValue(fieldId, defaultValue) {
    const field = document.getElementById(fieldId);
    return field ? field.checked : defaultValue;
  }

  validateSettings(settings) {
    const errors = [];

    // Validate confidence threshold
    if (settings.confidenceThreshold < 0 || settings.confidenceThreshold > 100) {
      errors.push('Confidence threshold must be between 0 and 100');
    }

    // Validate output format
    const validFormats = ['markdown', 'txt', 'html'];
    if (!validFormats.includes(settings.outputFormat)) {
      errors.push('Invalid output format selected');
    }

    // Validate language
    const validLanguages = ['eng', 'spa', 'fra', 'deu'];
    if (!validLanguages.includes(settings.ocrLanguage)) {
      errors.push('Invalid OCR language selected');
    }

    return errors;
  }

  resetToDefaults() {
    const defaultSettings = {
      ocrLanguage: 'eng',
      confidenceThreshold: 60,
      preserveLayout: true,
      enableSpellCheck: true,
      aggressiveCorrection: false,
      customDictionary: '',
      outputFormat: 'markdown',
      includeMetadata: true,
      preserveFormatting: true
    };

    this.loadSettings(defaultSettings);
    return defaultSettings;
  }

  exportSettings() {
    const settingsJson = JSON.stringify(this.settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdf-processor-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importSettings(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target.result);
          const errors = this.validateSettings(settings);
          
          if (errors.length > 0) {
            reject(new Error('Invalid settings file: ' + errors.join(', ')));
            return;
          }
          
          this.loadSettings(settings);
          resolve(settings);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  }
}

// Initialize component when DOM is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.settingsModalComponent = new SettingsModalComponent();
  });
}