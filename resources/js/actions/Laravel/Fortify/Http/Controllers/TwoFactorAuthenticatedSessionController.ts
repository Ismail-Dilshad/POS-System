import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::create
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
export const create = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(queryOptions),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/two-factor-challenge',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::create
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
create.url = (queryOptions?: RouteQueryOptions) => {




    return create.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::create
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
create.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::create
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
create.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::create
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
const createForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::create
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
createForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::create
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
createForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: create.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

create.form = createForm

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::store
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:57
* @route '/two-factor-challenge'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/two-factor-challenge',
} satisfies RouteDefinition<["post"]>

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::store
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:57
* @route '/two-factor-challenge'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::store
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:57
* @route '/two-factor-challenge'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::store
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:57
* @route '/two-factor-challenge'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::store
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:57
* @route '/two-factor-challenge'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

const TwoFactorAuthenticatedSessionController = { create, store }

export default TwoFactorAuthenticatedSessionController