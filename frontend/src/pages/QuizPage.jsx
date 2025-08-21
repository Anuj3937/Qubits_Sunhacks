import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from 'react-query'
import { quizApi } from '../services/quiz'
import Header from '../components/common/Header'
import QuizInterface from '../components/study/QuizInterface'
import QuizResults from '../components/study/QuizResults'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { motion } from 'framer-motion'
import { FileQuestion, Settings, Play, RotateCcw } from 'lucide-react'
import { toast } from 'react-hot-toast'

function QuizPage() {
  const { materialId } = useParams()
  const { t } = useTranslation()
  const [quizState, setQuizState] = useState('setup') // 'setup', 'active', 'completed'
  const [quizResults, setQuizResults] = useState(null)
  const [quizSettings, setQuizSettings] = useState({
    questionCount: 10,
    difficultyLevel: 'medium',
    topics: []
  })

  // Generate Quiz Mutation
  const generateQuizMutation = useMutation(quizApi.generateQuiz, {
    onSuccess: (data) => {
      setQuizState('active')
      toast.success(t('quiz.generated', 'Quiz generated successfully!'))
    },
    onError: (error) => {
      toast.error(t('quiz.generateError', 'Failed to generate quiz'))
      console.error('Quiz generation error:', error)
    }
  })

  // Get existing quiz
  const { data: quizData, isLoading } = useQuery(
    ['quiz', materialId],
    () => quizApi.getQuiz(materialId),
    {
      enabled: !!materialId && quizState === 'active',
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: () => {
        // If no quiz exists, go to setup
        setQuizState('setup')
      }
    }
  )

  const handleGenerateQuiz = () => {
    generateQuizMutation.mutate({
      materialId,
      ...quizSettings
    })
  }

  const handleQuizComplete = (results) => {
    setQuizResults(results.results)
    setQuizState('completed')
  }

  const handleRetakeQuiz = () => {
    setQuizResults(null)
    setQuizState('setup')
  }

  const handleStartExistingQuiz = () => {
    setQuizState('active')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="large" message={t('quiz.loading', 'Loading quiz...')} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Quiz Setup */}
        {quizState === 'setup' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <FileQuestion className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('quiz.setup.title', 'Quiz Setup')}
              </h1>
              <p className="text-gray-600">
                {t('quiz.setup.subtitle', 'Customize your quiz settings to match your learning goals')}
              </p>
            </div>

            {/* Quiz Settings */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('quiz.setup.settings', 'Quiz Settings')}
              </h2>

              <div className="space-y-6">
                {/* Question Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('quiz.setup.questionCount', 'Number of Questions')}
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[5, 10, 15, 20].map((count) => (
                      <button
                        key={count}
                        onClick={() => setQuizSettings(prev => ({ ...prev, questionCount: count }))}
                        className={`p-3 text-center rounded-lg border-2 transition-colors ${
                          quizSettings.questionCount === count
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-lg font-semibold">{count}</div>
                        <div className="text-xs text-gray-500">
                          ~{Math.round(count * 1.5)}min
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('quiz.setup.difficulty', 'Difficulty Level')}
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'easy', label: t('quiz.difficulty.easy', 'Easy'), color: 'green' },
                      { value: 'medium', label: t('quiz.difficulty.medium', 'Medium'), color: 'yellow' },
                      { value: 'hard', label: t('quiz.difficulty.hard', 'Hard'), color: 'red' }
                    ].map((difficulty) => (
                      <button
                        key={difficulty.value}
                        onClick={() => setQuizSettings(prev => ({ ...prev, difficultyLevel: difficulty.value }))}
                        className={`p-4 text-center rounded-lg border-2 transition-colors ${
                          quizSettings.difficultyLevel === difficulty.value
                            ? `border-${difficulty.color}-500 bg-${difficulty.color}-50 text-${difficulty.color}-700`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{difficulty.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('quiz.setup.topics', 'Focus Topics (Optional)')}
                  </label>
                  <textarea
                    value={quizSettings.topics.join(', ')}
                    onChange={(e) => setQuizSettings(prev => ({
                      ...prev,
                      topics: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }))}
                    className="input-field h-20"
                    placeholder={t('quiz.setup.topicsPlaceholder', 'Enter topics separated by commas (leave empty for all topics)')}
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={handleGenerateQuiz}
                disabled={generateQuizMutation.isLoading}
                className="btn-primary px-8 py-4 text-lg flex items-center gap-3 mx-auto"
              >
                {generateQuizMutation.isLoading ? (
                  <RotateCcw className="w-6 h-6 animate-spin" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
                {generateQuizMutation.isLoading 
                  ? t('quiz.generating', 'Generating Quiz...')
                  : t('quiz.generate', 'Generate Quiz')
                }
              </button>
            </div>
          </motion.div>
        )}

        {/* Active Quiz */}
        {quizState === 'active' && quizData?.quiz?.questions && (
          <QuizInterface
            materialId={materialId}
            questions={quizData.quiz.questions}
            onQuizComplete={handleQuizComplete}
          />
        )}

        {/* Quiz Results */}
        {quizState === 'completed' && quizResults && (
          <QuizResults
            results={quizResults}
            onRetakeQuiz={handleRetakeQuiz}
            materialId={materialId}
          />
        )}
      </div>
    </div>
  )
}

export default QuizPage
