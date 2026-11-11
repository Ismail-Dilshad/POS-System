import { useTranslation } from '@/hooks/use-translation';

export default function AppLogo() {
    const { t } = useTranslation();

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-[#1F3F3F] shadow-lg">
                <img 
                    src="/favicon.svg" 
                    alt={t('auth_layout.logo_alt')} 
                    className="h-5 w-5"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {t('auth_layout.market_system')}
                </span>
            </div>
        </>
    );
}
