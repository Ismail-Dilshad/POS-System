import api from '../../lib/axios';

const STORAGE_KEY = 'pos_visibility_sync_timestamp';
const EVENT_NAME = 'pos-visibility-sync-changed';
const API_PATH = '/pos/visibility-sync';
const POLL_INTERVAL_MS = 2000;

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const parseStoredValue = (value: string | null): number => {
    if (value === null) {
        return 0;
    }

    try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'number') {
            return parsed;
        }
    } catch {
        // Ignore JSON parse errors and fallback to number parse
    }

    return parseInt(value, 10) || 0;
};

const toStorageValue = (timestamp: number): string => JSON.stringify(timestamp);

let lastKnownValue: number | null = null;
let pollTimer: number | null = null;
const subscribers = new Set<(timestamp: number) => void>();
let syncPromise: Promise<number> | null = null;

const getStoredValue = (): number => {
    if (!isBrowser()) {
        return lastKnownValue ?? 0;
    }

    try {
        const storedValue = window.localStorage.getItem(STORAGE_KEY);
        return parseStoredValue(storedValue);
    } catch {
        return lastKnownValue ?? 0;
    }
};

const notifySubscribers = (timestamp: number) => {
    subscribers.forEach((callback) => {
        try {
            callback(timestamp);
        } catch (error) {
            console.error('posVisibilitySyncService subscriber failed', error);
        }
    });
};

const commitValue = (
    timestamp: number,
    { persist = true, broadcast = true }: { persist?: boolean; broadcast?: boolean } = {},
) => {
    const valueChanged = lastKnownValue !== timestamp;
    lastKnownValue = timestamp;

    if (persist && isBrowser()) {
        try {
            window.localStorage.setItem(STORAGE_KEY, toStorageValue(timestamp));
        } catch {
            // Ignore persistence errors
        }
    }

    if (broadcast && valueChanged && isBrowser()) {
        const event = new CustomEvent<number>(EVENT_NAME, {
            detail: timestamp,
        });
        window.dispatchEvent(event);
    }

    if (valueChanged) {
        notifySubscribers(timestamp);
    }
};

const fetchServerValue = async (): Promise<number | null> => {
    try {
        const response = await api.get(API_PATH);
        const serverValue = response.data?.timestamp;
        if (typeof serverValue === 'number') {
            return serverValue;
        }
    } catch (error) {
        console.error('Failed to fetch POS visibility timestamp from server', error);
    }

    return null;
};

const syncFromServerInternal = async (): Promise<number> => {
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
    getTimestamp(): number {
        if (lastKnownValue !== null) {
            return lastKnownValue;
        }

        const value = getStoredValue();
        lastKnownValue = value;
        return value;
    },
    async syncFromServer(): Promise<number> {
        if (syncPromise) {
            return syncPromise;
        }

        syncPromise = syncFromServerInternal()
            .catch((error) => {
                console.error('Failed to synchronise POS visibility', error);
                return service.getTimestamp();
            })
            .finally(() => {
                syncPromise = null;
            });

        return syncPromise;
    },
    async notifyChange() {
        const timestamp = Date.now();
        commitValue(timestamp, { persist: true, broadcast: true });

        try {
            await api.post(API_PATH);
        } catch (error) {
            console.error('Failed to notify POS visibility change', error);
            await service.syncFromServer();
        }
    },
    subscribe(callback: (timestamp: number) => void) {
        if (!isBrowser()) {
            return () => undefined;
        }

        subscribers.add(callback);
        ensurePolling();
        service.syncFromServer().catch(() => undefined);

        const customEventHandler = (event: Event) => {
            const customEvent = event as CustomEvent<number>;
            const value = Number(customEvent.detail);
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
        callback(service.getTimestamp());

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

export const posVisibilitySyncService = service;
