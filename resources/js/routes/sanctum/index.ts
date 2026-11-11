import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \Laravel\Sanctum\Http\Controllers\CsrfCookieController::csrfCookie
* @see vendor/laravel/sanctum/src/Http/Controllers/CsrfCookieController.php:17
* @route '/sanctum/csrf-cookie'
*/
export const csrfCookie = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: csrfCookie.url(queryOptions),
    method: 'get',
})

csrfCookie.definition = {
    methods: ["get","head"],
    url: '/sanctum/csrf-cookie',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Sanctum\Http\Controllers\CsrfCookieController::csrfCookie
* @see vendor/laravel/sanctum/src/Http/Controllers/CsrfCookieController.php:17
* @route '/sanctum/csrf-cookie'
*/
csrfCookie.url = (queryOptions?: RouteQueryOptions) => {




    return csrfCookie.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Sanctum\Http\Controllers\CsrfCookieController::csrfCookie
* @see vendor/laravel/sanctum/src/Http/Controllers/CsrfCookieController.php:17
* @route '/sanctum/csrf-cookie'
*/
csrfCookie.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: csrfCookie.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Sanctum\Http\Controllers\CsrfCookieController::csrfCookie
* @see vendor/laravel/sanctum/src/Http/Controllers/CsrfCookieController.php:17
* @route '/sanctum/csrf-cookie'
*/
csrfCookie.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: csrfCookie.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Sanctum\Http\Controllers\CsrfCookieController::csrfCookie
* @see vendor/laravel/sanctum/src/Http/Controllers/CsrfCookieController.php:17
* @route '/sanctum/csrf-cookie'
*/
const csrfCookieForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: csrfCookie.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Sanctum\Http\Controllers\CsrfCookieController::csrfCookie
* @see vendor/laravel/sanctum/src/Http/Controllers/CsrfCookieController.php:17
* @route '/sanctum/csrf-cookie'
*/
csrfCookieForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: csrfCookie.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Sanctum\Http\Controllers\CsrfCookieController::csrfCookie
* @see vendor/laravel/sanctum/src/Http/Controllers/CsrfCookieController.php:17
* @route '/sanctum/csrf-cookie'
*/
csrfCookieForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: csrfCookie.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

csrfCookie.form = csrfCookieForm



const sanctum = {
    csrfCookie: Object.assign(csrfCookie, csrfCookie),
}

export default sanctum