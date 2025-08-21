import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

function SignupForm() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()
  const { register: authRegister, loading } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const password = watch('password')

  const onSubmit = async (data) => {
    const result = await authRegister({
      name: data.name,
      email: data.email,
      password: data.password,
      academicLevel: 'intermediate',
      preferredLanguage: 'English'
    })
    
    if (result.success) {
      navigate('/onboarding')
    }
  }

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: 'gray' }
    
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    strength = Object.values(checks).filter(Boolean).length
    
    if (strength <= 2) return { strength, text: 'Weak', color: 'red' }
    if (strength <= 3) return { strength, text: 'Fair', color: 'yellow' }
    if (strength <= 4) return { strength, text: 'Good', color: 'blue' }
    return { strength, text: 'Strong', color: 'green' }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.name', 'Full Name')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="name"
              {...register('name', {
                required: t('auth.nameRequired', 'Name is required'),
                minLength: {
                  value: 2,
                  message: t('auth.nameMinLength', 'Name must be at least 2 characters')
                },
                pattern: {
                  value: /^[a-zA-Z\s]+$/,
                  message: t('auth.namePattern', 'Name can only contain letters and spaces')
                }
              })}
              className={`input-field pl-10 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder={t('auth.namePlaceholder', 'John Doe')}
              disabled={loading}
            />
          </div>
          {errors.name && (
            <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.name.message}</span>
            </div>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.email', 'Email')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: t('auth.emailRequired', 'Email is required'),
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: t('auth.emailInvalid', 'Please enter a valid email')
                }
              })}
              className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          {errors.email && (
            <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.password', 'Password')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              {...register('password', {
                required: t('auth.passwordRequired', 'Password is required'),
                minLength: {
                  value: 8,
                  message: t('auth.passwordMinLength', 'Password must be at least 8 characters')
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: t('auth.passwordPattern', 'Password must contain uppercase, lowercase, and number')
                }
              })}
              className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 bg-${passwordStrength.color}-500`}
                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium text-${passwordStrength.color}-600`}>
                  {passwordStrength.text}
                </span>
              </div>
            </div>
          )}

          {errors.password && (
            <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.password.message}</span>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            {t('auth.confirmPassword', 'Confirm Password')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              {...register('confirmPassword', {
                required: t('auth.confirmPasswordRequired', 'Please confirm your password'),
                validate: value => value === password || t('auth.passwordMismatch', 'Passwords do not match')
              })}
              className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="••••••••"
              disabled={loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {!errors.confirmPassword && watch('confirmPassword') && password === watch('confirmPassword') && (
            <div className="flex items-center gap-1 mt-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>{t('auth.passwordMatch', 'Passwords match')}</span>
            </div>
          )}
          {errors.confirmPassword && (
            <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.confirmPassword.message}</span>
            </div>
          )}
        </div>

        {/* Terms and Privacy */}
        <div className="flex items-start gap-2">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            {...register('terms', {
              required: t('auth.termsRequired', 'Please accept the terms and conditions')
            })}
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            {t('auth.acceptTerms', 'I agree to the')} {' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
              {t('footer.terms', 'Terms of Service')}
            </Link>
            {' '} {t('auth.and', 'and')} {' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
              {t('footer.privacy', 'Privacy Policy')}
            </Link>
          </label>
        </div>
        {errors.terms && (
          <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{errors.terms.message}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {(loading || isSubmitting) ? (
            <>
              <LoadingSpinner size="small" />
              {t('common.loading', 'Loading...')}
            </>
          ) : (
            t('auth.createAccount', 'Create Account')
          )}
        </button>

        {/* Google OAuth Button */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t('auth.signupWithGoogle', 'Sign up with Google')}
        </button>

        {/* Sign In Link */}
        <div className="text-center">
          <span className="text-sm text-gray-600">
            {t('auth.alreadyHaveAccount', 'Already have an account?')} {' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {t('auth.login', 'Sign in')}
            </Link>
          </span>
        </div>
      </form>
    </div>
  )
}

export default SignupForm
