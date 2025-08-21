import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { dashboardApi } from '../../services/dashboard'
import { 
  FileText, 
  Brain, 
  Trophy, 
  Clock, 
  TrendingUp,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import LoadingSpinner from '../common/LoadingSpinner'

function RecentActivity({ activities: propActivities }) {
  const { t } = useTranslation()

  // Fetch recent activity if not provided via props
  const { data: activityData, isLoading } = useQuery(
    'recentActivity',
    () => dashboardApi.getRecentActivity({ days: 7, limit: 10 }),
    {
      enabled: !propActivities,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  const activities = propActivities || activityData?.recentActivity || []

  const getActivityIcon = (type) => {
    const iconMap = {
      'quiz': <FileText className="w-4 h-4" />,
      'flashcard': <Brain className="w-4 h-4" />,
      'study_session': <Clock className="w-4 h-4" />,
      'upload': <TrendingUp className="w-4 h-4" />
    }
    return iconMap[type] || <Calendar className="w-4 h-4" />
  }

  const getActivityColor = (type) => {
    const colorMap = {
      'quiz': 'text-blue-600 bg-blue-50',
      'flashcard': 'text-purple-600 bg-purple-50',
      'study_session': 'text-green-600 bg-green-50',
      'upload': 'text-orange-600 bg-orange-50'
    }
    return colorMap[type] || 'text-gray-600 bg-gray-50'
  }

  const formatActivityText = (activity) => {
    switch (activity.type) {
      case 'quiz':
        return t('activity.quiz', 'Completed quiz on {{material}}', { material: activity.materialName })
      case 'flashcard':
        return t('activity.flashcard', 'Reviewed flashcards for {{material}}', { material: activity.materialName })
      case 'study_session':
        return t('activity.study', 'Studied {{material}} for {{duration}}', { 
          material: activity.materialName,
          duration: activity.details
        })
      case 'upload':
        return t('activity.upload', 'Uploaded {{material}}', { material: activity.materialName })
      default:
        return activity.details || t('activity.unknown', 'Unknown activity')
    }
  }

  if (isLoading && !propActivities) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="medium" message={t('activity.loading', 'Loading recent activity...')} />
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          {t('dashboard.recentActivity', 'Recent Activity')}
        </h2>
        <Link
          to="/progress"
          className="text-sm text-primary-600 hover:text-primary-500 flex items-center gap-1"
        >
          {t('dashboard.viewAll', 'View all')}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('activity.empty.title', 'No recent activity')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('activity.empty.description', 'Start learning to see your activity here')}
          </p>
          <Link
            to="/upload"
            className="btn-primary inline-flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {t('activity.empty.action', 'Upload your first material')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 6).map((activity, index) => (
            <motion.div
              key={`${activity.type}-${activity.id}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Activity Icon */}
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {formatActivityText(activity)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <time className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </time>
                  {activity.type === 'quiz' && activity.details && (
                    <>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        Score: {activity.details}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Activity Badge/Score */}
              {activity.type === 'quiz' && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-medium text-gray-700">
                    {activity.details}
                  </span>
                </div>
              )}
            </motion.div>
          ))}

          {activities.length > 6 && (
            <div className="text-center pt-4 border-t border-gray-200">
              <Link
                to="/progress"
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                {t('activity.viewMore', 'View {{count}} more activities', { 
                  count: activities.length - 6 
                })}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RecentActivity
