import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CardController::statistics
* @see app/Http/Controllers/CardController.php:230
* @route '/api/cards/statistics'
*/
export const statistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

statistics.definition = {
    methods: ["get","head"],
    url: '/api/cards/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CardController::statistics
* @see app/Http/Controllers/CardController.php:230
* @route '/api/cards/statistics'
*/
statistics.url = (queryOptions?: RouteQueryOptions) => {




    return statistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::statistics
* @see app/Http/Controllers/CardController.php:230
* @route '/api/cards/statistics'
*/
statistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::statistics
* @see app/Http/Controllers/CardController.php:230
* @route '/api/cards/statistics'
*/
statistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: statistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CardController::statistics
* @see app/Http/Controllers/CardController.php:230
* @route '/api/cards/statistics'
*/
const statisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::statistics
* @see app/Http/Controllers/CardController.php:230
* @route '/api/cards/statistics'
*/
statisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::statistics
* @see app/Http/Controllers/CardController.php:230
* @route '/api/cards/statistics'
*/
statisticsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

statistics.form = statisticsForm

/**
* @see \App\Http\Controllers\CardController::byNameCard
* @see app/Http/Controllers/CardController.php:271
* @route '/api/cards/by-name-card/{nameCard}'
*/
export const byNameCard = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: byNameCard.url(args, queryOptions),
    method: 'get',
})

byNameCard.definition = {
    methods: ["get","head"],
    url: '/api/cards/by-name-card/{nameCard}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CardController::byNameCard
* @see app/Http/Controllers/CardController.php:271
* @route '/api/cards/by-name-card/{nameCard}'
*/
byNameCard.url = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { nameCard: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { nameCard: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            nameCard: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        nameCard: typeof args.nameCard === 'object'
        ? args.nameCard.id
        : args.nameCard,
    }

    return byNameCard.definition.url
            .replace('{nameCard}', parsedArgs.nameCard.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::byNameCard
* @see app/Http/Controllers/CardController.php:271
* @route '/api/cards/by-name-card/{nameCard}'
*/
byNameCard.get = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: byNameCard.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::byNameCard
* @see app/Http/Controllers/CardController.php:271
* @route '/api/cards/by-name-card/{nameCard}'
*/
byNameCard.head = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: byNameCard.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CardController::byNameCard
* @see app/Http/Controllers/CardController.php:271
* @route '/api/cards/by-name-card/{nameCard}'
*/
const byNameCardForm = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: byNameCard.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::byNameCard
* @see app/Http/Controllers/CardController.php:271
* @route '/api/cards/by-name-card/{nameCard}'
*/
byNameCardForm.get = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: byNameCard.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::byNameCard
* @see app/Http/Controllers/CardController.php:271
* @route '/api/cards/by-name-card/{nameCard}'
*/
byNameCardForm.head = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: byNameCard.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

byNameCard.form = byNameCardForm

/**
* @see \App\Http\Controllers\CardController::index
* @see app/Http/Controllers/CardController.php:22
* @route '/api/cards'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/cards',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CardController::index
* @see app/Http/Controllers/CardController.php:22
* @route '/api/cards'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::index
* @see app/Http/Controllers/CardController.php:22
* @route '/api/cards'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::index
* @see app/Http/Controllers/CardController.php:22
* @route '/api/cards'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CardController::index
* @see app/Http/Controllers/CardController.php:22
* @route '/api/cards'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::index
* @see app/Http/Controllers/CardController.php:22
* @route '/api/cards'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::index
* @see app/Http/Controllers/CardController.php:22
* @route '/api/cards'
*/
indexForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\CardController::store
* @see app/Http/Controllers/CardController.php:97
* @route '/api/cards'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/cards',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CardController::store
* @see app/Http/Controllers/CardController.php:97
* @route '/api/cards'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::store
* @see app/Http/Controllers/CardController.php:97
* @route '/api/cards'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CardController::store
* @see app/Http/Controllers/CardController.php:97
* @route '/api/cards'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CardController::store
* @see app/Http/Controllers/CardController.php:97
* @route '/api/cards'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\CardController::show
* @see app/Http/Controllers/CardController.php:126
* @route '/api/cards/{card}'
*/
export const show = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/cards/{card}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CardController::show
* @see app/Http/Controllers/CardController.php:126
* @route '/api/cards/{card}'
*/
show.url = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { card: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { card: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            card: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        card: typeof args.card === 'object'
        ? args.card.id
        : args.card,
    }

    return show.definition.url
            .replace('{card}', parsedArgs.card.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::show
* @see app/Http/Controllers/CardController.php:126
* @route '/api/cards/{card}'
*/
show.get = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::show
* @see app/Http/Controllers/CardController.php:126
* @route '/api/cards/{card}'
*/
show.head = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CardController::show
* @see app/Http/Controllers/CardController.php:126
* @route '/api/cards/{card}'
*/
const showForm = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::show
* @see app/Http/Controllers/CardController.php:126
* @route '/api/cards/{card}'
*/
showForm.get = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::show
* @see app/Http/Controllers/CardController.php:126
* @route '/api/cards/{card}'
*/
showForm.head = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\CardController::update
* @see app/Http/Controllers/CardController.php:148
* @route '/api/cards/{card}'
*/
export const update = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/cards/{card}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\CardController::update
* @see app/Http/Controllers/CardController.php:148
* @route '/api/cards/{card}'
*/
update.url = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { card: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { card: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            card: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        card: typeof args.card === 'object'
        ? args.card.id
        : args.card,
    }

    return update.definition.url
            .replace('{card}', parsedArgs.card.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::update
* @see app/Http/Controllers/CardController.php:148
* @route '/api/cards/{card}'
*/
update.put = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\CardController::update
* @see app/Http/Controllers/CardController.php:148
* @route '/api/cards/{card}'
*/
const updateForm = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CardController::update
* @see app/Http/Controllers/CardController.php:148
* @route '/api/cards/{card}'
*/
updateForm.put = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\CardController::destroy
* @see app/Http/Controllers/CardController.php:180
* @route '/api/cards/{card}'
*/
export const destroy = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/cards/{card}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\CardController::destroy
* @see app/Http/Controllers/CardController.php:180
* @route '/api/cards/{card}'
*/
destroy.url = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { card: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { card: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            card: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        card: typeof args.card === 'object'
        ? args.card.id
        : args.card,
    }

    return destroy.definition.url
            .replace('{card}', parsedArgs.card.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::destroy
* @see app/Http/Controllers/CardController.php:180
* @route '/api/cards/{card}'
*/
destroy.delete = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\CardController::destroy
* @see app/Http/Controllers/CardController.php:180
* @route '/api/cards/{card}'
*/
const destroyForm = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CardController::destroy
* @see app/Http/Controllers/CardController.php:180
* @route '/api/cards/{card}'
*/
destroyForm.delete = (args: { card: string | number | { id: string | number } } | [card: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

/**
* @see \App\Http\Controllers\CardController::rebuildCache
* @see app/Http/Controllers/CardController.php:335
* @route '/api/cards/rebuild-cache'
*/
export const rebuildCache = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rebuildCache.url(queryOptions),
    method: 'post',
})

rebuildCache.definition = {
    methods: ["post"],
    url: '/api/cards/rebuild-cache',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CardController::rebuildCache
* @see app/Http/Controllers/CardController.php:335
* @route '/api/cards/rebuild-cache'
*/
rebuildCache.url = (queryOptions?: RouteQueryOptions) => {




    return rebuildCache.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::rebuildCache
* @see app/Http/Controllers/CardController.php:335
* @route '/api/cards/rebuild-cache'
*/
rebuildCache.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rebuildCache.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CardController::rebuildCache
* @see app/Http/Controllers/CardController.php:335
* @route '/api/cards/rebuild-cache'
*/
const rebuildCacheForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rebuildCache.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CardController::rebuildCache
* @see app/Http/Controllers/CardController.php:335
* @route '/api/cards/rebuild-cache'
*/
rebuildCacheForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rebuildCache.url(

    queryOptions
   ),
    method: 'post',
})

rebuildCache.form = rebuildCacheForm

/**
* @see \App\Http\Controllers\CardController::cacheStats
* @see app/Http/Controllers/CardController.php:355
* @route '/api/cards/cache-stats'
*/
export const cacheStats = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cacheStats.url(queryOptions),
    method: 'get',
})

cacheStats.definition = {
    methods: ["get","head"],
    url: '/api/cards/cache-stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CardController::cacheStats
* @see app/Http/Controllers/CardController.php:355
* @route '/api/cards/cache-stats'
*/
cacheStats.url = (queryOptions?: RouteQueryOptions) => {




    return cacheStats.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::cacheStats
* @see app/Http/Controllers/CardController.php:355
* @route '/api/cards/cache-stats'
*/
cacheStats.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cacheStats.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::cacheStats
* @see app/Http/Controllers/CardController.php:355
* @route '/api/cards/cache-stats'
*/
cacheStats.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: cacheStats.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CardController::cacheStats
* @see app/Http/Controllers/CardController.php:355
* @route '/api/cards/cache-stats'
*/
const cacheStatsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cacheStats.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::cacheStats
* @see app/Http/Controllers/CardController.php:355
* @route '/api/cards/cache-stats'
*/
cacheStatsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cacheStats.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CardController::cacheStats
* @see app/Http/Controllers/CardController.php:355
* @route '/api/cards/cache-stats'
*/
cacheStatsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cacheStats.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

cacheStats.form = cacheStatsForm

/**
* @see \App\Http\Controllers\CardController::clearCache
* @see app/Http/Controllers/CardController.php:375
* @route '/api/cards/clear-cache'
*/
export const clearCache = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clearCache.url(queryOptions),
    method: 'delete',
})

clearCache.definition = {
    methods: ["delete"],
    url: '/api/cards/clear-cache',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\CardController::clearCache
* @see app/Http/Controllers/CardController.php:375
* @route '/api/cards/clear-cache'
*/
clearCache.url = (queryOptions?: RouteQueryOptions) => {




    return clearCache.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CardController::clearCache
* @see app/Http/Controllers/CardController.php:375
* @route '/api/cards/clear-cache'
*/
clearCache.delete = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clearCache.url(queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\CardController::clearCache
* @see app/Http/Controllers/CardController.php:375
* @route '/api/cards/clear-cache'
*/
const clearCacheForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: clearCache.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CardController::clearCache
* @see app/Http/Controllers/CardController.php:375
* @route '/api/cards/clear-cache'
*/
clearCacheForm.delete = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: clearCache.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

clearCache.form = clearCacheForm

const CardController = { statistics, byNameCard, index, store, show, update, destroy, rebuildCache, cacheStats, clearCache }

export default CardController