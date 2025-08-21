const axios = require('axios');
const { getGeminiModel } = require('../config/gemini');

class RAGService {
  constructor() {
    this.llamaServiceUrl = process.env.LLAMA_SERVICE_URL || 'http://localhost:8002';
    this.maxContextLength = 4000; // Maximum context length for processing
  }

  async generateAnswer(question, sourceContent, options = {}) {
    try {
      const { complexity = 'detailed', topics = [], context = '' } = options;
      console.log('Generating RAG answer for question:', question.substring(0, 100));

      // Retrieve relevant context from source content
      const relevantContext = this.retrieveRelevantContent(question, sourceContent, topics);
      
      // Try Llama service first, fallback to Gemini
      let answer;
      try {
        answer = await this.generateWithLlama(question, relevantContext, complexity);
      } catch (llamaError) {
        console.warn('Llama service unavailable, using Gemini fallback:', llamaError.message);
        answer = await this.generateWithGemini(question, relevantContext, complexity);
      }

      return this.formatAnswer(answer, complexity);

    } catch (error) {
      console.error('RAG answer generation error:', error);
      return this.generateFallbackAnswer(question, sourceContent);
    }
  }

  async generateWithLlama(question, context, complexity) {
    try {
      const prompt = this.buildPrompt(question, context, complexity);
      
      const response = await axios.post(`${this.llamaServiceUrl}/generate`, {
        prompt,
        max_tokens: this.getMaxTokens(complexity),
        temperature: 0.7
      }, {
        timeout: 30000 // 30 second timeout
      });

      if (response.data && response.data.generated_text && response.data.success) {
        return response.data.generated_text.trim();
      }

      throw new Error('Invalid response from Llama service');
    } catch (error) {
      console.error('Llama service error:', error);
      throw error;
    }
  }

  async generateWithGemini(question, context, complexity) {
    try {
      const model = getGeminiModel();
      const prompt = this.buildPrompt(question, context, complexity);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
    } catch (error) {
      console.error('Gemini RAG error:', error);
      throw error;
    }
  }

  buildPrompt(question, context, complexity) {
    const complexityInstructions = {
      'simple': 'Provide a clear, concise answer in simple terms. Use everyday language and avoid technical jargon.',
      'detailed': 'Provide a comprehensive answer with explanations, examples, and key details.',
      'advanced': 'Provide an in-depth, technical answer with detailed analysis and advanced concepts.'
    };

    return `
You are an AI tutor helping a student understand educational content. Answer the question based ONLY on the provided context material.

Context Material:
${context.substring(0, this.maxContextLength)}

Question: ${question}

Instructions: ${complexityInstructions[complexity] || complexityInstructions['detailed']}

Important Guidelines:
- Base your answer strictly on the provided context
- If the context doesn't contain enough information, say so clearly
- Provide specific examples when possible
- Use clear, educational language appropriate for learning
- Structure your answer logically with main points clearly identified

Answer:`;
  }

  retrieveRelevantContent(question, sourceContent, topics = []) {
    try {
      // Simple keyword-based retrieval (can be enhanced with vector embeddings)
      const questionWords = this.extractKeywords(question.toLowerCase());
      const topicWords = topics.map(t => t.toLowerCase());
      const allKeywords = [...questionWords, ...topicWords];

      // Split content into chunks
      const chunks = this.splitIntoChunks(sourceContent, 500);
      
      // Score chunks based on keyword overlap
      const scoredChunks = chunks.map(chunk => {
        const chunkWords = this.extractKeywords(chunk.toLowerCase());
        const overlap = allKeywords.filter(keyword => 
          chunkWords.some(word => word.includes(keyword) || keyword.includes(word))
        ).length;
        
        return {
          chunk,
          score: overlap,
          length: chunk.length
        };
      });

      // Sort by relevance score and select top chunks
      const topChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.chunk);

      return topChunks.join('\n\n');
    } catch (error) {
      console.error('Content retrieval error:', error);
      return sourceContent.substring(0, this.maxContextLength);
    }
  }

  extractKeywords(text) {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
      'what', 'how', 'when', 'where', 'why', 'who', 'which'
    ]);

    return text
      .split(/\W+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 20); // Limit to top 20 keywords
  }

  splitIntoChunks(text, chunkSize = 500) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence.trim();
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  formatAnswer(answer, complexity) {
    // Clean up and format the answer
    let formattedAnswer = answer
      .replace(/^\s*Answer:\s*/i, '') // Remove "Answer:" prefix if present
      .trim();

    // Ensure proper formatting based on complexity
    if (complexity === 'simple' && formattedAnswer.length > 500) {
      // Truncate for simple answers
      formattedAnswer = formattedAnswer.substring(0, 500) + '...';
    }

    return formattedAnswer;
  }

  generateFallbackAnswer(question, sourceContent) {
    // Generate a basic answer when AI services fail
    const keywords = this.extractKeywords(question.toLowerCase());
    const relevantSentences = sourceContent
      .split(/[.!?]+/)
      .filter(sentence => 
        keywords.some(keyword => 
          sentence.toLowerCase().includes(keyword)
        )
      )
      .slice(0, 3);

    if (relevantSentences.length > 0) {
      return `Based on the provided material: ${relevantSentences.join('. ')}.`;
    }

    return 'I apologize, but I cannot find sufficient information in the provided material to answer your question accurately. Please try rephrasing your question or check if the material contains the relevant information.';
  }

  async explainIncorrectAnswer(question, correctAnswer, userAnswer, context = '') {
    try {
      const prompt = `
You are an AI tutor helping a student understand their mistake. Explain why their answer was incorrect and help them learn.

Question: ${question}
Correct Answer: ${correctAnswer}
Student's Answer: ${userAnswer}
Context: ${context.substring(0, 1000)}

Please provide:
1. Why the student's answer was incorrect
2. What the correct concept/principle is
3. A clear explanation of the correct answer
4. Tips to avoid this mistake in the future

Keep the explanation encouraging and educational.

Explanation:`;

      // Try Gemini for explanation
      const model = getGeminiModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
    } catch (error) {
      console.error('Answer explanation error:', error);
      return `The correct answer is "${correctAnswer}". Your answer "${userAnswer}" was incorrect. Please review the concept and try to understand the key differences. Consider asking specific questions about what you found confusing.`;
    }
  }

  getMaxTokens(complexity) {
    const tokenLimits = {
      'simple': 200,
      'detailed': 500,
      'advanced': 800
    };
    return tokenLimits[complexity] || 500;
  }
}

module.exports = new RAGService();
