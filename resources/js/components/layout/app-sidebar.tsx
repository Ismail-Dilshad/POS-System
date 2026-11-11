import { NavMain } from '@/components/layout/nav-main';
import { NavUser } from '@/components/layout/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/use-translation';
import admin from '@/routes/admin';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    CreditCard,
    Minus,
    Package,
    PackageX,
    Printer,
    RotateCcw,
    Settings,
    ShoppingCart,
    TrendingUp,
    Truck,
    Users,
} from 'lucide-react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { t } = useTranslation();
    const page = usePage();
    const { auth } = (page.props as Record<string, unknown>) || {};
    const isAdmin =
        (auth as { user: { role: string } })?.user?.role === 'admin';

    const allNavItems: NavItem[] = [
        {
            title: t('navigation.point_of_sale'),
            href: admin.pointOfSale.url(),
            icon: CreditCard,
            component: 'admin/point-of-sale',
        },
        {
            title: t('navigation.inventory'),
            href: admin.inventory.url(),
            icon: Package,
            component: 'admin/inventory',
        },
        {
            title: t('navigation.purchase'),
            href: admin.purchases.url(),
            icon: ShoppingCart,
            component: 'admin/purchases',
        },
        {
            title: t('navigation.transactions'),
            href: admin.transactions.url(),
            icon: TrendingUp,
            component: 'admin/transactions',
        },
        {
            title: t('navigation.returns'),
            href: admin.returns.url(),
            icon: RotateCcw,
            component: 'admin/returns',
        },
        {
            title: t('navigation.expenses'),
            href: admin.expenses.url(),
            icon: Minus,
            component: 'admin/expenses',
        },
        {
            title: t('navigation.reports'),
            href: admin.reports.url(),
            icon: BarChart3,
            component: 'admin/reports',
        },
        {
            title: t('navigation.suppliers'),
            href: admin.suppliers.url(),
            icon: Truck,
            component: 'admin/suppliers',
        },
        {
            title: t('navigation.supplier_returns'),
            href: admin.supplierReturns.url(),
            icon: PackageX,
            component: 'admin/supplier-returns',
        },
        {
            title: t('navigation.users'),
            href: admin.users.url(),
            icon: Users,
            component: 'admin/users',
        },
        {
            title: t('navigation.print_barcode'),
            href: admin.printBarcode.url(),
            icon: Printer,
            component: 'admin/print-barcode',
        },
        {
            title: t('navigation.settings'),
            href: admin.settings.url(),
            icon: Settings,
            component: 'admin/settings',
        },
    ];

    // Filter navigation items based on user role
    const mainNavItems: NavItem[] = allNavItems.filter(() => {
        // Show all navigation items only for admin users
        return isAdmin;
    });

    return (
        <Sidebar collapsible="icon" variant="inset" className="overflow-visible">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-transparent hover:text-inherit data-[active=true]:bg-transparent data-[active=true]:text-inherit active:bg-transparent active:text-inherit">
                            <Link href={admin.pointOfSale.url()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="overflow-visible">
                <div className="h-px bg-gradient-to-r from-transparent via-[#4A6CF7]/30 to-transparent mb-2 shadow-lg"></div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
