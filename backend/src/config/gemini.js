const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGeminiModel = (modelName = 'gemini-1.5-pro') => {
  return genAI.getGenerativeModel({ model: modelName });
};

const analyzeDocument = async (text, imageData = null) => {
  try {
    const model = getGeminiModel();
    
    let prompt = `
    Analyze the following educational content and extract:
    1. Main topics and concepts
    2. Key definitions and terms
    3. Important formulas or equations
    4. Conceptual relationships
    5. Difficulty level (beginner, intermediate, advanced)
    
    Content: ${text}
    
    Please provide a structured analysis in JSON format.
    `;

    const parts = [{ text: prompt }];
    
    if (imageData) {
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.data
        }
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw error;
  }
};

const generateSummary = async (content, academicLevel = 'intermediate', language = 'English') => {
  try {
    const model = getGeminiModel();
    
    const prompt = `
    Create a comprehensive summary of the following content for ${academicLevel} level students in ${language}.
    Make it engaging and easy to understand while preserving all important information.
    
    Content: ${content}
    
    Provide the summary in a structured format with:
    1. Brief overview (2-3 sentences)
    2. Key points (bullet format)
    3. Important concepts to remember
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Summary generation error:', error);
    throw error;
  }
};

module.exports = {
  getGeminiModel,
  analyzeDocument,
  generateSummary
};
