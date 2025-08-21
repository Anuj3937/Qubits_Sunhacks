const fs = require('fs').promises;
const path = require('path');
const pdf = require('pdf-parse');
const { analyzeDocument, generateSummary } = require('../config/gemini');
const questionGenerator = require('./questionGenerator');
const flashcardGenerator = require('./flashcardGenerator');

class DocumentProcessor {
  async processDocument(filePath, materialId, userId) {
    try {
      console.log(`Processing document: ${filePath}`);
      
      // Extract text based on file type
      const extractedText = await this.extractText(filePath);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the document');
      }

      // Analyze document with Gemini
      const analysis = await this.analyzeWithGemini(extractedText);
      
      // Generate summary
      const summary = await this.generateDocumentSummary(extractedText, analysis);
      
      // Generate study materials
      const flashcards = await flashcardGenerator.generateFlashcards(extractedText, analysis.topics);
      const questions = await questionGenerator.generateQuestions(extractedText, analysis.topics);
      
      const processedContent = {
        extractedText: extractedText.substring(0, 10000), // Store first 10k chars
        analysis,
        summary,
        flashcards,
        questions,
        topics: analysis.topics || [],
        difficultyLevel: analysis.difficultyLevel || 'intermediate',
        processedAt: new Date().toISOString()
      };

      return processedContent;

    } catch (error) {
      console.error('Document processing error:', error);
      throw error;
    }
  }

  async extractText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      switch (ext) {
        case '.pdf':
          return await this.extractFromPDF(filePath);
        case '.txt':
          return await this.extractFromText(filePath);
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
          return await this.extractFromImage(filePath);
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }
    } catch (error) {
      console.error(`Text extraction error for ${filePath}:`, error);
      throw error;
    }
  }

  async extractFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  async extractFromText(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return content;
    } catch (error) {
      console.error('Text file extraction error:', error);
      throw new Error('Failed to read text file');
    }
  }

  async extractFromImage(filePath) {
    try {
      // Read image file as base64
      const imageBuffer = await fs.readFile(filePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(filePath);
      
      // Use Gemini to extract text from image
      const imageData = {
        data: base64Image,
        mimeType: mimeType
      };
      
      const result = await analyzeDocument('Extract and analyze all text from this image', imageData);
      return result;
    } catch (error) {
      console.error('Image extraction error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async analyzeWithGemini(text) {
    try {
      const analysisResult = await analyzeDocument(text);
      
      // Parse JSON response from Gemini
      let analysis;
      try {
        analysis = JSON.parse(analysisResult);
      } catch (parseError) {
        // If not valid JSON, create structured response
        analysis = {
          topics: this.extractTopics(text),
          concepts: this.extractConcepts(analysisResult),
          difficultyLevel: 'intermediate',
          keyTerms: [],
          formulas: []
        };
      }

      return analysis;
    } catch (error) {
      console.error('Gemini analysis error:', error);
      // Return fallback analysis
      return {
        topics: this.extractTopics(text),
        concepts: [],
        difficultyLevel: 'intermediate',
        keyTerms: [],
        formulas: []
      };
    }
  }

  async generateDocumentSummary(text, analysis) {
    try {
      const summary = await generateSummary(text, 'intermediate', 'English');
      return {
        brief: this.extractBrief(summary),
        detailed: summary,
        keyPoints: analysis.concepts || [],
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Summary generation error:', error);
      return {
        brief: text.substring(0, 200) + '...',
        detailed: text.substring(0, 1000) + '...',
        keyPoints: [],
        generatedAt: new Date().toISOString()
      };
    }
  }

  extractTopics(text) {
    // Simple topic extraction - can be enhanced
    const words = text.toLowerCase().split(/\W+/);
    const topicWords = words.filter(word => word.length > 5);
    const frequency = {};
    
    topicWords.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  extractConcepts(analysisText) {
    // Extract concepts from analysis text
    const lines = analysisText.split('\n').filter(line => line.trim().length > 0);
    return lines.slice(0, 5); // Return first 5 meaningful lines as concepts
  }

  extractBrief(summary) {
    // Extract first paragraph or first 2 sentences
    const sentences = summary.split(/[.!?]+/);
    return sentences.slice(0, 2).join('. ').trim() + '.';
  }
}

module.exports = new DocumentProcessor();
