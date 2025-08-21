import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useQuery } from 'react-query'
import { dashboardApi } from '../services/dashboard'
import Header from '../components/common/Header'
import DashboardStats from '../components/dashboard/DashboardStats'
import QuickActions from '../components/dashboard/QuickActions'
import RecentActivity from '../components/dashboard/RecentActivity'
import StudyStreak from '../components/dashboard/StudyStreak'
import WeakAreas from '../components/dashboard/WeakAreas'
import ProgressChart from '../components/dashboard/ProgressChart'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { motion } from 'framer-motion'

function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const { data: dashboardData, isLoading, error } = useQuery(
    'dashboard',
    dashboardApi.getDashboardData,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="large" message={t('dashboard.loading', 'Loading your dashboard...')} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('dashboard.error', 'Unable to load dashboard')}
            </h2>
            <p className="text-gray-600 mb-4">
              {t('dashboard.errorMessage', 'Please refresh the page or try again later.')}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              {t('common.refresh', 'Refresh Page')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.dashboard?.stats || {}
  const recentActivity = dashboardData?.dashboard?.recentActivity || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcome', 'Welcome back, {{name}}!', { 
              name: user?.name?.split(' ')[0] || 'Student' 
            })}
          </h1>
          <p className="text-gray-600">
            {t('dashboard.subtitle', 'Here\'s your learning progress and study insights.')}
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <DashboardStats stats={stats} />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <QuickActions />
            </motion.div>

            {/* Progress Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ProgressChart />
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <RecentActivity activities={recentActivity} />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Study Streak */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <StudyStreak streak={stats.studyStreak || 0} />
            </motion.div>

            {/* Weak Areas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <WeakAreas />
            </motion.div>

            {/* Due Flashcards */}
            {recentActivity.dueFlashcards?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="card"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('dashboard.dueFlashcards', 'Due for Review')}
                </h3>
                <div className="space-y-2">
                  {recentActivity.dueFlashcards.slice(0, 3).map((card, index) => (
                    <div key={card.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {card.front}
                        </p>
                        <p className="text-xs text-gray-600">
                          {card.topic} • {card.materialName}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentActivity.dueFlashcards.length > 3 && (
                    <div className="text-center pt-2">
                      <button className="text-sm text-primary-600 hover:text-primary-500">
                        {t('dashboard.viewAllFlashcards', 'View all {{count}} due cards', { 
                          count: recentActivity.dueFlashcards.length 
                        })}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
