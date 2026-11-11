import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PosController::getAllProductsCache
* @see app/Http/Controllers/Api/PosController.php:24
* @route '/api/pos/all-products-cache'
*/
export const getAllProductsCache = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAllProductsCache.url(queryOptions),
    method: 'get',
})

getAllProductsCache.definition = {
    methods: ["get","head"],
    url: '/api/pos/all-products-cache',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PosController::getAllProductsCache
* @see app/Http/Controllers/Api/PosController.php:24
* @route '/api/pos/all-products-cache'
*/
getAllProductsCache.url = (queryOptions?: RouteQueryOptions) => {




    return getAllProductsCache.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\PosController::getAllProductsCache
* @see app/Http/Controllers/Api/PosController.php:24
* @route '/api/pos/all-products-cache'
*/
getAllProductsCache.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAllProductsCache.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::getAllProductsCache
* @see app/Http/Controllers/Api/PosController.php:24
* @route '/api/pos/all-products-cache'
*/
getAllProductsCache.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAllProductsCache.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PosController::getAllProductsCache
* @see app/Http/Controllers/Api/PosController.php:24
* @route '/api/pos/all-products-cache'
*/
const getAllProductsCacheForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAllProductsCache.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::getAllProductsCache
* @see app/Http/Controllers/Api/PosController.php:24
* @route '/api/pos/all-products-cache'
*/
getAllProductsCacheForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAllProductsCache.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::getAllProductsCache
* @see app/Http/Controllers/Api/PosController.php:24
* @route '/api/pos/all-products-cache'
*/
getAllProductsCacheForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAllProductsCache.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAllProductsCache.form = getAllProductsCacheForm

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode'
*/
const searchByBarcodefa34172da5383d509ed3b499b19101db = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByBarcodefa34172da5383d509ed3b499b19101db.url(queryOptions),
    method: 'get',
})

searchByBarcodefa34172da5383d509ed3b499b19101db.definition = {
    methods: ["get","head"],
    url: '/api/pos/search-barcode',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode'
*/
searchByBarcodefa34172da5383d509ed3b499b19101db.url = (queryOptions?: RouteQueryOptions) => {




    return searchByBarcodefa34172da5383d509ed3b499b19101db.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode'
*/
searchByBarcodefa34172da5383d509ed3b499b19101db.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByBarcodefa34172da5383d509ed3b499b19101db.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode'
*/
searchByBarcodefa34172da5383d509ed3b499b19101db.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchByBarcodefa34172da5383d509ed3b499b19101db.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode'
*/
const searchByBarcodefa34172da5383d509ed3b499b19101dbForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByBarcodefa34172da5383d509ed3b499b19101db.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode'
*/
searchByBarcodefa34172da5383d509ed3b499b19101dbForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByBarcodefa34172da5383d509ed3b499b19101db.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode'
*/
searchByBarcodefa34172da5383d509ed3b499b19101dbForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByBarcodefa34172da5383d509ed3b499b19101db.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

searchByBarcodefa34172da5383d509ed3b499b19101db.form = searchByBarcodefa34172da5383d509ed3b499b19101dbForm
/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode/{barcode}'
*/
const searchByBarcode5e76f96007165e7b05def972081cc854 = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByBarcode5e76f96007165e7b05def972081cc854.url(args, queryOptions),
    method: 'get',
})

searchByBarcode5e76f96007165e7b05def972081cc854.definition = {
    methods: ["get","head"],
    url: '/api/pos/search-barcode/{barcode}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode/{barcode}'
*/
searchByBarcode5e76f96007165e7b05def972081cc854.url = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { barcode: args }
    }


    if (Array.isArray(args)) {
        args = {
            barcode: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        barcode: args.barcode,
    }

    return searchByBarcode5e76f96007165e7b05def972081cc854.definition.url
            .replace('{barcode}', parsedArgs.barcode.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode/{barcode}'
*/
searchByBarcode5e76f96007165e7b05def972081cc854.get = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByBarcode5e76f96007165e7b05def972081cc854.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode/{barcode}'
*/
searchByBarcode5e76f96007165e7b05def972081cc854.head = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchByBarcode5e76f96007165e7b05def972081cc854.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode/{barcode}'
*/
const searchByBarcode5e76f96007165e7b05def972081cc854Form = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByBarcode5e76f96007165e7b05def972081cc854.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode/{barcode}'
*/
searchByBarcode5e76f96007165e7b05def972081cc854Form.get = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByBarcode5e76f96007165e7b05def972081cc854.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByBarcode
* @see app/Http/Controllers/Api/PosController.php:70
* @route '/api/pos/search-barcode/{barcode}'
*/
searchByBarcode5e76f96007165e7b05def972081cc854Form.head = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByBarcode5e76f96007165e7b05def972081cc854.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

searchByBarcode5e76f96007165e7b05def972081cc854.form = searchByBarcode5e76f96007165e7b05def972081cc854Form

export const searchByBarcode = {
    '/api/pos/search-barcode': searchByBarcodefa34172da5383d509ed3b499b19101db,
    '/api/pos/search-barcode/{barcode}': searchByBarcode5e76f96007165e7b05def972081cc854,
}


/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name'
*/
const searchByName8854bfa2ce14899db881251fedf61b5c = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByName8854bfa2ce14899db881251fedf61b5c.url(queryOptions),
    method: 'get',
})

searchByName8854bfa2ce14899db881251fedf61b5c.definition = {
    methods: ["get","head"],
    url: '/api/pos/search-name',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name'
*/
searchByName8854bfa2ce14899db881251fedf61b5c.url = (queryOptions?: RouteQueryOptions) => {




    return searchByName8854bfa2ce14899db881251fedf61b5c.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name'
*/
searchByName8854bfa2ce14899db881251fedf61b5c.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByName8854bfa2ce14899db881251fedf61b5c.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name'
*/
searchByName8854bfa2ce14899db881251fedf61b5c.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchByName8854bfa2ce14899db881251fedf61b5c.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name'
*/
const searchByName8854bfa2ce14899db881251fedf61b5cForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByName8854bfa2ce14899db881251fedf61b5c.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name'
*/
searchByName8854bfa2ce14899db881251fedf61b5cForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByName8854bfa2ce14899db881251fedf61b5c.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name'
*/
searchByName8854bfa2ce14899db881251fedf61b5cForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByName8854bfa2ce14899db881251fedf61b5c.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

searchByName8854bfa2ce14899db881251fedf61b5c.form = searchByName8854bfa2ce14899db881251fedf61b5cForm
/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name/{name}'
*/
const searchByName11b9b8639d415507163f1558493bbb2a = (args: { name: string | number } | [name: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByName11b9b8639d415507163f1558493bbb2a.url(args, queryOptions),
    method: 'get',
})

searchByName11b9b8639d415507163f1558493bbb2a.definition = {
    methods: ["get","head"],
    url: '/api/pos/search-name/{name}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name/{name}'
*/
searchByName11b9b8639d415507163f1558493bbb2a.url = (args: { name: string | number } | [name: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { name: args }
    }


    if (Array.isArray(args)) {
        args = {
            name: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        name: args.name,
    }

    return searchByName11b9b8639d415507163f1558493bbb2a.definition.url
            .replace('{name}', parsedArgs.name.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name/{name}'
*/
searchByName11b9b8639d415507163f1558493bbb2a.get = (args: { name: string | number } | [name: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchByName11b9b8639d415507163f1558493bbb2a.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name/{name}'
*/
searchByName11b9b8639d415507163f1558493bbb2a.head = (args: { name: string | number } | [name: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchByName11b9b8639d415507163f1558493bbb2a.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name/{name}'
*/
const searchByName11b9b8639d415507163f1558493bbb2aForm = (args: { name: string | number } | [name: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByName11b9b8639d415507163f1558493bbb2a.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name/{name}'
*/
searchByName11b9b8639d415507163f1558493bbb2aForm.get = (args: { name: string | number } | [name: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByName11b9b8639d415507163f1558493bbb2a.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::searchByName
* @see app/Http/Controllers/Api/PosController.php:117
* @route '/api/pos/search-name/{name}'
*/
searchByName11b9b8639d415507163f1558493bbb2aForm.head = (args: { name: string | number } | [name: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchByName11b9b8639d415507163f1558493bbb2a.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

searchByName11b9b8639d415507163f1558493bbb2a.form = searchByName11b9b8639d415507163f1558493bbb2aForm

export const searchByName = {
    '/api/pos/search-name': searchByName8854bfa2ce14899db881251fedf61b5c,
    '/api/pos/search-name/{name}': searchByName11b9b8639d415507163f1558493bbb2a,
}


/**
* @see \App\Http\Controllers\Api\PosController::cacheStats
* @see app/Http/Controllers/Api/PosController.php:230
* @route '/api/pos/cache-stats'
*/
export const cacheStats = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cacheStats.url(queryOptions),
    method: 'get',
})

cacheStats.definition = {
    methods: ["get","head"],
    url: '/api/pos/cache-stats',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PosController::cacheStats
* @see app/Http/Controllers/Api/PosController.php:230
* @route '/api/pos/cache-stats'
*/
cacheStats.url = (queryOptions?: RouteQueryOptions) => {




    return cacheStats.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\PosController::cacheStats
* @see app/Http/Controllers/Api/PosController.php:230
* @route '/api/pos/cache-stats'
*/
cacheStats.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: cacheStats.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::cacheStats
* @see app/Http/Controllers/Api/PosController.php:230
* @route '/api/pos/cache-stats'
*/
cacheStats.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: cacheStats.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PosController::cacheStats
* @see app/Http/Controllers/Api/PosController.php:230
* @route '/api/pos/cache-stats'
*/
const cacheStatsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cacheStats.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::cacheStats
* @see app/Http/Controllers/Api/PosController.php:230
* @route '/api/pos/cache-stats'
*/
cacheStatsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: cacheStats.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PosController::cacheStats
* @see app/Http/Controllers/Api/PosController.php:230
* @route '/api/pos/cache-stats'
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
* @see \App\Http\Controllers\Api\PosController::rebuildCache
* @see app/Http/Controllers/Api/PosController.php:164
* @route '/api/pos/rebuild-cache'
*/
export const rebuildCache = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rebuildCache.url(queryOptions),
    method: 'post',
})

rebuildCache.definition = {
    methods: ["post"],
    url: '/api/pos/rebuild-cache',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PosController::rebuildCache
* @see app/Http/Controllers/Api/PosController.php:164
* @route '/api/pos/rebuild-cache'
*/
rebuildCache.url = (queryOptions?: RouteQueryOptions) => {




    return rebuildCache.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\PosController::rebuildCache
* @see app/Http/Controllers/Api/PosController.php:164
* @route '/api/pos/rebuild-cache'
*/
rebuildCache.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: rebuildCache.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\PosController::rebuildCache
* @see app/Http/Controllers/Api/PosController.php:164
* @route '/api/pos/rebuild-cache'
*/
const rebuildCacheForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rebuildCache.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\PosController::rebuildCache
* @see app/Http/Controllers/Api/PosController.php:164
* @route '/api/pos/rebuild-cache'
*/
rebuildCacheForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: rebuildCache.url(

    queryOptions
   ),
    method: 'post',
})

rebuildCache.form = rebuildCacheForm

/**
* @see \App\Http\Controllers\Api\PosController::clearCache
* @see app/Http/Controllers/Api/PosController.php:252
* @route '/api/pos/clear-cache'
*/
export const clearCache = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clearCache.url(queryOptions),
    method: 'delete',
})

clearCache.definition = {
    methods: ["delete"],
    url: '/api/pos/clear-cache',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\PosController::clearCache
* @see app/Http/Controllers/Api/PosController.php:252
* @route '/api/pos/clear-cache'
*/
clearCache.url = (queryOptions?: RouteQueryOptions) => {




    return clearCache.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\PosController::clearCache
* @see app/Http/Controllers/Api/PosController.php:252
* @route '/api/pos/clear-cache'
*/
clearCache.delete = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: clearCache.url(queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\PosController::clearCache
* @see app/Http/Controllers/Api/PosController.php:252
* @route '/api/pos/clear-cache'
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
* @see \App\Http\Controllers\Api\PosController::clearCache
* @see app/Http/Controllers/Api/PosController.php:252
* @route '/api/pos/clear-cache'
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

/**
* @see \App\Http\Controllers\Api\PosController::refreshCache
* @see app/Http/Controllers/Api/PosController.php:192
* @route '/api/pos/refresh-cache'
*/
export const refreshCache = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshCache.url(queryOptions),
    method: 'post',
})

refreshCache.definition = {
    methods: ["post"],
    url: '/api/pos/refresh-cache',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PosController::refreshCache
* @see app/Http/Controllers/Api/PosController.php:192
* @route '/api/pos/refresh-cache'
*/
refreshCache.url = (queryOptions?: RouteQueryOptions) => {




    return refreshCache.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\PosController::refreshCache
* @see app/Http/Controllers/Api/PosController.php:192
* @route '/api/pos/refresh-cache'
*/
refreshCache.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refreshCache.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\PosController::refreshCache
* @see app/Http/Controllers/Api/PosController.php:192
* @route '/api/pos/refresh-cache'
*/
const refreshCacheForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: refreshCache.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\PosController::refreshCache
* @see app/Http/Controllers/Api/PosController.php:192
* @route '/api/pos/refresh-cache'
*/
refreshCacheForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: refreshCache.url(

    queryOptions
   ),
    method: 'post',
})

refreshCache.form = refreshCacheForm

const PosController = { getAllProductsCache, searchByBarcode, searchByName, cacheStats, rebuildCache, clearCache, refreshCache }

export default PosController