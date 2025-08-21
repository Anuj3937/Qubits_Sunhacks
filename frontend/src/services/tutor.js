import api from './api'

export const tutorApi = {
  askQuestion: (params) =>
    api.post(`/tutor/ask/${params.materialId}`, {
      question: params.question,
      language: params.language,
      complexity: params.complexity
    }),

  getConversationHistory: (materialId, params = {}) =>
    api.get(`/tutor/conversation/${materialId}`, { params }),

  clearConversationHistory: (materialId) =>
    api.delete(`/tutor/conversation/${materialId}`),

  getSuggestedQuestions: (materialId, params = {}) =>
    api.get(`/tutor/suggestions/${materialId}`, { params }),

  rateTutorResponse: (params) =>
    api.post('/tutor/rate', {
      conversationId: params.conversationId,
      rating: params.rating,
      feedback: params.feedback
    }),

  getTutorStats: () =>
    api.get('/tutor/stats')
}

export default tutorApi
