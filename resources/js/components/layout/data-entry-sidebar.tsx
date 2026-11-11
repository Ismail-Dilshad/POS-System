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
import dataEntry from '@/routes/data-entry';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Package,
    Printer,
    RotateCcw,
    ShoppingCart,
    Truck,
    CreditCard,
} from 'lucide-react';
import AppLogo from './app-logo';

export function DataEntrySidebar() {
    const { t } = useTranslation();

    const navItems: NavItem[] = [
        {
            title: t('navigation.point_of_sale'),
            href: dataEntry.pointOfSale.url(),
            icon: CreditCard,
            component: 'data-entry/point-of-sale',
        },
        {
            title: t('navigation.inventory'),
            href: dataEntry.inventory.url(),
            icon: Package,
            component: 'data-entry/inventory',
        },
        {
            title: t('navigation.purchase'),
            href: dataEntry.purchase.url(),
            icon: ShoppingCart,
            component: 'data-entry/purchase',
        },
        {
            title: t('navigation.suppliers'),
            href: dataEntry.suppliers.url(),
            icon: Truck,
            component: 'data-entry/suppliers',
        },
        {
            title: t('navigation.supplier_returns'),
            href: dataEntry.supplierReturn.url(),
            icon: RotateCcw,
            component: 'data-entry/supplier-return',
        },
        {
            title: t('navigation.print_barcode'),
            href: dataEntry.printBarcode.url(),
            icon: Printer,
            component: 'data-entry/print-barcode',
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="overflow-visible">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="hover:bg-transparent hover:text-inherit data-[active=true]:bg-transparent data-[active=true]:text-inherit active:bg-transparent active:text-inherit"
                        >
                            <Link href={dataEntry.pointOfSale.url()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter className="overflow-visible">
                <div className="mb-2 h-px bg-gradient-to-r from-transparent via-[#4A6CF7]/30 to-transparent shadow-lg"></div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
