// URL Input Component
class URLInputComponent {
  constructor() {
    this.urls = [];
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // URL validation
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
      urlInput.addEventListener('input', this.validateURL.bind(this));
    }
  }

  validateURL(event) {
    const url = event.target.value.trim();
    const input = event.target;
    
    if (url) {
      try {
        new URL(url);
        input.classList.remove('input-error');
        
        // Check if it looks like a PDF URL
        if (url.toLowerCase().includes('.pdf') || this.isPDFURL(url)) {
          input.style.borderColor = '#10b981';
        } else {
          input.style.borderColor = '#f59e0b';
        }
      } catch {
        input.classList.add('input-error');
      }
    } else {
      input.classList.remove('input-error');
      input.style.borderColor = '';
    }
  }

  isPDFURL(url) {
    const pdfIndicators = ['.pdf', '/pdf/', 'application/pdf'];
    return pdfIndicators.some(indicator => 
      url.toLowerCase().includes(indicator)
    );
  }
}

// Initialize component when DOM is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.urlInputComponent = new URLInputComponent();
  });
}