import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoadingSpinner from './components/common/LoadingSpinner'
import ErrorBoundary from './components/common/ErrorBoundary'

// Lazy load pages for better performance
const LandingPage = React.lazy(() => import('./pages/LandingPage'))
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const SignupPage = React.lazy(() => import('./pages/SignupPage'))
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage'))
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'))
const UploadPage = React.lazy(() => import('./pages/UploadPage'))
const StudyPage = React.lazy(() => import('./pages/StudyPage'))
const QuizPage = React.lazy(() => import('./pages/QuizPage'))
const FlashcardsPage = React.lazy(() => import('./pages/FlashcardsPage'))
const TutorPage = React.lazy(() => import('./pages/TutorPage'))
const ProgressPage = React.lazy(() => import('./pages/ProgressPage'))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'))

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return user ? children : <Navigate to="/login" replace />
}

// Public Route Component (redirects if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return !user ? children : <Navigate to="/dashboard" replace />
}

function App() {
  const { initialized } = useAuth()

  if (!initialized) {
    return <LoadingSpinner />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            
            {/* Protected Routes */}
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
            <Route path="/study/:materialId" element={<ProtectedRoute><StudyPage /></ProtectedRoute>} />
            <Route path="/quiz/:materialId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/flashcards/:materialId" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
            <Route path="/tutor/:materialId" element={<ProtectedRoute><TutorPage /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

export default App
