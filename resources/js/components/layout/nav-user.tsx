import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { UserInfo } from '@/components/layout/user-info';
import { useLogout } from '@/hooks/use-logout';
import type { User } from '@/types';
import { usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

export function NavUser() {
    const page = usePage();
    const auth = (page.props as Record<string, unknown>).auth as
        | { user: User }
        | undefined;
    const { submitLogout, isLoggingOut } = useLogout();

    if (!auth?.user) return null;

    const handleLogout = () => {
        submitLogout();
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <div className="flex items-center justify-between gap-3 p-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2">
                    <UserInfo user={auth.user} showUsername={false} showRole={true} />
                    <SidebarMenuButton
                        size="sm"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="h-8 w-8 p-0 flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors duration-200"
                    >
                        <LogOut className="size-4" />
                    </SidebarMenuButton>
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
