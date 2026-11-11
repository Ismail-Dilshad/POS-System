import DataEntryLayoutTemplate from '@/layouts/data-entry/data-entry-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface DataEntryLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function DataEntryLayout({
    children,
    breadcrumbs,
    ...props
}: DataEntryLayoutProps) {
    return (
        <DataEntryLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
        </DataEntryLayoutTemplate>
    );
}
