const path = require('path');

class MarkdownGenerator {
  constructor() {
    this.headingPatterns = this.initializeHeadingPatterns();
  }

  initializeHeadingPatterns() {
    return [
      // Roman numerals
      /^[IVX]+[\.\)]\s+(.+)$/i,
      // Numbers with periods or parentheses
      /^(\d+)[\.\)]\s+(.+)$/,
      // Letters with periods or parentheses
      /^([A-Z])[\.\)]\s+(.+)$/,
      // All caps (potential headings)
      /^([A-Z][A-Z\s]{2,50})$/,
      // Numbered sections
      /^(\d+\.\d+)\s+(.+)$/,
      // Chapter/Section indicators
      /^(CHAPTER|SECTION|PART|APPENDIX)\s+(.+)$/i
    ];
  }

  generate(text, options = {}) {
    const {
      sourceURL = '',
      metadata = true,
      preserveFormatting = true,
      includeTableOfContents = false
    } = options;

    console.log(`[Markdown Generator] Generating markdown from text (length: ${text ? text.length : 'null/undefined'})`);
    console.log(`[Markdown Generator] Input text type:`, typeof text);
    
    if (!text || typeof text !== 'string') {
      console.warn('[Markdown Generator] Invalid or empty text input, using fallback');
      text = 'No content could be processed from the PDF. Please check the processing logs for errors.';
    }

    let markdown = '';

    // Add metadata header if requested
    if (metadata) {
      markdown += this.generateMetadata(sourceURL);
    }

    // Process the text
    const processedContent = this.processContent(text, {
      preserveFormatting,
      detectHeadings: true,
      detectLists: true,
      detectTables: true
    });

    console.log(`[Markdown Generator] Processed content length: ${processedContent.length}`);

    // Add table of contents if requested
    if (includeTableOfContents) {
      const toc = this.generateTableOfContents(processedContent);
      if (toc) {
        markdown += '\n## Table of Contents\n\n' + toc + '\n\n';
      }
    }

    markdown += processedContent;

    // Final cleanup
    markdown = this.finalCleanup(markdown);

    console.log(`[Markdown Generator] Final markdown length: ${markdown.length}`);
    return markdown;
  }

  generateMetadata(sourceURL) {
    const now = new Date();
    const metadata = [
      '---',
      `title: "PDF Processed Document"`,
      `source: "${sourceURL}"`,
      `processed_date: "${now.toISOString()}"`,
      `generator: "PDF Processor v1.0.0"`,
      '---',
      ''
    ];

    return metadata.join('\n') + '\n';
  }

  processContent(text, options) {
    const lines = text.split('\n');
    const processedLines = [];
    let inCodeBlock = false;
    let listLevel = 0;
    let currentHeadingLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines but preserve paragraph breaks
      if (!trimmedLine) {
        processedLines.push('');
        listLevel = 0;
        continue;
      }

      // Detect and convert headings
      const heading = this.detectHeading(trimmedLine);
      if (heading) {
        // Add extra spacing before headings
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
        
        processedLines.push(heading.markdown);
        currentHeadingLevel = heading.level;
        listLevel = 0;
        continue;
      }

      // Detect and convert lists
      const listItem = this.detectListItem(trimmedLine);
      if (listItem) {
        processedLines.push(listItem.markdown);
        listLevel = listItem.level;
        continue;
      }

      // Detect and convert tables
      if (this.looksLikeTableRow(trimmedLine)) {
        const table = this.processTable(lines, i);
        if (table.markdown) {
          processedLines.push(table.markdown);
          i = table.endIndex; // Skip processed table lines
          continue;
        }
      }

      // Detect code blocks
      if (this.looksLikeCode(trimmedLine)) {
        if (!inCodeBlock) {
          processedLines.push('```');
          inCodeBlock = true;
        }
        processedLines.push(trimmedLine);
        continue;
      } else if (inCodeBlock && !this.looksLikeCode(trimmedLine)) {
        processedLines.push('```');
        inCodeBlock = false;
      }

      // Process regular paragraphs
      const processedLine = this.processInlineFormatting(trimmedLine);
      processedLines.push(processedLine);
      listLevel = 0;
    }

    // Close any open code blocks
    if (inCodeBlock) {
      processedLines.push('```');
    }

    return processedLines.join('\n');
  }

  detectHeading(line) {
    // Check various heading patterns
    for (let i = 0; i < this.headingPatterns.length; i++) {
      const pattern = this.headingPatterns[i];
      const match = line.match(pattern);
      
      if (match) {
        const level = this.determineHeadingLevel(match, i);
        const text = this.extractHeadingText(match, i);
        
        return {
          level,
          text,
          markdown: '#'.repeat(level) + ' ' + text
        };
      }
    }

    // Check for underlined headings
    const underlineHeading = this.detectUnderlinedHeading(line);
    if (underlineHeading) {
      return underlineHeading;
    }

    return null;
  }

  determineHeadingLevel(match, patternIndex) {
    switch (patternIndex) {
      case 0: // Roman numerals
        return 1;
      case 1: // Numbers
        const num = parseInt(match[1]);
        return num <= 3 ? 2 : 3;
      case 2: // Letters
        return 3;
      case 3: // All caps
        return line.length < 30 ? 2 : 3;
      case 4: // Numbered sections (1.1, 2.3, etc.)
        return 2;
      case 5: // Chapter/Section
        return 1;
      default:
        return 2;
    }
  }

  extractHeadingText(match, patternIndex) {
    switch (patternIndex) {
      case 0: // Roman numerals
      case 1: // Numbers
      case 2: // Letters
        return match[2] || match[1];
      case 3: // All caps
        return this.toTitleCase(match[1]);
      case 4: // Numbered sections
        return match[2];
      case 5: // Chapter/Section
        return match[2];
      default:
        return match[1] || match[0];
    }
  }

  detectUnderlinedHeading(line) {
    // This would need to look at the next line for underline characters
    // For now, return null as it requires context
    return null;
  }

  detectListItem(line) {
    // Bullet points
    const bulletMatch = line.match(/^(\s*)([\u2022\u2023\u25E6\u2043\u2219\-\*])\s+(.+)$/);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const level = Math.floor(indent / 2) + 1;
      return {
        level,
        type: 'bullet',
        markdown: '  '.repeat(Math.max(0, level - 1)) + '- ' + bulletMatch[3]
      };
    }

    // Numbered lists
    const numberedMatch = line.match(/^(\s*)(\d+)[\.\)]\s+(.+)$/);
    if (numberedMatch) {
      const indent = numberedMatch[1].length;
      const level = Math.floor(indent / 2) + 1;
      return {
        level,
        type: 'numbered',
        markdown: '  '.repeat(Math.max(0, level - 1)) + numberedMatch[2] + '. ' + numberedMatch[3]
      };
    }

    return null;
  }

  looksLikeTableRow(line) {
    // Simple heuristic: contains multiple words separated by multiple spaces or tabs
    return line.match(/\w+\s{2,}\w+/) || line.includes('\t');
  }

  processTable(lines, startIndex) {
    // Simple table detection and conversion
    const tableLines = [];
    let i = startIndex;
    
    // Collect potential table lines
    while (i < lines.length && this.looksLikeTableRow(lines[i].trim())) {
      tableLines.push(lines[i].trim());
      i++;
    }

    if (tableLines.length < 2) {
      return { markdown: null, endIndex: startIndex };
    }

    // Convert to markdown table
    const rows = tableLines.map(line => {
      // Split on multiple spaces or tabs
      const cells = line.split(/\s{2,}|\t+/).map(cell => cell.trim());
      return '| ' + cells.join(' | ') + ' |';
    });

    // Add header separator after first row
    if (rows.length > 0) {
      const headerSeparator = '|' + ' --- |'.repeat(rows[0].split('|').length - 2);
      rows.splice(1, 0, headerSeparator);
    }

    return {
      markdown: '\n' + rows.join('\n') + '\n',
      endIndex: i - 1
    };
  }

  looksLikeCode(line) {
    // Simple heuristics for code detection
    if (line.length === 0) return false;
    
    // Contains programming keywords
    const codeKeywords = ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'class', 'def', 'public', 'private'];
    if (codeKeywords.some(keyword => line.includes(keyword))) return true;
    
    // Contains code-like symbols
    if (line.match(/[{}();=<>]/)) return true;
    
    // Indented with spaces/tabs and contains alphanumeric
    if (line.match(/^\s{4,}/) && line.match(/\w/)) return true;
    
    return false;
  }

  processInlineFormatting(line) {
    let processed = line;

    // Bold text (words in ALL CAPS that aren't whole sentences)
    processed = processed.replace(/\b([A-Z]{2,})\b(?!\s*[.!?])/g, '**$1**');

    // Italic text (this is more challenging to detect automatically)
    // We'll skip automatic italic detection for now

    // URLs
    processed = processed.replace(/(https?:\/\/[^\s]+)/g, '[$1]($1)');

    // Email addresses
    processed = processed.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, '[$1](mailto:$1)');

    return processed;
  }

  generateTableOfContents(content) {
    const lines = content.split('\n');
    const headings = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const anchor = this.generateAnchor(text);
        
        headings.push({
          level,
          text,
          anchor
        });
      }
    }

    if (headings.length === 0) return null;

    const tocLines = headings.map(heading => {
      const indent = '  '.repeat(Math.max(0, heading.level - 1));
      return `${indent}- [${heading.text}](#${heading.anchor})`;
    });

    return tocLines.join('\n');
  }

  generateAnchor(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single
      .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
  }

  toTitleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }

  finalCleanup(markdown) {
    let cleaned = markdown;

    // Remove excessive blank lines
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

    // Ensure proper spacing around headings
    cleaned = cleaned.replace(/\n(#{1,6}\s+)/g, '\n\n$1');
    cleaned = cleaned.replace(/(#{1,6}\s+.+)\n(?!\n)/g, '$1\n\n');

    // Clean up list spacing
    cleaned = cleaned.replace(/\n([\-\*]\s+)/g, '\n$1');

    // Remove trailing whitespace from lines
    cleaned = cleaned.split('\n').map(line => line.trimEnd()).join('\n');

    // Ensure document ends with single newline
    cleaned = cleaned.trimEnd() + '\n';

    return cleaned;
  }
}

module.exports = MarkdownGenerator;