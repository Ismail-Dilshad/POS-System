import { portalPath } from '@/lib/portal';
import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';

interface LogoutOptions {
    onAfter?: () => void;
}

type LogoutVisitOptions = {
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
    replace?: boolean;
    preserveScroll?: boolean;
    preserveState?: boolean;
    onFinish?: () => void;
    onSuccess?: () => void;
    onCancel?: () => void;
    onError?: () => void;
};

type InertiaRouter = {
    visit: (url: string, options: LogoutVisitOptions) => void;
};

export function useLogout() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const inertiaRouter = router as unknown as InertiaRouter;

    const submitLogout = useCallback(
        (options?: LogoutOptions) => {
            if (isLoggingOut) {
                return;
            }

            setIsLoggingOut(true);

            inertiaRouter.visit(portalPath('logout'), {
                method: 'post',
                replace: true,
                preserveScroll: false,
                preserveState: false,
                onFinish: () => {
                    setIsLoggingOut(false);
                    options?.onAfter?.();
                },
            });
        },
        [inertiaRouter, isLoggingOut],
    );

    return { submitLogout, isLoggingOut };
}
