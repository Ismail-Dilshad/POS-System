import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

const languages = [
    { code: 'en', name: 'English', label: 'EN' },
    { code: 'ku', name: 'Kurdî', label: 'KU' },
];

export function LanguageToggle() {
    const { getCurrentLanguage, changeLanguage } = useTranslation();
    const currentLang = getCurrentLanguage() || 'ku';

    const toggleLanguage = () => {
        const currentIndex = languages.findIndex(
            (lang) => lang.code === currentLang,
        );
        const nextIndex = (currentIndex + 1) % languages.length;
        changeLanguage(languages[nextIndex].code);
    };

    const currentLanguage =
        languages.find((lang) => lang.code === currentLang) || languages[0];

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-xs font-bold uppercase tracking-wide text-rose-600 transition-all duration-300 hover:border-rose-500/50 hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 dark:border-rose-400/40 dark:bg-rose-500/20 dark:text-rose-100 dark:hover:border-rose-400/60 dark:hover:bg-rose-500/30"
            title={currentLanguage.name}
        >
            {currentLanguage.label}
        </Button>
    );
}
