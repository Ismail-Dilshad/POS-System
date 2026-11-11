import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import ku from './locales/ku.json';

// Initialize language from localStorage
const initializeLanguage = () => {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && ['ku', 'en'].includes(savedLanguage)) {
        return savedLanguage;
    }
    return 'ku'; // Default to Kurdish
};

const resources = {
    en: {
        translation: en,
    },
    ku: {
        translation: ku,
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
    resources,
    lng: initializeLanguage(), // Initialize from localStorage
    fallbackLng: 'en',
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false, // React already does escaping
        },

        detection: {
            order: ['localStorage', 'htmlTag'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },
    });

export default i18n;
