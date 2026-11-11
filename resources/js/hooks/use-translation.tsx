import { useTranslation as useI18nTranslation } from 'react-i18next';

export function initializeLanguage() {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && ['ku', 'en'].includes(savedLanguage)) {
        return savedLanguage;
    }
    return 'ku'; // Default to Kurdish
}

export function useTranslation() {
    const { t, i18n } = useI18nTranslation();

    const changeLanguage = (language: string) => {
        i18n.changeLanguage(language);
        // Ensure language is saved to localStorage
        localStorage.setItem('i18nextLng', language);
    };

    const getCurrentLanguage = () => {
        return i18n.language;
    };

    const getAvailableLanguages = () => {
        return Object.keys(i18n.options.resources || {});
    };

    return {
        t,
        changeLanguage,
        getCurrentLanguage,
        getAvailableLanguages,
        isReady: i18n.isInitialized,
    };
}
