import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  Trophy, 
  Clock, 
  Target, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  ArrowRight,
  Award,
  TrendingUp,
  Brain
} from 'lucide-react'
import { motion } from 'framer-motion'

function QuizResults({ results, onRetakeQuiz, materialId }) {
  const { t } = useTranslation()
  
  if (!results) {
    return null
  }

  const {
    score,
    totalQuestions,
    percentage,
    timeTaken,
    detailedResults = [],
    performance,
    suggestions = []
  } = results

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getPerformanceColor = (perf) => {
    switch (perf?.toLowerCase()) {
      case 'excellent': return 'text-green-600 bg-green-100'
      case 'good': return 'text-blue-600 bg-blue-100'
      case 'fair': return 'text-yellow-600 bg-yellow-100'
      case 'needs improvement': return 'text-orange-600 bg-orange-100'
      case 'poor': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getScoreIcon = (percentage) => {
    if (percentage >= 90) return <Award className="w-8 h-8 text-yellow-500" />
    if (percentage >= 80) return <Trophy className="w-8 h-8 text-blue-500" />
    if (percentage >= 70) return <Target className="w-8 h-8 text-green-500" />
    return <Brain className="w-8 h-8 text-gray-500" />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <div className="mb-6">
          {getScoreIcon(percentage)}
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {t('quiz.results.title', 'Quiz Complete!')}
        </h2>
        
        <div className="text-6xl font-bold text-primary-600 mb-4">
          {percentage}%
        </div>
        
        <p className="text-xl text-gray-600 mb-6">
          {t('quiz.results.score', 'You scored {{score}} out of {{total}} questions correctly', {
            score,
            total: totalQuestions
          })}
        </p>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getPerformanceColor(performance)}`}>
          {performance}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid md:grid-cols-3 gap-6"
      >
        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-green-600 mb-1">
            {score}
          </div>
          <div className="text-sm text-gray-600">
            {t('quiz.results.correct', 'Correct Answers')}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
          <XCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-red-600 mb-1">
            {totalQuestions - score}
          </div>
          <div className="text-sm text-gray-600">
            {t('quiz.results.incorrect', 'Incorrect Answers')}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
          <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {formatTime(timeTaken)}
          </div>
          <div className="text-sm text-gray-600">
            {t('quiz.results.timeTaken', 'Time Taken')}
          </div>
        </div>
      </motion.div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            {t('quiz.results.suggestions', 'Suggestions for Improvement')}
          </h3>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Detailed Results */}
      {detailedResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('quiz.results.detailed', 'Detailed Results')}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {detailedResults.map((result, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start gap-4">
                  {/* Question Number & Status */}
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      result.isCorrect 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Question */}
                    <h4 className="text-base font-medium text-gray-900 mb-3">
                      {result.question}
                    </h4>

                    {/* Answers */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {t('quiz.results.yourAnswer', 'Your answer:')}
                        </span>
                        <span className={`text-sm font-medium ${
                          result.isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {result.selectedAnswer}
                        </span>
                        {result.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      
                      {!result.isCorrect && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {t('quiz.results.correctAnswer', 'Correct answer:')}
                          </span>
                          <span className="text-sm font-medium text-green-700">
                            {result.correctAnswer}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {result.explanation && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-blue-900 mb-1">
                          {t('quiz.results.explanation', 'Explanation')}
                        </h5>
                        <p className="text-sm text-blue-800">
                          {result.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <button
          onClick={onRetakeQuiz}
          className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          {t('quiz.results.retake', 'Retake Quiz')}
        </button>

        <Link
          to={`/flashcards/${materialId}`}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          <Brain className="w-5 h-5" />
          {t('quiz.results.reviewFlashcards', 'Review Flashcards')}
        </Link>

        <Link
          to={`/tutor/${materialId}`}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
          {t('quiz.results.askTutor', 'Ask AI Tutor')}
        </Link>
      </motion.div>
    </div>
  )
}

export default QuizResults
