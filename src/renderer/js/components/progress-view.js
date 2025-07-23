// Progress View Component
class ProgressViewComponent {
  constructor() {
    this.jobs = new Map();
    this.initializeComponent();
  }

  initializeComponent() {
    this.updateMemoryUsage();
    // Update memory usage every 5 seconds
    setInterval(() => this.updateMemoryUsage(), 5000);
  }

  updateJobProgress(jobId, data) {
    this.jobs.set(jobId, data);
    this.renderJobProgress(jobId, data);
    this.updateOverallProgress();
  }

  renderJobProgress(jobId, data) {
    const processingList = document.getElementById('processingList');
    if (!processingList) return;

    let jobElement = document.getElementById(`job-${jobId}`);
    
    if (!jobElement) {
      jobElement = document.createElement('div');
      jobElement.id = `job-${jobId}`;
      jobElement.className = 'processing-item fade-in';
      processingList.appendChild(jobElement);
    }

    const statusClass = this.getStatusClass(data.status);
    const progressWidth = data.progress || 0;

    jobElement.innerHTML = `
      <div class="processing-header">
        <div class="processing-url" title="${data.url || 'Unknown URL'}">${this.truncateURL(data.url)}</div>
        <div class="processing-status ${statusClass}">${this.getStatusText(data.status)}</div>
      </div>
      <div class="processing-progress">
        <div class="progress-text">
          <span>${data.message || 'Processing...'}</span>
          <span>${data.progress ? data.progress + '%' : ''}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressWidth}%; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
  }

  updateOverallProgress() {
    const totalJobs = this.jobs.size;
    const completedJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'complete' || job.status === 'error').length;
    
    const overallProgress = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    const progressText = document.getElementById('overallProgressText');
    const progressBar = document.getElementById('overallProgressBar');
    
    if (progressText) {
      progressText.textContent = `${completedJobs}/${totalJobs} completed`;
    }
    
    if (progressBar) {
      progressBar.style.width = overallProgress + '%';
    }
  }

  getStatusClass(status) {
    const statusMap = {
      pending: 'status-pending',
      downloading: 'status-downloading',
      converting: 'status-converting',
      ocr: 'status-ocr',
      correcting: 'status-correcting',
      generating: 'status-generating',
      saving: 'status-saving',
      complete: 'status-complete',
      error: 'status-error',
      paused: 'status-pending',
      cancelled: 'status-error'
    };
    return statusMap[status] || 'status-pending';
  }

  getStatusText(status) {
    const statusMap = {
      pending: 'Pending',
      downloading: 'Downloading PDF',
      converting: 'Converting to Images',
      ocr: 'OCR Processing',
      correcting: 'Text Correction',
      generating: 'Generating Markdown',
      saving: 'Saving Output',
      complete: 'Complete ✅',
      error: 'Error ❌',
      paused: 'Paused',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  }

  truncateURL(url, maxLength = 60) {
    if (!url || url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
  }

  clearAllJobs() {
    this.jobs.clear();
    const processingList = document.getElementById('processingList');
    if (processingList) {
      processingList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⏳</div>
          <div class="empty-state-title">No Active Processing</div>
          <div class="empty-state-message">Jobs will appear here when processing starts</div>
        </div>
      `;
    }
    this.updateOverallProgress();
  }

  updateMemoryUsage() {
    // Estimate memory usage (this is a simplified version)
    const memoryElement = document.getElementById('memoryUsage');
    if (memoryElement && window.performance && window.performance.memory) {
      const used = Math.round(window.performance.memory.usedJSHeapSize / 1048576);
      memoryElement.textContent = `Memory: ${used} MB`;
    }
  }

  removeJob(jobId) {
    this.jobs.delete(jobId);
    const jobElement = document.getElementById(`job-${jobId}`);
    if (jobElement) {
      jobElement.remove();
    }
    this.updateOverallProgress();
  }
}

// Initialize component when DOM is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.progressViewComponent = new ProgressViewComponent();
  });
}