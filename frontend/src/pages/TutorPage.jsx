import React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import { uploadApi } from '../services/upload'
import Header from '../components/common/Header'
import AITutor from '../components/tutor/AITutor'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { motion } from 'framer-motion'
import { MessageCircle, Brain, Sparkles, BookOpen } from 'lucide-react'

function TutorPage() {
  const { materialId } = useParams()
  const { t } = useTranslation()

  // Get material info
  const { data: materialData, isLoading } = useQuery(
    ['material', materialId],
    () => uploadApi.getMaterialInfo?.(materialId),
    {
      enabled: !!materialId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }
  )

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: t('tutor.features.contextual.title', 'Contextual Understanding'),
      description: t('tutor.features.contextual.desc', 'I understand your specific study material and can answer questions based on its content')
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: t('tutor.features.multilingual.title', 'Multilingual Support'),
      description: t('tutor.features.multilingual.desc', 'Ask questions and receive answers in your preferred language')
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: t('tutor.features.adaptive.title', 'Adaptive Complexity'),
      description: t('tutor.features.adaptive.desc', 'Explanations adapt to your chosen complexity level from simple to advanced')
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="large" message={t('tutor.loadingMaterial', 'Loading study material...')} />
          </div>
        </div>
      </div>
    )
  }

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
            <MessageCircle className="w-12 h-12 text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              {t('tutor.pageTitle', 'AI Tutor')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {materialData?.material?.fileName 
              ? t('tutor.pageSubtitleWithMaterial', 'Get personalized help with {{material}}', { 
                  material: materialData.material.fileName 
                })
              : t('tutor.pageSubtitle', 'Your personal AI assistant for understanding study materials')
            }
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-primary-600 mb-4 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* AI Tutor Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AITutor 
            materialId={materialId} 
            materialName={materialData?.material?.fileName}
          />
        </motion.div>

        {/* Usage Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            {t('tutor.tips.title', 'Tips for Better Conversations')}
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm">
                {t('tutor.tips.specific', 'Ask specific questions about concepts you don\'t understand')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm">
                {t('tutor.tips.examples', 'Request examples or real-world applications')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm">
                {t('tutor.tips.clarify', 'Ask for clarification if an answer is too complex or too simple')}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm">
                {t('tutor.tips.language', 'Switch languages anytime using the language selector')}
              </span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}

export default TutorPage
