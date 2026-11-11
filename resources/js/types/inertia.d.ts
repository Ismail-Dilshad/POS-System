declare module '@inertiajs/react' {
    import { InertiaLinkProps } from '@inertiajs/react';
    import { FunctionComponent, Dispatch, SetStateAction } from 'react';

    interface InertiaHeadProps {
        title?: string;
        children?: React.ReactNode;
    }

    export const Head: FunctionComponent<InertiaHeadProps>;
    export const router: Record<string, unknown>;
    export const createInertiaApp: (config: Record<string, unknown>) => void;
    export const Form: React.ComponentType<Record<string, unknown>>;
    export const Link: React.ComponentType<InertiaLinkProps>;
    export const useForm: unknown;
    export const usePage: () => { props: Record<string, unknown> };
    export const usePoll: unknown;
    export const usePrefetch: unknown;
    export function useRemember<T>(
        initialValue: T,
        key?: string
    ): [T, Dispatch<SetStateAction<T>>];
    export const WhenVisible: unknown;
}
