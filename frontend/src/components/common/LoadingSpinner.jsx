import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

function LoadingSpinner({ size = 'medium', message, className = '' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const containerClasses = {
    small: 'gap-2',
    medium: 'gap-3',
    large: 'gap-4'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={`${sizeClasses[size]} text-primary-600`}
      >
        <BookOpen className="w-full h-full" />
      </motion.div>
      
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-gray-600 text-center ${
            size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
          }`}
        >
          {message}
          <span className="loading-dots">...</span>
        </motion.p>
      )}
    </div>
  )
}

// Full page loading component
export function FullPageLoader({ message = "Loading StudyGenie..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="large" message={message} />
      </div>
    </div>
  )
}

export default LoadingSpinner
