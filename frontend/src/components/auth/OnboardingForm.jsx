import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../context/LanguageContext'
import { useTranslation } from 'react-i18next'
import { Calendar, GraduationCap, Globe, ArrowRight, Skip } from 'lucide-react'
import LoadingSpinner from '../common/LoadingSpinner'

function OnboardingForm() {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      academicLevel: 'intermediate',
      preferredLanguage: 'English'
    }
  })
  const { updateProfile, user } = useAuth()
  const { supportedLanguages, changeLanguage } = useLanguage()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const totalSteps = 3
  const watchedLanguage = watch('preferredLanguage')

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // Update user profile with onboarding data
      const result = await updateProfile({
        name: user.name,
        academicLevel: data.academicLevel,
        preferredLanguage: data.preferredLanguage,
        birthDate: data.birthDate
      })

      if (result.success) {
        // Change app language to user's preference
        const selectedLanguage = supportedLanguages.find(
          lang => lang.name === data.preferredLanguage
        )
        if (selectedLanguage) {
          changeLanguage(selectedLanguage.code)
        }

        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const academicLevels = [
    {
      value: 'beginner',
      label: t('onboarding.levels.beginner', 'Beginner'),
      description: t('onboarding.levels.beginnerDesc', 'Just starting your educational journey')
    },
    {
      value: 'intermediate',
      label: t('onboarding.levels.intermediate', 'Intermediate'),
      description: t('onboarding.levels.intermediateDesc', 'Building on foundational knowledge')
    },
    {
      value: 'advanced',
      label: t('onboarding.levels.advanced', 'Advanced'),
      description: t('onboarding.levels.advancedDesc', 'Pursuing specialized or higher education')
    },
    {
      value: 'expert',
      label: t('onboarding.levels.expert', 'Expert'),
      description: t('onboarding.levels.expertDesc', 'Graduate studies or professional development')
    }
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {t('onboarding.step', 'Step {{current}} of {{total}}', { current: currentStep, total: totalSteps })}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Academic Level */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <GraduationCap className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('onboarding.academicLevel.title', 'What\'s your academic level?')}
              </h2>
              <p className="text-gray-600">
                {t('onboarding.academicLevel.subtitle', 'This helps us personalize your study experience')}
              </p>
            </div>

            <div className="grid gap-4">
              {academicLevels.map((level) => (
                <label
                  key={level.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 hover:bg-gray-50 transition-colors ${
                    watch('academicLevel') === level.value
                      ? 'border-primary-600 ring-2 ring-primary-600 bg-primary-50'
                      : 'border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('academicLevel', { required: true })}
                    value={level.value}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        {level.label}
                      </h3>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          watch('academicLevel') === level.value
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {watch('academicLevel') === level.value && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {level.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Preferred Language */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <Globe className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('onboarding.language.title', 'Choose your preferred language')}
              </h2>
              <p className="text-gray-600">
                {t('onboarding.language.subtitle', 'StudyGenie supports 70+ languages for better learning')}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {supportedLanguages.map((language) => (
                <label
                  key={language.code}
                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    watchedLanguage === language.name ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      {...register('preferredLanguage', { required: true })}
                      value={language.name}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        watchedLanguage === language.name
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {watchedLanguage === language.name && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">
                        {language.nativeName}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({language.name})
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Birth Date (Optional) */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('onboarding.birthDate.title', 'When were you born?')}
              </h2>
              <p className="text-gray-600">
                {t('onboarding.birthDate.subtitle', 'This helps us recommend age-appropriate content (optional)')}
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                {t('onboarding.birthDate', 'Date of Birth')}
              </label>
              <input
                type="date"
                id="birthDate"
                {...register('birthDate')}
                className="input-field"
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-gray-500 mt-2">
                {t('onboarding.birthDate.privacy', 'Your birth date is kept private and used only for content personalization')}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-12">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary flex items-center gap-2"
              >
                {t('common.back', 'Back')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkip}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Skip className="w-4 h-4" />
                {t('onboarding.skip', 'Skip for now')}
              </button>
            )}
          </div>

          <div>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex items-center gap-2"
              >
                {t('common.next', 'Next')}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="small" />
                    {t('common.loading', 'Loading...')}
                  </>
                ) : (
                  <>
                    {t('onboarding.complete', 'Complete Setup')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default OnboardingForm
