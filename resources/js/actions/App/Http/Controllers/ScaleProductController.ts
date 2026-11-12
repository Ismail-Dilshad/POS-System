import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ScaleProductController::statistics
* @see app/Http/Controllers/ScaleProductController.php:422
* @route '/api/scale-products/statistics'
*/
export const statistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

statistics.definition = {
    methods: ["get","head"],
    url: '/api/scale-products/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ScaleProductController::statistics
* @see app/Http/Controllers/ScaleProductController.php:422
* @route '/api/scale-products/statistics'
*/
statistics.url = (queryOptions?: RouteQueryOptions) => {




    return statistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::statistics
* @see app/Http/Controllers/ScaleProductController.php:422
* @route '/api/scale-products/statistics'
*/
statistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::statistics
* @see app/Http/Controllers/ScaleProductController.php:422
* @route '/api/scale-products/statistics'
*/
statistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: statistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ScaleProductController::statistics
* @see app/Http/Controllers/ScaleProductController.php:422
* @route '/api/scale-products/statistics'
*/
const statisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::statistics
* @see app/Http/Controllers/ScaleProductController.php:422
* @route '/api/scale-products/statistics'
*/
statisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::statistics
* @see app/Http/Controllers/ScaleProductController.php:422
* @route '/api/scale-products/statistics'
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
* @see \App\Http\Controllers\ScaleProductController::search
* @see app/Http/Controllers/ScaleProductController.php:382
* @route '/api/scale-products/search'
*/
export const search = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(queryOptions),
    method: 'get',
})

search.definition = {
    methods: ["get","head"],
    url: '/api/scale-products/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ScaleProductController::search
* @see app/Http/Controllers/ScaleProductController.php:382
* @route '/api/scale-products/search'
*/
search.url = (queryOptions?: RouteQueryOptions) => {




    return search.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::search
* @see app/Http/Controllers/ScaleProductController.php:382
* @route '/api/scale-products/search'
*/
search.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::search
* @see app/Http/Controllers/ScaleProductController.php:382
* @route '/api/scale-products/search'
*/
search.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: search.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ScaleProductController::search
* @see app/Http/Controllers/ScaleProductController.php:382
* @route '/api/scale-products/search'
*/
const searchForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: search.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::search
* @see app/Http/Controllers/ScaleProductController.php:382
* @route '/api/scale-products/search'
*/
searchForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: search.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::search
* @see app/Http/Controllers/ScaleProductController.php:382
* @route '/api/scale-products/search'
*/
searchForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: search.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

search.form = searchForm

/**
* @see \App\Http\Controllers\ScaleProductController::checkPlu
* @see app/Http/Controllers/ScaleProductController.php:347
* @route '/api/scale-products/check-plu'
*/
export const checkPlu = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkPlu.url(queryOptions),
    method: 'post',
})

checkPlu.definition = {
    methods: ["post"],
    url: '/api/scale-products/check-plu',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ScaleProductController::checkPlu
* @see app/Http/Controllers/ScaleProductController.php:347
* @route '/api/scale-products/check-plu'
*/
checkPlu.url = (queryOptions?: RouteQueryOptions) => {




    return checkPlu.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::checkPlu
* @see app/Http/Controllers/ScaleProductController.php:347
* @route '/api/scale-products/check-plu'
*/
checkPlu.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: checkPlu.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ScaleProductController::checkPlu
* @see app/Http/Controllers/ScaleProductController.php:347
* @route '/api/scale-products/check-plu'
*/
const checkPluForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: checkPlu.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ScaleProductController::checkPlu
* @see app/Http/Controllers/ScaleProductController.php:347
* @route '/api/scale-products/check-plu'
*/
checkPluForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: checkPlu.url(

    queryOptions
   ),
    method: 'post',
})

checkPlu.form = checkPluForm

/**
* @see \App\Http\Controllers\ScaleProductController::bulkDestroy
* @see app/Http/Controllers/ScaleProductController.php:285
* @route '/api/scale-products/bulk-destroy'
*/
export const bulkDestroy = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDestroy.url(queryOptions),
    method: 'delete',
})

bulkDestroy.definition = {
    methods: ["delete"],
    url: '/api/scale-products/bulk-destroy',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ScaleProductController::bulkDestroy
* @see app/Http/Controllers/ScaleProductController.php:285
* @route '/api/scale-products/bulk-destroy'
*/
bulkDestroy.url = (queryOptions?: RouteQueryOptions) => {




    return bulkDestroy.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::bulkDestroy
* @see app/Http/Controllers/ScaleProductController.php:285
* @route '/api/scale-products/bulk-destroy'
*/
bulkDestroy.delete = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: bulkDestroy.url(queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ScaleProductController::bulkDestroy
* @see app/Http/Controllers/ScaleProductController.php:285
* @route '/api/scale-products/bulk-destroy'
*/
const bulkDestroyForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: bulkDestroy.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ScaleProductController::bulkDestroy
* @see app/Http/Controllers/ScaleProductController.php:285
* @route '/api/scale-products/bulk-destroy'
*/
bulkDestroyForm.delete = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: bulkDestroy.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

bulkDestroy.form = bulkDestroyForm

/**
* @see \App\Http\Controllers\ScaleProductController::index
* @see app/Http/Controllers/ScaleProductController.php:17
* @route '/api/scale-products'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/scale-products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ScaleProductController::index
* @see app/Http/Controllers/ScaleProductController.php:17
* @route '/api/scale-products'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::index
* @see app/Http/Controllers/ScaleProductController.php:17
* @route '/api/scale-products'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::index
* @see app/Http/Controllers/ScaleProductController.php:17
* @route '/api/scale-products'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ScaleProductController::index
* @see app/Http/Controllers/ScaleProductController.php:17
* @route '/api/scale-products'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::index
* @see app/Http/Controllers/ScaleProductController.php:17
* @route '/api/scale-products'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::index
* @see app/Http/Controllers/ScaleProductController.php:17
* @route '/api/scale-products'
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
* @see \App\Http\Controllers\ScaleProductController::store
* @see app/Http/Controllers/ScaleProductController.php:92
* @route '/api/scale-products'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/scale-products',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ScaleProductController::store
* @see app/Http/Controllers/ScaleProductController.php:92
* @route '/api/scale-products'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::store
* @see app/Http/Controllers/ScaleProductController.php:92
* @route '/api/scale-products'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ScaleProductController::store
* @see app/Http/Controllers/ScaleProductController.php:92
* @route '/api/scale-products'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ScaleProductController::store
* @see app/Http/Controllers/ScaleProductController.php:92
* @route '/api/scale-products'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ScaleProductController::show
* @see app/Http/Controllers/ScaleProductController.php:146
* @route '/api/scale-products/{scaleProduct}'
*/
export const show = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/scale-products/{scaleProduct}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ScaleProductController::show
* @see app/Http/Controllers/ScaleProductController.php:146
* @route '/api/scale-products/{scaleProduct}'
*/
show.url = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { scaleProduct: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { scaleProduct: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            scaleProduct: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        scaleProduct: typeof args.scaleProduct === 'object'
        ? args.scaleProduct.id
        : args.scaleProduct,
    }

    return show.definition.url
            .replace('{scaleProduct}', parsedArgs.scaleProduct.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::show
* @see app/Http/Controllers/ScaleProductController.php:146
* @route '/api/scale-products/{scaleProduct}'
*/
show.get = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::show
* @see app/Http/Controllers/ScaleProductController.php:146
* @route '/api/scale-products/{scaleProduct}'
*/
show.head = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ScaleProductController::show
* @see app/Http/Controllers/ScaleProductController.php:146
* @route '/api/scale-products/{scaleProduct}'
*/
const showForm = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::show
* @see app/Http/Controllers/ScaleProductController.php:146
* @route '/api/scale-products/{scaleProduct}'
*/
showForm.get = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ScaleProductController::show
* @see app/Http/Controllers/ScaleProductController.php:146
* @route '/api/scale-products/{scaleProduct}'
*/
showForm.head = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ScaleProductController::update
* @see app/Http/Controllers/ScaleProductController.php:174
* @route '/api/scale-products/{scaleProduct}'
*/
export const update = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/scale-products/{scaleProduct}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ScaleProductController::update
* @see app/Http/Controllers/ScaleProductController.php:174
* @route '/api/scale-products/{scaleProduct}'
*/
update.url = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { scaleProduct: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { scaleProduct: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            scaleProduct: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        scaleProduct: typeof args.scaleProduct === 'object'
        ? args.scaleProduct.id
        : args.scaleProduct,
    }

    return update.definition.url
            .replace('{scaleProduct}', parsedArgs.scaleProduct.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::update
* @see app/Http/Controllers/ScaleProductController.php:174
* @route '/api/scale-products/{scaleProduct}'
*/
update.put = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ScaleProductController::update
* @see app/Http/Controllers/ScaleProductController.php:174
* @route '/api/scale-products/{scaleProduct}'
*/
const updateForm = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ScaleProductController::update
* @see app/Http/Controllers/ScaleProductController.php:174
* @route '/api/scale-products/{scaleProduct}'
*/
updateForm.put = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ScaleProductController::destroy
* @see app/Http/Controllers/ScaleProductController.php:262
* @route '/api/scale-products/{scaleProduct}'
*/
export const destroy = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/scale-products/{scaleProduct}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ScaleProductController::destroy
* @see app/Http/Controllers/ScaleProductController.php:262
* @route '/api/scale-products/{scaleProduct}'
*/
destroy.url = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { scaleProduct: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { scaleProduct: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            scaleProduct: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        scaleProduct: typeof args.scaleProduct === 'object'
        ? args.scaleProduct.id
        : args.scaleProduct,
    }

    return destroy.definition.url
            .replace('{scaleProduct}', parsedArgs.scaleProduct.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::destroy
* @see app/Http/Controllers/ScaleProductController.php:262
* @route '/api/scale-products/{scaleProduct}'
*/
destroy.delete = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ScaleProductController::destroy
* @see app/Http/Controllers/ScaleProductController.php:262
* @route '/api/scale-products/{scaleProduct}'
*/
const destroyForm = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ScaleProductController::destroy
* @see app/Http/Controllers/ScaleProductController.php:262
* @route '/api/scale-products/{scaleProduct}'
*/
destroyForm.delete = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

/**
* @see \App\Http\Controllers\ScaleProductController::togglePosVisibility
* @see app/Http/Controllers/ScaleProductController.php:238
* @route '/api/scale-products/{scaleProduct}/toggle-pos'
*/
export const togglePosVisibility = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: togglePosVisibility.url(args, queryOptions),
    method: 'patch',
})

togglePosVisibility.definition = {
    methods: ["patch"],
    url: '/api/scale-products/{scaleProduct}/toggle-pos',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ScaleProductController::togglePosVisibility
* @see app/Http/Controllers/ScaleProductController.php:238
* @route '/api/scale-products/{scaleProduct}/toggle-pos'
*/
togglePosVisibility.url = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { scaleProduct: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { scaleProduct: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            scaleProduct: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        scaleProduct: typeof args.scaleProduct === 'object'
        ? args.scaleProduct.id
        : args.scaleProduct,
    }

    return togglePosVisibility.definition.url
            .replace('{scaleProduct}', parsedArgs.scaleProduct.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ScaleProductController::togglePosVisibility
* @see app/Http/Controllers/ScaleProductController.php:238
* @route '/api/scale-products/{scaleProduct}/toggle-pos'
*/
togglePosVisibility.patch = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: togglePosVisibility.url(args, queryOptions),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ScaleProductController::togglePosVisibility
* @see app/Http/Controllers/ScaleProductController.php:238
* @route '/api/scale-products/{scaleProduct}/toggle-pos'
*/
const togglePosVisibilityForm = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: togglePosVisibility.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ScaleProductController::togglePosVisibility
* @see app/Http/Controllers/ScaleProductController.php:238
* @route '/api/scale-products/{scaleProduct}/toggle-pos'
*/
togglePosVisibilityForm.patch = (args: { scaleProduct: string | number | { id: string | number } } | [scaleProduct: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: togglePosVisibility.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

togglePosVisibility.form = togglePosVisibilityForm

const ScaleProductController = { statistics, search, checkPlu, bulkDestroy, index, store, show, update, destroy, togglePosVisibility }

export default ScaleProductController