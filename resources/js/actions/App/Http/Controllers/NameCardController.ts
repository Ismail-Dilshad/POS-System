import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\NameCardController::statistics
* @see app/Http/Controllers/NameCardController.php:287
* @route '/api/name-cards/statistics'
*/
export const statistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

statistics.definition = {
    methods: ["get","head"],
    url: '/api/name-cards/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NameCardController::statistics
* @see app/Http/Controllers/NameCardController.php:287
* @route '/api/name-cards/statistics'
*/
statistics.url = (queryOptions?: RouteQueryOptions) => {




    return statistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\NameCardController::statistics
* @see app/Http/Controllers/NameCardController.php:287
* @route '/api/name-cards/statistics'
*/
statistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::statistics
* @see app/Http/Controllers/NameCardController.php:287
* @route '/api/name-cards/statistics'
*/
statistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: statistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\NameCardController::statistics
* @see app/Http/Controllers/NameCardController.php:287
* @route '/api/name-cards/statistics'
*/
const statisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::statistics
* @see app/Http/Controllers/NameCardController.php:287
* @route '/api/name-cards/statistics'
*/
statisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::statistics
* @see app/Http/Controllers/NameCardController.php:287
* @route '/api/name-cards/statistics'
*/
statisticsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

statistics.form = statisticsForm

/**
* @see \App\Http\Controllers\NameCardController::options
* @see app/Http/Controllers/NameCardController.php:316
* @route '/api/name-cards/options'
*/
export const options = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: options.url(queryOptions),
    method: 'get',
})

options.definition = {
    methods: ["get","head"],
    url: '/api/name-cards/options',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NameCardController::options
* @see app/Http/Controllers/NameCardController.php:316
* @route '/api/name-cards/options'
*/
options.url = (queryOptions?: RouteQueryOptions) => {




    return options.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\NameCardController::options
* @see app/Http/Controllers/NameCardController.php:316
* @route '/api/name-cards/options'
*/
options.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: options.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::options
* @see app/Http/Controllers/NameCardController.php:316
* @route '/api/name-cards/options'
*/
options.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: options.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\NameCardController::options
* @see app/Http/Controllers/NameCardController.php:316
* @route '/api/name-cards/options'
*/
const optionsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: options.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::options
* @see app/Http/Controllers/NameCardController.php:316
* @route '/api/name-cards/options'
*/
optionsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: options.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::options
* @see app/Http/Controllers/NameCardController.php:316
* @route '/api/name-cards/options'
*/
optionsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: options.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

options.form = optionsForm

/**
* @see \App\Http\Controllers\NameCardController::index
* @see app/Http/Controllers/NameCardController.php:23
* @route '/api/name-cards'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/name-cards',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NameCardController::index
* @see app/Http/Controllers/NameCardController.php:23
* @route '/api/name-cards'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\NameCardController::index
* @see app/Http/Controllers/NameCardController.php:23
* @route '/api/name-cards'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::index
* @see app/Http/Controllers/NameCardController.php:23
* @route '/api/name-cards'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\NameCardController::index
* @see app/Http/Controllers/NameCardController.php:23
* @route '/api/name-cards'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::index
* @see app/Http/Controllers/NameCardController.php:23
* @route '/api/name-cards'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::index
* @see app/Http/Controllers/NameCardController.php:23
* @route '/api/name-cards'
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
* @see \App\Http\Controllers\NameCardController::store
* @see app/Http/Controllers/NameCardController.php:80
* @route '/api/name-cards'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/name-cards',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\NameCardController::store
* @see app/Http/Controllers/NameCardController.php:80
* @route '/api/name-cards'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\NameCardController::store
* @see app/Http/Controllers/NameCardController.php:80
* @route '/api/name-cards'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\NameCardController::store
* @see app/Http/Controllers/NameCardController.php:80
* @route '/api/name-cards'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\NameCardController::store
* @see app/Http/Controllers/NameCardController.php:80
* @route '/api/name-cards'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\NameCardController::show
* @see app/Http/Controllers/NameCardController.php:136
* @route '/api/name-cards/{nameCard}'
*/
export const show = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/name-cards/{nameCard}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NameCardController::show
* @see app/Http/Controllers/NameCardController.php:136
* @route '/api/name-cards/{nameCard}'
*/
show.url = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { nameCard: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { nameCard: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            nameCard: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        nameCard: typeof args.nameCard === 'object'
        ? args.nameCard.id
        : args.nameCard,
    }

    return show.definition.url
            .replace('{nameCard}', parsedArgs.nameCard.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\NameCardController::show
* @see app/Http/Controllers/NameCardController.php:136
* @route '/api/name-cards/{nameCard}'
*/
show.get = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::show
* @see app/Http/Controllers/NameCardController.php:136
* @route '/api/name-cards/{nameCard}'
*/
show.head = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\NameCardController::show
* @see app/Http/Controllers/NameCardController.php:136
* @route '/api/name-cards/{nameCard}'
*/
const showForm = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::show
* @see app/Http/Controllers/NameCardController.php:136
* @route '/api/name-cards/{nameCard}'
*/
showForm.get = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\NameCardController::show
* @see app/Http/Controllers/NameCardController.php:136
* @route '/api/name-cards/{nameCard}'
*/
showForm.head = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\NameCardController::update
* @see app/Http/Controllers/NameCardController.php:160
* @route '/api/name-cards/{nameCard}'
*/
export const update = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/name-cards/{nameCard}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\NameCardController::update
* @see app/Http/Controllers/NameCardController.php:160
* @route '/api/name-cards/{nameCard}'
*/
update.url = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { nameCard: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { nameCard: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            nameCard: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        nameCard: typeof args.nameCard === 'object'
        ? args.nameCard.id
        : args.nameCard,
    }

    return update.definition.url
            .replace('{nameCard}', parsedArgs.nameCard.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\NameCardController::update
* @see app/Http/Controllers/NameCardController.php:160
* @route '/api/name-cards/{nameCard}'
*/
update.put = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\NameCardController::update
* @see app/Http/Controllers/NameCardController.php:160
* @route '/api/name-cards/{nameCard}'
*/
const updateForm = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\NameCardController::update
* @see app/Http/Controllers/NameCardController.php:160
* @route '/api/name-cards/{nameCard}'
*/
updateForm.put = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\NameCardController::destroy
* @see app/Http/Controllers/NameCardController.php:255
* @route '/api/name-cards/{nameCard}'
*/
export const destroy = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/name-cards/{nameCard}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\NameCardController::destroy
* @see app/Http/Controllers/NameCardController.php:255
* @route '/api/name-cards/{nameCard}'
*/
destroy.url = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { nameCard: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { nameCard: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            nameCard: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        nameCard: typeof args.nameCard === 'object'
        ? args.nameCard.id
        : args.nameCard,
    }

    return destroy.definition.url
            .replace('{nameCard}', parsedArgs.nameCard.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\NameCardController::destroy
* @see app/Http/Controllers/NameCardController.php:255
* @route '/api/name-cards/{nameCard}'
*/
destroy.delete = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\NameCardController::destroy
* @see app/Http/Controllers/NameCardController.php:255
* @route '/api/name-cards/{nameCard}'
*/
const destroyForm = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\NameCardController::destroy
* @see app/Http/Controllers/NameCardController.php:255
* @route '/api/name-cards/{nameCard}'
*/
destroyForm.delete = (args: { nameCard: string | number | { id: string | number } } | [nameCard: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const NameCardController = { statistics, options, index, store, show, update, destroy }

export default NameCardController