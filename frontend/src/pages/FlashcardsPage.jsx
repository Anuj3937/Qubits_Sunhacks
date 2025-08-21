import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation } from 'react-query'
import { flashcardApi } from '../services/flashcard'
import Header from '../components/common/Header'
import FlashCardViewer from '../components/study/FlashCardViewer'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Settings, 
  Play, 
  RotateCcw, 
  Plus, 
  Filter,
  Calendar,
  Target,
  TrendingUp,
  BookOpen
} from 'lucide-react'
import { toast } from 'react-hot-toast'

function FlashcardsPage() {
  const { materialId } = useParams()
  const { t } = useTranslation()
  const [studyMode, setStudyMode] = useState('due') // 'all', 'due', 'new', 'review'
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [studySettings, setStudySettings] = useState({
    flashcardCount: 15,
    topics: []
  })
  const [isStudying, setIsStudying] = useState(false)

  // Fetch flashcards
  const { data: flashcardsData, isLoading, refetch } = useQuery(
    ['flashcards', materialId, studyMode, selectedTopic],
    () => {
      if (studyMode === 'due') {
        return flashcardApi.getDueFlashcards()
      } else {
        return flashcardApi.getFlashcards(materialId)
      }
    },
    {
      enabled: !!materialId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Generate flashcards mutation
  const generateFlashcardsMutation = useMutation(flashcardApi.generateFlashcards, {
    onSuccess: (data) => {
      toast.success(t('flashcard.generated', 'Flashcards generated successfully!'))
      refetch()
    },
    onError: (error) => {
      toast.error(t('flashcard.generateError', 'Failed to generate flashcards'))
      console.error('Flashcard generation error:', error)
    }
  })

  const handleGenerateFlashcards = () => {
    generateFlashcardsMutation.mutate({
      materialId,
      ...studySettings
    })
  }

  const handleStartStudy = () => {
    setIsStudying(true)
  }

  const handleEndStudy = () => {
    setIsStudying(false)
    refetch() // Refresh data after study session
  }

  const getFilteredFlashcards = () => {
    if (!flashcardsData?.flashcards) return []
    
    let cards = flashcardsData.flashcards

    if (selectedTopic !== 'all') {
      cards = cards.filter(card => card.topic === selectedTopic)
    }

    switch (studyMode) {
      case 'due':
        return cards.filter(card => card.isDue)
      case 'new':
        return cards.filter(card => card.reviewCount === 0)
      case 'review':
        return cards.filter(card => card.reviewCount > 0 && !card.isDue)
      default:
        return cards
    }
  }

  const getUniqueTopics = () => {
    if (!flashcardsData?.flashcards) return []
    const topics = [...new Set(flashcardsData.flashcards.map(card => card.topic))]
    return topics.filter(Boolean)
  }

  const filteredFlashcards = getFilteredFlashcards()
  const topics = getUniqueTopics()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="large" message={t('flashcard.loading', 'Loading flashcards...')} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {isStudying ? (
          /* Study Mode */
          <div>
            <div className="mb-6">
              <button
                onClick={handleEndStudy}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← {t('flashcard.backToLibrary', 'Back to Flashcard Library')}
              </button>
            </div>
            
            <FlashCardViewer
              flashcards={filteredFlashcards}
              materialId={materialId}
              studyMode={studyMode}
            />
          </div>
        ) : (
          /* Library Mode */
          <>
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <Brain className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {t('flashcard.title', 'Flashcards')}
              </h1>
              <p className="text-xl text-gray-600">
                {t('flashcard.subtitle', 'Practice with spaced repetition for better retention')}
              </p>
            </motion.div>

            {/* Stats Overview */}
            {flashcardsData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
              >
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {flashcardsData.stats?.totalCards || flashcardsData.flashcards?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('flashcard.stats.total', 'Total Cards')}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {flashcardsData.stats?.dueToday || filteredFlashcards.filter(c => c.isDue).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('flashcard.stats.dueToday', 'Due Today')}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {flashcardsData.flashcards?.filter(c => c.reviewCount === 0).length || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('flashcard.stats.new', 'New Cards')}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(flashcardsData.flashcards?.filter(c => c.reviewCount > 0).length / Math.max(flashcardsData.flashcards?.length, 1) * 100) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {t('flashcard.stats.progress', 'Progress')}
                  </div>
                </div>
              </motion.div>
            )}

            {/* No Flashcards State */}
            {(!flashcardsData?.flashcards || flashcardsData.flashcards.length === 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm p-12 text-center"
              >
                <Brain className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {t('flashcard.empty.title', 'No flashcards yet')}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {t('flashcard.empty.description', 'Generate flashcards from your study material to start practicing with spaced repetition')}
                </p>

                {/* Generate Settings */}
                <div className="max-w-md mx-auto mb-8">
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      {t('flashcard.generateSettings', 'Generation Settings')}
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('flashcard.cardCount', 'Number of Cards')}
                      </label>
                      <select
                        value={studySettings.flashcardCount}
                        onChange={(e) => setStudySettings(prev => ({ ...prev, flashcardCount: parseInt(e.target.value) }))}
                        className="input-field"
                      >
                        <option value={10}>10 cards</option>
                        <option value={15}>15 cards</option>
                        <option value={20}>20 cards</option>
                        <option value={25}>25 cards</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGenerateFlashcards}
                  disabled={generateFlashcardsMutation.isLoading}
                  className="btn-primary px-8 py-4 text-lg flex items-center gap-3 mx-auto"
                >
                  {generateFlashcardsMutation.isLoading ? (
                    <RotateCcw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Plus className="w-6 h-6" />
                  )}
                  {generateFlashcardsMutation.isLoading 
                    ? t('flashcard.generating', 'Generating...')
                    : t('flashcard.generate', 'Generate Flashcards')
                  }
                </button>
              </motion.div>
            )}

            {/* Flashcards Available */}
            {flashcardsData?.flashcards && flashcardsData.flashcards.length > 0 && (
              <>
                {/* Filters */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white rounded-lg p-6 shadow-sm mb-8"
                >
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    {t('flashcard.filters', 'Study Options')}
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Study Mode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {t('flashcard.studyMode', 'Study Mode')}
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'due', label: t('flashcard.mode.due', 'Due for Review'), count: filteredFlashcards.filter(c => c.isDue).length },
                          { value: 'all', label: t('flashcard.mode.all', 'All Cards'), count: flashcardsData.flashcards.length },
                          { value: 'new', label: t('flashcard.mode.new', 'New Cards'), count: flashcardsData.flashcards.filter(c => c.reviewCount === 0).length },
                          { value: 'review', label: t('flashcard.mode.review', 'Previously Studied'), count: flashcardsData.flashcards.filter(c => c.reviewCount > 0).length }
                        ].map((mode) => (
                          <label key={mode.value} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="studyMode"
                              value={mode.value}
                              checked={studyMode === mode.value}
                              onChange={(e) => setStudyMode(e.target.value)}
                              className="text-primary-600 focus:ring-primary-500"
                            />
                            <span className="flex-1">
                              {mode.label}
                              <span className="text-gray-500 ml-2">({mode.count})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Topic Filter */}
                    {topics.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          {t('flashcard.filterByTopic', 'Filter by Topic')}
                        </label>
                        <select
                          value={selectedTopic}
                          onChange={(e) => setSelectedTopic(e.target.value)}
                          className="input-field"
                        >
                          <option value="all">{t('flashcard.allTopics', 'All Topics')}</option>
                          {topics.map((topic) => (
                            <option key={topic} value={topic}>
                              {topic}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Start Study Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-center mb-8"
                >
                  {filteredFlashcards.length > 0 ? (
                    <button
                      onClick={handleStartStudy}
                      className="btn-primary px-8 py-4 text-lg flex items-center gap-3 mx-auto"
                    >
                      <Play className="w-6 h-6" />
                      {t('flashcard.startStudying', 'Start Studying ({{count}} cards)', {
                        count: filteredFlashcards.length
                      })}
                    </button>
                  ) : (
                    <div className="text-gray-600">
                      <p>{t('flashcard.noCardsInFilter', 'No cards match the selected filters')}</p>
                      <button
                        onClick={() => {
                          setStudyMode('all')
                          setSelectedTopic('all')
                        }}
                        className="text-primary-600 hover:text-primary-700 mt-2"
                      >
                        {t('flashcard.clearFilters', 'Clear filters')}
                      </button>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FlashcardsPage
