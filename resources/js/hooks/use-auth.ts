import { usePage } from '@inertiajs/react';
import { useCallback, useEffect } from 'react';

interface AuthUser {
    id: number;
    full_name: string;
    username: string;
    role: string;
    email: string;
}

export function useAuth() {
    const page = usePage();
    const { auth } = (page.props as Record<string, unknown>) || {};

    const authUser = (auth as { user?: AuthUser | null })?.user;

    useEffect(() => {
        // Validate auth state on mount
        if (!authUser) {
            // User not authenticated
        } else {
            // User authenticated
        }
    }, [authUser]);

    const isAuthenticated = useCallback(() => {
        return !!authUser;
    }, [authUser]);

    const hasRole = useCallback(
        (role: string) => {
            return authUser?.role === role;
        },
        [authUser],
    );

    const canPerformAction = useCallback(() => {
        if (!authUser) {
            return false;
        }
        return true;
    }, [authUser]);

    return {
        user: authUser,
        isAuthenticated: isAuthenticated(),
        hasRole,
        canPerformAction,
    };
}
