import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from 'react-query'
import { quizApi } from '../../services/quiz'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Flag,
  RotateCcw,
  Target,
  Brain
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

function QuizInterface({ materialId, questions = [], onQuizComplete }) {
  const { t } = useTranslation()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [quizStartTime] = useState(Date.now())
  const [showExplanation, setShowExplanation] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const hasAnswered = answers[currentQuestion?.id] !== undefined
  const totalQuestions = questions.length

  // Timer Effect
  useEffect(() => {
    if (!timeRemaining) return
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  // Initialize timer (15 minutes default)
  useEffect(() => {
    if (questions.length > 0 && timeRemaining === null) {
      setTimeRemaining(questions.length * 90) // 1.5 minutes per question
    }
  }, [questions.length])

  const submitQuizMutation = useMutation(quizApi.submitQuiz, {
    onSuccess: (data) => {
      onQuizComplete?.(data)
      toast.success(t('quiz.submitted', 'Quiz submitted successfully!'))
    },
    onError: (error) => {
      toast.error(t('quiz.submitError', 'Failed to submit quiz'))
      console.error('Quiz submission error:', error)
    }
  })

  const handleAnswerSelect = (answerId) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerId
    }))
    setShowExplanation(false)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowExplanation(false)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setShowExplanation(false)
    }
  }

  const toggleFlag = () => {
    const newFlagged = new Set(flaggedQuestions)
    if (flaggedQuestions.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id)
    } else {
      newFlagged.add(currentQuestion.id)
    }
    setFlaggedQuestions(newFlagged)
  }

  const handleSubmitQuiz = () => {
    const quizAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer
    }))

    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000)

    submitQuizMutation.mutate({
      materialId,
      answers: quizAnswers,
      timeTaken
    })
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / totalQuestions) * 100
  }

  const getAnsweredCount = () => {
    return Object.keys(answers).length
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('quiz.noQuestions', 'No questions available')}
          </h3>
          <p className="text-gray-600">
            {t('quiz.generateFirst', 'Please generate a quiz first')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quiz Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('quiz.title', 'Quiz')}
            </h2>
            <p className="text-gray-600">
              {t('quiz.question', 'Question {{current}} of {{total}}', {
                current: currentQuestionIndex + 1,
                total: totalQuestions
              })}
            </p>
          </div>

          {/* Timer */}
          {timeRemaining !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              {t('quiz.progress', 'Progress')}
            </span>
            <span className="text-sm text-gray-600">
              {getAnsweredCount()}/{totalQuestions} {t('quiz.answered', 'answered')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.5 }}
              className="bg-primary-600 h-3 rounded-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-25 animate-pulse" />
            </motion.div>
          </div>
        </div>

        {/* Quiz Navigation */}
        <div className="flex items-center gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-primary-600 text-white'
                  : answers[questions[index]?.id]
                  ? 'bg-green-100 text-green-800'
                  : flaggedQuestions.has(questions[index]?.id)
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Card */}
      <motion.div
        key={currentQuestion.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-8"
      >
        {/* Question Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {t(`quiz.difficulty.${currentQuestion.difficulty}`, currentQuestion.difficulty)}
              </span>
              
              {currentQuestion.topic && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentQuestion.topic}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={toggleFlag}
            className={`p-2 rounded-lg transition-colors ${
              flaggedQuestions.has(currentQuestion.id)
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
          >
            <Flag className="w-5 h-5" />
          </button>
        </div>

        {/* Question Text */}
        <h3 className="text-xl font-semibold text-gray-900 mb-8 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Answer Options */}
        <div className="space-y-3 mb-8">
          {currentQuestion.options?.map((option, index) => {
            const optionId = option
            const isSelected = answers[currentQuestion.id] === optionId
            
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleAnswerSelect(optionId)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-medium">
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Explanation (if shown) */}
        <AnimatePresence>
          {showExplanation && currentQuestion.explanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <h4 className="font-semibold text-blue-900 mb-2">
                {t('quiz.explanation', 'Explanation')}
              </h4>
              <p className="text-blue-800 text-sm">
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.previous', 'Previous')}
            </button>

            {currentQuestion.explanation && (
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Target className="w-4 h-4" />
                {showExplanation ? t('quiz.hideExplanation', 'Hide') : t('quiz.showExplanation', 'Show Explanation')}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isLastQuestion ? (
              <button
                onClick={handleNextQuestion}
                className="flex items-center gap-2 btn-primary"
              >
                {t('quiz.nextQuestion', 'Next Question')}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitQuizMutation.isLoading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitQuizMutation.isLoading ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {t('quiz.finishQuiz', 'Finish Quiz')}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quiz Summary */}
      <div className="mt-6 bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          {t('quiz.summary', 'Quiz Summary')}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {getAnsweredCount()}
            </div>
            <div className="text-sm text-gray-600">
              {t('quiz.answered', 'Answered')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {totalQuestions - getAnsweredCount()}
            </div>
            <div className="text-sm text-gray-600">
              {t('quiz.remaining', 'Remaining')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {flaggedQuestions.size}
            </div>
            <div className="text-sm text-gray-600">
              {t('quiz.flagged', 'Flagged')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {timeRemaining ? formatTime(timeRemaining) : '--:--'}
            </div>
            <div className="text-sm text-gray-600">
              {t('quiz.timeLeft', 'Time Left')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizInterface
