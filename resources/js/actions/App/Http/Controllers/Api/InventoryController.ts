import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\InventoryController::index
* @see app/Http/Controllers/Api/InventoryController.php:710
* @route '/api/inventory'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/inventory',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\InventoryController::index
* @see app/Http/Controllers/Api/InventoryController.php:710
* @route '/api/inventory'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\InventoryController::index
* @see app/Http/Controllers/Api/InventoryController.php:710
* @route '/api/inventory'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::index
* @see app/Http/Controllers/Api/InventoryController.php:710
* @route '/api/inventory'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::index
* @see app/Http/Controllers/Api/InventoryController.php:710
* @route '/api/inventory'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::index
* @see app/Http/Controllers/Api/InventoryController.php:710
* @route '/api/inventory'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::index
* @see app/Http/Controllers/Api/InventoryController.php:710
* @route '/api/inventory'
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
* @see \App\Http\Controllers\Api\InventoryController::getComprehensiveStatistics
* @see app/Http/Controllers/Api/InventoryController.php:863
* @route '/api/inventory/statistics'
*/
export const getComprehensiveStatistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getComprehensiveStatistics.url(queryOptions),
    method: 'get',
})

getComprehensiveStatistics.definition = {
    methods: ["get","head"],
    url: '/api/inventory/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\InventoryController::getComprehensiveStatistics
* @see app/Http/Controllers/Api/InventoryController.php:863
* @route '/api/inventory/statistics'
*/
getComprehensiveStatistics.url = (queryOptions?: RouteQueryOptions) => {




    return getComprehensiveStatistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\InventoryController::getComprehensiveStatistics
* @see app/Http/Controllers/Api/InventoryController.php:863
* @route '/api/inventory/statistics'
*/
getComprehensiveStatistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getComprehensiveStatistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::getComprehensiveStatistics
* @see app/Http/Controllers/Api/InventoryController.php:863
* @route '/api/inventory/statistics'
*/
getComprehensiveStatistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getComprehensiveStatistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::getComprehensiveStatistics
* @see app/Http/Controllers/Api/InventoryController.php:863
* @route '/api/inventory/statistics'
*/
const getComprehensiveStatisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getComprehensiveStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::getComprehensiveStatistics
* @see app/Http/Controllers/Api/InventoryController.php:863
* @route '/api/inventory/statistics'
*/
getComprehensiveStatisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getComprehensiveStatistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::getComprehensiveStatistics
* @see app/Http/Controllers/Api/InventoryController.php:863
* @route '/api/inventory/statistics'
*/
getComprehensiveStatisticsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getComprehensiveStatistics.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getComprehensiveStatistics.form = getComprehensiveStatisticsForm

/**
* @see \App\Http\Controllers\Api\InventoryController::validateAdjustments
* @see app/Http/Controllers/Api/InventoryController.php:950
* @route '/api/inventory/validate-adjustments'
*/
export const validateAdjustments = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateAdjustments.url(queryOptions),
    method: 'post',
})

validateAdjustments.definition = {
    methods: ["post"],
    url: '/api/inventory/validate-adjustments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\InventoryController::validateAdjustments
* @see app/Http/Controllers/Api/InventoryController.php:950
* @route '/api/inventory/validate-adjustments'
*/
validateAdjustments.url = (queryOptions?: RouteQueryOptions) => {




    return validateAdjustments.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\InventoryController::validateAdjustments
* @see app/Http/Controllers/Api/InventoryController.php:950
* @route '/api/inventory/validate-adjustments'
*/
validateAdjustments.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateAdjustments.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::validateAdjustments
* @see app/Http/Controllers/Api/InventoryController.php:950
* @route '/api/inventory/validate-adjustments'
*/
const validateAdjustmentsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validateAdjustments.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::validateAdjustments
* @see app/Http/Controllers/Api/InventoryController.php:950
* @route '/api/inventory/validate-adjustments'
*/
validateAdjustmentsForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validateAdjustments.url(

    queryOptions
   ),
    method: 'post',
})

validateAdjustments.form = validateAdjustmentsForm

/**
* @see \App\Http\Controllers\Api\InventoryController::adjust
* @see app/Http/Controllers/Api/InventoryController.php:0
* @route '/api/inventory/adjust'
*/
export const adjust = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjust.url(queryOptions),
    method: 'post',
})

adjust.definition = {
    methods: ["post"],
    url: '/api/inventory/adjust',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\InventoryController::adjust
* @see app/Http/Controllers/Api/InventoryController.php:0
* @route '/api/inventory/adjust'
*/
adjust.url = (queryOptions?: RouteQueryOptions) => {




    return adjust.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\InventoryController::adjust
* @see app/Http/Controllers/Api/InventoryController.php:0
* @route '/api/inventory/adjust'
*/
adjust.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: adjust.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::adjust
* @see app/Http/Controllers/Api/InventoryController.php:0
* @route '/api/inventory/adjust'
*/
const adjustForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: adjust.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\InventoryController::adjust
* @see app/Http/Controllers/Api/InventoryController.php:0
* @route '/api/inventory/adjust'
*/
adjustForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: adjust.url(

    queryOptions
   ),
    method: 'post',
})

adjust.form = adjustForm

const InventoryController = { index, getComprehensiveStatistics, validateAdjustments, adjust }

export default InventoryController