import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowLeft } from 'lucide-react'
import SignupForm from '../components/auth/SignupForm'
import LanguageSwitcher from '../components/common/LanguageSwitcher'

function SignupPage() {
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
            {t('auth.createAccount', 'Create your account')}
          </h2>
          <p className="text-gray-600">
            {t('auth.signupSubtitle', 'Join thousands of learners studying smarter with AI')}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <SignupForm />
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            {t('auth.whyJoin', 'Why join StudyGenie?')}
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              {t('auth.feature1', 'AI-generated flashcards and quizzes')}
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              {t('auth.feature2', '70+ languages supported')}
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              {t('auth.feature3', 'Personal AI tutor available 24/7')}
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
              {t('auth.feature4', 'Track your learning progress')}
            </li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          {t('auth.signupFooter', 'Free to start, no credit card required')}
        </p>
      </div>
    </div>
  )
}

export default SignupPage
