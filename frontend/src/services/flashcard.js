import api from './api'

export const flashcardApi = {
  generateFlashcards: (params) =>
    api.post(`/flashcards/generate/${params.materialId}`, {
      flashcardCount: params.flashcardCount,
      topics: params.topics
    }),

  getFlashcards: (materialId, params = {}) =>
    api.get(`/flashcards/${materialId}`, { params }),

  getDueFlashcards: (params = {}) =>
    api.get('/flashcards/due/today', { params }),

  getAllUserFlashcards: (params = {}) =>
    api.get('/flashcards/user/all', { params }),

  reviewFlashcard: (params) =>
    api.post(`/flashcards/review/${params.flashcardId}`, {
      quality: params.quality
    }),

  createFlashcard: (params) =>
    api.post('/flashcards/custom', params),

  updateFlashcard: (flashcardId, params) =>
    api.put(`/flashcards/${flashcardId}`, params),

  deleteFlashcard: (flashcardId) =>
    api.delete(`/flashcards/${flashcardId}`),

  getFlashcardStats: () =>
    api.get('/flashcards/stats'),

  getTopicStats: () =>
    api.get('/flashcards/stats/topics')
}

export default flashcardApi
