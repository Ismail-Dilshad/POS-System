import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\BarcodePrintController::index
* @see app/Http/Controllers/Api/BarcodePrintController.php:18
* @route '/api/barcode/products'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/barcode/products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::index
* @see app/Http/Controllers/Api/BarcodePrintController.php:18
* @route '/api/barcode/products'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::index
* @see app/Http/Controllers/Api/BarcodePrintController.php:18
* @route '/api/barcode/products'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::index
* @see app/Http/Controllers/Api/BarcodePrintController.php:18
* @route '/api/barcode/products'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::index
* @see app/Http/Controllers/Api/BarcodePrintController.php:18
* @route '/api/barcode/products'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::index
* @see app/Http/Controllers/Api/BarcodePrintController.php:18
* @route '/api/barcode/products'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::index
* @see app/Http/Controllers/Api/BarcodePrintController.php:18
* @route '/api/barcode/products'
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
* @see \App\Http\Controllers\Api\BarcodePrintController::getPrinters
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/printers'
*/
export const getPrinters = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getPrinters.url(queryOptions),
    method: 'get',
})

getPrinters.definition = {
    methods: ["get","head"],
    url: '/api/barcode/printers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::getPrinters
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/printers'
*/
getPrinters.url = (queryOptions?: RouteQueryOptions) => {




    return getPrinters.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::getPrinters
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/printers'
*/
getPrinters.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getPrinters.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::getPrinters
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/printers'
*/
getPrinters.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getPrinters.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::getPrinters
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/printers'
*/
const getPrintersForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getPrinters.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::getPrinters
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/printers'
*/
getPrintersForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getPrinters.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::getPrinters
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/printers'
*/
getPrintersForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getPrinters.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getPrinters.form = getPrintersForm

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::printLabels
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/print-labels'
*/
export const printLabels = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: printLabels.url(queryOptions),
    method: 'post',
})

printLabels.definition = {
    methods: ["post"],
    url: '/api/barcode/print-labels',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::printLabels
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/print-labels'
*/
printLabels.url = (queryOptions?: RouteQueryOptions) => {




    return printLabels.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::printLabels
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/print-labels'
*/
printLabels.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: printLabels.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::printLabels
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/print-labels'
*/
const printLabelsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: printLabels.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\BarcodePrintController::printLabels
* @see app/Http/Controllers/Api/BarcodePrintController.php:0
* @route '/api/barcode/print-labels'
*/
printLabelsForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: printLabels.url(

    queryOptions
   ),
    method: 'post',
})

printLabels.form = printLabelsForm

const BarcodePrintController = { index, getPrinters, printLabels }

export default BarcodePrintController