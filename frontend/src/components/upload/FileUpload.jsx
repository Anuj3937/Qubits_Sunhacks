import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { uploadApi } from '../../services/upload'
import { useTranslation } from 'react-i18next'
import { 
  CloudUpload, 
  FileText, 
  Image, 
  FileCheck, 
  AlertCircle, 
  X,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

function FileUpload({ onUploadSuccess }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [uploadQueue, setUploadQueue] = useState([])

  const uploadMutation = useMutation(uploadApi.uploadFile, {
    onSuccess: (data, variables) => {
      const fileId = variables.get('file').name
      setUploadQueue(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, status: 'completed', materialId: data.material.id }
            : item
        )
      )
      toast.success(t('upload.success', 'File uploaded successfully!'))
      queryClient.invalidateQueries(['materials'])
      onUploadSuccess?.(data)
    },
    onError: (error, variables) => {
      const fileId = variables.get('file').name
      setUploadQueue(prev => 
        prev.map(item => 
          item.id === fileId 
            ? { ...item, status: 'error', error: error.message }
            : item
        )
      )
      toast.error(t('upload.error', 'Upload failed. Please try again.'))
    }
  })

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      if (errors.find(e => e.code === 'file-too-large')) {
        toast.error(t('upload.fileTooLarge', 'File "{{name}}" exceeds 10MB limit', { name: file.name }))
      } else if (errors.find(e => e.code === 'file-invalid-type')) {
        toast.error(t('upload.invalidType', 'File "{{name}}" is not a supported format', { name: file.name }))
      }
    })

    // Process accepted files
    acceptedFiles.forEach(file => {
      const uploadItem = {
        id: file.name + Date.now(),
        file,
        name: file.name,
        size: file.size,
        status: 'uploading',
        progress: 0
      }

      setUploadQueue(prev => [...prev, uploadItem])

      // Create FormData and upload
      const formData = new FormData()
      formData.append('file', file)
      
      uploadMutation.mutate(formData)
    })
  }, [uploadMutation])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/gif': ['.gif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const removeFromQueue = (id) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id))
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <Image className="w-8 h-8" />
    }
    return <FileText className="w-8 h-8" />
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer 
          transition-all duration-300 hover:scale-[1.02]
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <motion.div
          animate={{ 
            y: isDragActive ? -10 : 0,
            scale: isDragActive ? 1.1 : 1
          }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <CloudUpload className={`
            mx-auto mb-6 w-20 h-20 transition-colors duration-300
            ${isDragActive ? 'text-primary-600' : 'text-gray-400'}
          `} />
        </motion.div>

        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">
            {isDragActive 
              ? t('upload.dropHere', 'Drop your files here')
              : t('upload.dragDrop', 'Drag and drop your study materials')
            }
          </h3>
          
          <p className="text-gray-600">
            {t('upload.orClick', 'or click to browse files from your computer')}
          </p>

          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>PDF, DOC, DOCX</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Image className="w-4 h-4" />
              <span>JPG, PNG, GIF</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>TXT</span>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            {t('upload.maxSize', 'Maximum file size: 10MB per file')}
          </p>
        </div>

        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-primary-600/10 rounded-xl flex items-center justify-center"
            >
              <div className="text-primary-600 text-xl font-semibold">
                {t('upload.dropToUpload', 'Drop to upload')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Upload Queue */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h4 className="text-lg font-semibold text-gray-900">
                {t('upload.uploadQueue', 'Upload Queue')} ({uploadQueue.length})
              </h4>
            </div>
            
            <div className="divide-y divide-gray-200">
              {uploadQueue.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="px-6 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* File Icon */}
                      <div className={`
                        p-2 rounded-lg
                        ${item.status === 'completed' ? 'text-green-600 bg-green-100' :
                          item.status === 'error' ? 'text-red-600 bg-red-100' :
                          'text-gray-600 bg-gray-100'
                        }
                      `}>
                        {item.status === 'uploading' && <Loader2 className="w-8 h-8 animate-spin" />}
                        {item.status === 'completed' && <CheckCircle className="w-8 h-8" />}
                        {item.status === 'error' && <AlertCircle className="w-8 h-8" />}
                        {item.status === 'pending' && getFileIcon(item.name)}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatFileSize(item.size)}
                          </p>
                          
                          {/* Status */}
                          <div className="flex items-center gap-1">
                            {item.status === 'uploading' && (
                              <span className="text-xs text-blue-600">
                                {t('upload.uploading', 'Uploading...')}
                              </span>
                            )}
                            {item.status === 'completed' && (
                              <span className="text-xs text-green-600">
                                {t('upload.completed', 'Upload complete')}
                              </span>
                            )}
                            {item.status === 'error' && (
                              <span className="text-xs text-red-600">
                                {t('upload.failed', 'Upload failed')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Error Message */}
                        {item.status === 'error' && item.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {item.error}
                          </p>
                        )}

                        {/* Success Message */}
                        {item.status === 'completed' && (
                          <p className="text-xs text-green-600 mt-1">
                            {t('upload.processingStarted', 'AI processing started - you\'ll be notified when ready')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {item.status === 'completed' && (
                        <button
                          onClick={() => window.location.href = `/study/${item.materialId}`}
                          className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full hover:bg-primary-200 transition-colors"
                        >
                          {t('upload.startStudying', 'Start Studying')}
                        </button>
                      )}
                      
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {item.status === 'uploading' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                          className="bg-primary-600 h-1 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileUpload
