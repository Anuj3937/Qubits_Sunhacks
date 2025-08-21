import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowLeft } from 'lucide-react'
import LoginForm from '../components/auth/LoginForm'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

function LoginPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">{t('common.back', 'Back to home')}</span>
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-6">
            <BookOpen className="w-10 h-10 text-primary-600" />
            <span className="text-3xl font-bold text-gray-900">StudyGenie</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('auth.welcomeBack', 'Welcome back!')}
          </h2>
          <p className="text-gray-600">
            {t('auth.loginSubtitle', 'Sign in to continue your learning journey')}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          {t('auth.loginFooter', 'Secure login powered by StudyGenie')}
        </p>
      </div>
    </div>
  )
}

export default LoginPage
