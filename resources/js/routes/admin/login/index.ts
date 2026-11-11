import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::store
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:33
* @route '/admin/login'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/login',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::store
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:33
* @route '/admin/login'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::store
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:33
* @route '/admin/login'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::store
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:33
* @route '/admin/login'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\AuthenticatedSessionController::store
* @see app/Http/Controllers/Auth/AuthenticatedSessionController.php:33
* @route '/admin/login'
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