import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\UserController::index
* @see app/Http/Controllers/UserController.php:17
* @route '/api/users'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/users',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserController::index
* @see app/Http/Controllers/UserController.php:17
* @route '/api/users'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\UserController::index
* @see app/Http/Controllers/UserController.php:17
* @route '/api/users'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\UserController::index
* @see app/Http/Controllers/UserController.php:17
* @route '/api/users'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\UserController::index
* @see app/Http/Controllers/UserController.php:17
* @route '/api/users'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\UserController::index
* @see app/Http/Controllers/UserController.php:17
* @route '/api/users'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\UserController::index
* @see app/Http/Controllers/UserController.php:17
* @route '/api/users'
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
* @see \App\Http\Controllers\UserController::store
* @see app/Http/Controllers/UserController.php:59
* @route '/api/users'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/users',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\UserController::store
* @see app/Http/Controllers/UserController.php:59
* @route '/api/users'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\UserController::store
* @see app/Http/Controllers/UserController.php:59
* @route '/api/users'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\UserController::store
* @see app/Http/Controllers/UserController.php:59
* @route '/api/users'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\UserController::store
* @see app/Http/Controllers/UserController.php:59
* @route '/api/users'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\UserController::show
* @see app/Http/Controllers/UserController.php:116
* @route '/api/users/{user}'
*/
export const show = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/users/{user}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\UserController::show
* @see app/Http/Controllers/UserController.php:116
* @route '/api/users/{user}'
*/
show.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { user: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            user: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        user: typeof args.user === 'object'
        ? args.user.id
        : args.user,
    }

    return show.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\UserController::show
* @see app/Http/Controllers/UserController.php:116
* @route '/api/users/{user}'
*/
show.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\UserController::show
* @see app/Http/Controllers/UserController.php:116
* @route '/api/users/{user}'
*/
show.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\UserController::show
* @see app/Http/Controllers/UserController.php:116
* @route '/api/users/{user}'
*/
const showForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\UserController::show
* @see app/Http/Controllers/UserController.php:116
* @route '/api/users/{user}'
*/
showForm.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\UserController::show
* @see app/Http/Controllers/UserController.php:116
* @route '/api/users/{user}'
*/
showForm.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\UserController::update
* @see app/Http/Controllers/UserController.php:134
* @route '/api/users/{user}'
*/
export const update = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/users/{user}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\UserController::update
* @see app/Http/Controllers/UserController.php:134
* @route '/api/users/{user}'
*/
update.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { user: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            user: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        user: typeof args.user === 'object'
        ? args.user.id
        : args.user,
    }

    return update.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\UserController::update
* @see app/Http/Controllers/UserController.php:134
* @route '/api/users/{user}'
*/
update.put = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\UserController::update
* @see app/Http/Controllers/UserController.php:134
* @route '/api/users/{user}'
*/
const updateForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\UserController::update
* @see app/Http/Controllers/UserController.php:134
* @route '/api/users/{user}'
*/
updateForm.put = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\UserController::destroy
* @see app/Http/Controllers/UserController.php:195
* @route '/api/users/{user}'
*/
export const destroy = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/users/{user}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\UserController::destroy
* @see app/Http/Controllers/UserController.php:195
* @route '/api/users/{user}'
*/
destroy.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { user: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            user: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        user: typeof args.user === 'object'
        ? args.user.id
        : args.user,
    }

    return destroy.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\UserController::destroy
* @see app/Http/Controllers/UserController.php:195
* @route '/api/users/{user}'
*/
destroy.delete = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\UserController::destroy
* @see app/Http/Controllers/UserController.php:195
* @route '/api/users/{user}'
*/
const destroyForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\UserController::destroy
* @see app/Http/Controllers/UserController.php:195
* @route '/api/users/{user}'
*/
destroyForm.delete = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const UserController = { index, store, show, update, destroy }

export default UserController