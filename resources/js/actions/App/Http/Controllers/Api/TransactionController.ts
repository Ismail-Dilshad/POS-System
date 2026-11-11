import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\TransactionController::statistics
* @see app/Http/Controllers/Api/TransactionController.php:889
* @route '/api/transactions/statistics'
*/
export const statistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

statistics.definition = {
    methods: ["get","head"],
    url: '/api/transactions/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::statistics
* @see app/Http/Controllers/Api/TransactionController.php:889
* @route '/api/transactions/statistics'
*/
statistics.url = (queryOptions?: RouteQueryOptions) => {




    return statistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::statistics
* @see app/Http/Controllers/Api/TransactionController.php:889
* @route '/api/transactions/statistics'
*/
statistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::statistics
* @see app/Http/Controllers/Api/TransactionController.php:889
* @route '/api/transactions/statistics'
*/
statistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: statistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::statistics
* @see app/Http/Controllers/Api/TransactionController.php:889
* @route '/api/transactions/statistics'
*/
const statisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::statistics
* @see app/Http/Controllers/Api/TransactionController.php:889
* @route '/api/transactions/statistics'
*/
statisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::statistics
* @see app/Http/Controllers/Api/TransactionController.php:889
* @route '/api/transactions/statistics'
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
* @see \App\Http\Controllers\Api\TransactionController::getAll
* @see app/Http/Controllers/Api/TransactionController.php:258
* @route '/api/transactions/all'
*/
export const getAll = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAll.url(queryOptions),
    method: 'get',
})

getAll.definition = {
    methods: ["get","head"],
    url: '/api/transactions/all',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::getAll
* @see app/Http/Controllers/Api/TransactionController.php:258
* @route '/api/transactions/all'
*/
getAll.url = (queryOptions?: RouteQueryOptions) => {




    return getAll.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::getAll
* @see app/Http/Controllers/Api/TransactionController.php:258
* @route '/api/transactions/all'
*/
getAll.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAll.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::getAll
* @see app/Http/Controllers/Api/TransactionController.php:258
* @route '/api/transactions/all'
*/
getAll.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAll.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::getAll
* @see app/Http/Controllers/Api/TransactionController.php:258
* @route '/api/transactions/all'
*/
const getAllForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::getAll
* @see app/Http/Controllers/Api/TransactionController.php:258
* @route '/api/transactions/all'
*/
getAllForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::getAll
* @see app/Http/Controllers/Api/TransactionController.php:258
* @route '/api/transactions/all'
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
* @see \App\Http\Controllers\Api\TransactionController::getByTransactionNumber
* @see app/Http/Controllers/Api/TransactionController.php:947
* @route '/api/transactions/by-number/{transactionNumber}'
*/
export const getByTransactionNumber = (args: { transactionNumber: string | number } | [transactionNumber: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getByTransactionNumber.url(args, queryOptions),
    method: 'get',
})

getByTransactionNumber.definition = {
    methods: ["get","head"],
    url: '/api/transactions/by-number/{transactionNumber}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::getByTransactionNumber
* @see app/Http/Controllers/Api/TransactionController.php:947
* @route '/api/transactions/by-number/{transactionNumber}'
*/
getByTransactionNumber.url = (args: { transactionNumber: string | number } | [transactionNumber: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transactionNumber: args }
    }


    if (Array.isArray(args)) {
        args = {
            transactionNumber: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        transactionNumber: args.transactionNumber,
    }

    return getByTransactionNumber.definition.url
            .replace('{transactionNumber}', parsedArgs.transactionNumber.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::getByTransactionNumber
* @see app/Http/Controllers/Api/TransactionController.php:947
* @route '/api/transactions/by-number/{transactionNumber}'
*/
getByTransactionNumber.get = (args: { transactionNumber: string | number } | [transactionNumber: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getByTransactionNumber.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::getByTransactionNumber
* @see app/Http/Controllers/Api/TransactionController.php:947
* @route '/api/transactions/by-number/{transactionNumber}'
*/
getByTransactionNumber.head = (args: { transactionNumber: string | number } | [transactionNumber: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getByTransactionNumber.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::getByTransactionNumber
* @see app/Http/Controllers/Api/TransactionController.php:947
* @route '/api/transactions/by-number/{transactionNumber}'
*/
const getByTransactionNumberForm = (args: { transactionNumber: string | number } | [transactionNumber: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getByTransactionNumber.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::getByTransactionNumber
* @see app/Http/Controllers/Api/TransactionController.php:947
* @route '/api/transactions/by-number/{transactionNumber}'
*/
getByTransactionNumberForm.get = (args: { transactionNumber: string | number } | [transactionNumber: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getByTransactionNumber.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::getByTransactionNumber
* @see app/Http/Controllers/Api/TransactionController.php:947
* @route '/api/transactions/by-number/{transactionNumber}'
*/
getByTransactionNumberForm.head = (args: { transactionNumber: string | number } | [transactionNumber: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getByTransactionNumber.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getByTransactionNumber.form = getByTransactionNumberForm

/**
* @see \App\Http\Controllers\Api\TransactionController::processReturn
* @see app/Http/Controllers/Api/TransactionController.php:1396
* @route '/api/transactions/return'
*/
export const processReturn = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processReturn.url(queryOptions),
    method: 'post',
})

processReturn.definition = {
    methods: ["post"],
    url: '/api/transactions/return',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::processReturn
* @see app/Http/Controllers/Api/TransactionController.php:1396
* @route '/api/transactions/return'
*/
processReturn.url = (queryOptions?: RouteQueryOptions) => {




    return processReturn.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::processReturn
* @see app/Http/Controllers/Api/TransactionController.php:1396
* @route '/api/transactions/return'
*/
processReturn.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processReturn.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::processReturn
* @see app/Http/Controllers/Api/TransactionController.php:1396
* @route '/api/transactions/return'
*/
const processReturnForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processReturn.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::processReturn
* @see app/Http/Controllers/Api/TransactionController.php:1396
* @route '/api/transactions/return'
*/
processReturnForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processReturn.url(

    queryOptions
   ),
    method: 'post',
})

processReturn.form = processReturnForm

/**
* @see \App\Http\Controllers\Api\TransactionController::searchTransactionHistory
* @see app/Http/Controllers/Api/TransactionController.php:1013
* @route '/api/transactions/search-history/{barcode}'
*/
export const searchTransactionHistory = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchTransactionHistory.url(args, queryOptions),
    method: 'get',
})

searchTransactionHistory.definition = {
    methods: ["get","head"],
    url: '/api/transactions/search-history/{barcode}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::searchTransactionHistory
* @see app/Http/Controllers/Api/TransactionController.php:1013
* @route '/api/transactions/search-history/{barcode}'
*/
searchTransactionHistory.url = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
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

    return searchTransactionHistory.definition.url
            .replace('{barcode}', parsedArgs.barcode.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::searchTransactionHistory
* @see app/Http/Controllers/Api/TransactionController.php:1013
* @route '/api/transactions/search-history/{barcode}'
*/
searchTransactionHistory.get = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: searchTransactionHistory.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::searchTransactionHistory
* @see app/Http/Controllers/Api/TransactionController.php:1013
* @route '/api/transactions/search-history/{barcode}'
*/
searchTransactionHistory.head = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: searchTransactionHistory.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::searchTransactionHistory
* @see app/Http/Controllers/Api/TransactionController.php:1013
* @route '/api/transactions/search-history/{barcode}'
*/
const searchTransactionHistoryForm = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchTransactionHistory.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::searchTransactionHistory
* @see app/Http/Controllers/Api/TransactionController.php:1013
* @route '/api/transactions/search-history/{barcode}'
*/
searchTransactionHistoryForm.get = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchTransactionHistory.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::searchTransactionHistory
* @see app/Http/Controllers/Api/TransactionController.php:1013
* @route '/api/transactions/search-history/{barcode}'
*/
searchTransactionHistoryForm.head = (args: { barcode: string | number } | [barcode: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: searchTransactionHistory.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

searchTransactionHistory.form = searchTransactionHistoryForm

/**
* @see \App\Http\Controllers\Api\TransactionController::deleteAll
* @see app/Http/Controllers/Api/TransactionController.php:1407
* @route '/api/transactions/delete-all'
*/
export const deleteAll = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

deleteAll.definition = {
    methods: ["post"],
    url: '/api/transactions/delete-all',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::deleteAll
* @see app/Http/Controllers/Api/TransactionController.php:1407
* @route '/api/transactions/delete-all'
*/
deleteAll.url = (queryOptions?: RouteQueryOptions) => {




    return deleteAll.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::deleteAll
* @see app/Http/Controllers/Api/TransactionController.php:1407
* @route '/api/transactions/delete-all'
*/
deleteAll.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::deleteAll
* @see app/Http/Controllers/Api/TransactionController.php:1407
* @route '/api/transactions/delete-all'
*/
const deleteAllForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::deleteAll
* @see app/Http/Controllers/Api/TransactionController.php:1407
* @route '/api/transactions/delete-all'
*/
deleteAllForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

deleteAll.form = deleteAllForm

/**
* @see \App\Http\Controllers\Api\TransactionController::reportStatistics
* @see app/Http/Controllers/Api/TransactionController.php:1678
* @route '/api/transactions/report/statistics'
*/
export const reportStatistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportStatistics.url(queryOptions),
    method: 'get',
})

reportStatistics.definition = {
    methods: ["get","head"],
    url: '/api/transactions/report/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::reportStatistics
* @see app/Http/Controllers/Api/TransactionController.php:1678
* @route '/api/transactions/report/statistics'
*/
reportStatistics.url = (queryOptions?: RouteQueryOptions) => {




    return reportStatistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::reportStatistics
* @see app/Http/Controllers/Api/TransactionController.php:1678
* @route '/api/transactions/report/statistics'
*/
reportStatistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportStatistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::reportStatistics
* @see app/Http/Controllers/Api/TransactionController.php:1678
* @route '/api/transactions/report/statistics'
*/
reportStatistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportStatistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::reportStatistics
* @see app/Http/Controllers/Api/TransactionController.php:1678
* @route '/api/transactions/report/statistics'
*/
const reportStatisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::reportStatistics
* @see app/Http/Controllers/Api/TransactionController.php:1678
* @route '/api/transactions/report/statistics'
*/
reportStatisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::reportStatistics
* @see app/Http/Controllers/Api/TransactionController.php:1678
* @route '/api/transactions/report/statistics'
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
* @see \App\Http\Controllers\Api\TransactionController::reportExport
* @see app/Http/Controllers/Api/TransactionController.php:1857
* @route '/api/transactions/report/export'
*/
export const reportExport = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportExport.url(queryOptions),
    method: 'get',
})

reportExport.definition = {
    methods: ["get","head"],
    url: '/api/transactions/report/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::reportExport
* @see app/Http/Controllers/Api/TransactionController.php:1857
* @route '/api/transactions/report/export'
*/
reportExport.url = (queryOptions?: RouteQueryOptions) => {




    return reportExport.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::reportExport
* @see app/Http/Controllers/Api/TransactionController.php:1857
* @route '/api/transactions/report/export'
*/
reportExport.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reportExport.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::reportExport
* @see app/Http/Controllers/Api/TransactionController.php:1857
* @route '/api/transactions/report/export'
*/
reportExport.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reportExport.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::reportExport
* @see app/Http/Controllers/Api/TransactionController.php:1857
* @route '/api/transactions/report/export'
*/
const reportExportForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportExport.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::reportExport
* @see app/Http/Controllers/Api/TransactionController.php:1857
* @route '/api/transactions/report/export'
*/
reportExportForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reportExport.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::reportExport
* @see app/Http/Controllers/Api/TransactionController.php:1857
* @route '/api/transactions/report/export'
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
* @see \App\Http\Controllers\Api\TransactionController::report
* @see app/Http/Controllers/Api/TransactionController.php:1474
* @route '/api/transactions/report'
*/
export const report = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: report.url(queryOptions),
    method: 'get',
})

report.definition = {
    methods: ["get","head"],
    url: '/api/transactions/report',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::report
* @see app/Http/Controllers/Api/TransactionController.php:1474
* @route '/api/transactions/report'
*/
report.url = (queryOptions?: RouteQueryOptions) => {




    return report.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::report
* @see app/Http/Controllers/Api/TransactionController.php:1474
* @route '/api/transactions/report'
*/
report.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: report.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::report
* @see app/Http/Controllers/Api/TransactionController.php:1474
* @route '/api/transactions/report'
*/
report.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: report.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::report
* @see app/Http/Controllers/Api/TransactionController.php:1474
* @route '/api/transactions/report'
*/
const reportForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: report.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::report
* @see app/Http/Controllers/Api/TransactionController.php:1474
* @route '/api/transactions/report'
*/
reportForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: report.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::report
* @see app/Http/Controllers/Api/TransactionController.php:1474
* @route '/api/transactions/report'
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
* @see \App\Http\Controllers\Api\TransactionController::index
* @see app/Http/Controllers/Api/TransactionController.php:110
* @route '/api/transactions'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::index
* @see app/Http/Controllers/Api/TransactionController.php:110
* @route '/api/transactions'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::index
* @see app/Http/Controllers/Api/TransactionController.php:110
* @route '/api/transactions'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::index
* @see app/Http/Controllers/Api/TransactionController.php:110
* @route '/api/transactions'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::index
* @see app/Http/Controllers/Api/TransactionController.php:110
* @route '/api/transactions'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::index
* @see app/Http/Controllers/Api/TransactionController.php:110
* @route '/api/transactions'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::index
* @see app/Http/Controllers/Api/TransactionController.php:110
* @route '/api/transactions'
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
* @see \App\Http\Controllers\Api\TransactionController::store
* @see app/Http/Controllers/Api/TransactionController.php:500
* @route '/api/transactions'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/transactions',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::store
* @see app/Http/Controllers/Api/TransactionController.php:500
* @route '/api/transactions'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::store
* @see app/Http/Controllers/Api/TransactionController.php:500
* @route '/api/transactions'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::store
* @see app/Http/Controllers/Api/TransactionController.php:500
* @route '/api/transactions'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::store
* @see app/Http/Controllers/Api/TransactionController.php:500
* @route '/api/transactions'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Api\TransactionController::show
* @see app/Http/Controllers/Api/TransactionController.php:817
* @route '/api/transactions/{transaction}'
*/
export const show = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/transactions/{transaction}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::show
* @see app/Http/Controllers/Api/TransactionController.php:817
* @route '/api/transactions/{transaction}'
*/
show.url = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transaction: args }
    }


    if (Array.isArray(args)) {
        args = {
            transaction: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        transaction: args.transaction,
    }

    return show.definition.url
            .replace('{transaction}', parsedArgs.transaction.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::show
* @see app/Http/Controllers/Api/TransactionController.php:817
* @route '/api/transactions/{transaction}'
*/
show.get = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::show
* @see app/Http/Controllers/Api/TransactionController.php:817
* @route '/api/transactions/{transaction}'
*/
show.head = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::show
* @see app/Http/Controllers/Api/TransactionController.php:817
* @route '/api/transactions/{transaction}'
*/
const showForm = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::show
* @see app/Http/Controllers/Api/TransactionController.php:817
* @route '/api/transactions/{transaction}'
*/
showForm.get = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::show
* @see app/Http/Controllers/Api/TransactionController.php:817
* @route '/api/transactions/{transaction}'
*/
showForm.head = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Api\TransactionController::update
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
export const update = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/transactions/{transaction}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::update
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
update.url = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transaction: args }
    }


    if (Array.isArray(args)) {
        args = {
            transaction: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        transaction: args.transaction,
    }

    return update.definition.url
            .replace('{transaction}', parsedArgs.transaction.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::update
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
update.put = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::update
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
const updateForm = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::update
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
updateForm.put = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Api\TransactionController::destroy
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
export const destroy = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/transactions/{transaction}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\TransactionController::destroy
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
destroy.url = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { transaction: args }
    }


    if (Array.isArray(args)) {
        args = {
            transaction: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        transaction: args.transaction,
    }

    return destroy.definition.url
            .replace('{transaction}', parsedArgs.transaction.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\TransactionController::destroy
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
destroy.delete = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::destroy
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
const destroyForm = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\TransactionController::destroy
* @see app/Http/Controllers/Api/TransactionController.php:0
* @route '/api/transactions/{transaction}'
*/
destroyForm.delete = (args: { transaction: string | number } | [transaction: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const TransactionController = { statistics, getAll, getByTransactionNumber, processReturn, searchTransactionHistory, deleteAll, reportStatistics, reportExport, report, index, store, show, update, destroy }

export default TransactionController