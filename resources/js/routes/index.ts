import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../wayfinder'
/**
* @see routes/auth.php:14
* @route '/login'
*/
export const login = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/auth.php:14
* @route '/login'
*/
login.url = (queryOptions?: RouteQueryOptions) => {




    return login.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/auth.php:14
* @route '/login'
*/
login.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

/**
* @see routes/auth.php:14
* @route '/login'
*/
login.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(queryOptions),
    method: 'head',
})

/**
* @see routes/auth.php:14
* @route '/login'
*/
const loginForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/auth.php:14
* @route '/login'
*/
loginForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/auth.php:14
* @route '/login'
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
* @route '/logout'
*/
export const logout = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(queryOptions),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/logout'
*/
logout.url = (queryOptions?: RouteQueryOptions) => {




    return logout.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/logout'
*/
logout.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::logout
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:87
* @route '/logout'
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
* @route '/logout'
*/
logoutForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(

    queryOptions
   ),
    method: 'post',
})

logout.form = logoutForm

/**
* @see routes/web.php:26
* @route '/home'
*/
export const home = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(queryOptions),
    method: 'get',
})

home.definition = {
    methods: ["get","head"],
    url: '/home',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:26
* @route '/home'
*/
home.url = (queryOptions?: RouteQueryOptions) => {




    return home.definition.url
    + queryParams(queryOptions)
}

/**
* @see routes/web.php:26
* @route '/home'
*/
home.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(queryOptions),
    method: 'get',
})

/**
* @see routes/web.php:26
* @route '/home'
*/
home.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: home.url(queryOptions),
    method: 'head',
})

/**
* @see routes/web.php:26
* @route '/home'
*/
const homeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:26
* @route '/home'
*/
homeForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see routes/web.php:26
* @route '/home'
*/
homeForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

home.form = homeForm
