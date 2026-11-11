import api from '@/lib/axios';

const STORAGE_KEY = 'pos_discount_visibility_enabled';
const EVENT_NAME = 'pos-discount-visibility-changed';
const API_PATH = '/pos/discount-visibility';
const POLL_INTERVAL_MS = 2000;

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const parseStoredValue = (value: string | null): boolean => {
    if (value === null) {
        return true;
    }

    try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'boolean') {
            return parsed;
        }
    } catch {
        // Ignore JSON parse errors and fallback to string compare
    }

    return value === 'true';
};

const toStorageValue = (enabled: boolean): string => JSON.stringify(enabled);

let lastKnownValue: boolean | null = null;
let pollTimer: number | null = null;
const subscribers = new Set<(enabled: boolean) => void>();
let syncPromise: Promise<boolean> | null = null;

const getStoredValue = (): boolean => {
    if (!isBrowser()) {
        return lastKnownValue ?? true;
    }

    try {
        const storedValue = window.localStorage.getItem(STORAGE_KEY);
        return parseStoredValue(storedValue);
    } catch {
        return lastKnownValue ?? true;
    }
};

const notifySubscribers = (enabled: boolean) => {
    subscribers.forEach((callback) => {
        try {
            callback(enabled);
        } catch (error) {
            console.error('discountVisibilityService subscriber failed', error);
        }
    });
};

const commitValue = (
    enabled: boolean,
    { persist = true, broadcast = true }: { persist?: boolean; broadcast?: boolean } = {},
) => {
    const valueChanged = lastKnownValue !== enabled;
    lastKnownValue = enabled;

    if (persist && isBrowser()) {
        try {
            window.localStorage.setItem(STORAGE_KEY, toStorageValue(enabled));
        } catch {
            // Ignore persistence errors
        }
    }

    if (broadcast && valueChanged && isBrowser()) {
        const event = new CustomEvent<boolean>(EVENT_NAME, {
            detail: enabled,
        });
        window.dispatchEvent(event);
    }

    if (valueChanged) {
        notifySubscribers(enabled);
    }
};

const fetchServerValue = async (): Promise<boolean | null> => {
    try {
        const response = await api.get(API_PATH);
        const serverValue = response.data?.enabled;
        if (typeof serverValue === 'boolean') {
            return serverValue;
        }
    } catch (error) {
        console.error('Failed to fetch discount visibility from server', error);
    }

    return null;
};

const syncFromServerInternal = async (): Promise<boolean> => {
    const serverValue = await fetchServerValue();
    if (serverValue === null) {
        const fallback = getStoredValue();
        commitValue(fallback, { persist: false, broadcast: false });
        return fallback;
    }

    commitValue(serverValue, { persist: true, broadcast: true });
    return serverValue;
};

const ensurePolling = () => {
    if (!isBrowser()) {
        return;
    }

    if (pollTimer !== null) {
        return;
    }

    pollTimer = window.setInterval(async () => {
        const serverValue = await fetchServerValue();
        if (serverValue === null) {
            return;
        }

        if (lastKnownValue !== serverValue) {
            commitValue(serverValue, { persist: true, broadcast: true });
        }
    }, POLL_INTERVAL_MS);
};

const stopPollingIfNeeded = () => {
    if (pollTimer === null) {
        return;
    }

    if (subscribers.size === 0) {
        window.clearInterval(pollTimer);
        pollTimer = null;
    }
};

const service = {
    getVisibility(): boolean {
        if (lastKnownValue !== null) {
            return lastKnownValue;
        }

        const value = getStoredValue();
        lastKnownValue = value;
        return value;
    },
    async syncFromServer(): Promise<boolean> {
        if (syncPromise) {
            return syncPromise;
        }

        syncPromise = syncFromServerInternal()
            .catch((error) => {
                console.error('Failed to synchronise discount visibility', error);
                return service.getVisibility();
            })
            .finally(() => {
                syncPromise = null;
            });

        return syncPromise;
    },
    async setVisibility(enabled: boolean) {
        commitValue(enabled, { persist: true, broadcast: true });

        try {
            await api.post(API_PATH, {
                enabled,
            });
        } catch (error) {
            console.error('Failed to persist discount visibility', error);
            await service.syncFromServer();
        }
    },
    subscribe(callback: (enabled: boolean) => void) {
        if (!isBrowser()) {
            return () => undefined;
        }

        subscribers.add(callback);
        ensurePolling();
        service.syncFromServer().catch(() => undefined);

        const customEventHandler = (event: Event) => {
            const customEvent = event as CustomEvent<boolean>;
            const value = Boolean(customEvent.detail);
            commitValue(value, { persist: true, broadcast: false });
        };

        const storageHandler = (event: StorageEvent) => {
            if (event.key === STORAGE_KEY) {
                const value = parseStoredValue(event.newValue);
                commitValue(value, { persist: false, broadcast: false });
            }
        };

        window.addEventListener(EVENT_NAME, customEventHandler as EventListener);
        window.addEventListener('storage', storageHandler);

        // Emit current value to new subscriber
        callback(service.getVisibility());

        return () => {
            window.removeEventListener(
                EVENT_NAME,
                customEventHandler as EventListener,
            );
            window.removeEventListener('storage', storageHandler);
            subscribers.delete(callback);
            stopPollingIfNeeded();
        };
    },
};

export const discountVisibilityService = service;
