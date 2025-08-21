import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function LanguageSwitcher() {
  const { currentLanguage, supportedLanguages, changeLanguage, getCurrentLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode)
    setIsOpen(false)
  }

  const currentLang = getCurrentLanguage()

  // Group languages by region for better organization
  const groupedLanguages = supportedLanguages.reduce((acc, lang) => {
    const region = lang.region || 'Other'
    if (!acc[region]) acc[region] = []
    acc[region].push(lang)
    return acc
  }, {})

  // Sort regions with most common first
  const regionOrder = ['Global', 'India', 'Europe', 'Asia', 'Americas', 'Middle East/Africa', 'Other']

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentLang.nativeName}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto"
            >
              {regionOrder.map((region) => {
                if (!groupedLanguages[region]) return null
                
                return (
                  <div key={region} className="mb-2">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {region}
                    </div>
                    {groupedLanguages[region].map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                          currentLanguage === language.code ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            {language.nativeName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {language.name}
                          </span>
                        </div>
                        {currentLanguage === language.code && (
                          <Check className="w-4 h-4 text-primary-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )
              })}
              
              {/* Language count footer */}
              <div className="mt-2 pt-2 border-t border-gray-200 px-4 py-2">
                <p className="text-xs text-gray-500 text-center">
                  {supportedLanguages.length}+ languages supported
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSwitcher
