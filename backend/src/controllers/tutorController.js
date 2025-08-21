const { validationResult } = require('express-validator');
const StudyMaterial = require('../models/StudyMaterial');
const ragService = require('../services/ragService');
const translationService = require('../services/translationService');
const redisService = require('../config/redis');
const pool = require('../config/database');

class TutorController {
  async askQuestion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const { question, language = 'English', complexity = 'detailed' } = req.body;
      const userId = req.userId;

      // Check if material exists and belongs to user
      const material = await StudyMaterial.findById(materialId, userId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      if (material.processing_status !== 'completed') {
        return res.status(400).json({ 
          error: 'Material is still being processed',
          status: material.processing_status
        });
      }

      // Get processed content
      const processedContent = await StudyMaterial.getProcessedContent(materialId, userId);
      if (!processedContent || !processedContent.extractedText) {
        return res.status(400).json({ error: 'No content available for tutoring' });
      }

      // Generate answer using RAG
      const answer = await ragService.generateAnswer(
        question,
        processedContent.extractedText,
        {
          complexity,
          topics: processedContent.topics || [],
          context: processedContent.summary?.detailed || ''
        }
      );

      // Translate if needed
      let finalAnswer = answer;
      if (language !== 'English') {
        finalAnswer = await translationService.translate(answer, 'English', language);
      }

      // Store conversation in database
      await pool.query(
        `INSERT INTO tutor_conversations (user_id, material_id, question, answer, language, complexity, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [userId, materialId, question, finalAnswer, language, complexity]
      );

      // Cache recent conversation
      const conversationKey = `tutor:${userId}:${materialId}`;
      const cachedConversation = await redisService.client?.get(conversationKey);
      let conversation = cachedConversation ? JSON.parse(cachedConversation) : [];
      
      conversation.push({
        question,
        answer: finalAnswer,
        timestamp: new Date().toISOString(),
        language,
        complexity
      });

      // Keep only last 10 exchanges
      if (conversation.length > 10) {
        conversation = conversation.slice(-10);
      }

      await redisService.client?.setEx(conversationKey, 3600, JSON.stringify(conversation));

      res.json({
        success: true,
        answer: finalAnswer,
        question,
        metadata: {
          language,
          complexity,
          responseTime: Date.now(),
          relatedTopics: processedContent.topics?.slice(0, 3) || [],
          confidence: this.calculateConfidence(answer, processedContent.extractedText)
        },
        suggestions: await this.generateFollowUpSuggestions(question, processedContent.topics)
      });

    } catch (error) {
      console.error('Ask question error:', error);
      res.status(500).json({ 
        error: 'Failed to generate answer',
        suggestion: 'Please try rephrasing your question or check if the material content is sufficient.'
      });
    }
  }

  async getConversationHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const userId = req.userId;
      const { limit = 20, page = 1 } = req.query;

      // Check if material exists and belongs to user
      const material = await StudyMaterial.findById(materialId, userId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      // Get conversation history from database
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const result = await pool.query(
        `SELECT question, answer, language, complexity, created_at
         FROM tutor_conversations 
         WHERE user_id = $1 AND material_id = $2 
         ORDER BY created_at DESC 
         LIMIT $3 OFFSET $4`,
        [userId, materialId, parseInt(limit), offset]
      );

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM tutor_conversations WHERE user_id = $1 AND material_id = $2',
        [userId, materialId]
      );

      const conversations = result.rows.map(row => ({
        question: row.question,
        answer: row.answer,
        language: row.language,
        complexity: row.complexity,
        timestamp: row.created_at
      }));

      res.json({
        success: true,
        conversations,
        material: {
          id: material.id,
          fileName: material.file_name
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResult.rows[0].count / parseInt(limit)),
          totalCount: parseInt(countResult.rows.count)
        }
      });

    } catch (error) {
      console.error('Get conversation history error:', error);
      res.status(500).json({ error: 'Failed to retrieve conversation history' });
    }
  }

  async clearConversationHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const userId = req.userId;

      // Clear from database
      const result = await pool.query(
        'DELETE FROM tutor_conversations WHERE user_id = $1 AND material_id = $2',
        [userId, materialId]
      );

      // Clear from cache
      const conversationKey = `tutor:${userId}:${materialId}`;
      await redisService.client?.del(conversationKey);

      res.json({
        success: true,
        message: 'Conversation history cleared successfully',
        deletedCount: result.rowCount
      });

    } catch (error) {
      console.error('Clear conversation history error:', error);
      res.status(500).json({ error: 'Failed to clear conversation history' });
    }
  }

  async getSuggestedQuestions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const userId = req.userId;
      const { language = 'English' } = req.query;

      // Check if material exists and belongs to user
      const material = await StudyMaterial.findById(materialId, userId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      // Check cache first
      const cacheKey = `suggestions:${materialId}:${language}`;
      let suggestions = await redisService.client?.get(cacheKey);

      if (suggestions) {
        suggestions = JSON.parse(suggestions);
      } else {
        // Get processed content
        const processedContent = await StudyMaterial.getProcessedContent(materialId, userId);
        if (!processedContent) {
          return res.status(400).json({ error: 'No content available for suggestions' });
        }

        // Generate suggestions based on content
        suggestions = await this.generateSuggestions(processedContent, language);
        
        // Cache for 1 hour
        await redisService.client?.setEx(cacheKey, 3600, JSON.stringify(suggestions));
      }

      res.json({
        success: true,
        suggestions,
        material: {
          fileName: material.file_name
        }
      });

    } catch (error) {
      console.error('Get suggested questions error:', error);
      res.status(500).json({ error: 'Failed to generate question suggestions' });
    }
  }

  async explainAnswer(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { question, correctAnswer, userAnswer, context = '', language = 'English' } = req.body;
      const userId = req.userId;

      // Generate explanation using RAG
      const explanation = await ragService.explainIncorrectAnswer(
        question,
        correctAnswer,
        userAnswer,
        context
      );

      // Translate if needed
      let finalExplanation = explanation;
      if (language !== 'English') {
        finalExplanation = await translationService.translate(explanation, 'English', language);
      }

      // Store explanation for analytics
      await pool.query(
        `INSERT INTO answer_explanations (user_id, question, correct_answer, user_answer, explanation, language, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [userId, question, correctAnswer, userAnswer, finalExplanation, language]
      );

      res.json({
        success: true,
        explanation: finalExplanation,
        tips: this.generateStudyTips(question, correctAnswer, userAnswer),
        relatedConcepts: await this.extractRelatedConcepts(context, question)
      });

    } catch (error) {
      console.error('Explain answer error:', error);
      res.status(500).json({ error: 'Failed to generate explanation' });
    }
  }

  // Helper methods
  async generateSuggestions(processedContent, language) {
    const suggestions = {
      conceptual: [],
      practical: [],
      analytical: []
    };

    const topics = processedContent.topics || [];
    const summary = processedContent.summary?.brief || '';

    // Generate conceptual questions
    for (const topic of topics.slice(0, 3)) {
      suggestions.conceptual.push(`What is the main concept behind ${topic}?`);
      suggestions.conceptual.push(`How does ${topic} relate to the overall subject?`);
    }

    // Generate practical questions
    suggestions.practical.push('Can you provide a real-world example of this concept?');
    suggestions.practical.push('How would I apply this knowledge in practice?');
    suggestions.practical.push('What are the key steps to remember?');

    // Generate analytical questions
    suggestions.analytical.push('What are the strengths and weaknesses of this approach?');
    suggestions.analytical.push('How does this compare to alternative methods?');
    suggestions.analytical.push('What would happen if we changed the key variables?');

    // Translate suggestions if needed
    if (language !== 'English') {
      for (const category in suggestions) {
        suggestions[category] = await Promise.all(
          suggestions[category].map(q => 
            translationService.translate(q, 'English', language)
          )
        );
      }
    }

    return suggestions;
  }

  async generateFollowUpSuggestions(question, topics) {
    const suggestions = [];
    
    // Add topic-based follow-ups
    if (topics && topics.length > 0) {
      suggestions.push(`Tell me more about ${topics[0]}`);
      if (topics.length > 1) {
        suggestions.push(`How does ${topics} relate to ${topics}?`);
      }
    }

    // Add generic follow-ups
    suggestions.push('Can you give me an example?');
    suggestions.push('What are the key points I should remember?');
    suggestions.push('How can I practice this concept?');

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  calculateConfidence(answer, sourceText) {
    // Simple confidence calculation based on answer length and source content overlap
    const answerWords = answer.split(' ').length;
    const sourceWords = sourceText.split(' ').length;
    
    // Base confidence on answer completeness and source richness
    let confidence = Math.min(answerWords / 50, 1) * 0.5; // Answer length factor
    confidence += Math.min(sourceWords / 1000, 1) * 0.3; // Source richness factor
    confidence += 0.2; // Base confidence
    
    return Math.round(confidence * 100);
  }

  generateStudyTips(question, correctAnswer, userAnswer) {
    const tips = [];
    
    if (userAnswer.toLowerCase().includes('i don\'t know') || userAnswer.trim().length < 10) {
      tips.push('Try to review the material more thoroughly before attempting questions.');
      tips.push('Break down complex topics into smaller, manageable parts.');
    }
    
    if (correctAnswer.length > userAnswer.length * 2) {
      tips.push('Your answer might be too brief. Try to provide more detailed explanations.');
    }
    
    tips.push('Create flashcards for key concepts you find challenging.');
    tips.push('Practice explaining concepts in your own words.');
    
    return tips.slice(0, 3);
  }

  async extractRelatedConcepts(context, question) {
    // Simple keyword extraction for related concepts
    const words = (context + ' ' + question).toLowerCase().split(/\W+/);
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'what', 'how', 'when', 'where', 'why']);
    
    const keywords = words
      .filter(word => word.length > 4 && !commonWords.has(word))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});
    
    return Object.entries(keywords)
      .sort((a, b) => b[1] - a)
      .slice(0, 5)
      .map(([word]) => word);
  }
}

module.exports = new TutorController();
