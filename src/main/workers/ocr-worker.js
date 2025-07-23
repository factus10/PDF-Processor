const { createWorker } = require('tesseract.js');
const fs = require('fs-extra');
const path = require('path');

class OCRWorker {
  constructor(mainWindow, jobId) {
    this.mainWindow = mainWindow;
    this.jobId = jobId;
    this.worker = null;
    this.isInitialized = false;
  }

  async initialize(settings) {
    if (this.isInitialized) return;

    try {
      console.log('[OCR Worker] Initializing Tesseract.js worker...');
      
      // Create worker with modern API (no need for loadLanguage/initialize)
      const language = settings.ocrLanguage || 'eng';
      this.worker = await createWorker(language, {
        // Modern API comes pre-loaded and pre-initialized
      });

      console.log('[OCR Worker] Setting OCR parameters...');
      
      // Configure OCR parameters for better accuracy
      await this.worker.setParameters({
        tessedit_char_whitelist: '', // Allow all characters
        tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
        preserve_interword_spaces: '1', // Preserve spaces between words
        tessedit_do_invert: '0', // Don't invert images
        tessedit_create_hocr: '0', // Don't create HOCR output
        tessedit_create_pdf: '0', // Don't create PDF
        tessedit_create_txt: '1', // Create text output
      });

      this.isInitialized = true;
      console.log('[OCR Worker] Tesseract.js initialized successfully');
      this.sendProgress('ocr', 65, 'OCR engine ready for processing');
    } catch (error) {
      console.error('[OCR Worker] Initialization failed:', error);
      throw new Error(`OCR initialization failed: ${error.message}`);
    }
  }

  async processImages(imagePages, settings) {
    console.log(`[OCR Worker] Processing ${imagePages.length} pages for job ${this.jobId}`);
    const results = [];
    const totalPages = imagePages.length;
    let processedPages = 0;

    for (const page of imagePages) {
      try {
        const progress = 40 + Math.round((processedPages / totalPages) * 25); // 40-65% for OCR
        this.sendProgress('ocr', progress, 
          `OCR processing page ${page.page} of ${totalPages}...`
        );

        // Check if this is text-only (no OCR needed)
        if (page.isTextOnly && page.extractedText) {
          console.log(`[OCR Worker] Using extracted text for page ${page.page} (${page.extractedText.length} chars)`);
          const result = {
            page: page.page,
            text: page.extractedText,
            confidence: 100, // Text extraction is 100% confident
            words: this.createMockWordData(page.extractedText),
            lines: this.createMockLineData(page.extractedText),
            paragraphs: this.createMockParagraphData(page.extractedText),
            bbox: null
          };
          results.push(result);
        } else {
          // Regular OCR processing
          console.log(`[OCR Worker] Running Tesseract OCR on page ${page.page}`);
          await this.initialize(settings);
          const result = await this.processImage(page, settings);
          results.push(result);
        }
        
        processedPages++;
        console.log(`[OCR Worker] Completed page ${page.page}, ${processedPages}/${totalPages} done`);

      } catch (error) {
        console.error(`[OCR Worker] Error on page ${page.page}:`, error);
        results.push({
          page: page.page,
          text: page.extractedText || '',
          confidence: page.extractedText ? 100 : 0,
          error: error.message,
          bbox: null
        });
        processedPages++;
      }
    }

    if (this.worker) {
      await this.cleanup();
    }
    
    console.log(`[OCR Worker] All pages processed, combining results`);
    this.sendProgress('ocr', 65, 'Combining OCR results...');
    
    // Combine results into structured text
    const structuredText = this.combinePageResults(results);
    
    console.log(`[OCR Worker] OCR processing complete for job ${this.jobId}`);
    return structuredText;
  }

  async processImage(page, settings) {
    try {
      // Preprocess image if needed
      const imagePath = await this.preprocessImage(page.path, settings);
      
      // Perform OCR
      const { data } = await this.worker.recognize(imagePath);
      
      // Extract structured information
      const result = {
        page: page.page,
        text: data.text,
        confidence: data.confidence,
        words: this.extractWordData(data),
        lines: this.extractLineData(data),
        paragraphs: this.extractParagraphData(data),
        bbox: data.bbox
      };

      // Clean up preprocessed image if it's different from original
      if (imagePath !== page.path) {
        await fs.remove(imagePath);
      }

      return result;
    } catch (error) {
      throw new Error(`OCR processing failed for page ${page.page}: ${error.message}`);
    }
  }

  async preprocessImage(imagePath, settings) {
    // For now, return the original image
    // In a full implementation, you might:
    // - Adjust brightness/contrast
    // - Remove noise
    // - Deskew the image
    // - Enhance text clarity
    return imagePath;
  }

  extractWordData(data) {
    if (!data.words) return [];
    
    return data.words
      .filter(word => word.confidence > (data.confidence * 0.6)) // Filter low confidence words
      .map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox,
        baseline: word.baseline,
        font: word.font_name,
        fontSize: word.font_size,
        bold: word.is_bold,
        italic: word.is_italic
      }));
  }

  extractLineData(data) {
    if (!data.lines) return [];
    
    return data.lines.map(line => ({
      text: line.text,
      confidence: line.confidence,
      bbox: line.bbox,
      baseline: line.baseline,
      words: line.words ? line.words.length : 0
    }));
  }

  extractParagraphData(data) {
    if (!data.paragraphs) return [];
    
    return data.paragraphs.map(paragraph => ({
      text: paragraph.text,
      confidence: paragraph.confidence,
      bbox: paragraph.bbox,
      lines: paragraph.lines ? paragraph.lines.length : 0
    }));
  }

  combinePageResults(results) {
    console.log(`[OCR Worker] Combining ${results.length} page results`);
    
    const structuredText = {
      pages: results,
      fullText: '',
      totalConfidence: 0,
      pageCount: results.length,
      wordCount: 0,
      metadata: {
        averageConfidence: 0,
        lowConfidencePages: [],
        processingTime: Date.now()
      }
    };

    let totalConfidence = 0;
    let totalWords = 0;
    let fullTextParts = [];

    for (const page of results) {
      console.log(`[OCR Worker] Processing page ${page.page}: text length = ${page.text ? page.text.length : 'no text'}`);
      
      if (page.text && page.text.trim()) {
        // Don't add page separators for cleaner text
        if (fullTextParts.length > 0) {
          fullTextParts.push('\n\n');
        }
        fullTextParts.push(page.text.trim());
        
        totalConfidence += (page.confidence || 0);
        totalWords += page.words ? page.words.length : page.text.split(/\s+/).length;
        
        // Track low confidence pages
        if ((page.confidence || 0) < 70) {
          structuredText.metadata.lowConfidencePages.push({
            page: page.page,
            confidence: page.confidence
          });
        }
      }
    }

    structuredText.fullText = fullTextParts.join('');
    structuredText.totalConfidence = totalConfidence;
    structuredText.wordCount = totalWords;
    structuredText.metadata.averageConfidence = results.length > 0 ? 
      totalConfidence / results.length : 0;

    console.log(`[OCR Worker] Combined fullText length: ${structuredText.fullText.length}`);
    console.log(`[OCR Worker] First 200 chars: "${structuredText.fullText.substring(0, 200)}"`);

    return structuredText;
  }

  handleProgress(message) {
    if (message.status === 'recognizing text') {
      const progress = Math.round(message.progress * 15) + 65; // 65-80% for OCR
      this.sendProgress('ocr', progress, `OCR: ${message.status}...`);
    }
  }

  handleError(error) {
    console.error('OCR Worker Error:', error);
    this.sendProgress('error', null, `OCR Error: ${error.message}`);
  }

  sendProgress(status, progress, message) {
    const data = {
      jobId: this.jobId,
      status,
      progress,
      message,
      timestamp: Date.now()
    };
    
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('processing-progress', data);
    }
  }

  async cleanup() {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
      } catch (error) {
        console.warn('OCR cleanup warning:', error.message);
      }
    }
  }

  // Static method for batch processing multiple workers
  static async processImagesInParallel(imagePages, settings, mainWindow, jobId, maxWorkers = 2) {
    const workers = [];
    const results = [];
    const pageChunks = this.chunkArray(imagePages, maxWorkers);

    try {
      // Create workers
      for (let i = 0; i < Math.min(maxWorkers, pageChunks.length); i++) {
        const worker = new OCRWorker(mainWindow, `${jobId}_${i}`);
        workers.push(worker);
      }

      // Process chunks in parallel
      const promises = pageChunks.map(async (chunk, index) => {
        const worker = workers[index];
        const chunkResults = [];
        
        for (const page of chunk) {
          const result = await worker.processImage(page, settings);
          chunkResults.push(result);
        }
        
        return chunkResults;
      });

      const chunkResults = await Promise.all(promises);
      
      // Flatten and sort results by page number
      for (const chunk of chunkResults) {
        results.push(...chunk);
      }
      
      results.sort((a, b) => a.page - b.page);
      
      return results;
    } finally {
      // Cleanup all workers
      for (const worker of workers) {
        await worker.cleanup();
      }
    }
  }

  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Helper methods for text-only processing
  createMockWordData(text) {
    const words = text.split(/\s+/).filter(word => word.trim());
    return words.map((word, index) => ({
      text: word,
      confidence: 100,
      bbox: { x0: index * 10, y0: 0, x1: (index + 1) * 10, y1: 20 },
      baseline: null,
      font: 'Arial',
      fontSize: 12,
      bold: false,
      italic: false
    }));
  }

  createMockLineData(text) {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, index) => ({
      text: line,
      confidence: 100,
      bbox: { x0: 0, y0: index * 20, x1: line.length * 8, y1: (index + 1) * 20 },
      baseline: null,
      words: line.split(/\s+/).length
    }));
  }

  createMockParagraphData(text) {
    const paragraphs = text.split('\n\n').filter(para => para.trim());
    return paragraphs.map((paragraph, index) => ({
      text: paragraph,
      confidence: 100,
      bbox: { x0: 0, y0: index * 100, x1: 400, y1: (index + 1) * 100 },
      lines: paragraph.split('\n').length
    }));
  }
}

module.exports = OCRWorker;