import { LanguageToggle } from '@/components/layout/language-toggle';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { useTranslation } from '@/hooks/use-translation';
import { type BreadcrumbItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs }: AppHeaderProps) {
    const page = usePage();
    const { auth } = (page.props as { auth?: { user?: Record<string, unknown> } }) ?? {};
    const getInitials = useInitials();
    const { t } = useTranslation();

    const user = auth?.user as
        | {
              full_name?: string;
              role?: string;
              avatar?: string;
          }
        | undefined;

    const marketName = t('auth_layout.market_system') || 'Ali Network POS';
    const displayName = user?.full_name ?? t('app_header.fallback_user');
    const roleLabel = user?.role
        ? t(`roles.${user.role}`, { defaultValue: user.role })
        : undefined;

    const homeHref = breadcrumbs?.[0]?.href ?? '/';

    return (
        <header className="bg-background shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_0_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3),0_1px_2px_0_rgba(0,0,0,0.2)]">
            <div className="mx-auto flex h-16 w-full items-center justify-between px-4 md:max-w-7xl">
                <Link
                    href={homeHref}
                    className="flex items-center gap-3 text-lg font-semibold text-foreground"
                >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <AppLogoIcon className="size-10" />
                    </span>
                    <span className="hidden sm:inline-block">{marketName}</span>
                </Link>

                <div className="flex items-center gap-3 sm:gap-4">
                    <LanguageToggle />
                    <ThemeToggle />
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-medium text-foreground">
                                {displayName}
                            </p>
                            {roleLabel && (
                                <p className="text-xs text-muted-foreground">
                                    {roleLabel}
                                </p>
                            )}
                        </div>
                        <Avatar className="size-10">
                            <AvatarImage src={user?.avatar ?? undefined} alt={displayName} />
                            <AvatarFallback className="bg-primary/10 text-sm font-semibold uppercase text-primary">
                                {getInitials(displayName)}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </header>
    );
}
