import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import loginDf2c2a from './login'
/**
* @see routes/web.php:96
* @route '/cashier/point-of-sale'
*/
export const pointOfSale = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pointOfSale.url(queryOptions),
    method: 'get',
})

pointOfSale.definition = {
    methods: ["get","head"],
    url: '/cashier/point-of-sale',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:96
* @route '/cashier/point-of-sale'
*/
pointOfSale.url = (queryOptions?: RouteQueryOptions) => {




    return pointOfSale.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:96
* @route '/cashier/point-of-sale'
*/
pointOfSale.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: pointOfSale.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:96
* @route '/cashier/point-of-sale'
*/
pointOfSale.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: pointOfSale.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:96
* @route '/cashier/point-of-sale'
*/
const pointOfSaleForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pointOfSale.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:96
* @route '/cashier/point-of-sale'
*/
pointOfSaleForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: pointOfSale.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:96
* @route '/cashier/point-of-sale'
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
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/cashier/login'
*/
export const login = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/cashier/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/cashier/login'
*/
login.url = (queryOptions?: RouteQueryOptions) => {




    return login.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/cashier/login'
*/
login.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/cashier/login'
*/
login.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::login
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:19
* @route '/cashier/login'
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
* @route '/cashier/login'
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
* @route '/cashier/login'
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
* @route '/cashier/logout'
*/
export const logout = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(queryOptions),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/cashier/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/cashier/logout'
*/
logout.url = (queryOptions?: RouteQueryOptions) => {




    return logout.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/cashier/logout'
*/
logout.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/cashier/logout'
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
* @route '/cashier/logout'
*/
logoutForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(

    queryOptions
   ),
    method: 'post',
})

logout.form = logoutForm



const cashier = {
    pointOfSale: Object.assign(pointOfSale, pointOfSale),
    login: Object.assign(login, loginDf2c2a),
    logout: Object.assign(logout, logout),
}

export default cashier