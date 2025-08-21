import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import { dashboardApi } from '../services/dashboard'
import Header from '../components/common/Header'
import ProgressChart from '../components/dashboard/ProgressChart'
import WeakAreas from '../components/dashboard/WeakAreas'
import StudyStreak from '../components/dashboard/StudyStreak'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Target, 
  Calendar, 
  TrendingUp, 
  Award, 
  Brain,
  Clock,
  Trophy,
  Flame,
  Star
} from 'lucide-react'

function ProgressPage() {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState('overview')

  // Fetch comprehensive progress data
  const { data: progressData, isLoading } = useQuery(
    ['userProgress'],
    dashboardApi.getDashboardData,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  const { data: achievementsData } = useQuery(
    ['achievements'],
    dashboardApi.getAchievements,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  const { data: heatmapData } = useQuery(
    ['knowledgeHeatmap', 'year'],
    () => dashboardApi.getKnowledgeHeatmap('year'),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  )

  const tabs = [
    { id: 'overview', label: t('progress.tabs.overview', 'Overview'), icon: BarChart3 },
    { id: 'analytics', label: t('progress.tabs.analytics', 'Analytics'), icon: TrendingUp },
    { id: 'achievements', label: t('progress.tabs.achievements', 'Achievements'), icon: Trophy },
    { id: 'heatmap', label: t('progress.tabs.heatmap', 'Activity Heatmap'), icon: Calendar }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="large" message={t('progress.loading', 'Loading your progress...')} />
          </div>
        </div>
      </div>
    )
  }

  const stats = progressData?.dashboard?.stats || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <BarChart3 className="w-12 h-12 text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              {t('progress.title', 'Learning Progress')}
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            {t('progress.subtitle', 'Track your learning journey and identify areas for improvement')}
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.avgQuizScore || 0}%
            </div>
            <div className="text-sm text-gray-600">
              {t('progress.avgScore', 'Average Score')}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <Flame className="w-8 h-8 text-orange-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.studyStreak || 0}
            </div>
            <div className="text-sm text-gray-600">
              {t('progress.studyStreak', 'Day Streak')}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <Brain className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stats.totalFlashcards || 0}
            </div>
            <div className="text-sm text-gray-600">
              {t('progress.flashcards', 'Flashcards')}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {Math.round((stats.totalStudyTime || 0) / 60)}h
            </div>
            <div className="text-sm text-gray-600">
              {t('progress.studyTime', 'Study Time')}
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <div className="space-y-8">
                <ProgressChart />
                <div className="grid lg:grid-cols-2 gap-8">
                  <StudyStreak streak={stats.studyStreak} />
                  <WeakAreas />
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {selectedTab === 'analytics' && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('progress.performance', 'Performance Analysis')}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">
                            {t('progress.comprehension', 'Comprehension')}
                          </span>
                          <span className="text-sm font-medium">
                            {stats.avgQuizScore || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(stats.avgQuizScore || 0, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">
                            {t('progress.consistency', 'Study Consistency')}
                          </span>
                          <span className="text-sm font-medium">
                            {Math.min((stats.studyStreak || 0) * 10, 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((stats.studyStreak || 0) * 10, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-600">
                            {t('progress.retention', 'Knowledge Retention')}
                          </span>
                          <span className="text-sm font-medium">
                            {Math.round((stats.totalFlashcards || 0) / Math.max((stats.dueFlashcards || 0), 1) * 10)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(Math.round((stats.totalFlashcards || 0) / Math.max((stats.dueFlashcards || 0), 1) * 10), 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('progress.recommendations', 'Recommendations')}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-white rounded border">
                        <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {stats.avgQuizScore < 70 
                              ? t('progress.improveScores', 'Focus on improving quiz scores')
                              : t('progress.maintainScores', 'Excellent quiz performance!')
                            }
                          </p>
                          <p className="text-xs text-gray-600">
                            {stats.avgQuizScore < 70
                              ? t('progress.scoreAdvice', 'Review weak areas and practice more')
                              : t('progress.scorePraise', 'Keep up the great work!')
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white rounded border">
                        <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {stats.studyStreak < 3 
                              ? t('progress.buildStreak', 'Build a consistent study habit')
                              : t('progress.greatStreak', 'Amazing study streak!')
                            }
                          </p>
                          <p className="text-xs text-gray-600">
                            {stats.studyStreak < 3
                              ? t('progress.streakAdvice', 'Try to study a little bit every day')
                              : t('progress.streakPraise', 'Your consistency is paying off!')
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {selectedTab === 'achievements' && (
              <div>
                {achievementsData?.achievements ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {achievementsData.achievements.unlocked.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {achievement.title}
                            </h3>
                            <span className="text-xs text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">
                              {t(`achievements.category.${achievement.category}`, achievement.category)}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">
                          {achievement.description}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {t('achievements.empty', 'No achievements yet')}
                    </h3>
                    <p className="text-gray-600">
                      {t('achievements.emptyDesc', 'Keep studying to unlock achievements!')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Heatmap Tab */}
            {selectedTab === 'heatmap' && (
              <div>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('heatmap.title', 'Activity Heatmap')}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {t('heatmap.description', 'Visual representation of your study activity over time')}
                  </p>
                  
                  {/* Placeholder for heatmap visualization */}
                  <div className="bg-gray-100 rounded-lg p-8 max-w-4xl mx-auto">
                    <p className="text-gray-500">
                      {t('heatmap.placeholder', 'Heatmap visualization will be displayed here')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProgressPage
