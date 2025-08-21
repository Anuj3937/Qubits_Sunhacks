const axios = require('axios');

class QuestionGenerator {
  constructor() {
    this.t5ServiceUrl = process.env.T5_SERVICE_URL || 'http://localhost:8001';
  }

  async generateQuestions(text, topics = [], questionCount = 10) {
    try {
      // Split text into chunks for better question generation
      const chunks = this.splitTextIntoChunks(text, 500);
      const allQuestions = [];

      for (const chunk of chunks.slice(0, 3)) { // Process first 3 chunks
        const questions = await this.generateQuestionsFromChunk(chunk, topics);
        allQuestions.push(...questions);
      }

      // Deduplicate and limit questions
      const uniqueQuestions = this.deduplicateQuestions(allQuestions);
      return uniqueQuestions.slice(0, questionCount);

    } catch (error) {
      console.error('Question generation error:', error);
      // Return fallback questions
      return this.generateFallbackQuestions(text, topics);
    }
  }

  async generateQuestionsFromChunk(text, topics) {
    try {
      // Call T5 service
      const response = await axios.post(`${this.t5ServiceUrl}/generate-questions`, {
        context: text,
        max_questions: 5,
        question_types: ['multiple_choice', 'short_answer']
      }, {
        timeout: 30000 // 30 second timeout
      });

      if (response.data && response.data.success && response.data.questions) {
        return response.data.questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type || 'multiple_choice',
          options: q.options || [],
          correctAnswer: q.correct_answer || q.answer,
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
          topic: this.identifyQuestionTopic(q.question, topics)
        }));
      }

      return [];
    } catch (error) {
      console.error('T5 service error:', error);
      return this.generateBasicQuestions(text, topics);
    }
  }

  generateBasicQuestions(text, topics) {
    // Fallback: Generate basic questions when T5 service is unavailable
    const questions = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    for (let i = 0; i < Math.min(5, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 30) {
        questions.push({
          id: this.generateId(),
          question: `What is the main concept discussed in: "${sentence.substring(0, 100)}..."?`,
          type: 'short_answer',
          options: [],
          correctAnswer: 'Based on the provided text content',
          explanation: 'This question tests comprehension of the key concepts.',
          difficulty: 'medium',
          topic: topics[0] || 'General'
        });
      }
    }

    return questions;
  }

  generateFallbackQuestions(text, topics) {
    // Generate very basic questions when all else fails
    return [
      {
        id: this.generateId(),
        question: 'What are the main topics covered in this material?',
        type: 'short_answer',
        options: [],
        correctAnswer: topics.join(', ') || 'Various educational topics',
        explanation: 'This question assesses understanding of the overall content structure.',
        difficulty: 'easy',
        topic: 'General Overview'
      },
      {
        id: this.generateId(),
        question: 'Summarize the key concepts from the provided material.',
        type: 'short_answer',
        options: [],
        correctAnswer: 'Summary based on the uploaded content',
        explanation: 'This question tests the ability to synthesize information.',
        difficulty: 'medium',
        topic: 'Comprehension'
      }
    ];
  }

  splitTextIntoChunks(text, maxLength = 500) {
    const words = text.split(' ');
    const chunks = [];
    let currentChunk = [];

    for (const word of words) {
      currentChunk.push(word);
      if (currentChunk.join(' ').length >= maxLength) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  deduplicateQuestions(questions) {
    const seen = new Set();
    return questions.filter(q => {
      const key = q.question.toLowerCase().trim();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  identifyQuestionTopic(question, topics) {
    const questionLower = question.toLowerCase();
    for (const topic of topics) {
      if (questionLower.includes(topic.toLowerCase())) {
        return topic;
      }
    }
    return topics[0] || 'General';
  }

  generateId() {
    return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = new QuestionGenerator();
