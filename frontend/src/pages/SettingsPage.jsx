import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../context/LanguageContext'
import Header from '../components/common/Header'
import { motion } from 'framer-motion'
import { 
  Settings, 
  User, 
  Globe, 
  Bell, 
  Shield, 
  Download,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

function SettingsPage() {
  const { t } = useTranslation()
  const { user, updateProfile } = useAuth()
  const { currentLanguage, supportedLanguages, changeLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    academicLevel: user?.academicLevel || 'intermediate',
    preferredLanguage: user?.preferredLanguage || 'English'
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    studyReminders: true,
    weeklyProgress: false,
    achievements: true
  })

  const tabs = [
    { id: 'profile', label: t('settings.profile', 'Profile'), icon: User },
    { id: 'language', label: t('settings.language', 'Language'), icon: Globe },
    { id: 'notifications', label: t('settings.notifications', 'Notifications'), icon: Bell },
    { id: 'privacy', label: t('settings.privacy', 'Privacy & Data'), icon: Shield }
  ]

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await updateProfile(profileData)
      if (result.success) {
        toast.success(t('settings.profileUpdated', 'Profile updated successfully'))
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error(t('settings.updateError', 'Failed to update profile'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode)
    const selectedLang = supportedLanguages.find(lang => lang.code === languageCode)
    setProfileData(prev => ({ ...prev, preferredLanguage: selectedLang?.name || 'English' }))
    toast.success(t('settings.languageChanged', 'Language changed successfully'))
  }

  const handleDataExport = () => {
    toast.success(t('settings.exportStarted', 'Data export started. You will receive an email when ready.'))
  }

  const handleAccountDelete = () => {
    if (window.confirm(t('settings.confirmDelete', 'Are you sure you want to delete your account? This action cannot be undone.'))) {
      toast.error(t('settings.deleteFeature', 'Account deletion feature will be available soon'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-10 h-10 text-primary-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('settings.title', 'Settings')}
              </h1>
              <p className="text-gray-600">
                {t('settings.subtitle', 'Manage your account and preferences')}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t('settings.profile', 'Profile Settings')}
                  </h2>
                  
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('auth.name', 'Full Name')}
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="input-field"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('auth.email', 'Email')}
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          className="input-field bg-gray-50"
                          disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {t('settings.emailNote', 'Email cannot be changed')}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('onboarding.academicLevel', 'Academic Level')}
                      </label>
                      <select
                        value={profileData.academicLevel}
                        onChange={(e) => setProfileData(prev => ({ ...prev, academicLevel: e.target.value }))}
                        className="input-field"
                      >
                        <option value="beginner">{t('onboarding.levels.beginner', 'Beginner')}</option>
                        <option value="intermediate">{t('onboarding.levels.intermediate', 'Intermediate')}</option>
                        <option value="advanced">{t('onboarding.levels.advanced', 'Advanced')}</option>
                        <option value="expert">{t('onboarding.levels.expert', 'Expert')}</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isLoading ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Language Tab */}
              {activeTab === 'language' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t('settings.language', 'Language Settings')}
                  </h2>
                  
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      {t('settings.languageDescription', 'Choose your preferred language for the interface and AI interactions')}
                    </p>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {supportedLanguages.map((language) => (
                        <button
                          key={language.code}
                          onClick={() => handleLanguageChange(language.code)}
                          className={`p-4 text-left rounded-lg border-2 transition-all ${
                            currentLanguage === language.code
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium">{language.nativeName}</div>
                          <div className="text-sm text-gray-500">{language.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t('settings.notifications', 'Notification Preferences')}
                  </h2>
                  
                  <div className="space-y-6">
                    {[
                      {
                        key: 'emailNotifications',
                        title: t('settings.emailNotifications', 'Email Notifications'),
                        description: t('settings.emailNotificationsDesc', 'Receive important updates via email')
                      },
                      {
                        key: 'studyReminders',
                        title: t('settings.studyReminders', 'Study Reminders'),
                        description: t('settings.studyRemindersDesc', 'Get reminded when it\'s time to study')
                      },
                      {
                        key: 'weeklyProgress',
                        title: t('settings.weeklyProgress', 'Weekly Progress Reports'),
                        description: t('settings.weeklyProgressDesc', 'Receive weekly summary of your progress')
                      },
                      {
                        key: 'achievements',
                        title: t('settings.achievements', 'Achievement Notifications'),
                        description: t('settings.achievementsDesc', 'Get notified when you unlock achievements')
                      }
                    ].map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{setting.title}</h3>
                          <p className="text-sm text-gray-600">{setting.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings[setting.key]}
                            onChange={(e) => setNotificationSettings(prev => ({
                              ...prev,
                              [setting.key]: e.target.checked
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {t('settings.privacy', 'Privacy & Data')}
                  </h2>
                  
                  <div className="space-y-8">
                    {/* Data Export */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <Download className="w-6 h-6 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {t('settings.exportData', 'Export Your Data')}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {t('settings.exportDescription', 'Download a copy of all your study data, including materials, progress, and statistics.')}
                          </p>
                          <button
                            onClick={handleDataExport}
                            className="btn-secondary flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            {t('settings.requestExport', 'Request Data Export')}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Account Deletion */}
                    <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {t('settings.deleteAccount', 'Delete Account')}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {t('settings.deleteDescription', 'Permanently delete your account and all associated data. This action cannot be undone.')}
                          </p>
                          <button
                            onClick={handleAccountDelete}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('settings.deleteAccountButton', 'Delete Account')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
