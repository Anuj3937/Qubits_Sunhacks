const { getGeminiModel } = require('../config/gemini');

class FlashcardGenerator {
  async generateFlashcards(text, topics = [], flashcardCount = 15) {
    try {
      console.log('Generating flashcards from text...');
      
      // Use Gemini to generate flashcards
      const geminiFlashcards = await this.generateWithGemini(text, topics, flashcardCount);
      
      // Add fallback generation if needed
      if (geminiFlashcards.length < 5) {
        const fallbackCards = this.generateFallbackFlashcards(text, topics);
        geminiFlashcards.push(...fallbackCards);
      }

      return geminiFlashcards.slice(0, flashcardCount);

    } catch (error) {
      console.error('Flashcard generation error:', error);
      return this.generateFallbackFlashcards(text, topics);
    }
  }

  async generateWithGemini(text, topics, count) {
    try {
      const model = getGeminiModel();
      
      const prompt = `
Generate ${count} educational flashcards from the following text. 
Each flashcard should have a clear question/term on the front and a concise answer/definition on the back.
Focus on key concepts, definitions, formulas, and important facts.

Text: ${text.substring(0, 3000)}

Return the flashcards in the following JSON format:
{
  "flashcards": [
    {
      "front": "Question or term here",
      "back": "Answer or definition here",
      "difficulty": "easy|medium|hard",
      "topic": "relevant topic"
    }
  ]
}

Make sure each flashcard is educational and tests understanding of the material.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Parse JSON response
      let flashcardsData;
      try {
        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          flashcardsData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        return this.parseTextualFlashcards(responseText, topics);
      }

      // Process and validate flashcards
      if (flashcardsData.flashcards && Array.isArray(flashcardsData.flashcards)) {
        return flashcardsData.flashcards.map(card => ({
          id: this.generateId(),
          front: card.front || 'Question',
          back: card.back || 'Answer',
          difficulty: card.difficulty || 'medium',
          topic: card.topic || (topics[0] || 'General'),
          created_at: new Date().toISOString(),
          next_review: new Date().toISOString().split('T'), // Today
          ease_factor: 2.5,
          review_count: 0
        }));
      }

      return [];
    } catch (error) {
      console.error('Gemini flashcard generation error:', error);
      return [];
    }
  }

  parseTextualFlashcards(responseText, topics) {
    // Parse flashcards from non-JSON text response
    const flashcards = [];
    const lines = responseText.split('\n').filter(line => line.trim());
    
    let currentCard = {};
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for question patterns
      if (trimmedLine.toLowerCase().includes('front:') || 
          trimmedLine.toLowerCase().includes('question:') ||
          trimmedLine.includes('Q:')) {
        if (currentCard.front && currentCard.back) {
          flashcards.push(this.formatFlashcard(currentCard, topics));
          currentCard = {};
        }
        currentCard.front = trimmedLine.replace(/^(front:|question:|Q:)/i, '').trim();
      }
      // Look for answer patterns
      else if (trimmedLine.toLowerCase().includes('back:') || 
               trimmedLine.toLowerCase().includes('answer:') ||
               trimmedLine.includes('A:')) {
        currentCard.back = trimmedLine.replace(/^(back:|answer:|A:)/i, '').trim();
      }
    }
    
    // Add the last card
    if (currentCard.front && currentCard.back) {
      flashcards.push(this.formatFlashcard(currentCard, topics));
    }

    return flashcards;
  }

  formatFlashcard(card, topics) {
    return {
      id: this.generateId(),
      front: card.front,
      back: card.back,
      difficulty: 'medium',
      topic: topics[0] || 'General',
      created_at: new Date().toISOString(),
      next_review: new Date().toISOString().split('T'),
      ease_factor: 2.5,
      review_count: 0
    };
  }

  generateFallbackFlashcards(text, topics) {
    // Generate basic flashcards when AI generation fails
    const flashcards = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
    
    // Create definition-style flashcards
    for (let i = 0; i < Math.min(10, sentences.length); i++) {
      const sentence = sentences[i].trim();
      const words = sentence.split(' ');
      
      if (words.length > 5) {
        // Extract potential key terms (capitalized words, longer words)
        const keyTerms = words.filter(word => 
          word.length > 6 || /^[A-Z]/.test(word)
        );
        
        if (keyTerms.length > 0) {
          const term = keyTerms[0];
          flashcards.push({
            id: this.generateId(),
            front: `What is ${term}?`,
            back: sentence.substring(0, 150) + (sentence.length > 150 ? '...' : ''),
            difficulty: 'medium',
            topic: topics[0] || 'General',
            created_at: new Date().toISOString(),
            next_review: new Date().toISOString().split('T'),
            ease_factor: 2.5,
            review_count: 0
          });
        }
      }
    }

    // Add topic-based flashcards
    topics.forEach((topic, index) => {
      if (index < 5) {
        flashcards.push({
          id: this.generateId(),
          front: `Explain the concept of ${topic}`,
          back: `Key concept related to ${topic} from the study material.`,
          difficulty: 'medium',
          topic: topic,
          created_at: new Date().toISOString(),
          next_review: new Date().toISOString().split('T')[0],
          ease_factor: 2.5,
          review_count: 0
        });
      }
    });

    return flashcards.slice(0, 10);
  }

  generateId() {
    return 'fc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = new FlashcardGenerator();
