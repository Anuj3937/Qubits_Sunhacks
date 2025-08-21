import api from './api'

export const quizApi = {
  generateQuiz: (params) => 
    api.post(`/quiz/generate/${params.materialId}`, {
      questionCount: params.questionCount,
      difficultyLevel: params.difficultyLevel,
      topics: params.topics
    }),

  getQuiz: (materialId) => 
    api.get(`/quiz/${materialId}`),

  submitQuiz: (params) =>
    api.post(`/quiz/submit/${params.materialId}`, {
      answers: params.answers,
      timeTaken: params.timeTaken
    }),

  getQuizResults: (attemptId) =>
    api.get(`/quiz/results/${attemptId}`),

  getQuizHistory: (params = {}) =>
    api.get('/quiz/history/user', { params }),

  getMaterialQuizHistory: (materialId, params = {}) =>
    api.get(`/quiz/history/${materialId}`, { params }),

  deleteQuizAttempt: (attemptId) =>
    api.delete(`/quiz/attempt/${attemptId}`)
}

export default quizApi
