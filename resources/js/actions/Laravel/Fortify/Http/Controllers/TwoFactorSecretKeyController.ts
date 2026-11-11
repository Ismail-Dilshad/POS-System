import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
export const show = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/user/two-factor-secret-key',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
show.url = (queryOptions?: RouteQueryOptions) => {




    return show.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
show.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
show.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
const showForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
showForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
showForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

const TwoFactorSecretKeyController = { show }

export default TwoFactorSecretKeyController