import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printTest
* @see app/Http/Controllers/Api/ReceiptPrintController.php:12
* @route '/api/receipt/print-test'
*/
export const printTest = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: printTest.url(queryOptions),
    method: 'post',
})

printTest.definition = {
    methods: ["post"],
    url: '/api/receipt/print-test',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printTest
* @see app/Http/Controllers/Api/ReceiptPrintController.php:12
* @route '/api/receipt/print-test'
*/
printTest.url = (queryOptions?: RouteQueryOptions) => {




    return printTest.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printTest
* @see app/Http/Controllers/Api/ReceiptPrintController.php:12
* @route '/api/receipt/print-test'
*/
printTest.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: printTest.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printTest
* @see app/Http/Controllers/Api/ReceiptPrintController.php:12
* @route '/api/receipt/print-test'
*/
const printTestForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: printTest.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printTest
* @see app/Http/Controllers/Api/ReceiptPrintController.php:12
* @route '/api/receipt/print-test'
*/
printTestForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: printTest.url(

    queryOptions
   ),
    method: 'post',
})

printTest.form = printTestForm

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:60
* @route '/api/receipt/print'
*/
export const printReceipt = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: printReceipt.url(queryOptions),
    method: 'post',
})

printReceipt.definition = {
    methods: ["post"],
    url: '/api/receipt/print',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:60
* @route '/api/receipt/print'
*/
printReceipt.url = (queryOptions?: RouteQueryOptions) => {




    return printReceipt.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:60
* @route '/api/receipt/print'
*/
printReceipt.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: printReceipt.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:60
* @route '/api/receipt/print'
*/
const printReceiptForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: printReceipt.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::printReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:60
* @route '/api/receipt/print'
*/
printReceiptForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: printReceipt.url(

    queryOptions
   ),
    method: 'post',
})

printReceipt.form = printReceiptForm

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::streamReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:140
* @route '/api/receipt/stream'
*/
export const streamReceipt = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: streamReceipt.url(queryOptions),
    method: 'post',
})

streamReceipt.definition = {
    methods: ["post"],
    url: '/api/receipt/stream',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::streamReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:140
* @route '/api/receipt/stream'
*/
streamReceipt.url = (queryOptions?: RouteQueryOptions) => {




    return streamReceipt.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::streamReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:140
* @route '/api/receipt/stream'
*/
streamReceipt.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: streamReceipt.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::streamReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:140
* @route '/api/receipt/stream'
*/
const streamReceiptForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: streamReceipt.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ReceiptPrintController::streamReceipt
* @see app/Http/Controllers/Api/ReceiptPrintController.php:140
* @route '/api/receipt/stream'
*/
streamReceiptForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: streamReceipt.url(

    queryOptions
   ),
    method: 'post',
})

streamReceipt.form = streamReceiptForm

const ReceiptPrintController = { printTest, printReceipt, streamReceipt }

export default ReceiptPrintController