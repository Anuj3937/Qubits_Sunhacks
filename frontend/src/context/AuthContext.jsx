import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/auth'
import { toast } from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const userData = await authApi.getProfile()
          setUser(userData.user)
        } catch (error) {
          localStorage.removeItem('token')
          console.error('Auth initialization error:', error)
        }
      }
      setInitialized(true)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await authApi.login({ email, password })
      
      localStorage.setItem('token', response.token)
      setUser(response.user)
      
      toast.success(`Welcome back, ${response.user.name}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    setLoading(true)
    try {
      const response = await authApi.register(userData)
      
      localStorage.setItem('token', response.token)
      setUser(response.user)
      
      toast.success(`Welcome to StudyGenie, ${response.user.name}!`)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateProfile = async (profileData) => {
    setLoading(true)
    try {
      const response = await authApi.updateProfile(profileData)
      setUser(response.user)
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed'
      toast.error(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    initialized,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
