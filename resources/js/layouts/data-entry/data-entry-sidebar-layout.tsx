import { AppContent } from '@/components/layout/app-content';
import { AppShell } from '@/components/layout/app-shell';
import { DataEntrySidebar } from '@/components/layout/data-entry-sidebar';
import { AppSidebarHeader } from '@/components/layout/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function DataEntrySidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <DataEntrySidebar />
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
