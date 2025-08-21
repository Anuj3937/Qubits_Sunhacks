import React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import { dashboardApi } from '../../services/dashboard'
import { Flame, Trophy, Target, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import LoadingSpinner from '../common/LoadingSpinner'

function StudyStreak({ streak: propStreak }) {
  const { t } = useTranslation()

  // Fetch streak data if not provided via props
  const { data: streakData, isLoading } = useQuery(
    'studyStreak',
    dashboardApi.getStudyStreak,
    {
      enabled: propStreak === undefined,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const streak = propStreak !== undefined ? propStreak : streakData?.streakData?.currentStreak || 0
  const longestStreak = streakData?.streakData?.longestStreak || streak
  const nextMilestone = streakData?.streakData?.nextMilestone || 7
  const streakMessage = streakData?.streakData?.streakMessage || t('streak.start', 'Start your study streak today!')

  const getStreakLevel = (days) => {
    if (days >= 100) return { level: 'legendary', color: 'purple', icon: '👑' }
    if (days >= 30) return { level: 'champion', color: 'yellow', icon: '🏆' }
    if (days >= 14) return { level: 'warrior', color: 'orange', icon: '⚡' }
    if (days >= 7) return { level: 'committed', color: 'blue', icon: '💪' }
    if (days >= 3) return { level: 'building', color: 'green', icon: '🌱' }
    return { level: 'starting', color: 'gray', icon: '🎯' }
  }

  const currentLevel = getStreakLevel(streak)
  const progressToNext = ((streak % 7) / 7) * 100

  if (isLoading && propStreak === undefined) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="small" />
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('dashboard.studyStreak', 'Study Streak')}
        </h3>
      </div>

      {/* Current Streak Display */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="relative inline-flex items-center justify-center w-24 h-24 mb-4"
        >
          {/* Circular Progress */}
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              className={`${
                streak > 0 ? 'text-orange-500' : 'text-gray-300'
              }`}
              initial={{ strokeDashoffset: 251.2 }}
              animate={{ 
                strokeDashoffset: 251.2 - (progressToNext / 100) * 251.2 
              }}
              style={{ 
                strokeDasharray: '251.2 251.2',
                transition: 'stroke-dashoffset 0.5s ease-in-out'
              }}
            />
          </svg>

          {/* Streak Number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl">{currentLevel.icon}</span>
            <span className="text-2xl font-bold text-gray-900">{streak}</span>
          </div>
        </motion.div>

        <h4 className="text-xl font-bold text-gray-900 mb-1">
          {streak} {t('streak.days', 'Days')}
        </h4>
        <p className="text-sm text-gray-600">
          {streakMessage}
        </p>
      </div>

      {/* Streak Stats */}
      <div className="space-y-4 mb-6">
        {/* Progress to Next Milestone */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {t('streak.nextGoal', 'Next goal: {{days}} days', { days: nextMilestone })}
            </span>
            <span className="text-sm text-gray-500">
              {Math.max(0, nextMilestone - streak)} {t('streak.remaining', 'to go')}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((streak / nextMilestone) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Longest Streak */}
        {longestStreak > streak && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {t('streak.longest', 'Longest streak')}
              </span>
            </div>
            <span className="text-sm font-bold text-yellow-800">
              {longestStreak} {t('streak.days', 'days')}
            </span>
          </div>
        )}
      </div>

      {/* Motivational Section */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-200">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-primary-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-primary-900 mb-1">
              {streak === 0 
                ? t('streak.startMotivation', 'Ready to start your streak?')
                : t('streak.keepGoing', 'Keep the momentum going!')
              }
            </h5>
            <p className="text-sm text-primary-700">
              {streak === 0 
                ? t('streak.startTip', 'Just 5 minutes of study counts!')
                : t('streak.continueTip', 'Study a little bit each day to maintain your streak')
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudyStreak
