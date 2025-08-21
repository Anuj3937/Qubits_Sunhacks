import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  FileText, 
  Trophy, 
  Brain, 
  TrendingUp, 
  Clock,
  Target,
  Award
} from 'lucide-react'
import { motion } from 'framer-motion'

function DashboardStats({ stats }) {
  const { t } = useTranslation()

  const statCards = [
    {
      id: 'materials',
      title: t('dashboard.stats.totalMaterials', 'Study Materials'),
      value: stats.totalMaterials || 0,
      change: stats.completedMaterials ? `${stats.completedMaterials} completed` : null,
      icon: <FileText className="w-6 h-6" />,
      color: 'blue',
      link: '/upload'
    },
    {
      id: 'quizScore',
      title: t('dashboard.stats.avgQuizScore', 'Average Quiz Score'),
      value: stats.avgQuizScore ? `${stats.avgQuizScore}%` : '0%',
      change: stats.bestQuizScore ? `Best: ${stats.bestQuizScore}%` : null,
      icon: <Trophy className="w-6 h-6" />,
      color: 'green',
      link: '/progress'
    },
    {
      id: 'streak',
      title: t('dashboard.stats.studyStreak', 'Study Streak'),
      value: stats.studyStreak || 0,
      change: stats.studyStreak > 0 ? t('dashboard.keepItUp', 'Keep it up!') : t('dashboard.startToday', 'Start today!'),
      icon: <Award className="w-6 h-6" />,
      color: 'orange',
      link: '/progress'
    },
    {
      id: 'flashcards',
      title: t('dashboard.stats.dueFlashcards', 'Due Flashcards'),
      value: stats.dueFlashcards || 0,
      change: stats.totalFlashcards ? `${stats.totalFlashcards} total` : null,
      icon: <Brain className="w-6 h-6" />,
      color: 'purple',
      link: '/flashcards'
    }
  ]

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        border: 'border-blue-200',
        hover: 'hover:border-blue-300'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        border: 'border-green-200',
        hover: 'hover:border-green-300'
      },
      orange: {
        bg: 'bg-orange-50',
        icon: 'text-orange-600',
        border: 'border-orange-200',
        hover: 'hover:border-orange-300'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        border: 'border-purple-200',
        hover: 'hover:border-purple-300'
      }
    }
    return colorMap[color] || colorMap.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const colors = getColorClasses(card.color)
        
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link
              to={card.link}
              className={`block p-6 bg-white rounded-lg border-2 transition-all duration-200 ${colors.border} ${colors.hover} hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <div className={colors.icon}>
                        {card.icon}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      {card.title}
                    </p>
                    {card.change && (
                      <p className="text-xs text-gray-500">
                        {card.change}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

export default DashboardStats
