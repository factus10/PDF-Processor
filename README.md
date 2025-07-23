# PDF Processor

A powerful Electron desktop application that processes PDF files through OCR, applies intelligent text correction, and outputs clean Markdown files with real-time processing visualization.

## Features

🔍 **Advanced OCR Processing**
- High-quality text extraction using Tesseract.js
- Support for multiple languages
- Confidence-based quality assessment

🧠 **Intelligent Text Correction**
- Automatic correction of common OCR errors
- Column layout restoration
- Spell checking with custom dictionaries
- Natural language processing for improved readability

📝 **Smart Markdown Generation**
- Automatic heading detection
- List and table recognition
- Proper formatting and structure
- Metadata inclusion

⚡ **Real-time Processing**
- Live progress tracking
- Interactive text preview
- Batch processing support
- Error handling and recovery

## Installation

### Prerequisites
- Node.js 18.x or higher
- NPM or Yarn package manager

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd PDF-Processor

# Install dependencies
npm install

# Start the application in development mode
npm run dev
```

### Build for Production
```bash
# Build the application
npm run build

# Create distributable packages
npm run dist
```

## Usage

1. **Add PDF URLs**: Enter PDF URLs you want to process
2. **Configure Settings**: Adjust OCR language, correction settings, and output format
3. **Select Output Folder**: Choose where to save the processed files
4. **Start Processing**: Click the start button to begin processing
5. **Monitor Progress**: Watch real-time progress and preview results
6. **Access Results**: Find your processed Markdown files in the output folder

### Batch Processing
- Use "Batch Input" to add multiple URLs at once
- Load URLs from text files
- Process multiple PDFs simultaneously

### Settings Configuration

**OCR Settings**
- Language: Choose OCR language (English, Spanish, French, German)
- Confidence Threshold: Set minimum confidence for text extraction
- Layout Preservation: Maintain original document structure

**Text Correction**
- Spell Checking: Enable/disable automatic spell correction
- Aggressive Correction: More extensive error correction
- Custom Dictionary: Add domain-specific terms

**Output Settings**
- Format: Markdown, Plain Text, or HTML
- Metadata: Include processing information
- Formatting: Preserve original text formatting

## Technical Architecture

### Main Process Components
- **Main.js**: Application lifecycle and window management
- **PDF Processor**: Handles PDF download and conversion
- **OCR Worker**: Manages Tesseract.js OCR processing
- **Text Corrector**: Applies intelligent text corrections

### Renderer Process
- **App.js**: Main application logic and UI management
- **Components**: Modular UI components for different features
- **Styles**: CSS for modern, responsive interface

### Processing Pipeline
1. PDF URL validation and download
2. PDF to high-resolution image conversion
3. OCR text extraction with confidence scoring
4. Multi-column layout restoration
5. OCR error pattern correction
6. Spell checking and grammar improvement
7. Markdown formatting and structure detection
8. Output file generation and metadata inclusion

## Development

### Project Structure
```
PDF-Processor/
├── src/
│   ├── main/                # Main process code
│   │   ├── main.js          # Entry point
│   │   └── workers/         # Background processing
│   ├── renderer/            # UI and frontend
│   │   ├── index.html       # Main interface
│   │   ├── js/              # JavaScript modules
│   │   └── styles/          # CSS styling
│   └── utils/               # Shared utilities
├── tests/                   # Test files
├── build/                   # Build configuration
└── dist/                    # Distribution files
```

### Available Scripts
```bash
npm run dev          # Development mode with hot reload
npm test            # Run test suite
npm run build       # Build for production
npm run dist        # Create distributable packages
npm run lint        # Code linting
npm start           # Start built application
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "OCR"
npm test -- --grep "TextCorrection"
```

## Configuration

### Environment Variables
- `NODE_ENV`: Development or production mode
- `LOG_LEVEL`: Logging verbosity (debug, info, warn, error)

### Settings Storage
Settings are automatically saved to the user's application data directory using `electron-store`.

## Troubleshooting

### Common Issues

**OCR Not Working**
- Ensure Tesseract.js dependencies are properly installed
- Check network connectivity for language data downloads
- Verify PDF image quality and resolution

**Processing Errors**
- Check PDF URL accessibility
- Ensure sufficient disk space for temporary files
- Verify output folder write permissions

**Performance Issues**
- Reduce batch size for large PDFs
- Lower OCR quality settings if needed
- Close other memory-intensive applications

### Logs
Application logs are available in:
- **Windows**: `%APPDATA%/pdf-processor/logs/`
- **macOS**: `~/Library/Logs/pdf-processor/`
- **Linux**: `~/.config/pdf-processor/logs/`

## Requirements

### System Requirements
- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Disk Space**: 500MB for application, additional space for processing
- **Network**: Internet connection for PDF downloads and OCR language data

### Supported PDF Types
- Standard PDF documents
- Scanned documents (images embedded in PDF)
- Multi-page documents
- Password-protected PDFs (with manual password entry)

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tesseract.js](https://tesseract.projectnaptha.com/) for OCR capabilities
- [Electron](https://www.electronjs.org/) for cross-platform desktop framework
- [pdf2pic](https://www.npmjs.com/package/pdf2pic) for PDF to image conversion
- [Compromise](https://compromise.cool/) for natural language processing
- [Natural](https://github.com/NaturalNode/natural) for text processing utilities

## Support

For support, bug reports, or feature requests:
- Create an issue on GitHub
- Check the [documentation](claude.md)
- Review troubleshooting guide above

---

**Made with ❤️ for better document processing**