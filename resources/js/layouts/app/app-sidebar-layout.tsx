import { AppContent } from '@/components/layout/app-content';
import { AppShell } from '@/components/layout/app-shell';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { DataEntrySidebar } from '@/components/layout/data-entry-sidebar';
import { AppSidebarHeader } from '@/components/layout/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const page = usePage();
    const currentUrl = (page as { url?: string }).url || '';
    const isDataEntryRoute = currentUrl.startsWith('/data-entry');
    
    return (
        <AppShell variant="sidebar">
            {isDataEntryRoute ? <DataEntrySidebar /> : <AppSidebar />}
            <AppContent
                variant="sidebar"
                className="flex h-screen flex-col overflow-hidden"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1 overflow-y-auto">{children}</div>
            </AppContent>
        </AppShell>
    );
}
