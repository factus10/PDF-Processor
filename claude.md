# PDF Processor - Electron OCR Application

## Project Overview
An Electron desktop application that downloads PDFs from URLs, performs OCR processing, applies intelligent text correction, and outputs clean Markdown files with real-time processing visualization.

## Key Features
- **PDF URL Processing**: Download PDFs from web URLs with progress tracking
- **Advanced OCR**: Convert PDF pages to images and extract text using Tesseract.js
- **Intelligent Text Correction**: 
  - Column restoration from multi-column layouts
  - Heading detection and hierarchy preservation
  - Spell checking and OCR error correction
  - Natural language processing for improved readability
- **Real-time Preview**: Live display of processing progress and text extraction
- **Batch Processing**: Handle multiple PDFs simultaneously
- **Markdown Export**: Generate well-formatted Markdown files with proper structure

## Technical Stack
- **Framework**: Electron (Latest)
- **OCR Engine**: Tesseract.js
- **PDF Processing**: pdf-poppler, pdf2pic
- **Text Processing**: compromise, natural, typo-js
- **Language**: JavaScript/Node.js
- **UI**: HTML5, CSS3, Vanilla JavaScript

## Project Architecture

### Directory Structure
```
PDF-Processor/
├── src/
│   ├── main/                    # Main process code
│   │   ├── main.js              # Main entry point
│   │   ├── menu.js              # Application menu
│   │   ├── ipc-handlers.js      # IPC communication handlers
│   │   └── workers/             # Background workers
│   │       ├── pdf-processor.js # PDF download & conversion
│   │       ├── ocr-worker.js    # OCR processing
│   │       └── text-corrector.js # Text correction pipeline
│   ├── renderer/                # Renderer process code
│   │   ├── index.html           # Main UI
│   │   ├── styles/              # CSS files
│   │   │   └── main.css         
│   │   ├── js/                  # Frontend JavaScript
│   │   │   ├── app.js           # Main renderer logic
│   │   │   └── components/      # UI components
│   │   │       ├── url-input.js 
│   │   │       ├── progress-view.js 
│   │   │       └── text-preview.js
│   │   └── assets/              # Images, icons
│   └── utils/                   # Shared utilities
│       ├── text-processor.js    # Text correction algorithms
│       ├── markdown-generator.js # Markdown formatting
│       ├── heading-detector.js  # Heading recognition
│       └── ocr-error-corrector.js # OCR error patterns
├── tests/                       # Test files
├── build/                       # Build configuration
├── dist/                        # Distribution files
├── package.json
├── README.md
└── claude.md                    # This file
```

## Core Components

### 1. Main Process (`src/main/main.js`)
- Manages application lifecycle
- Creates and controls browser windows
- Handles IPC communication with renderer
- Coordinates worker processes

### 2. PDF Processor Worker (`src/main/workers/pdf-processor.js`)
- Downloads PDFs from URLs with progress tracking
- Validates PDF format
- Converts PDF pages to high-quality images for OCR
- Handles network errors and retries

### 3. OCR Worker (`src/main/workers/ocr-worker.js`)
- Processes images using Tesseract.js
- Extracts text with confidence scoring
- Preserves spatial information for layout analysis
- Sends progress updates to main process

### 4. Text Correction Pipeline (`src/main/workers/text-corrector.js`)
- Restores multi-column layouts
- Detects and fixes common OCR errors
- Applies spell checking with context awareness
- Uses NLP for improved text flow

### 5. UI Components
- **URL Input**: Accepts single or batch PDF URLs
- **Progress View**: Real-time processing status
- **Text Preview**: Live display of extracted/corrected text
- **Settings Panel**: OCR and correction options

## Processing Pipeline

1. **URL Input** → Validate and queue URLs
2. **PDF Download** → Download with progress tracking
3. **PDF to Image** → Convert pages to high-res images
4. **OCR Processing** → Extract text with Tesseract
5. **Text Correction** → Apply intelligent corrections
6. **Markdown Generation** → Format and structure output
7. **Save Results** → Export to user-specified location

## Key Algorithms

### Column Detection & Restoration
```javascript
// Analyzes text positioning to detect multi-column layouts
// Merges text fragments based on spatial proximity
// Preserves reading order and paragraph structure
```

### Heading Detection
```javascript
// Uses multiple signals:
// - Font size (from OCR confidence)
// - Capitalization patterns
// - Numbering schemes (1., A., i., etc.)
// - Position on page
// - Surrounding whitespace
```

### OCR Error Correction
```javascript
// Common patterns:
// 'rn' → 'm', 'cl' → 'd', '0' → 'o', '1' → 'l'
// Context-aware correction using dictionary
// Preserves technical terms and proper nouns
```

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Package for distribution
npm run dist
```

## Configuration

The application supports various configuration options:

```javascript
{
  "ocr": {
    "language": "eng",
    "confidence_threshold": 0.6,
    "preserve_layout": true
  },
  "correction": {
    "spell_check": true,
    "aggressive_mode": false,
    "custom_dictionary": []
  },
  "output": {
    "format": "markdown",
    "include_metadata": true,
    "preserve_formatting": true
  }
}
```

## Error Handling

- Network timeouts with exponential backoff
- Invalid PDF format detection
- OCR failure recovery
- Memory usage monitoring
- Graceful degradation for low-quality scans

## Performance Considerations

- Worker threads for CPU-intensive tasks
- Streaming for large PDFs
- Image optimization before OCR
- Caching of processed pages
- Batch processing with concurrency limits

## Testing Strategy

- Unit tests for text processing algorithms
- Integration tests for PDF pipeline
- E2E tests for UI workflows
- Performance benchmarks
- Cross-platform compatibility tests

## Future Enhancements

- [ ] Support for additional OCR languages
- [ ] Plugin system for custom corrections
- [ ] Cloud processing option
- [ ] Direct scanner integration
- [ ] Export to additional formats (DOCX, HTML)
- [ ] Machine learning for improved heading detection
- [ ] Collaborative editing features

## Security Considerations

- URL validation and sanitization
- Sandboxed PDF processing
- Limited resource allocation per PDF
- No execution of embedded scripts
- Secure file system access

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

For issues and feature requests, please use the GitHub issue tracker.