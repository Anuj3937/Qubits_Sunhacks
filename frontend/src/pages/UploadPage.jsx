import React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import { uploadApi } from '../services/upload'
import Header from '../components/common/Header'
import FileUpload from '../components/upload/FileUpload'
import ProcessingStatus from '../components/upload/ProcessingStatus'
import MaterialsList from '../components/upload/MaterialsList'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { motion } from 'framer-motion'
import { Upload, FileText, Brain, MessageCircle } from 'lucide-react'

function UploadPage() {
  const { t } = useTranslation()

  const { data: materialsData, isLoading, refetch } = useQuery(
    ['materials'],
    uploadApi.getUserMaterials,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  const handleUploadSuccess = () => {
    refetch()
  }

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: t('upload.features.ocr.title', 'Smart Text Extraction'),
      description: t('upload.features.ocr.desc', 'AI extracts text from PDFs, images, and handwritten notes')
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: t('upload.features.analysis.title', 'Content Analysis'),
      description: t('upload.features.analysis.desc', 'Automatic generation of summaries, key topics, and concepts')
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: t('upload.features.multilingual.title', 'Multilingual Support'),
      description: t('upload.features.multilingual.desc', 'Process materials in 70+ languages automatically')
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Upload className="w-10 h-10 text-primary-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              {t('upload.title', 'Upload Study Materials')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('upload.subtitle', 'Upload your PDFs, notes, images, or documents. Our AI will extract content and create personalized study tools for you.')}
          </p>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
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

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </motion.div>

        {/* Materials List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" message={t('upload.loadingMaterials', 'Loading your materials...')} />
            </div>
          ) : (
            <MaterialsList materials={materialsData?.materials || []} />
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default UploadPage
