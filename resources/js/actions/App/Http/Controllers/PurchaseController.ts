import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PurchaseController::statistics
* @see app/Http/Controllers/PurchaseController.php:328
* @route '/api/purchases/statistics'
*/
export const statistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

statistics.definition = {
    methods: ["get","head"],
    url: '/api/purchases/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PurchaseController::statistics
* @see app/Http/Controllers/PurchaseController.php:328
* @route '/api/purchases/statistics'
*/
statistics.url = (queryOptions?: RouteQueryOptions) => {




    return statistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::statistics
* @see app/Http/Controllers/PurchaseController.php:328
* @route '/api/purchases/statistics'
*/
statistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::statistics
* @see app/Http/Controllers/PurchaseController.php:328
* @route '/api/purchases/statistics'
*/
statistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: statistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PurchaseController::statistics
* @see app/Http/Controllers/PurchaseController.php:328
* @route '/api/purchases/statistics'
*/
const statisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::statistics
* @see app/Http/Controllers/PurchaseController.php:328
* @route '/api/purchases/statistics'
*/
statisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::statistics
* @see app/Http/Controllers/PurchaseController.php:328
* @route '/api/purchases/statistics'
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
* @see \App\Http\Controllers\PurchaseController::purchaseHistoryByProduct
* @see app/Http/Controllers/PurchaseController.php:913
* @route '/api/purchases/by-product'
*/
export const purchaseHistoryByProduct = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: purchaseHistoryByProduct.url(queryOptions),
    method: 'get',
})

purchaseHistoryByProduct.definition = {
    methods: ["get","head"],
    url: '/api/purchases/by-product',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PurchaseController::purchaseHistoryByProduct
* @see app/Http/Controllers/PurchaseController.php:913
* @route '/api/purchases/by-product'
*/
purchaseHistoryByProduct.url = (queryOptions?: RouteQueryOptions) => {




    return purchaseHistoryByProduct.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::purchaseHistoryByProduct
* @see app/Http/Controllers/PurchaseController.php:913
* @route '/api/purchases/by-product'
*/
purchaseHistoryByProduct.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: purchaseHistoryByProduct.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::purchaseHistoryByProduct
* @see app/Http/Controllers/PurchaseController.php:913
* @route '/api/purchases/by-product'
*/
purchaseHistoryByProduct.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: purchaseHistoryByProduct.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PurchaseController::purchaseHistoryByProduct
* @see app/Http/Controllers/PurchaseController.php:913
* @route '/api/purchases/by-product'
*/
const purchaseHistoryByProductForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: purchaseHistoryByProduct.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::purchaseHistoryByProduct
* @see app/Http/Controllers/PurchaseController.php:913
* @route '/api/purchases/by-product'
*/
purchaseHistoryByProductForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: purchaseHistoryByProduct.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::purchaseHistoryByProduct
* @see app/Http/Controllers/PurchaseController.php:913
* @route '/api/purchases/by-product'
*/
purchaseHistoryByProductForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: purchaseHistoryByProduct.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

purchaseHistoryByProduct.form = purchaseHistoryByProductForm

/**
* @see \App\Http\Controllers\PurchaseController::search
* @see app/Http/Controllers/PurchaseController.php:730
* @route '/api/purchases/search'
*/
export const search = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: search.url(queryOptions),
    method: 'post',
})

search.definition = {
    methods: ["post"],
    url: '/api/purchases/search',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchaseController::search
* @see app/Http/Controllers/PurchaseController.php:730
* @route '/api/purchases/search'
*/
search.url = (queryOptions?: RouteQueryOptions) => {




    return search.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::search
* @see app/Http/Controllers/PurchaseController.php:730
* @route '/api/purchases/search'
*/
search.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: search.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchaseController::search
* @see app/Http/Controllers/PurchaseController.php:730
* @route '/api/purchases/search'
*/
const searchForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: search.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchaseController::search
* @see app/Http/Controllers/PurchaseController.php:730
* @route '/api/purchases/search'
*/
searchForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: search.url(

    queryOptions
   ),
    method: 'post',
})

search.form = searchForm

/**
* @see \App\Http\Controllers\PurchaseController::markAsReceived
* @see app/Http/Controllers/PurchaseController.php:768
* @route '/api/purchases/{purchase}/receive'
*/
export const markAsReceived = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: markAsReceived.url(args, queryOptions),
    method: 'patch',
})

markAsReceived.definition = {
    methods: ["patch"],
    url: '/api/purchases/{purchase}/receive',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\PurchaseController::markAsReceived
* @see app/Http/Controllers/PurchaseController.php:768
* @route '/api/purchases/{purchase}/receive'
*/
markAsReceived.url = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchase: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchase: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchase: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        purchase: typeof args.purchase === 'object'
        ? args.purchase.id
        : args.purchase,
    }

    return markAsReceived.definition.url
            .replace('{purchase}', parsedArgs.purchase.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::markAsReceived
* @see app/Http/Controllers/PurchaseController.php:768
* @route '/api/purchases/{purchase}/receive'
*/
markAsReceived.patch = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: markAsReceived.url(args, queryOptions),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\PurchaseController::markAsReceived
* @see app/Http/Controllers/PurchaseController.php:768
* @route '/api/purchases/{purchase}/receive'
*/
const markAsReceivedForm = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: markAsReceived.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchaseController::markAsReceived
* @see app/Http/Controllers/PurchaseController.php:768
* @route '/api/purchases/{purchase}/receive'
*/
markAsReceivedForm.patch = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: markAsReceived.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

markAsReceived.form = markAsReceivedForm

/**
* @see \App\Http\Controllers\PurchaseController::deleteAll
* @see app/Http/Controllers/PurchaseController.php:850
* @route '/api/purchases/delete-all'
*/
export const deleteAll = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

deleteAll.definition = {
    methods: ["post"],
    url: '/api/purchases/delete-all',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchaseController::deleteAll
* @see app/Http/Controllers/PurchaseController.php:850
* @route '/api/purchases/delete-all'
*/
deleteAll.url = (queryOptions?: RouteQueryOptions) => {




    return deleteAll.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::deleteAll
* @see app/Http/Controllers/PurchaseController.php:850
* @route '/api/purchases/delete-all'
*/
deleteAll.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchaseController::deleteAll
* @see app/Http/Controllers/PurchaseController.php:850
* @route '/api/purchases/delete-all'
*/
const deleteAllForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchaseController::deleteAll
* @see app/Http/Controllers/PurchaseController.php:850
* @route '/api/purchases/delete-all'
*/
deleteAllForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

deleteAll.form = deleteAllForm

/**
* @see \App\Http\Controllers\PurchaseController::reportStatistics
* @see app/Http/Controllers/PurchaseController.php:1202
* @route '/api/purchases/report/statistics'
*/
export const reportStatistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportStatistics.url(queryOptions),
    method: 'get',
})

reportStatistics.definition = {
    methods: ["get","head"],
    url: '/api/purchases/report/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PurchaseController::reportStatistics
* @see app/Http/Controllers/PurchaseController.php:1202
* @route '/api/purchases/report/statistics'
*/
reportStatistics.url = (queryOptions?: RouteQueryOptions) => {




    return reportStatistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::reportStatistics
* @see app/Http/Controllers/PurchaseController.php:1202
* @route '/api/purchases/report/statistics'
*/
reportStatistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportStatistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::reportStatistics
* @see app/Http/Controllers/PurchaseController.php:1202
* @route '/api/purchases/report/statistics'
*/
reportStatistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportStatistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PurchaseController::reportStatistics
* @see app/Http/Controllers/PurchaseController.php:1202
* @route '/api/purchases/report/statistics'
*/
const reportStatisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::reportStatistics
* @see app/Http/Controllers/PurchaseController.php:1202
* @route '/api/purchases/report/statistics'
*/
reportStatisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::reportStatistics
* @see app/Http/Controllers/PurchaseController.php:1202
* @route '/api/purchases/report/statistics'
*/
reportStatisticsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportStatistics.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

reportStatistics.form = reportStatisticsForm

/**
* @see \App\Http\Controllers\PurchaseController::reportExport
* @see app/Http/Controllers/PurchaseController.php:1326
* @route '/api/purchases/report/export'
*/
export const reportExport = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportExport.url(queryOptions),
    method: 'get',
})

reportExport.definition = {
    methods: ["get","head"],
    url: '/api/purchases/report/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PurchaseController::reportExport
* @see app/Http/Controllers/PurchaseController.php:1326
* @route '/api/purchases/report/export'
*/
reportExport.url = (queryOptions?: RouteQueryOptions) => {




    return reportExport.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::reportExport
* @see app/Http/Controllers/PurchaseController.php:1326
* @route '/api/purchases/report/export'
*/
reportExport.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportExport.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::reportExport
* @see app/Http/Controllers/PurchaseController.php:1326
* @route '/api/purchases/report/export'
*/
reportExport.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportExport.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PurchaseController::reportExport
* @see app/Http/Controllers/PurchaseController.php:1326
* @route '/api/purchases/report/export'
*/
const reportExportForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportExport.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::reportExport
* @see app/Http/Controllers/PurchaseController.php:1326
* @route '/api/purchases/report/export'
*/
reportExportForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportExport.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::reportExport
* @see app/Http/Controllers/PurchaseController.php:1326
* @route '/api/purchases/report/export'
*/
reportExportForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportExport.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

reportExport.form = reportExportForm

/**
* @see \App\Http\Controllers\PurchaseController::report
* @see app/Http/Controllers/PurchaseController.php:1018
* @route '/api/purchases/report'
*/
export const report = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: report.url(queryOptions),
    method: 'get',
})

report.definition = {
    methods: ["get","head"],
    url: '/api/purchases/report',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PurchaseController::report
* @see app/Http/Controllers/PurchaseController.php:1018
* @route '/api/purchases/report'
*/
report.url = (queryOptions?: RouteQueryOptions) => {




    return report.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::report
* @see app/Http/Controllers/PurchaseController.php:1018
* @route '/api/purchases/report'
*/
report.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: report.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::report
* @see app/Http/Controllers/PurchaseController.php:1018
* @route '/api/purchases/report'
*/
report.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: report.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PurchaseController::report
* @see app/Http/Controllers/PurchaseController.php:1018
* @route '/api/purchases/report'
*/
const reportForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: report.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::report
* @see app/Http/Controllers/PurchaseController.php:1018
* @route '/api/purchases/report'
*/
reportForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: report.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::report
* @see app/Http/Controllers/PurchaseController.php:1018
* @route '/api/purchases/report'
*/
reportForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: report.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

report.form = reportForm

/**
* @see \App\Http\Controllers\PurchaseController::index
* @see app/Http/Controllers/PurchaseController.php:223
* @route '/api/purchases'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/purchases',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PurchaseController::index
* @see app/Http/Controllers/PurchaseController.php:223
* @route '/api/purchases'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::index
* @see app/Http/Controllers/PurchaseController.php:223
* @route '/api/purchases'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::index
* @see app/Http/Controllers/PurchaseController.php:223
* @route '/api/purchases'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PurchaseController::index
* @see app/Http/Controllers/PurchaseController.php:223
* @route '/api/purchases'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::index
* @see app/Http/Controllers/PurchaseController.php:223
* @route '/api/purchases'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::index
* @see app/Http/Controllers/PurchaseController.php:223
* @route '/api/purchases'
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
* @see \App\Http\Controllers\PurchaseController::store
* @see app/Http/Controllers/PurchaseController.php:507
* @route '/api/purchases'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/purchases',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PurchaseController::store
* @see app/Http/Controllers/PurchaseController.php:507
* @route '/api/purchases'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::store
* @see app/Http/Controllers/PurchaseController.php:507
* @route '/api/purchases'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchaseController::store
* @see app/Http/Controllers/PurchaseController.php:507
* @route '/api/purchases'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchaseController::store
* @see app/Http/Controllers/PurchaseController.php:507
* @route '/api/purchases'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\PurchaseController::show
* @see app/Http/Controllers/PurchaseController.php:595
* @route '/api/purchases/{purchase}'
*/
export const show = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/purchases/{purchase}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PurchaseController::show
* @see app/Http/Controllers/PurchaseController.php:595
* @route '/api/purchases/{purchase}'
*/
show.url = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchase: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchase: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchase: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        purchase: typeof args.purchase === 'object'
        ? args.purchase.id
        : args.purchase,
    }

    return show.definition.url
            .replace('{purchase}', parsedArgs.purchase.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::show
* @see app/Http/Controllers/PurchaseController.php:595
* @route '/api/purchases/{purchase}'
*/
show.get = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::show
* @see app/Http/Controllers/PurchaseController.php:595
* @route '/api/purchases/{purchase}'
*/
show.head = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\PurchaseController::show
* @see app/Http/Controllers/PurchaseController.php:595
* @route '/api/purchases/{purchase}'
*/
const showForm = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::show
* @see app/Http/Controllers/PurchaseController.php:595
* @route '/api/purchases/{purchase}'
*/
showForm.get = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\PurchaseController::show
* @see app/Http/Controllers/PurchaseController.php:595
* @route '/api/purchases/{purchase}'
*/
showForm.head = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PurchaseController::update
* @see app/Http/Controllers/PurchaseController.php:605
* @route '/api/purchases/{purchase}'
*/
export const update = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/purchases/{purchase}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\PurchaseController::update
* @see app/Http/Controllers/PurchaseController.php:605
* @route '/api/purchases/{purchase}'
*/
update.url = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchase: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchase: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchase: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        purchase: typeof args.purchase === 'object'
        ? args.purchase.id
        : args.purchase,
    }

    return update.definition.url
            .replace('{purchase}', parsedArgs.purchase.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::update
* @see app/Http/Controllers/PurchaseController.php:605
* @route '/api/purchases/{purchase}'
*/
update.put = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\PurchaseController::update
* @see app/Http/Controllers/PurchaseController.php:605
* @route '/api/purchases/{purchase}'
*/
const updateForm = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchaseController::update
* @see app/Http/Controllers/PurchaseController.php:605
* @route '/api/purchases/{purchase}'
*/
updateForm.put = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\PurchaseController::destroy
* @see app/Http/Controllers/PurchaseController.php:705
* @route '/api/purchases/{purchase}'
*/
export const destroy = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/purchases/{purchase}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\PurchaseController::destroy
* @see app/Http/Controllers/PurchaseController.php:705
* @route '/api/purchases/{purchase}'
*/
destroy.url = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { purchase: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { purchase: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            purchase: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        purchase: typeof args.purchase === 'object'
        ? args.purchase.id
        : args.purchase,
    }

    return destroy.definition.url
            .replace('{purchase}', parsedArgs.purchase.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\PurchaseController::destroy
* @see app/Http/Controllers/PurchaseController.php:705
* @route '/api/purchases/{purchase}'
*/
destroy.delete = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\PurchaseController::destroy
* @see app/Http/Controllers/PurchaseController.php:705
* @route '/api/purchases/{purchase}'
*/
const destroyForm = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\PurchaseController::destroy
* @see app/Http/Controllers/PurchaseController.php:705
* @route '/api/purchases/{purchase}'
*/
destroyForm.delete = (args: { purchase: number | { id: number } } | [purchase: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const PurchaseController = { statistics, purchaseHistoryByProduct, search, markAsReceived, deleteAll, reportStatistics, reportExport, report, index, store, show, update, destroy }

export default PurchaseController