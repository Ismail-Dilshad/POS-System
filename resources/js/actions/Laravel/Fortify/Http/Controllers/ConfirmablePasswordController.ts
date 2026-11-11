import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:40
* @route '/user/confirm-password'
*/
export const show = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/user/confirm-password',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:40
* @route '/user/confirm-password'
*/
show.url = (queryOptions?: RouteQueryOptions) => {




    return show.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:40
* @route '/user/confirm-password'
*/
show.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:40
* @route '/user/confirm-password'
*/
show.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:40
* @route '/user/confirm-password'
*/
const showForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:40
* @route '/user/confirm-password'
*/
showForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::show
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:40
* @route '/user/confirm-password'
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

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::store
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:51
* @route '/user/confirm-password'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/user/confirm-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::store
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:51
* @route '/user/confirm-password'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::store
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:51
* @route '/user/confirm-password'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::store
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:51
* @route '/user/confirm-password'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmablePasswordController::store
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmablePasswordController.php:51
* @route '/user/confirm-password'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

const ConfirmablePasswordController = { show, store }

export default ConfirmablePasswordController