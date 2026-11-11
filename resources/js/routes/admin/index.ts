import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import loginDf2c2a from './login'
/**
* @see routes/web.php:46
* @route '/admin/point-of-sale'
*/
export const pointOfSale = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pointOfSale.url(queryOptions),
    method: 'get',
})

pointOfSale.definition = {
    methods: ["get","head"],
    url: '/admin/point-of-sale',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:46
* @route '/admin/point-of-sale'
*/
pointOfSale.url = (queryOptions?: RouteQueryOptions) => {




    return pointOfSale.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:46
* @route '/admin/point-of-sale'
*/
pointOfSale.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pointOfSale.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:46
* @route '/admin/point-of-sale'
*/
pointOfSale.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pointOfSale.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:46
* @route '/admin/point-of-sale'
*/
const pointOfSaleForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pointOfSale.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:46
* @route '/admin/point-of-sale'
*/
pointOfSaleForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pointOfSale.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:46
* @route '/admin/point-of-sale'
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
* @see routes/web.php:50
* @route '/admin/inventory'
*/
export const inventory = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: inventory.url(queryOptions),
    method: 'get',
})

inventory.definition = {
    methods: ["get","head"],
    url: '/admin/inventory',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:50
* @route '/admin/inventory'
*/
inventory.url = (queryOptions?: RouteQueryOptions) => {




    return inventory.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:50
* @route '/admin/inventory'
*/
inventory.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: inventory.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:50
* @route '/admin/inventory'
*/
inventory.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: inventory.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:50
* @route '/admin/inventory'
*/
const inventoryForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: inventory.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:50
* @route '/admin/inventory'
*/
inventoryForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: inventory.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:50
* @route '/admin/inventory'
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
* @see routes/web.php:54
* @route '/admin/suppliers'
*/
export const suppliers = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: suppliers.url(queryOptions),
    method: 'get',
})

suppliers.definition = {
    methods: ["get","head"],
    url: '/admin/suppliers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:54
* @route '/admin/suppliers'
*/
suppliers.url = (queryOptions?: RouteQueryOptions) => {




    return suppliers.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:54
* @route '/admin/suppliers'
*/
suppliers.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: suppliers.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:54
* @route '/admin/suppliers'
*/
suppliers.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: suppliers.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:54
* @route '/admin/suppliers'
*/
const suppliersForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: suppliers.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:54
* @route '/admin/suppliers'
*/
suppliersForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: suppliers.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:54
* @route '/admin/suppliers'
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
* @see routes/web.php:58
* @route '/admin/supplier-returns'
*/
export const supplierReturns = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: supplierReturns.url(queryOptions),
    method: 'get',
})

supplierReturns.definition = {
    methods: ["get","head"],
    url: '/admin/supplier-returns',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:58
* @route '/admin/supplier-returns'
*/
supplierReturns.url = (queryOptions?: RouteQueryOptions) => {




    return supplierReturns.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:58
* @route '/admin/supplier-returns'
*/
supplierReturns.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: supplierReturns.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:58
* @route '/admin/supplier-returns'
*/
supplierReturns.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: supplierReturns.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:58
* @route '/admin/supplier-returns'
*/
const supplierReturnsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: supplierReturns.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:58
* @route '/admin/supplier-returns'
*/
supplierReturnsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: supplierReturns.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:58
* @route '/admin/supplier-returns'
*/
supplierReturnsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: supplierReturns.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

supplierReturns.form = supplierReturnsForm

/**
* @see routes/web.php:62
* @route '/admin/expenses'
*/
export const expenses = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expenses.url(queryOptions),
    method: 'get',
})

expenses.definition = {
    methods: ["get","head"],
    url: '/admin/expenses',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:62
* @route '/admin/expenses'
*/
expenses.url = (queryOptions?: RouteQueryOptions) => {




    return expenses.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:62
* @route '/admin/expenses'
*/
expenses.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expenses.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:62
* @route '/admin/expenses'
*/
expenses.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: expenses.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:62
* @route '/admin/expenses'
*/
const expensesForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expenses.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:62
* @route '/admin/expenses'
*/
expensesForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expenses.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:62
* @route '/admin/expenses'
*/
expensesForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: expenses.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

expenses.form = expensesForm

/**
* @see routes/web.php:66
* @route '/admin/purchases'
*/
export const purchases = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: purchases.url(queryOptions),
    method: 'get',
})

purchases.definition = {
    methods: ["get","head"],
    url: '/admin/purchases',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:66
* @route '/admin/purchases'
*/
purchases.url = (queryOptions?: RouteQueryOptions) => {




    return purchases.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:66
* @route '/admin/purchases'
*/
purchases.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: purchases.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:66
* @route '/admin/purchases'
*/
purchases.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: purchases.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:66
* @route '/admin/purchases'
*/
const purchasesForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: purchases.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:66
* @route '/admin/purchases'
*/
purchasesForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: purchases.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:66
* @route '/admin/purchases'
*/
purchasesForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: purchases.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

purchases.form = purchasesForm

/**
* @see routes/web.php:70
* @route '/admin/returns'
*/
export const returns = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: returns.url(queryOptions),
    method: 'get',
})

returns.definition = {
    methods: ["get","head"],
    url: '/admin/returns',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:70
* @route '/admin/returns'
*/
returns.url = (queryOptions?: RouteQueryOptions) => {




    return returns.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:70
* @route '/admin/returns'
*/
returns.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: returns.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:70
* @route '/admin/returns'
*/
returns.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: returns.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:70
* @route '/admin/returns'
*/
const returnsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: returns.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:70
* @route '/admin/returns'
*/
returnsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: returns.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:70
* @route '/admin/returns'
*/
returnsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: returns.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

returns.form = returnsForm

/**
* @see routes/web.php:74
* @route '/admin/reports'
*/
export const reports = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reports.url(queryOptions),
    method: 'get',
})

reports.definition = {
    methods: ["get","head"],
    url: '/admin/reports',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:74
* @route '/admin/reports'
*/
reports.url = (queryOptions?: RouteQueryOptions) => {




    return reports.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:74
* @route '/admin/reports'
*/
reports.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: reports.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:74
* @route '/admin/reports'
*/
reports.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: reports.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:74
* @route '/admin/reports'
*/
const reportsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reports.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:74
* @route '/admin/reports'
*/
reportsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reports.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:74
* @route '/admin/reports'
*/
reportsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: reports.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

reports.form = reportsForm

/**
* @see routes/web.php:78
* @route '/admin/settings'
*/
export const settings = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: settings.url(queryOptions),
    method: 'get',
})

settings.definition = {
    methods: ["get","head"],
    url: '/admin/settings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:78
* @route '/admin/settings'
*/
settings.url = (queryOptions?: RouteQueryOptions) => {




    return settings.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:78
* @route '/admin/settings'
*/
settings.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: settings.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:78
* @route '/admin/settings'
*/
settings.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: settings.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:78
* @route '/admin/settings'
*/
const settingsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: settings.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:78
* @route '/admin/settings'
*/
settingsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: settings.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:78
* @route '/admin/settings'
*/
settingsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: settings.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

settings.form = settingsForm

/**
* @see routes/web.php:82
* @route '/admin/transactions'
*/
export const transactions = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: transactions.url(queryOptions),
    method: 'get',
})

transactions.definition = {
    methods: ["get","head"],
    url: '/admin/transactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:82
* @route '/admin/transactions'
*/
transactions.url = (queryOptions?: RouteQueryOptions) => {




    return transactions.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:82
* @route '/admin/transactions'
*/
transactions.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: transactions.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:82
* @route '/admin/transactions'
*/
transactions.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: transactions.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:82
* @route '/admin/transactions'
*/
const transactionsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: transactions.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:82
* @route '/admin/transactions'
*/
transactionsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: transactions.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:82
* @route '/admin/transactions'
*/
transactionsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: transactions.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

transactions.form = transactionsForm

/**
* @see routes/web.php:86
* @route '/admin/users'
*/
export const users = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: users.url(queryOptions),
    method: 'get',
})

users.definition = {
    methods: ["get","head"],
    url: '/admin/users',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:86
* @route '/admin/users'
*/
users.url = (queryOptions?: RouteQueryOptions) => {




    return users.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:86
* @route '/admin/users'
*/
users.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: users.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:86
* @route '/admin/users'
*/
users.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: users.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:86
* @route '/admin/users'
*/
const usersForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: users.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:86
* @route '/admin/users'
*/
usersForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: users.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:86
* @route '/admin/users'
*/
usersForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: users.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

users.form = usersForm

/**
* @see routes/web.php:90
* @route '/admin/print-barcode'
*/
export const printBarcode = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: printBarcode.url(queryOptions),
    method: 'get',
})

printBarcode.definition = {
    methods: ["get","head"],
    url: '/admin/print-barcode',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:90
* @route '/admin/print-barcode'
*/
printBarcode.url = (queryOptions?: RouteQueryOptions) => {




    return printBarcode.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:90
* @route '/admin/print-barcode'
*/
printBarcode.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: printBarcode.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:90
* @route '/admin/print-barcode'
*/
printBarcode.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: printBarcode.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:90
* @route '/admin/print-barcode'
*/
const printBarcodeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: printBarcode.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:90
* @route '/admin/print-barcode'
*/
printBarcodeForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: printBarcode.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:90
* @route '/admin/print-barcode'
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
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/admin/login'
*/
export const login = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/admin/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/admin/login'
*/
login.url = (queryOptions?: RouteQueryOptions) => {




    return login.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/admin/login'
*/
login.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/admin/login'
*/
login.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/admin/login'
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
* @route '/admin/login'
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
* @route '/admin/login'
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
* @route '/admin/logout'
*/
export const logout = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(queryOptions),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/admin/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/admin/logout'
*/
logout.url = (queryOptions?: RouteQueryOptions) => {




    return logout.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/admin/logout'
*/
logout.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/admin/logout'
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
* @route '/admin/logout'
*/
logoutForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(

    queryOptions
   ),
    method: 'post',
})

logout.form = logoutForm



const admin = {
    pointOfSale: Object.assign(pointOfSale, pointOfSale),
    inventory: Object.assign(inventory, inventory),
    suppliers: Object.assign(suppliers, suppliers),
    supplierReturns: Object.assign(supplierReturns, supplierReturns),
    expenses: Object.assign(expenses, expenses),
    purchases: Object.assign(purchases, purchases),
    returns: Object.assign(returns, returns),
    reports: Object.assign(reports, reports),
    settings: Object.assign(settings, settings),
    transactions: Object.assign(transactions, transactions),
    users: Object.assign(users, users),
    printBarcode: Object.assign(printBarcode, printBarcode),
    login: Object.assign(login, loginDf2c2a),
    logout: Object.assign(logout, logout),
}

export default admin