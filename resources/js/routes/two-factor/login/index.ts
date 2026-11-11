import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
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



const login = {
    store: Object.assign(store, store),
}

export default login