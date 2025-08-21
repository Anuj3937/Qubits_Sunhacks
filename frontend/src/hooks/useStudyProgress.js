import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { dashboardApi } from '../services/dashboard'

export function useStudyProgress(materialId) {
  const [progress, setProgress] = useState({
    quizzesTaken: 0,
    flashcardsReviewed: 0,
    averageScore: 0,
    studyTime: 0,
    lastActivity: null
  })

  const { data: progressData, isLoading, error } = useQuery(
    ['materialProgress', materialId],
    () => dashboardApi.getMaterialProgress?.(materialId),
    {
      enabled: !!materialId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )

  useEffect(() => {
    if (progressData) {
      setProgress(progressData.progress || progress)
    }
  }, [progressData])

  const updateProgress = (newProgress) => {
    setProgress(prev => ({ ...prev, ...newProgress }))
  }

  return {
    progress,
    updateProgress,
    isLoading,
    error
  }
}
