import api from './api'

export const dashboardApi = {
  getDashboardData: () => api.get('/dashboard'),
  
  getStudyProgress: (period = 'month') => 
    api.get('/dashboard/progress', { params: { period } }),
    
  getProgressByPeriod: (period) => 
    api.get(`/dashboard/progress/${period}`),
    
  getStudyStreak: () => 
    api.get('/dashboard/streak'),
    
  getKnowledgeHeatmap: (period = 'year') => 
    api.get('/dashboard/heatmap', { params: { period } }),
    
  getWeakAreas: (params = {}) => 
    api.get('/dashboard/weak-areas', { params }),
    
  getTopicStats: () => 
    api.get('/dashboard/stats/topics'),
    
  getMaterialStats: () => 
    api.get('/dashboard/stats/materials'),
    
  getRecentActivity: (params = {}) => 
    api.get('/dashboard/activity', { params }),
    
  getAchievements: () => 
    api.get('/dashboard/achievements'),
    
  setStudyGoals: (goals) => 
    api.post('/dashboard/goals', goals),
    
  exportUserData: (params = {}) => 
    api.get('/dashboard/export', { params })
}

export default dashboardApi
