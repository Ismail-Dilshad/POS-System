import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
export const show = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/user/two-factor-qr-code',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
show.url = (queryOptions?: RouteQueryOptions) => {




    return show.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
show.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
show.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
const showForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
showForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::show
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
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

const TwoFactorQrCodeController = { show }

export default TwoFactorQrCodeController