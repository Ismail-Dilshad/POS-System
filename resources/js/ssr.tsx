import type { PageProps } from '@inertiajs/core';
import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType, ReactElement } from 'react';
import ReactDOMServer from 'react-dom/server';
import en from './i18n/locales/en.json';

const fallbackAppName = (en.auth_layout?.market_system as string) || 'Ali Network POS';
const appName = import.meta.env.VITE_APP_DISPLAY_NAME || fallbackAppName;

createServer(async (page) => {
    return createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title: string) => (title ? `${title} - ${appName}` : appName),
        resolve: (name: string) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            ),
        setup: ({
            App,
            props,
        }: {
            App: ComponentType<PageProps>;
            props: PageProps;
        }): ReactElement => <App {...props} />,
    });
});
