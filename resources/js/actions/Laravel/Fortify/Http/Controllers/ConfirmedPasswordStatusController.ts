import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedPasswordStatusController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedPasswordStatusController.php:17
* @route '/user/confirmed-password-status'
*/
export const show = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/user/confirmed-password-status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedPasswordStatusController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedPasswordStatusController.php:17
* @route '/user/confirmed-password-status'
*/
show.url = (queryOptions?: RouteQueryOptions) => {




    return show.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedPasswordStatusController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedPasswordStatusController.php:17
* @route '/user/confirmed-password-status'
*/
show.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedPasswordStatusController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedPasswordStatusController.php:17
* @route '/user/confirmed-password-status'
*/
show.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedPasswordStatusController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedPasswordStatusController.php:17
* @route '/user/confirmed-password-status'
*/
const showForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedPasswordStatusController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedPasswordStatusController.php:17
* @route '/user/confirmed-password-status'
*/
showForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedPasswordStatusController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedPasswordStatusController.php:17
* @route '/user/confirmed-password-status'
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

const ConfirmedPasswordStatusController = { show }

export default ConfirmedPasswordStatusController