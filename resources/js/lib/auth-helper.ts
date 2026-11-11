/**
 * Simplified authentication helper
 */
export class AuthHelper {
    private static instance: AuthHelper;
    private authReady: boolean = false;

    static getInstance(): AuthHelper {
        if (!AuthHelper.instance) {
            AuthHelper.instance = new AuthHelper();
        }
        return AuthHelper.instance;
    }

    /**
     * Check if user is currently authenticated (synchronous)
     */
    isAuthenticated(): boolean {
        const userMeta = document.head.querySelector('meta[name="auth-user"]');
        return userMeta !== null && userMeta.getAttribute('content') !== 'null';
    }

    /**
     * Wait for authentication state to be ready (simplified)
     */
    async waitForAuth(): Promise<boolean> {
        // If already authenticated, return immediately
        if (this.isAuthenticated()) {
            this.authReady = true;
            return true;
        }

        // If auth is already ready, return cached result
        if (this.authReady) {
            return true;
        }

        // Simple check - no complex timeout logic
        return new Promise((resolve) => {
            const checkAuth = () => {
                if (this.isAuthenticated()) {
                    this.authReady = true;
                    resolve(true);
                } else {
                    // Check again in next tick
                    setTimeout(checkAuth, 10);
                }
            };
            checkAuth();
        });
    }

    /**
     * Reset auth state (call after logout)
     */
    reset(): void {
        this.authReady = false;
    }
}

export const authHelper = AuthHelper.getInstance();
