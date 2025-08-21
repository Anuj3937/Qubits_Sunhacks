import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { uploadApi } from '../../services/upload'
import { 
  FileText, 
  Image, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Play,
  Brain,
  FileQuestion,
  MessageCircle,
  MoreVertical,
  Trash2,
  Download
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

function MaterialsList({ materials = [] }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [showActions, setShowActions] = useState({})

  const deleteMutation = useMutation(uploadApi.deleteMaterial, {
    onSuccess: () => {
      toast.success(t('materials.deleted', 'Material deleted successfully'))
      queryClient.invalidateQueries(['materials'])
    },
    onError: () => {
      toast.error(t('materials.deleteError', 'Failed to delete material'))
    }
  })

  const getFileIcon = (fileName, fileType) => {
    if (fileType?.includes('image')) {
      return <Image className="w-8 h-8" />
    }
    return <FileText className="w-8 h-8" />
  }

  const getStatusIcon = (status) => {
    const iconMap = {
      'pending': <Clock className="w-5 h-5 text-yellow-600" />,
      'processing': <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />,
      'completed': <CheckCircle className="w-5 h-5 text-green-600" />,
      'failed': <AlertTriangle className="w-5 h-5 text-red-600" />
    }
    return iconMap[status] || <Clock className="w-5 h-5 text-gray-400" />
  }

  const getStatusText = (status) => {
    const textMap = {
      'pending': t('materials.status.pending', 'Pending'),
      'processing': t('materials.status.processing', 'Processing'),
      'completed': t('materials.status.completed', 'Ready'),
      'failed': t('materials.status.failed', 'Failed')
    }
    return textMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDelete = (materialId, materialName) => {
    if (window.confirm(t('materials.confirmDelete', 'Are you sure you want to delete "{{name}}"?', { name: materialName }))) {
      deleteMutation.mutate(materialId)
    }
  }

  const toggleActions = (materialId) => {
    setShowActions(prev => ({
      ...prev,
      [materialId]: !prev[materialId]
    }))
  }

  if (materials.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('materials.empty.title', 'No materials uploaded yet')}
        </h3>
        <p className="text-gray-600 mb-6">
          {t('materials.empty.description', 'Upload your first study material to get started with AI-powered learning')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('materials.title', 'Your Study Materials')} ({materials.length})
        </h3>
      </div>

      {/* Materials Grid */}
      <div className="p-6">
        <div className="grid gap-4">
          {materials.map((material, index) => (
            <motion.div
              key={material.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
                    {getFileIcon(material.fileName, material.fileType)}
                  </div>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {material.fileName}
                  </h4>
                  
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(material.fileSize)}
                    </span>
                    
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(material.uploadDate), { addSuffix: true })}
                    </span>

                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(material.processingStatus)}`}>
                      {getStatusIcon(material.processingStatus)}
                      {getStatusText(material.processingStatus)}
                    </span>
                  </div>

                  {/* Processing Message */}
                  {material.processingStatus === 'processing' && (
                    <p className="text-xs text-blue-600 mt-1">
                      {t('materials.processing', 'AI is analyzing your content...')}
                    </p>
                  )}
                  
                  {material.processingStatus === 'failed' && (
                    <p className="text-xs text-red-600 mt-1">
                      {t('materials.failed', 'Processing failed. Please try uploading again.')}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Study Actions */}
                {material.processingStatus === 'completed' && (
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/study/${material.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-100 rounded-md hover:bg-primary-200 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      {t('materials.study', 'Study')}
                    </Link>
                    
                    <Link
                      to={`/quiz/${material.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <FileQuestion className="w-3 h-3" />
                      {t('materials.quiz', 'Quiz')}
                    </Link>
                    
                    <Link
                      to={`/flashcards/${material.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
                    >
                      <Brain className="w-3 h-3" />
                      {t('materials.flashcards', 'Cards')}
                    </Link>
                    
                    <Link
                      to={`/tutor/${material.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      {t('materials.tutor', 'Tutor')}
                    </Link>
                  </div>
                )}

                {/* More Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => toggleActions(material.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showActions[material.id] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                      >
                        <button
                          onClick={() => {/* Handle download */}}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          {t('materials.download', 'Download')}
                        </button>
                        
                        <button
                          onClick={() => {
                            handleDelete(material.id, material.fileName)
                            setShowActions({})
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('materials.delete', 'Delete')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MaterialsList
