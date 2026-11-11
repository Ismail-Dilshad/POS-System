import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SupplierReturnController::index
* @see app/Http/Controllers/SupplierReturnController.php:33
* @route '/api/supplier-returns'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/supplier-returns',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierReturnController::index
* @see app/Http/Controllers/SupplierReturnController.php:33
* @route '/api/supplier-returns'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierReturnController::index
* @see app/Http/Controllers/SupplierReturnController.php:33
* @route '/api/supplier-returns'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::index
* @see app/Http/Controllers/SupplierReturnController.php:33
* @route '/api/supplier-returns'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::index
* @see app/Http/Controllers/SupplierReturnController.php:33
* @route '/api/supplier-returns'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::index
* @see app/Http/Controllers/SupplierReturnController.php:33
* @route '/api/supplier-returns'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::index
* @see app/Http/Controllers/SupplierReturnController.php:33
* @route '/api/supplier-returns'
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
* @see \App\Http\Controllers\SupplierReturnController::getStatistics
* @see app/Http/Controllers/SupplierReturnController.php:159
* @route '/api/supplier-returns/statistics'
*/
export const getStatistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatistics.url(queryOptions),
    method: 'get',
})

getStatistics.definition = {
    methods: ["get","head"],
    url: '/api/supplier-returns/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierReturnController::getStatistics
* @see app/Http/Controllers/SupplierReturnController.php:159
* @route '/api/supplier-returns/statistics'
*/
getStatistics.url = (queryOptions?: RouteQueryOptions) => {




    return getStatistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierReturnController::getStatistics
* @see app/Http/Controllers/SupplierReturnController.php:159
* @route '/api/supplier-returns/statistics'
*/
getStatistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getStatistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::getStatistics
* @see app/Http/Controllers/SupplierReturnController.php:159
* @route '/api/supplier-returns/statistics'
*/
getStatistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getStatistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::getStatistics
* @see app/Http/Controllers/SupplierReturnController.php:159
* @route '/api/supplier-returns/statistics'
*/
const getStatisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::getStatistics
* @see app/Http/Controllers/SupplierReturnController.php:159
* @route '/api/supplier-returns/statistics'
*/
getStatisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::getStatistics
* @see app/Http/Controllers/SupplierReturnController.php:159
* @route '/api/supplier-returns/statistics'
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
* @see \App\Http\Controllers\SupplierReturnController::getAll
* @see app/Http/Controllers/SupplierReturnController.php:229
* @route '/api/supplier-returns/all'
*/
export const getAll = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAll.url(queryOptions),
    method: 'get',
})

getAll.definition = {
    methods: ["get","head"],
    url: '/api/supplier-returns/all',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierReturnController::getAll
* @see app/Http/Controllers/SupplierReturnController.php:229
* @route '/api/supplier-returns/all'
*/
getAll.url = (queryOptions?: RouteQueryOptions) => {




    return getAll.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierReturnController::getAll
* @see app/Http/Controllers/SupplierReturnController.php:229
* @route '/api/supplier-returns/all'
*/
getAll.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAll.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::getAll
* @see app/Http/Controllers/SupplierReturnController.php:229
* @route '/api/supplier-returns/all'
*/
getAll.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAll.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::getAll
* @see app/Http/Controllers/SupplierReturnController.php:229
* @route '/api/supplier-returns/all'
*/
const getAllForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::getAll
* @see app/Http/Controllers/SupplierReturnController.php:229
* @route '/api/supplier-returns/all'
*/
getAllForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::getAll
* @see app/Http/Controllers/SupplierReturnController.php:229
* @route '/api/supplier-returns/all'
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
* @see \App\Http\Controllers\SupplierReturnController::show
* @see app/Http/Controllers/SupplierReturnController.php:367
* @route '/api/supplier-returns/{id}'
*/
export const show = (args: { id: string | number } | [id: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/supplier-returns/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierReturnController::show
* @see app/Http/Controllers/SupplierReturnController.php:367
* @route '/api/supplier-returns/{id}'
*/
show.url = (args: { id: string | number } | [id: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { id: args }
    }


    if (Array.isArray(args)) {
        args = {
            id: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        id: args.id,
    }

    return show.definition.url
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierReturnController::show
* @see app/Http/Controllers/SupplierReturnController.php:367
* @route '/api/supplier-returns/{id}'
*/
show.get = (args: { id: string | number } | [id: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::show
* @see app/Http/Controllers/SupplierReturnController.php:367
* @route '/api/supplier-returns/{id}'
*/
show.head = (args: { id: string | number } | [id: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::show
* @see app/Http/Controllers/SupplierReturnController.php:367
* @route '/api/supplier-returns/{id}'
*/
const showForm = (args: { id: string | number } | [id: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::show
* @see app/Http/Controllers/SupplierReturnController.php:367
* @route '/api/supplier-returns/{id}'
*/
showForm.get = (args: { id: string | number } | [id: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::show
* @see app/Http/Controllers/SupplierReturnController.php:367
* @route '/api/supplier-returns/{id}'
*/
showForm.head = (args: { id: string | number } | [id: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\SupplierReturnController::processReturn
* @see app/Http/Controllers/SupplierReturnController.php:390
* @route '/api/supplier-returns/process'
*/
export const processReturn = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processReturn.url(queryOptions),
    method: 'post',
})

processReturn.definition = {
    methods: ["post"],
    url: '/api/supplier-returns/process',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SupplierReturnController::processReturn
* @see app/Http/Controllers/SupplierReturnController.php:390
* @route '/api/supplier-returns/process'
*/
processReturn.url = (queryOptions?: RouteQueryOptions) => {




    return processReturn.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierReturnController::processReturn
* @see app/Http/Controllers/SupplierReturnController.php:390
* @route '/api/supplier-returns/process'
*/
processReturn.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processReturn.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::processReturn
* @see app/Http/Controllers/SupplierReturnController.php:390
* @route '/api/supplier-returns/process'
*/
const processReturnForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processReturn.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::processReturn
* @see app/Http/Controllers/SupplierReturnController.php:390
* @route '/api/supplier-returns/process'
*/
processReturnForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processReturn.url(

    queryOptions
   ),
    method: 'post',
})

processReturn.form = processReturnForm

/**
* @see \App\Http\Controllers\SupplierReturnController::deleteAll
* @see app/Http/Controllers/SupplierReturnController.php:563
* @route '/api/supplier-returns/delete-all'
*/
export const deleteAll = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

deleteAll.definition = {
    methods: ["post"],
    url: '/api/supplier-returns/delete-all',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SupplierReturnController::deleteAll
* @see app/Http/Controllers/SupplierReturnController.php:563
* @route '/api/supplier-returns/delete-all'
*/
deleteAll.url = (queryOptions?: RouteQueryOptions) => {




    return deleteAll.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierReturnController::deleteAll
* @see app/Http/Controllers/SupplierReturnController.php:563
* @route '/api/supplier-returns/delete-all'
*/
deleteAll.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::deleteAll
* @see app/Http/Controllers/SupplierReturnController.php:563
* @route '/api/supplier-returns/delete-all'
*/
const deleteAllForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierReturnController::deleteAll
* @see app/Http/Controllers/SupplierReturnController.php:563
* @route '/api/supplier-returns/delete-all'
*/
deleteAllForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

deleteAll.form = deleteAllForm

const SupplierReturnController = { index, getStatistics, getAll, show, processReturn, deleteAll }

export default SupplierReturnController