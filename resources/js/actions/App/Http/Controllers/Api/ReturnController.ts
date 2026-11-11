import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ReturnController::getStatistics
* @see app/Http/Controllers/Api/ReturnController.php:843
* @route '/api/returns/statistics'
*/
export const getStatistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatistics.url(queryOptions),
    method: 'get',
})

getStatistics.definition = {
    methods: ["get","head"],
    url: '/api/returns/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::getStatistics
* @see app/Http/Controllers/Api/ReturnController.php:843
* @route '/api/returns/statistics'
*/
getStatistics.url = (queryOptions?: RouteQueryOptions) => {




    return getStatistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::getStatistics
* @see app/Http/Controllers/Api/ReturnController.php:843
* @route '/api/returns/statistics'
*/
getStatistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getStatistics
* @see app/Http/Controllers/Api/ReturnController.php:843
* @route '/api/returns/statistics'
*/
getStatistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStatistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getStatistics
* @see app/Http/Controllers/Api/ReturnController.php:843
* @route '/api/returns/statistics'
*/
const getStatisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getStatistics
* @see app/Http/Controllers/Api/ReturnController.php:843
* @route '/api/returns/statistics'
*/
getStatisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getStatistics
* @see app/Http/Controllers/Api/ReturnController.php:843
* @route '/api/returns/statistics'
*/
getStatisticsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getStatistics.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getStatistics.form = getStatisticsForm

/**
* @see \App\Http\Controllers\Api\ReturnController::getAnalytics
* @see app/Http/Controllers/Api/ReturnController.php:1055
* @route '/api/returns/analytics'
*/
export const getAnalytics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAnalytics.url(queryOptions),
    method: 'get',
})

getAnalytics.definition = {
    methods: ["get","head"],
    url: '/api/returns/analytics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::getAnalytics
* @see app/Http/Controllers/Api/ReturnController.php:1055
* @route '/api/returns/analytics'
*/
getAnalytics.url = (queryOptions?: RouteQueryOptions) => {




    return getAnalytics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::getAnalytics
* @see app/Http/Controllers/Api/ReturnController.php:1055
* @route '/api/returns/analytics'
*/
getAnalytics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAnalytics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getAnalytics
* @see app/Http/Controllers/Api/ReturnController.php:1055
* @route '/api/returns/analytics'
*/
getAnalytics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAnalytics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getAnalytics
* @see app/Http/Controllers/Api/ReturnController.php:1055
* @route '/api/returns/analytics'
*/
const getAnalyticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAnalytics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getAnalytics
* @see app/Http/Controllers/Api/ReturnController.php:1055
* @route '/api/returns/analytics'
*/
getAnalyticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAnalytics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getAnalytics
* @see app/Http/Controllers/Api/ReturnController.php:1055
* @route '/api/returns/analytics'
*/
getAnalyticsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAnalytics.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAnalytics.form = getAnalyticsForm

/**
* @see \App\Http\Controllers\Api\ReturnController::exportReturns
* @see app/Http/Controllers/Api/ReturnController.php:1130
* @route '/api/returns/export'
*/
export const exportReturns = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportReturns.url(queryOptions),
    method: 'get',
})

exportReturns.definition = {
    methods: ["get","head"],
    url: '/api/returns/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::exportReturns
* @see app/Http/Controllers/Api/ReturnController.php:1130
* @route '/api/returns/export'
*/
exportReturns.url = (queryOptions?: RouteQueryOptions) => {




    return exportReturns.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::exportReturns
* @see app/Http/Controllers/Api/ReturnController.php:1130
* @route '/api/returns/export'
*/
exportReturns.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportReturns.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::exportReturns
* @see app/Http/Controllers/Api/ReturnController.php:1130
* @route '/api/returns/export'
*/
exportReturns.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportReturns.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::exportReturns
* @see app/Http/Controllers/Api/ReturnController.php:1130
* @route '/api/returns/export'
*/
const exportReturnsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportReturns.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::exportReturns
* @see app/Http/Controllers/Api/ReturnController.php:1130
* @route '/api/returns/export'
*/
exportReturnsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportReturns.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::exportReturns
* @see app/Http/Controllers/Api/ReturnController.php:1130
* @route '/api/returns/export'
*/
exportReturnsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportReturns.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

exportReturns.form = exportReturnsForm

/**
* @see \App\Http\Controllers\Api\ReturnController::searchTransactionHistory
* @see app/Http/Controllers/Api/ReturnController.php:1183
* @route '/api/returns/search-history'
*/
export const searchTransactionHistory = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: searchTransactionHistory.url(queryOptions),
    method: 'post',
})

searchTransactionHistory.definition = {
    methods: ["post"],
    url: '/api/returns/search-history',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::searchTransactionHistory
* @see app/Http/Controllers/Api/ReturnController.php:1183
* @route '/api/returns/search-history'
*/
searchTransactionHistory.url = (queryOptions?: RouteQueryOptions) => {




    return searchTransactionHistory.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::searchTransactionHistory
* @see app/Http/Controllers/Api/ReturnController.php:1183
* @route '/api/returns/search-history'
*/
searchTransactionHistory.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: searchTransactionHistory.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::searchTransactionHistory
* @see app/Http/Controllers/Api/ReturnController.php:1183
* @route '/api/returns/search-history'
*/
const searchTransactionHistoryForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: searchTransactionHistory.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::searchTransactionHistory
* @see app/Http/Controllers/Api/ReturnController.php:1183
* @route '/api/returns/search-history'
*/
searchTransactionHistoryForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: searchTransactionHistory.url(

    queryOptions
   ),
    method: 'post',
})

searchTransactionHistory.form = searchTransactionHistoryForm

/**
* @see \App\Http\Controllers\Api\ReturnController::bulkProcess
* @see app/Http/Controllers/Api/ReturnController.php:954
* @route '/api/returns/bulk-process'
*/
export const bulkProcess = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkProcess.url(queryOptions),
    method: 'post',
})

bulkProcess.definition = {
    methods: ["post"],
    url: '/api/returns/bulk-process',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::bulkProcess
* @see app/Http/Controllers/Api/ReturnController.php:954
* @route '/api/returns/bulk-process'
*/
bulkProcess.url = (queryOptions?: RouteQueryOptions) => {




    return bulkProcess.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::bulkProcess
* @see app/Http/Controllers/Api/ReturnController.php:954
* @route '/api/returns/bulk-process'
*/
bulkProcess.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkProcess.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::bulkProcess
* @see app/Http/Controllers/Api/ReturnController.php:954
* @route '/api/returns/bulk-process'
*/
const bulkProcessForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: bulkProcess.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::bulkProcess
* @see app/Http/Controllers/Api/ReturnController.php:954
* @route '/api/returns/bulk-process'
*/
bulkProcessForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: bulkProcess.url(

    queryOptions
   ),
    method: 'post',
})

bulkProcess.form = bulkProcessForm

/**
* @see \App\Http\Controllers\Api\ReturnController::index
* @see app/Http/Controllers/Api/ReturnController.php:35
* @route '/api/returns'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/returns',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::index
* @see app/Http/Controllers/Api/ReturnController.php:35
* @route '/api/returns'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::index
* @see app/Http/Controllers/Api/ReturnController.php:35
* @route '/api/returns'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::index
* @see app/Http/Controllers/Api/ReturnController.php:35
* @route '/api/returns'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::index
* @see app/Http/Controllers/Api/ReturnController.php:35
* @route '/api/returns'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::index
* @see app/Http/Controllers/Api/ReturnController.php:35
* @route '/api/returns'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::index
* @see app/Http/Controllers/Api/ReturnController.php:35
* @route '/api/returns'
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
* @see \App\Http\Controllers\Api\ReturnController::getAll
* @see app/Http/Controllers/Api/ReturnController.php:163
* @route '/api/returns/all'
*/
export const getAll = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAll.url(queryOptions),
    method: 'get',
})

getAll.definition = {
    methods: ["get","head"],
    url: '/api/returns/all',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::getAll
* @see app/Http/Controllers/Api/ReturnController.php:163
* @route '/api/returns/all'
*/
getAll.url = (queryOptions?: RouteQueryOptions) => {




    return getAll.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::getAll
* @see app/Http/Controllers/Api/ReturnController.php:163
* @route '/api/returns/all'
*/
getAll.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAll.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getAll
* @see app/Http/Controllers/Api/ReturnController.php:163
* @route '/api/returns/all'
*/
getAll.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAll.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getAll
* @see app/Http/Controllers/Api/ReturnController.php:163
* @route '/api/returns/all'
*/
const getAllForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getAll
* @see app/Http/Controllers/Api/ReturnController.php:163
* @route '/api/returns/all'
*/
getAllForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::getAll
* @see app/Http/Controllers/Api/ReturnController.php:163
* @route '/api/returns/all'
*/
getAllForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAll.form = getAllForm

/**
* @see \App\Http\Controllers\Api\ReturnController::store
* @see app/Http/Controllers/Api/ReturnController.php:501
* @route '/api/returns'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/returns',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::store
* @see app/Http/Controllers/Api/ReturnController.php:501
* @route '/api/returns'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::store
* @see app/Http/Controllers/Api/ReturnController.php:501
* @route '/api/returns'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::store
* @see app/Http/Controllers/Api/ReturnController.php:501
* @route '/api/returns'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::store
* @see app/Http/Controllers/Api/ReturnController.php:501
* @route '/api/returns'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Api\ReturnController::show
* @see app/Http/Controllers/Api/ReturnController.php:782
* @route '/api/returns/{return}'
*/
export const show = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/returns/{return}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::show
* @see app/Http/Controllers/Api/ReturnController.php:782
* @route '/api/returns/{return}'
*/
show.url = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { return: args }
    }


    if (Array.isArray(args)) {
        args = {
            return: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        return: args.return,
    }

    return show.definition.url
            .replace('{return}', parsedArgs.return.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::show
* @see app/Http/Controllers/Api/ReturnController.php:782
* @route '/api/returns/{return}'
*/
show.get = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::show
* @see app/Http/Controllers/Api/ReturnController.php:782
* @route '/api/returns/{return}'
*/
show.head = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::show
* @see app/Http/Controllers/Api/ReturnController.php:782
* @route '/api/returns/{return}'
*/
const showForm = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::show
* @see app/Http/Controllers/Api/ReturnController.php:782
* @route '/api/returns/{return}'
*/
showForm.get = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::show
* @see app/Http/Controllers/Api/ReturnController.php:782
* @route '/api/returns/{return}'
*/
showForm.head = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Api\ReturnController::update
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
export const update = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/returns/{return}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::update
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
update.url = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { return: args }
    }


    if (Array.isArray(args)) {
        args = {
            return: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        return: args.return,
    }

    return update.definition.url
            .replace('{return}', parsedArgs.return.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::update
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
update.put = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::update
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
const updateForm = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::update
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
updateForm.put = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Api\ReturnController::destroy
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
export const destroy = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/returns/{return}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::destroy
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
destroy.url = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { return: args }
    }


    if (Array.isArray(args)) {
        args = {
            return: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        return: args.return,
    }

    return destroy.definition.url
            .replace('{return}', parsedArgs.return.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::destroy
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
destroy.delete = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::destroy
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
const destroyForm = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::destroy
* @see app/Http/Controllers/Api/ReturnController.php:0
* @route '/api/returns/{return}'
*/
destroyForm.delete = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Api\ReturnController::deleteAll
* @see app/Http/Controllers/Api/ReturnController.php:1292
* @route '/api/returns/delete-all'
*/
export const deleteAll = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

deleteAll.definition = {
    methods: ["post"],
    url: '/api/returns/delete-all',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::deleteAll
* @see app/Http/Controllers/Api/ReturnController.php:1292
* @route '/api/returns/delete-all'
*/
deleteAll.url = (queryOptions?: RouteQueryOptions) => {




    return deleteAll.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::deleteAll
* @see app/Http/Controllers/Api/ReturnController.php:1292
* @route '/api/returns/delete-all'
*/
deleteAll.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::deleteAll
* @see app/Http/Controllers/Api/ReturnController.php:1292
* @route '/api/returns/delete-all'
*/
const deleteAllForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::deleteAll
* @see app/Http/Controllers/Api/ReturnController.php:1292
* @route '/api/returns/delete-all'
*/
deleteAllForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

deleteAll.form = deleteAllForm

/**
* @see \App\Http\Controllers\Api\ReturnController::processInventoryAdjustment
* @see app/Http/Controllers/Api/ReturnController.php:800
* @route '/api/returns/{return}/adjust-inventory'
*/
export const processInventoryAdjustment = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processInventoryAdjustment.url(args, queryOptions),
    method: 'post',
})

processInventoryAdjustment.definition = {
    methods: ["post"],
    url: '/api/returns/{return}/adjust-inventory',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::processInventoryAdjustment
* @see app/Http/Controllers/Api/ReturnController.php:800
* @route '/api/returns/{return}/adjust-inventory'
*/
processInventoryAdjustment.url = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { return: args }
    }


    if (Array.isArray(args)) {
        args = {
            return: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        return: args.return,
    }

    return processInventoryAdjustment.definition.url
            .replace('{return}', parsedArgs.return.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::processInventoryAdjustment
* @see app/Http/Controllers/Api/ReturnController.php:800
* @route '/api/returns/{return}/adjust-inventory'
*/
processInventoryAdjustment.post = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processInventoryAdjustment.url(args, queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::processInventoryAdjustment
* @see app/Http/Controllers/Api/ReturnController.php:800
* @route '/api/returns/{return}/adjust-inventory'
*/
const processInventoryAdjustmentForm = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processInventoryAdjustment.url(
    args,
    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::processInventoryAdjustment
* @see app/Http/Controllers/Api/ReturnController.php:800
* @route '/api/returns/{return}/adjust-inventory'
*/
processInventoryAdjustmentForm.post = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processInventoryAdjustment.url(
    args,
    queryOptions
   ),
    method: 'post',
})

processInventoryAdjustment.form = processInventoryAdjustmentForm

/**
* @see \App\Http\Controllers\Api\ReturnController::cancelReturn
* @see app/Http/Controllers/Api/ReturnController.php:898
* @route '/api/returns/{return}/cancel'
*/
export const cancelReturn = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: cancelReturn.url(args, queryOptions),
    method: 'delete',
})

cancelReturn.definition = {
    methods: ["delete"],
    url: '/api/returns/{return}/cancel',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\ReturnController::cancelReturn
* @see app/Http/Controllers/Api/ReturnController.php:898
* @route '/api/returns/{return}/cancel'
*/
cancelReturn.url = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { return: args }
    }


    if (Array.isArray(args)) {
        args = {
            return: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        return: args.return,
    }

    return cancelReturn.definition.url
            .replace('{return}', parsedArgs.return.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReturnController::cancelReturn
* @see app/Http/Controllers/Api/ReturnController.php:898
* @route '/api/returns/{return}/cancel'
*/
cancelReturn.delete = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: cancelReturn.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::cancelReturn
* @see app/Http/Controllers/Api/ReturnController.php:898
* @route '/api/returns/{return}/cancel'
*/
const cancelReturnForm = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancelReturn.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReturnController::cancelReturn
* @see app/Http/Controllers/Api/ReturnController.php:898
* @route '/api/returns/{return}/cancel'
*/
cancelReturnForm.delete = (args: { return: string | number } | [returnParam: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cancelReturn.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

cancelReturn.form = cancelReturnForm

const ReturnController = { getStatistics, getAnalytics, exportReturns, searchTransactionHistory, bulkProcess, index, getAll, store, show, update, destroy, deleteAll, processInventoryAdjustment, cancelReturn }

export default ReturnController