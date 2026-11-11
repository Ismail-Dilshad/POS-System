import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::index
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/user/two-factor-recovery-codes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::index
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::index
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::index
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::index
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::index
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::index
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
indexForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::store
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/user/two-factor-recovery-codes',
} satisfies RouteDefinition<["post"]>

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::store
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::store
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::store
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::store
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

const RecoveryCodeController = { index, store }

export default RecoveryCodeController