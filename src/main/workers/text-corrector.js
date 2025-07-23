const natural = require('natural');
const compromise = require('compromise');
const nspell = require('nspell');
const dictionary = require('dictionary-en');

class TextCorrector {
  constructor() {
    this.spellChecker = null;
    this.customDictionary = new Set();
    this.ocrErrorPatterns = this.initializeOCRPatterns();
    this.initializeSpellChecker();
  }

  async initializeSpellChecker() {
    try {
      // Initialize nspell with English dictionary
      const dict = await new Promise((resolve, reject) => {
        dictionary((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      this.spellChecker = nspell({
        aff: dict.aff,
        dic: dict.dic
      });

      console.log('Spell checker initialized successfully');
    } catch (error) {
      console.warn('Spell checker not available:', error.message);
      // Fallback to basic implementation
      this.spellChecker = {
        correct: (word) => !this.isValidWord(word),
        suggest: (word) => this.getSuggestions(word)
      };
    }
  }

  initializeOCRPatterns() {
    return {
      // Common OCR character substitution errors
      characterErrors: {
        'rn': 'm',
        'cl': 'd',
        'ii': 'll',
        '0': 'o', // Zero to O
        '1': 'l', // One to L
        '5': 'S', // Five to S
        '8': 'B', // Eight to B
        'vv': 'w',
        'VV': 'W',
        'nn': 'n',
        'oo': 'o'
      },
      
      // Common word-level errors
      wordErrors: {
        'tlie': 'the',
        'liave': 'have',
        'witli': 'with',
        'tliis': 'this',
        'tliat': 'that',
        'wliich': 'which',
        'wlien': 'when',
        'wliere': 'where',
        'liere': 'here',
        'tliere': 'there',
        'liis': 'his',
        'lier': 'her',
        'liim': 'him',
        'otlier': 'other',
        'anotlier': 'another',
        'furtlier': 'further'
      },

      // Punctuation errors
      punctuationErrors: {
        ',,': ',',
        '..': '.',
        ';;': ';',
        '::': ':',
        '??': '?',
        '!!': '!',
        ' ,': ',',
        ' .': '.',
        ' ;': ';',
        ' :': ':',
        ' ?': '?',
        ' !': '!'
      }
    };
  }

  async processText(ocrResults, settings) {
    console.log('[Text Corrector] Processing OCR results:', typeof ocrResults, ocrResults);
    
    let text = '';
    
    // Handle different OCR result formats
    if (typeof ocrResults === 'string') {
      text = ocrResults;
    } else if (ocrResults && ocrResults.fullText) {
      text = ocrResults.fullText;
    } else if (ocrResults && ocrResults.pages && Array.isArray(ocrResults.pages)) {
      // Extract text from pages array
      text = ocrResults.pages
        .map(page => page.text || '')
        .filter(pageText => pageText.trim())
        .join('\n\n');
    } else if (ocrResults && typeof ocrResults === 'object') {
      // Try to find text in the object
      text = ocrResults.text || ocrResults.content || '';
    }
    
    console.log(`[Text Corrector] Extracted text length: ${text.length}`);
    console.log(`[Text Corrector] First 200 chars: "${text.substring(0, 200)}"`);
    
    if (!text || !text.trim()) {
      console.warn('[Text Corrector] No text found, returning fallback content');
      return 'No text could be extracted from this PDF. This may be due to:\n- Unsupported PDF format\n- Image-based PDF requiring better OCR\n- Processing error\n\nPlease try with a different PDF or check the console for detailed error messages.';
    }

    // Ensure spell checker is initialized
    if (!this.spellChecker) {
      await this.initializeSpellChecker();
    }

    // Load custom dictionary if provided
    if (settings.customDictionary) {
      this.loadCustomDictionary(settings.customDictionary);
    }

    let correctedText = text;

    // Step 1: Fix common OCR character errors
    correctedText = this.fixCharacterErrors(correctedText);

    // Step 2: Fix word-level OCR errors
    correctedText = this.fixWordErrors(correctedText);

    // Step 3: Fix punctuation errors
    correctedText = this.fixPunctuationErrors(correctedText);

    // Step 4: Restore column layout and paragraph structure
    correctedText = this.restoreTextStructure(correctedText, ocrResults);

    // Step 5: Spell checking (if enabled)
    if (settings.enableSpellCheck) {
      correctedText = await this.performSpellCheck(correctedText, settings.aggressiveCorrection);
    }

    // Step 6: Grammar and text flow improvement
    correctedText = this.improveTextFlow(correctedText);

    // Step 7: Final cleanup
    correctedText = this.finalCleanup(correctedText);

    return correctedText;
  }

  fixCharacterErrors(text) {
    let corrected = text;
    
    // Apply character-level corrections
    Object.entries(this.ocrErrorPatterns.characterErrors).forEach(([error, correction]) => {
      const regex = new RegExp(error, 'g');
      corrected = corrected.replace(regex, correction);
    });

    return corrected;
  }

  fixWordErrors(text) {
    let corrected = text;
    
    // Apply word-level corrections
    Object.entries(this.ocrErrorPatterns.wordErrors).forEach(([error, correction]) => {
      const regex = new RegExp('\\b' + this.escapeRegExp(error) + '\\b', 'gi');
      corrected = corrected.replace(regex, correction);
    });

    return corrected;
  }

  fixPunctuationErrors(text) {
    let corrected = text;
    
    // Apply punctuation corrections
    Object.entries(this.ocrErrorPatterns.punctuationErrors).forEach(([error, correction]) => {
      const regex = new RegExp(this.escapeRegExp(error), 'g');
      corrected = corrected.replace(regex, correction);
    });

    return corrected;
  }

  restoreTextStructure(text, ocrResults) {
    // Remove page separators and merge content intelligently
    let lines = text.split('\n');
    let processedLines = [];
    
    let currentParagraph = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip page markers
      if (line.match(/^---\s*Page\s+\d+\s*---$/)) {
        continue;
      }
      
      // Empty line - paragraph break
      if (!line) {
        if (currentParagraph.length > 0) {
          processedLines.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        processedLines.push('');
        continue;
      }
      
      // Detect if this line should be merged with previous or start new paragraph
      if (this.shouldMergeWithPrevious(line, currentParagraph)) {
        currentParagraph.push(line);
      } else {
        // Start new paragraph
        if (currentParagraph.length > 0) {
          processedLines.push(currentParagraph.join(' '));
        }
        currentParagraph = [line];
      }
    }
    
    // Add final paragraph
    if (currentParagraph.length > 0) {
      processedLines.push(currentParagraph.join(' '));
    }
    
    return processedLines.join('\n');
  }

  shouldMergeWithPrevious(line, currentParagraph) {
    if (currentParagraph.length === 0) return false;
    
    // Don't merge if line looks like a heading
    if (this.looksLikeHeading(line)) return false;
    
    // Don't merge if line starts with bullet point or number
    if (line.match(/^\s*[\u2022\u2023\u25E6\u2043\u2219\-\*]\s/) || 
        line.match(/^\s*\d+[\.\)]\s/)) return false;
    
    // Don't merge if previous paragraph ends with period and this starts with capital
    const lastLine = currentParagraph[currentParagraph.length - 1];
    if (lastLine.endsWith('.') && line.match(/^[A-Z]/)) return false;
    
    // Merge if line doesn't start with capital letter (likely continuation)
    if (!line.match(/^[A-Z]/)) return true;
    
    // Merge if previous line doesn't end with sentence-ending punctuation
    if (!lastLine.match(/[.!?]$/)) return true;
    
    return false;
  }

  looksLikeHeading(line) {
    // Check for heading patterns
    if (line.length < 3) return false;
    if (line.length > 100) return false;
    
    // All caps might be heading
    if (line === line.toUpperCase() && line.length < 50) return true;
    
    // Starts with number or letter followed by period/parenthesis
    if (line.match(/^[A-Z]\d*[\.\)]\s/)) return true;
    if (line.match(/^\d+[\.\)]\s/)) return true;
    
    // Roman numerals
    if (line.match(/^[IVX]+[\.\)]\s/)) return true;
    
    return false;
  }

  async performSpellCheck(text, aggressiveMode = false) {
    if (!this.spellChecker) return text;
    
    const words = text.split(/\s+/);
    const correctedWords = [];
    
    for (const word of words) {
      const cleanWord = word.replace(/[^\w]/g, '');
      
      if (cleanWord.length < 2) {
        correctedWords.push(word);
        continue;
      }
      
      // Skip if in custom dictionary
      if (this.customDictionary.has(cleanWord.toLowerCase())) {
        correctedWords.push(word);
        continue;
      }
      
      // Check if word is misspelled using the new nspell API
      const isMisspelled = this.spellChecker.correct ? 
        this.spellChecker.correct(cleanWord) : 
        !this.spellChecker.check(cleanWord);

      if (isMisspelled) {
        const suggestions = this.spellChecker.suggest ? 
          this.spellChecker.suggest(cleanWord) : 
          this.spellChecker.spell(cleanWord);
        
        if (suggestions && suggestions.length > 0) {
          const bestSuggestion = this.chooseBestSuggestion(cleanWord, suggestions, aggressiveMode);
          if (bestSuggestion) {
            const correctedWord = word.replace(cleanWord, bestSuggestion);
            correctedWords.push(correctedWord);
            continue;
          }
        }
      }
      
      correctedWords.push(word);
    }
    
    return correctedWords.join(' ');
  }

  chooseBestSuggestion(originalWord, suggestions, aggressiveMode) {
    if (!suggestions.length) return null;
    
    // In non-aggressive mode, only accept suggestions with high confidence
    if (!aggressiveMode) {
      // Use edit distance to determine confidence
      const bestSuggestion = suggestions[0];
      const distance = natural.LevenshteinDistance(originalWord.toLowerCase(), bestSuggestion.toLowerCase());
      
      // Only accept if distance is small relative to word length
      if (distance <= Math.max(1, Math.floor(originalWord.length * 0.3))) {
        return bestSuggestion;
      }
      return null;
    }
    
    // In aggressive mode, always take the first suggestion
    return suggestions[0];
  }

  improveTextFlow(text) {
    try {
      // Use compromise.js for natural language processing
      const doc = compromise(text);
      
      // Fix common grammar issues
      let improved = doc.text();
      
      // Fix double spaces
      improved = improved.replace(/\s{2,}/g, ' ');
      
      // Fix spacing around punctuation
      improved = improved.replace(/\s+([,.;:!?])/g, '$1');
      improved = improved.replace(/([.!?])\s*([a-z])/g, '$1 $2');
      
      // Ensure sentences start with capital letters
      improved = improved.replace(/([.!?]\s+)([a-z])/g, (match, punct, letter) => {
        return punct + letter.toUpperCase();
      });
      
      return improved;
    } catch (error) {
      console.warn('Text flow improvement failed:', error.message);
      return text;
    }
  }

  finalCleanup(text) {
    let cleaned = text;
    
    // Remove excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // Trim whitespace from lines
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    
    // Remove trailing and leading whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  loadCustomDictionary(customWords) {
    if (Array.isArray(customWords)) {
      customWords.forEach(word => {
        this.customDictionary.add(word.toLowerCase());
      });
    } else if (typeof customWords === 'string') {
      customWords.split('\n').forEach(word => {
        const trimmed = word.trim();
        if (trimmed) {
          this.customDictionary.add(trimmed.toLowerCase());
        }
      });
    }
  }

  isValidWord(word) {
    // Basic word validation
    if (this.customDictionary.has(word.toLowerCase())) return true;
    
    // Simple heuristics for common words
    const commonWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'she', 'or', 'an', 'will',
      'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
      'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can',
      'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into',
      'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than',
      'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
      'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
      'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
      'most', 'us'
    ]);
    
    return commonWords.has(word.toLowerCase());
  }

  getSuggestions(word) {
    // Basic suggestion algorithm using edit distance
    const suggestions = [];
    const commonWords = ['the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but'];
    
    for (const candidate of commonWords) {
      const distance = natural.LevenshteinDistance(word.toLowerCase(), candidate);
      if (distance <= 2) {
        suggestions.push(candidate);
      }
    }
    
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = TextCorrector;