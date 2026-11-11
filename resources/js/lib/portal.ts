export type Portal = 'admin' | 'cashier' | 'dataentry';

export function currentPortal(): Portal {
    if (typeof window === 'undefined') return 'admin';
    const prefix = window.location.pathname.split('/')[1];
    if (prefix === 'cashier') return 'cashier';
    if (prefix === 'data-entry') return 'dataentry';
    if (prefix === 'admin') return 'admin';
    const query = new URLSearchParams(window.location.search).get('portal');
    if (query === 'admin' || query === 'cashier' || query === 'dataentry') return query;
    const role = typeof document === 'undefined' ? null : document.querySelector('meta[name="portal"]')?.getAttribute('content');
    return role === 'cashier' || role === 'dataentry' ? role : 'admin';
}

export function portalPath(action: 'login' | 'logout'): string {
    const portal = currentPortal();
    return `/${portal === 'dataentry' ? 'data-entry' : portal}/${action}`;
}
