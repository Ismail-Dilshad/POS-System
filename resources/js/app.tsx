import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './components/ui/toast';
import { TooltipProvider } from './components/ui/tooltip';
import { initializeTheme } from './hooks/use-appearance';
import './i18n';
import en from './i18n/locales/en.json';
// @ts-expect-error - PWA register is a virtual module
import { registerSW } from 'virtual:pwa-register';

const fallbackAppName = (en.auth_layout?.market_system as string) || 'Ali Network POS';
const appName = import.meta.env.VITE_APP_DISPLAY_NAME || fallbackAppName;

document.addEventListener('inertia:success', (event) => {
    const { page } = (event as CustomEvent<{ page: { props: Record<string, unknown> } }>).detail;
    const token = page.props.csrf_token;
    if (typeof token === 'string') document.querySelector('meta[name="csrf-token"]')?.setAttribute('content', token);
    const portal = page.props.portal_role;
    if (typeof portal === 'string') document.querySelector('meta[name="portal"]')?.setAttribute('content', portal);
});

createInertiaApp({
    title: (title: string) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name: string) => {
        // Lazy load pages based on route name for better code splitting
        const pages = import.meta.glob('./pages/**/*.tsx');

        // For admin pages, use more specific loading
        if (name.startsWith('admin/')) {
            if (name.includes('inventory') || name.includes('products')) {
                const { default: InventoryPage } = await import('./pages/admin/inventory');
                return InventoryPage;
            }
            if (name.includes('point-of-sale')) {
                const { default: PointOfSalePage } = await import('./pages/admin/point-of-sale');
                return PointOfSalePage;
            }
            if (name.includes('transactions')) {
                const { default: TransactionsPage } = await import('./pages/admin/transactions');
                return TransactionsPage;
            }
            if (name.includes('suppliers')) {
                const { default: SuppliersPage } = await import('./pages/admin/suppliers');
                return SuppliersPage;
            }
            if (name.includes('purchases')) {
                const { default: PurchasesPage } = await import('./pages/admin/purchases');
                return PurchasesPage;
            }
            if (name.includes('reports')) {
                const { default: ReportsPage } = await import('./pages/admin/reports');
                return ReportsPage;
            }
            if (name.includes('expenses')) {
                const { default: ExpensesPage } = await import('./pages/admin/expenses');
                return ExpensesPage;
            }
            if (name.includes('supplier-returns')) {
                const { default: SupplierReturnsPage } = await import('./pages/admin/supplier-returns');
                return SupplierReturnsPage;
            }
            if (name.includes('returns')) {
                const { default: ReturnsPage } = await import('./pages/admin/returns');
                return ReturnsPage;
            }
        }

        // For other pages, use the standard resolver
        return resolvePageComponent(
            `./pages/${name}.tsx`,
            pages,
        );
    },
    setup({
        el,
        App,
        props,
    }: {
        el: HTMLElement;
        App: React.ComponentType<unknown>;
        props: Record<string, unknown>;
    }) {
        const root = createRoot(el);

        root.render(
            <TooltipProvider>
                <ToastProvider>
                    <App {...props} />
                </ToastProvider>
            </TooltipProvider>,
        );
    },
    progress: {
        color: '#1F3F3F',
        delay: 250,
        includeCSS: true,
        showSpinner: true,
    },
    id: 'app',
});

// This will set light / dark mode on load...
initializeTheme();

// Register PWA service worker
registerSW({
    onNeedRefresh() {
        // You can show a toast notification here if needed
    },
    onOfflineReady() {
        // You can show a toast notification here if needed
    },
    onRegistered() {
        // Service worker registered successfully
    },
    onRegisterError(error: Error) {
        console.error('PWA: Service worker registration failed', error);
    }
});
