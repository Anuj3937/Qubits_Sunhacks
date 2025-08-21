import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from 'react-query'
import { flashcardApi } from '../../services/flashcard'
import { 
  Brain, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff,
  Star,
  Frown,
  Meh,
  Smile,
  ThumbsUp,
  Award,
  BookOpen,
  Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

function FlashCardViewer({ flashcards = [], materialId, studyMode = 'review' }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewedCards, setReviewedCards] = useState(new Set())
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0
  })

  const currentCard = flashcards[currentIndex]
  const hasNext = currentIndex < flashcards.length - 1
  const hasPrevious = currentIndex > 0
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0

  const reviewMutation = useMutation(flashcardApi.reviewFlashcard, {
    onSuccess: (data) => {
      setReviewedCards(prev => new Set([...prev, currentCard.id]))
      queryClient.invalidateQueries(['flashcards'])
      toast.success(data.message)
    },
    onError: (error) => {
      toast.error(t('flashcard.reviewError', 'Failed to record review'))
      console.error('Flashcard review error:', error)
    }
  })

  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex(prev => prev + 1)
    } else {
      // End of deck
      toast.success(t('flashcard.sessionComplete', 'Study session complete!'))
    }
  }

  const handlePrevious = () => {
    if (hasPrevious) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleReview = (quality) => {
    if (!currentCard) return

    reviewMutation.mutate({
      flashcardId: currentCard.id,
      quality
    })

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      total: prev.total + 1,
      correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect
    }))

    // Auto-advance after review
    setTimeout(() => {
      if (hasNext) {
        handleNext()
      }
    }, 1000)
  }

  const resetSession = () => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setReviewedCards(new Set())
    setSessionStats({ correct: 0, incorrect: 0, total: 0 })
  }

  const getQualityButton = (quality, icon, label, color) => (
    <motion.button
      key={quality}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => handleReview(quality)}
      disabled={reviewMutation.isLoading}
      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${color}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  )

  if (!flashcards.length) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {t('flashcard.empty.title', 'No flashcards available')}
        </h3>
        <p className="text-gray-600 mb-6">
          {t('flashcard.empty.description', 'Generate flashcards from your study material to start learning')}
        </p>
      </div>
    )
  }

  const isSessionComplete = currentIndex >= flashcards.length

  if (isSessionComplete) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <Award className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {t('flashcard.sessionComplete', 'Study Session Complete!')}
        </h2>

        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {sessionStats.correct}
            </div>
            <div className="text-sm text-green-700">
              {t('flashcard.correct', 'Correct')}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {sessionStats.incorrect}
            </div>
            <div className="text-sm text-red-700">
              {t('flashcard.incorrect', 'Need Review')}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((sessionStats.correct / Math.max(sessionStats.total, 1)) * 100)}%
            </div>
            <div className="text-sm text-blue-700">
              {t('flashcard.accuracy', 'Accuracy')}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={resetSession}
            className="flex items-center gap-2 btn-primary"
          >
            <RotateCcw className="w-5 h-5" />
            {t('flashcard.studyAgain', 'Study Again')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {t('flashcard.progress', 'Progress: {{current}} / {{total}}', {
              current: currentIndex + 1,
              total: flashcards.length
            })}
          </span>
          <span className="text-sm text-gray-500">
            {reviewedCards.size} {t('flashcard.reviewed', 'reviewed')}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="bg-primary-600 h-3 rounded-full relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-25 animate-pulse" />
          </motion.div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="perspective-1000 mb-8">
        <motion.div
          className="relative w-full h-96 cursor-pointer"
          onClick={handleFlip}
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          {/* Front of card */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="bg-white h-full rounded-xl border-2 border-gray-200 p-8 flex flex-col">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-primary-600">
                    {t('flashcard.front', 'Question')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {currentCard?.topic && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {currentCard.topic}
                    </span>
                  )}
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Card Content */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xl text-gray-900 text-center leading-relaxed">
                  {currentCard?.front}
                </p>
              </div>

              {/* Flip Hint */}
              <div className="text-center text-sm text-gray-500">
                {t('flashcard.clickToReveal', 'Click to reveal answer')}
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div
            className="absolute inset-0 w-full h-full backface-hidden rounded-xl shadow-lg"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="bg-primary-50 h-full rounded-xl border-2 border-primary-200 p-8 flex flex-col">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-primary-600">
                    {t('flashcard.back', 'Answer')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Card Content */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xl text-gray-900 text-center leading-relaxed">
                  {currentCard?.back}
                </p>
              </div>

              {/* Flip Hint */}
              <div className="text-center text-sm text-gray-500">
                {t('flashcard.clickToHide', 'Click to hide answer')}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handlePrevious}
          disabled={!hasPrevious}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          {t('common.previous', 'Previous')}
        </button>

        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {currentIndex + 1} / {flashcards.length}
          </div>
          <div className="text-sm text-gray-500">
            {currentCard?.topic || t('flashcard.general', 'General')}
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!hasNext}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {t('common.next', 'Next')}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Review Buttons (shown only when flipped) */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg p-6 shadow-lg border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              {t('flashcard.howWellDidYouKnow', 'How well did you know this?')}
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {getQualityButton(
                0,
                <Frown className="w-6 h-6 text-red-600" />,
                t('flashcard.quality.blackout', 'Complete blackout'),
                'border-red-200 hover:bg-red-50 text-red-700'
              )}
              {getQualityButton(
                1,
                <Frown className="w-6 h-6 text-red-500" />,
                t('flashcard.quality.wrong', 'Incorrect'),
                'border-red-200 hover:bg-red-50 text-red-600'
              )}
              {getQualityButton(
                2,
                <Meh className="w-6 h-6 text-yellow-600" />,
                t('flashcard.quality.hard', 'Hard'),
                'border-yellow-200 hover:bg-yellow-50 text-yellow-700'
              )}
              {getQualityButton(
                3,
                <Smile className="w-6 h-6 text-blue-600" />,
                t('flashcard.quality.good', 'Good'),
                'border-blue-200 hover:bg-blue-50 text-blue-700'
              )}
              {getQualityButton(
                4,
                <ThumbsUp className="w-6 h-6 text-green-600" />,
                t('flashcard.quality.easy', 'Easy'),
                'border-green-200 hover:bg-green-50 text-green-700'
              )}
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              {t('flashcard.reviewHelp', 'Your response helps optimize the spaced repetition algorithm')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Stats */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">
          {t('flashcard.sessionStats', 'Session Statistics')}
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {sessionStats.correct}
            </div>
            <div className="text-sm text-gray-600">
              {t('flashcard.correct', 'Correct')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {sessionStats.incorrect}
            </div>
            <div className="text-sm text-gray-600">
              {t('flashcard.needReview', 'Need Review')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {reviewedCards.size}
            </div>
            <div className="text-sm text-gray-600">
              {t('flashcard.reviewed', 'Reviewed')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlashCardViewer
