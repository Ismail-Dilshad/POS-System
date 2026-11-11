import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { useTranslation } from '@/hooks/use-translation';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();
    const { t } = useTranslation();

    const toggleTheme = () => {
        updateAppearance(appearance === 'light' ? 'dark' : 'light');
    };

    const isDark = appearance === 'dark';

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={`h-8 w-8 cursor-pointer rounded-full border p-0 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 ${
                isDark
                    ? 'border-purple-400/40 bg-purple-500/20 text-purple-100 hover:border-purple-400/60 hover:bg-purple-500/30'
                    : 'border-purple-500/30 bg-purple-500/10 text-purple-700 hover:border-purple-500/50 hover:bg-purple-500/20'
            }`}
            title={isDark ? t('user.theme.light') : t('user.theme.dark')}
        >
            <span className="sr-only">
                {isDark ? t('user.theme.light') : t('user.theme.dark')}
            </span>
            {isDark ? (
                <Sun className="h-4 w-4" />
            ) : (
                <Moon className="h-4 w-4" />
            )}
        </Button>
    );
}
