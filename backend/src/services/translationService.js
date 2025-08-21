const axios = require('axios');

class TranslationService {
  constructor() {
    this.apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
    
    // Comprehensive language code mappings
    this.languageCodes = {
      // Major World Languages
      'English': 'en',
      'Spanish': 'es',
      'French': 'fr',
      'German': 'de',
      'Italian': 'it',
      'Portuguese': 'pt',
      'Russian': 'ru',
      'Chinese': 'zh',
      'Japanese': 'ja',
      'Korean': 'ko',
      'Arabic': 'ar',
      'Hindi': 'hi',
      'Bengali': 'bn',
      'Turkish': 'tr',
      'Dutch': 'nl',
      'Polish': 'pl',
      'Swedish': 'sv',
      'Norwegian': 'no',
      'Danish': 'da',
      'Finnish': 'fi',
      'Greek': 'el',
      'Hebrew': 'he',
      'Thai': 'th',
      'Vietnamese': 'vi',
      'Indonesian': 'id',
      'Malay': 'ms',
      'Filipino': 'tl',
      
      // Indian Languages
      'Marathi': 'mr',
      'Tamil': 'ta',
      'Telugu': 'te',
      'Gujarati': 'gu',
      'Kannada': 'kn',
      'Malayalam': 'ml',
      'Punjabi': 'pa',
      'Urdu': 'ur',
      'Odia': 'or',
      'Assamese': 'as',
      'Nepali': 'ne',
      'Sindhi': 'sd',
      'Sanskrit': 'sa',
      
      // European Languages
      'Ukrainian': 'uk',
      'Czech': 'cs',
      'Slovak': 'sk',
      'Hungarian': 'hu',
      'Romanian': 'ro',
      'Bulgarian': 'bg',
      'Croatian': 'hr',
      'Serbian': 'sr',
      'Slovenian': 'sl',
      'Estonian': 'et',
      'Latvian': 'lv',
      'Lithuanian': 'lt',
      'Irish': 'ga',
      'Welsh': 'cy',
      'Basque': 'eu',
      'Catalan': 'ca',
      'Galician': 'gl',
      
      // African Languages
      'Swahili': 'sw',
      'Yoruba': 'yo',
      'Igbo': 'ig',
      'Hausa': 'ha',
      'Zulu': 'zu',
      'Afrikaans': 'af',
      'Amharic': 'am',
      'Somali': 'so',
      
      // Middle Eastern Languages
      'Persian': 'fa',
      'Kurdish': 'ku',
      'Pashto': 'ps',
      'Dari': 'prs',
      
      // East Asian Languages
      'Mongolian': 'mn',
      'Tibetan': 'bo',
      'Burmese': 'my',
      'Khmer': 'km',
      'Lao': 'lo',
      
      // Pacific Languages
      'Hawaiian': 'haw',
      'Maori': 'mi',
      'Samoan': 'sm',
      'Tongan': 'to',
      
      // Constructed Languages
      'Esperanto': 'eo',
      'Latin': 'la',
      
      // Programming-related (for code comments)
      'Python': 'en', // Fallback to English
      'JavaScript': 'en', // Fallback to English
      
      // Reverse mappings (code to name)
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'bn': 'Bengali',
      'tr': 'Turkish',
      'nl': 'Dutch',
      'pl': 'Polish',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'fi': 'Finnish',
      'el': 'Greek',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'tl': 'Filipino',
      'mr': 'Marathi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'pa': 'Punjabi',
      'ur': 'Urdu',
      'or': 'Odia',
      'as': 'Assamese',
      'ne': 'Nepali',
      'sd': 'Sindhi',
      'sa': 'Sanskrit',
      'uk': 'Ukrainian',
      'cs': 'Czech',
      'sk': 'Slovak',
      'hu': 'Hungarian',
      'ro': 'Romanian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'sr': 'Serbian',
      'sl': 'Slovenian',
      'et': 'Estonian',
      'lv': 'Latvian',
      'lt': 'Lithuanian',
      'ga': 'Irish',
      'cy': 'Welsh',
      'eu': 'Basque',
      'ca': 'Catalan',
      'gl': 'Galician',
      'sw': 'Swahili',
      'yo': 'Yoruba',
      'ig': 'Igbo',
      'ha': 'Hausa',
      'zu': 'Zulu',
      'af': 'Afrikaans',
      'am': 'Amharic',
      'so': 'Somali',
      'fa': 'Persian',
      'ku': 'Kurdish',
      'ps': 'Pashto',
      'mn': 'Mongolian',
      'bo': 'Tibetan',
      'my': 'Burmese',
      'km': 'Khmer',
      'lo': 'Lao',
      'haw': 'Hawaiian',
      'mi': 'Maori',
      'sm': 'Samoan',
      'to': 'Tongan',
      'eo': 'Esperanto',
      'la': 'Latin'
    };
  }

  async translate(text, sourceLanguage, targetLanguage) {
    try {
      // Skip translation if source and target are the same
      if (sourceLanguage === targetLanguage) {
        return text;
      }

      // Convert language names to codes if needed
      const sourceLang = this.languageCodes[sourceLanguage] || sourceLanguage.toLowerCase();
      const targetLang = this.languageCodes[targetLanguage] || targetLanguage.toLowerCase();

      if (sourceLang === targetLang) {
        return text;
      }

      // Check if API key is available
      if (!this.apiKey) {
        console.warn('Google Translate API key not configured, returning original text');
        return text;
      }

      // Prepare translation request
      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      }, {
        timeout: 10000 // 10 second timeout
      });

      if (response.data && response.data.data && response.data.data.translations) {
        const translatedText = response.data.data.translations[0].translatedText;
        
        // Decode HTML entities that might be present
        return this.decodeHtmlEntities(translatedText);
      }

      throw new Error('Invalid response from translation service');

    } catch (error) {
      console.error('Translation error:', error);
      
      // Return original text with a note if translation fails
      if (sourceLanguage !== targetLanguage) {
        return `${text}\n\n[Note: Translation to ${targetLanguage} unavailable]`;
      }
      
      return text;
    }
  }

  async translateBatch(textArray, sourceLanguage, targetLanguage) {
    try {
      if (sourceLanguage === targetLanguage) {
        return textArray;
      }

      const sourceLang = this.languageCodes[sourceLanguage] || sourceLanguage.toLowerCase();
      const targetLang = this.languageCodes[targetLanguage] || targetLanguage.toLowerCase();

      if (sourceLang === targetLang) {
        return textArray;
      }

      if (!this.apiKey) {
        console.warn('Google Translate API key not configured');
        return textArray;
      }

      // Process in batches of 10 to avoid rate limits
      const batchSize = 10;
      const results = [];

      for (let i = 0; i < textArray.length; i += batchSize) {
        const batch = textArray.slice(i, i + batchSize);
        
        const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
          q: batch,
          source: sourceLang,
          target: targetLang,
          format: 'text'
        }, {
          timeout: 15000 // 15 second timeout for batches
        });

        if (response.data && response.data.data && response.data.data.translations) {
          const translations = response.data.data.translations.map(t => 
            this.decodeHtmlEntities(t.translatedText)
          );
          results.push(...translations);
        } else {
          // Add original texts if translation fails
          results.push(...batch);
        }

        // Small delay between batches to respect rate limits
        if (i + batchSize < textArray.length) {
          await this.delay(100);
        }
      }

      return results;

    } catch (error) {
      console.error('Batch translation error:', error);
      return textArray; // Return original array if translation fails
    }
  }

  async detectLanguage(text) {
    try {
      if (!this.apiKey) {
        return 'en'; // Default to English
      }

      const response = await axios.post(`https://translation.googleapis.com/language/translate/v2/detect?key=${this.apiKey}`, {
        q: text
      }, {
        timeout: 5000
      });

      if (response.data && response.data.data && response.data.data.detections) {
        const detection = response.data.data.detections[0];
        return detection.language;
      }

      return 'en'; // Default fallback

    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default fallback
    }
  }

  getSupportedLanguages() {
    return [
      // Most commonly used languages first
      { code: 'en', name: 'English', nativeName: 'English', region: 'Global' },
      { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'Europe/Americas' },
      { code: 'fr', name: 'French', nativeName: 'Français', region: 'Europe/Africa' },
      { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'Europe' },
      { code: 'zh', name: 'Chinese', nativeName: '中文', region: 'Asia' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'Asia' },
      { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'Asia' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Middle East/Africa' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'India' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'Europe/Americas' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'Europe/Asia' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'Europe' },
      
      // Indian languages
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'India' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'India' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'India' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'India/Bangladesh' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'India' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'India' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'India' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'India' },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'India/Pakistan' },
      
      // Other major languages
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'Europe/Asia' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'Europe' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'Europe' },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'Europe' },
      { code: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'Europe' },
      { code: 'da', name: 'Danish', nativeName: 'Dansk', region: 'Europe' },
      { code: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'Europe' },
      { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'Europe' },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'Middle East' },
      { code: 'th', name: 'Thai', nativeName: 'ไทย', region: 'Asia' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Asia' },
      { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Asia' },
      { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Asia' },
      { code: 'tl', name: 'Filipino', nativeName: 'Filipino', region: 'Asia' },
      { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'Africa' },
      { code: 'fa', name: 'Persian', nativeName: 'فارسی', region: 'Middle East' },
      { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'Europe' }
    ];
  }

  getLanguagesByRegion() {
    const supportedLanguages = this.getSupportedLanguages();
    const byRegion = {};
    
    supportedLanguages.forEach(lang => {
      if (!byRegion[lang.region]) {
        byRegion[lang.region] = [];
      }
      byRegion[lang.region].push(lang);
    });
    
    return byRegion;
  }

  isLanguageSupported(language) {
    const langCode = this.languageCodes[language] || language.toLowerCase();
    return Object.values(this.languageCodes).includes(langCode) || 
           Object.keys(this.languageCodes).includes(langCode);
  }

  // Helper methods remain the same
  decodeHtmlEntities(text) {
    const entities = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' '
    };

    return text.replace(/&[#\w]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  preprocessTextForTranslation(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  postprocessTranslatedText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\s+([.!?])/g, '$1')
      .trim();
  }

  async translateFlashcard(flashcard, targetLanguage) {
    try {
      const [translatedFront, translatedBack] = await this.translateBatch(
        [flashcard.front, flashcard.back],
        'English',
        targetLanguage
      );

      return {
        ...flashcard,
        front: translatedFront,
        back: translatedBack,
        originalLanguage: 'English',
        translatedLanguage: targetLanguage
      };

    } catch (error) {
      console.error('Flashcard translation error:', error);
      return flashcard;
    }
  }

  async translateQuizQuestions(questions, targetLanguage) {
    try {
      const translatedQuestions = [];

      for (const question of questions) {
        const textsToTranslate = [
          question.question,
          ...(question.options || []),
          question.explanation || ''
        ].filter(text => text && text.trim().length > 0);

        const translatedTexts = await this.translateBatch(
          textsToTranslate,
          'English',
          targetLanguage
        );

        let textIndex = 0;
        const translatedQuestion = {
          ...question,
          question: translatedTexts[textIndex++],
          options: question.options ? 
            question.options.map(() => translatedTexts[textIndex++]) : 
            [],
          explanation: question.explanation ? 
            translatedTexts[textIndex++] : 
            ''
        };

        translatedQuestions.push(translatedQuestion);
      }

      return translatedQuestions;

    } catch (error) {
      console.error('Quiz translation error:', error);
      return questions;
    }
  }
}

module.exports = new TranslationService();
