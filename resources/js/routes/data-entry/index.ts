import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import loginDf2c2a from './login'
/**
* @see routes/web.php:109
* @route '/data-entry/inventory'
*/
export const inventory = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: inventory.url(queryOptions),
    method: 'get',
})

inventory.definition = {
    methods: ["get","head"],
    url: '/data-entry/inventory',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:109
* @route '/data-entry/inventory'
*/
inventory.url = (queryOptions?: RouteQueryOptions) => {




    return inventory.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:109
* @route '/data-entry/inventory'
*/
inventory.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: inventory.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:109
* @route '/data-entry/inventory'
*/
inventory.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: inventory.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:109
* @route '/data-entry/inventory'
*/
const inventoryForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: inventory.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:109
* @route '/data-entry/inventory'
*/
inventoryForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: inventory.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:109
* @route '/data-entry/inventory'
*/
inventoryForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: inventory.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

inventory.form = inventoryForm

/**
* @see routes/web.php:113
* @route '/data-entry/purchase'
*/
export const purchase = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: purchase.url(queryOptions),
    method: 'get',
})

purchase.definition = {
    methods: ["get","head"],
    url: '/data-entry/purchase',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:113
* @route '/data-entry/purchase'
*/
purchase.url = (queryOptions?: RouteQueryOptions) => {




    return purchase.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:113
* @route '/data-entry/purchase'
*/
purchase.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: purchase.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:113
* @route '/data-entry/purchase'
*/
purchase.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: purchase.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:113
* @route '/data-entry/purchase'
*/
const purchaseForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: purchase.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:113
* @route '/data-entry/purchase'
*/
purchaseForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: purchase.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:113
* @route '/data-entry/purchase'
*/
purchaseForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: purchase.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

purchase.form = purchaseForm

/**
* @see routes/web.php:117
* @route '/data-entry/point-of-sale'
*/
export const pointOfSale = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pointOfSale.url(queryOptions),
    method: 'get',
})

pointOfSale.definition = {
    methods: ["get","head"],
    url: '/data-entry/point-of-sale',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:117
* @route '/data-entry/point-of-sale'
*/
pointOfSale.url = (queryOptions?: RouteQueryOptions) => {




    return pointOfSale.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:117
* @route '/data-entry/point-of-sale'
*/
pointOfSale.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pointOfSale.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:117
* @route '/data-entry/point-of-sale'
*/
pointOfSale.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pointOfSale.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:117
* @route '/data-entry/point-of-sale'
*/
const pointOfSaleForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pointOfSale.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:117
* @route '/data-entry/point-of-sale'
*/
pointOfSaleForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pointOfSale.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:117
* @route '/data-entry/point-of-sale'
*/
pointOfSaleForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pointOfSale.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

pointOfSale.form = pointOfSaleForm

/**
* @see routes/web.php:121
* @route '/data-entry/suppliers'
*/
export const suppliers = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: suppliers.url(queryOptions),
    method: 'get',
})

suppliers.definition = {
    methods: ["get","head"],
    url: '/data-entry/suppliers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:121
* @route '/data-entry/suppliers'
*/
suppliers.url = (queryOptions?: RouteQueryOptions) => {




    return suppliers.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:121
* @route '/data-entry/suppliers'
*/
suppliers.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: suppliers.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:121
* @route '/data-entry/suppliers'
*/
suppliers.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: suppliers.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:121
* @route '/data-entry/suppliers'
*/
const suppliersForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: suppliers.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:121
* @route '/data-entry/suppliers'
*/
suppliersForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: suppliers.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:121
* @route '/data-entry/suppliers'
*/
suppliersForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: suppliers.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

suppliers.form = suppliersForm

/**
* @see routes/web.php:125
* @route '/data-entry/print-barcode'
*/
export const printBarcode = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: printBarcode.url(queryOptions),
    method: 'get',
})

printBarcode.definition = {
    methods: ["get","head"],
    url: '/data-entry/print-barcode',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:125
* @route '/data-entry/print-barcode'
*/
printBarcode.url = (queryOptions?: RouteQueryOptions) => {




    return printBarcode.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:125
* @route '/data-entry/print-barcode'
*/
printBarcode.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: printBarcode.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:125
* @route '/data-entry/print-barcode'
*/
printBarcode.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: printBarcode.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:125
* @route '/data-entry/print-barcode'
*/
const printBarcodeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: printBarcode.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:125
* @route '/data-entry/print-barcode'
*/
printBarcodeForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: printBarcode.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:125
* @route '/data-entry/print-barcode'
*/
printBarcodeForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: printBarcode.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

printBarcode.form = printBarcodeForm

/**
* @see routes/web.php:129
* @route '/data-entry/supplier-return'
*/
export const supplierReturn = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: supplierReturn.url(queryOptions),
    method: 'get',
})

supplierReturn.definition = {
    methods: ["get","head"],
    url: '/data-entry/supplier-return',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:129
* @route '/data-entry/supplier-return'
*/
supplierReturn.url = (queryOptions?: RouteQueryOptions) => {




    return supplierReturn.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:129
* @route '/data-entry/supplier-return'
*/
supplierReturn.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: supplierReturn.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:129
* @route '/data-entry/supplier-return'
*/
supplierReturn.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: supplierReturn.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:129
* @route '/data-entry/supplier-return'
*/
const supplierReturnForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: supplierReturn.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:129
* @route '/data-entry/supplier-return'
*/
supplierReturnForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: supplierReturn.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:129
* @route '/data-entry/supplier-return'
*/
supplierReturnForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: supplierReturn.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

supplierReturn.form = supplierReturnForm

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/data-entry/login'
*/
export const login = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/data-entry/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/data-entry/login'
*/
login.url = (queryOptions?: RouteQueryOptions) => {




    return login.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/data-entry/login'
*/
login.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/data-entry/login'
*/
login.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/data-entry/login'
*/
const loginForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/data-entry/login'
*/
loginForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/data-entry/login'
*/
loginForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

login.form = loginForm

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/data-entry/logout'
*/
export const logout = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(queryOptions),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/data-entry/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/data-entry/logout'
*/
logout.url = (queryOptions?: RouteQueryOptions) => {




    return logout.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/data-entry/logout'
*/
logout.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/data-entry/logout'
*/
const logoutForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/data-entry/logout'
*/
logoutForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(

    queryOptions
   ),
    method: 'post',
})

logout.form = logoutForm



const dataEntry = {
    inventory: Object.assign(inventory, inventory),
    purchase: Object.assign(purchase, purchase),
    pointOfSale: Object.assign(pointOfSale, pointOfSale),
    suppliers: Object.assign(suppliers, suppliers),
    printBarcode: Object.assign(printBarcode, printBarcode),
    supplierReturn: Object.assign(supplierReturn, supplierReturn),
    login: Object.assign(login, loginDf2c2a),
    logout: Object.assign(logout, logout),
}

export default dataEntry