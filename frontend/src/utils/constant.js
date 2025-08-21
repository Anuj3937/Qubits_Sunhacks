export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    REFRESH: '/auth/refresh'
  },
  UPLOAD: {
    FILE: '/upload',
    MATERIALS: '/upload/materials',
    STATUS: '/upload/status'
  },
  QUIZ: {
    GENERATE: '/quiz/generate',
    SUBMIT: '/quiz/submit',
    HISTORY: '/quiz/history'
  },
  FLASHCARDS: {
    GENERATE: '/flashcards/generate',
    REVIEW: '/flashcards/review',
    DUE: '/flashcards/due'
  },
  TUTOR: {
    ASK: '/tutor/ask',
    CONVERSATION: '/tutor/conversation',
    SUGGESTIONS: '/tutor/suggestions'
  },
  DASHBOARD: {
    MAIN: '/dashboard',
    PROGRESS: '/dashboard/progress',
    STATS: '/dashboard/stats'
  }
}

export const STUDY_MODES = {
  FLASHCARDS: 'flashcards',
  QUIZ: 'quiz',
  TUTOR: 'tutor',
  REVIEW: 'review'
}

export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
}

export const ACADEMIC_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
}

export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain',
  JPG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif'
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const PROCESSING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
}

export const QUIZ_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer',
  FILL_IN_BLANK: 'fill_in_blank'
}
