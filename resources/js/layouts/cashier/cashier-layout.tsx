import { CashierHeader } from '@/components/layout/cashier-header';
import { AppShell } from '@/components/layout/app-shell';
import type { PropsWithChildren } from 'react';

export default function CashierLayout({ children }: PropsWithChildren) {
    return (
        <AppShell>
            <CashierHeader />
            <main className="flex h-full w-full flex-1 flex-col">
                {children}
            </main>
        </AppShell>
    );
}
