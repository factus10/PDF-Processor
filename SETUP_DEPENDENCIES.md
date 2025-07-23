# PDF Processor Dependencies Setup

This document outlines the system dependencies required for full OCR functionality.

## Issue Summary

The PDF Processor was falling back to basic text extraction instead of performing OCR because essential dependencies were missing. This resulted in minimal text extraction (e.g., 210 characters from 100+ page PDFs).

## Required Dependencies

### 1. Node.js Dependencies
```bash
npm install pdf2pic
```

### 2. System Dependencies

#### GraphicsMagick (Primary Option)
```bash
# macOS (using Homebrew)
brew install graphicsmagick

# Ubuntu/Debian
sudo apt-get install graphicsmagick

# CentOS/RHEL
sudo yum install GraphicsMagick
```

#### ImageMagick (Alternative)
If you prefer ImageMagick over GraphicsMagick:
```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt-get install imagemagick

# CentOS/RHEL
sudo yum install ImageMagick
```

## Verification

### Test pdf2pic Installation
```bash
node -e "const pdf2pic = require('pdf2pic'); console.log('pdf2pic is available');"
```

### Test GraphicsMagick
```bash
which gm
gm version
```

### Test ImageMagick (if using instead of GraphicsMagick)
```bash
which convert
convert -version
```

## Processing Pipeline

With proper dependencies installed:

1. **Download PDF** → Downloaded to temp directory
2. **Convert PDF to Images** → pdf2pic converts each page to PNG using GraphicsMagick/ImageMagick
3. **OCR Processing** → Tesseract.js performs OCR on each image
4. **Text Correction** → Spell checking and error correction
5. **Markdown Generation** → Clean formatted output

## Troubleshooting

### Issue: "gm/convert binaries can't be found"
- **Solution**: Install GraphicsMagick or ImageMagick as shown above

### Issue: "pdf2pic not available"
- **Solution**: Run `npm install pdf2pic`

### Issue: Still getting minimal text extraction
- **Check**: Verify GraphicsMagick is working: `gm version`
- **Check**: Look for console logs showing "Converting PDF to images..."
- **Expected**: You should see actual OCR processing logs, not "Using mock PDF content"

## Performance Notes

- **Before Fix**: 210 characters from 100+ page PDF (text extraction only)
- **After Fix**: Full OCR processing capable of extracting all visible text
- **Processing Time**: OCR processing takes longer but provides complete text extraction

## What Was Fixed

1. ✅ Added missing `pdf2pic` dependency
2. ✅ Installed GraphicsMagick system dependency  
3. ✅ Fixed PDF filename handling to preserve `.pdf` extension
4. ✅ Enhanced error logging for better debugging
5. ✅ Confirmed full OCR pipeline is operational

The system now performs real OCR instead of fallback text extraction, enabling full text extraction from image-based PDFs.