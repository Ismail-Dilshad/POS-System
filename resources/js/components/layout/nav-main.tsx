import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { preloadInertiaPage } from '@/lib/page-preloader';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const currentUrl = (page as { url?: string }).url || '';
    const { t, getCurrentLanguage } = useTranslation();
    const currentLanguage = getCurrentLanguage();
    const isKurdish = currentLanguage === 'ku';
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    const handlePrefetch = (component?: string) => {
        if (!component) {
            return;
        }

        preloadInertiaPage(component);
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>
                {t('navigation.platform')}
            </SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {isCollapsed ? (
                            <SimpleTooltip
                                content={item.title}
                                side="right"
                                delayDuration={0}
                            >
                                <SidebarMenuButton
                                    asChild
                                    isActive={currentUrl.startsWith(
                                        typeof item.href === 'string'
                                            ? item.href
                                            : item.href.url,
                                    )}
                                    className="data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#4A6CF7] data-[active=true]:to-[#F7A64A] data-[active=true]:text-white"
                                >
                                    <Link
                                        href={item.href}
                                        prefetch
                                        onMouseEnter={() =>
                                            handlePrefetch(item.component)
                                        }
                                        onFocus={() =>
                                            handlePrefetch(item.component)
                                        }
                                        onTouchStart={() =>
                                            handlePrefetch(item.component)
                                        }
                                    >
                                        {item.icon && <item.icon />}
                                        <span
                                            className={
                                                isKurdish ? 'text-base' : ''
                                            }
                                        >
                                            {item.title}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SimpleTooltip>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                isActive={currentUrl.startsWith(
                                    typeof item.href === 'string'
                                        ? item.href
                                        : item.href.url,
                                )}
                                className="data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#4A6CF7] data-[active=true]:to-[#F7A64A] data-[active=true]:text-white"
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    onMouseEnter={() =>
                                        handlePrefetch(item.component)
                                    }
                                    onFocus={() =>
                                        handlePrefetch(item.component)
                                    }
                                    onTouchStart={() =>
                                        handlePrefetch(item.component)
                                    }
                                >
                                    {item.icon && <item.icon />}
                                    <span
                                        className={isKurdish ? 'text-base' : ''}
                                    >
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
