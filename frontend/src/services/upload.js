import api from './api'

export const uploadApi = {
  uploadFile: (formData) => {
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for file upload
    })
  },

  getProcessingStatus: (materialId) => 
    api.get(`/upload/status/${materialId}`),

  getUserMaterials: (params = {}) => 
    api.get('/upload/materials', { params }),

  deleteMaterial: (materialId) => 
    api.delete(`/upload/materials/${materialId}`),

  downloadMaterial: (materialId) =>
    api.get(`/upload/materials/${materialId}/download`, {
      responseType: 'blob'
    })
}

export default uploadApi
