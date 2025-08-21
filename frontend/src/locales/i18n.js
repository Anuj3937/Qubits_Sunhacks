import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Translation files
import enTranslations from './en/translation.json'
import hiTranslations from './hi/translation.json'
import mrTranslations from './mr/translation.json'

const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations },
  mr: { translation: mrTranslations },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  })

export default i18n
