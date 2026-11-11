const pageModules = import.meta.glob('@/pages/**/*.tsx');

const loaders = new Map<string, () => Promise<unknown>>();
const preloaded = new Set<string>();

for (const [path, loader] of Object.entries(pageModules)) {
    const normalized = path
        .replace('@/pages/', '')
        .replace(/\.(tsx?)$/, '')
        .replace(/index$/, '');

    loaders.set(normalized, loader as () => Promise<unknown>);
}

export function preloadInertiaPage(name?: string) {
    if (!name) {
        return;
    }

    const normalized = name.replace(/\.(tsx?)$/, '');

    if (preloaded.has(normalized)) {
        return;
    }

    const loader = loaders.get(normalized);

    if (!loader) {
        return;
    }

    loader()
        .then(() => {
            preloaded.add(normalized);
        })
        .catch(() => {
            /* swallow errors so hover prefetch never breaks navigation */
        });
}
