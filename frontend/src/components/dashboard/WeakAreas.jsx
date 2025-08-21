import React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import { dashboardApi } from '../../services/dashboard'
import { Link } from 'react-router-dom'
import { AlertTriangle, BookOpen, Brain, ArrowRight, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../common/LoadingSpinner'

function WeakAreas({ limit = 5 }) {
  const { t } = useTranslation()

  const { data: weakAreasData, isLoading } = useQuery(
    ['weakAreas', limit],
    () => dashboardApi.getWeakAreas({ limit }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="small" />
        </div>
      </div>
    )
  }

  const weakAreas = weakAreasData?.weakAreas || []

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('dashboard.weakAreas', 'Areas to Improve')}
        </h3>
      </div>

      {weakAreas.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">
            {t('weakAreas.empty.title', 'No weak areas identified yet')}
          </h4>
          <p className="text-sm text-gray-600">
            {t('weakAreas.empty.description', 'Take more quizzes to get personalized recommendations')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {weakAreas.map((area, index) => (
            <motion.div
              key={area.topic}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-4 border border-orange-200 rounded-lg bg-orange-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {area.topic}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('weakAreas.errorCount', '{{count}} incorrect answers', { count: area.errorCount })}
                  </p>
                  
                  {/* Suggestions */}
                  {area.improvementSuggestions && area.improvementSuggestions.length > 0 && (
                    <div className="space-y-1">
                      {area.improvementSuggestions.slice(0, 2).map((suggestion, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                          <div className="w-1 h-1 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 ml-4">
                  <Link
                    to={`/flashcards?topic=${encodeURIComponent(area.topic)}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200 transition-colors"
                  >
                    <Brain className="w-3 h-3" />
                    {t('weakAreas.study', 'Study')}
                  </Link>
                  <Link
                    to={`/quiz?topic=${encodeURIComponent(area.topic)}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                  >
                    <BookOpen className="w-3 h-3" />
                    {t('weakAreas.practice', 'Practice')}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}

          {/* View All Link */}
          {weakAreas.length >= limit && (
            <div className="text-center pt-4">
              <Link
                to="/progress#weak-areas"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium flex items-center justify-center gap-1"
              >
                {t('weakAreas.viewAll', 'View all weak areas')}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default WeakAreas
