import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  Upload, 
  FileText, 
  Brain, 
  MessageCircle, 
  BarChart3, 
  Plus,
  ArrowRight,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'

function QuickActions() {
  const { t } = useTranslation()

  const primaryActions = [
    {
      id: 'upload',
      title: t('dashboard.actions.uploadMaterial', 'Upload Material'),
      description: t('dashboard.actions.uploadDesc', 'Add PDFs, notes, or images to study'),
      icon: <Upload className="w-6 h-6" />,
      href: '/upload',
      color: 'primary',
      featured: true
    },
    {
      id: 'quiz',
      title: t('dashboard.actions.takeQuiz', 'Take Quiz'),
      description: t('dashboard.actions.quizDesc', 'Test your knowledge with AI-generated questions'),
      icon: <FileText className="w-6 h-6" />,
      href: '/quiz',
      color: 'green',
      featured: true
    }
  ]

  const secondaryActions = [
    {
      id: 'flashcards',
      title: t('dashboard.actions.reviewFlashcards', 'Review Flashcards'),
      description: t('dashboard.actions.flashcardsDesc', 'Practice with spaced repetition'),
      icon: <Brain className="w-5 h-5" />,
      href: '/flashcards',
      color: 'blue'
    },
    {
      id: 'tutor',
      title: t('dashboard.actions.askTutor', 'Ask AI Tutor'),
      description: t('dashboard.actions.tutorDesc', 'Get help with difficult concepts'),
      icon: <MessageCircle className="w-5 h-5" />,
      href: '/tutor',
      color: 'purple'
    },
    {
      id: 'progress',
      title: t('dashboard.actions.viewProgress', 'View Progress'),
      description: t('dashboard.actions.progressDesc', 'Track your learning analytics'),
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/progress',
      color: 'orange'
    }
  ]

  const getColorClasses = (color, isPrimary = false) => {
    const baseClasses = {
      primary: {
        bg: isPrimary ? 'bg-primary-600 hover:bg-primary-700' : 'bg-primary-50 hover:bg-primary-100',
        text: isPrimary ? 'text-white' : 'text-primary-700',
        border: 'border-primary-200',
        icon: isPrimary ? 'text-white' : 'text-primary-600'
      },
      green: {
        bg: isPrimary ? 'bg-green-600 hover:bg-green-700' : 'bg-green-50 hover:bg-green-100',
        text: isPrimary ? 'text-white' : 'text-green-700',
        border: 'border-green-200',
        icon: isPrimary ? 'text-white' : 'text-green-600'
      },
      blue: {
        bg: 'bg-blue-50 hover:bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: 'text-blue-600'
      },
      purple: {
        bg: 'bg-purple-50 hover:bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: 'text-purple-600'
      },
      orange: {
        bg: 'bg-orange-50 hover:bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200',
        icon: 'text-orange-600'
      }
    }
    return baseClasses[color] || baseClasses.primary
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-primary-600" />
        <h2 className="text-xl font-bold text-gray-900">
          {t('dashboard.quickActions', 'Quick Actions')}
        </h2>
      </div>

      {/* Primary Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {primaryActions.map((action, index) => {
          const colors = getColorClasses(action.color, true)
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={action.href}
                className={`block p-6 rounded-lg transition-all duration-200 ${colors.bg} group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`inline-flex p-2 rounded-lg mb-3 ${colors.icon === 'text-white' ? 'bg-white/20' : 'bg-white'}`}>
                      <div className={colors.icon}>
                        {action.icon}
                      </div>
                    </div>
                    
                    <h3 className={`text-lg font-semibold mb-2 ${colors.text}`}>
                      {action.title}
                    </h3>
                    
                    <p className={`text-sm ${colors.text} opacity-90 mb-4`}>
                      {action.description}
                    </p>
                  </div>
                  
                  <ArrowRight className={`w-5 h-5 ${colors.icon} group-hover:translate-x-1 transition-transform`} />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {secondaryActions.map((action, index) => {
          const colors = getColorClasses(action.color)
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
            >
              <Link
                to={action.href}
                className={`block p-4 rounded-lg border-2 transition-all duration-200 ${colors.bg} ${colors.border} group`}
              >
                <div className="flex items-center gap-3">
                  <div className={colors.icon}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium ${colors.text} group-hover:underline`}>
                      {action.title}
                    </h4>
                    <p className={`text-xs ${colors.text} opacity-75 truncate`}>
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${colors.icon} group-hover:translate-x-0.5 transition-transform`} />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default QuickActions
