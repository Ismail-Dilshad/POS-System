import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:38
* @route '/api/products'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/products',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:38
* @route '/api/products'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:38
* @route '/api/products'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:38
* @route '/api/products'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:38
* @route '/api/products'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:38
* @route '/api/products'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::index
* @see app/Http/Controllers/ProductController.php:38
* @route '/api/products'
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
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:100
* @route '/api/products'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/products',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:100
* @route '/api/products'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:100
* @route '/api/products'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:100
* @route '/api/products'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::store
* @see app/Http/Controllers/ProductController.php:100
* @route '/api/products'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:156
* @route '/api/products/{product}'
*/
export const show = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/products/{product}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:156
* @route '/api/products/{product}'
*/
show.url = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return show.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:156
* @route '/api/products/{product}'
*/
show.get = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:156
* @route '/api/products/{product}'
*/
show.head = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:156
* @route '/api/products/{product}'
*/
const showForm = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:156
* @route '/api/products/{product}'
*/
showForm.get = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::show
* @see app/Http/Controllers/ProductController.php:156
* @route '/api/products/{product}'
*/
showForm.head = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:178
* @route '/api/products/{product}'
*/
export const update = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/products/{product}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:178
* @route '/api/products/{product}'
*/
update.url = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return update.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:178
* @route '/api/products/{product}'
*/
update.put = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:178
* @route '/api/products/{product}'
*/
const updateForm = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::update
* @see app/Http/Controllers/ProductController.php:178
* @route '/api/products/{product}'
*/
updateForm.put = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:234
* @route '/api/products/{product}'
*/
export const destroy = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/products/{product}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:234
* @route '/api/products/{product}'
*/
destroy.url = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return destroy.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:234
* @route '/api/products/{product}'
*/
destroy.delete = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:234
* @route '/api/products/{product}'
*/
const destroyForm = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::destroy
* @see app/Http/Controllers/ProductController.php:234
* @route '/api/products/{product}'
*/
destroyForm.delete = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ProductController::search
* @see app/Http/Controllers/ProductController.php:425
* @route '/api/products/search/{query}'
*/
export const search = (args: { query: string | number } | [query: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(args, queryOptions),
    method: 'get',
})

search.definition = {
    methods: ["get","head"],
    url: '/api/products/search/{query}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductController::search
* @see app/Http/Controllers/ProductController.php:425
* @route '/api/products/search/{query}'
*/
search.url = (args: { query: string | number } | [query: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { query: args }
    }


    if (Array.isArray(args)) {
        args = {
            query: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        query: args.query,
    }

    return search.definition.url
            .replace('{query}', parsedArgs.query.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::search
* @see app/Http/Controllers/ProductController.php:425
* @route '/api/products/search/{query}'
*/
search.get = (args: { query: string | number } | [query: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: search.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::search
* @see app/Http/Controllers/ProductController.php:425
* @route '/api/products/search/{query}'
*/
search.head = (args: { query: string | number } | [query: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: search.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductController::search
* @see app/Http/Controllers/ProductController.php:425
* @route '/api/products/search/{query}'
*/
const searchForm = (args: { query: string | number } | [query: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: search.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::search
* @see app/Http/Controllers/ProductController.php:425
* @route '/api/products/search/{query}'
*/
searchForm.get = (args: { query: string | number } | [query: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: search.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::search
* @see app/Http/Controllers/ProductController.php:425
* @route '/api/products/search/{query}'
*/
searchForm.head = (args: { query: string | number } | [query: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: search.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

search.form = searchForm

/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import'
*/
const importMethodeebcc8305f47971d9fd330ec149529e9 = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethodeebcc8305f47971d9fd330ec149529e9.url(queryOptions),
    method: 'post',
})

importMethodeebcc8305f47971d9fd330ec149529e9.definition = {
    methods: ["post"],
    url: '/api/products/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import'
*/
importMethodeebcc8305f47971d9fd330ec149529e9.url = (queryOptions?: RouteQueryOptions) => {




    return importMethodeebcc8305f47971d9fd330ec149529e9.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import'
*/
importMethodeebcc8305f47971d9fd330ec149529e9.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethodeebcc8305f47971d9fd330ec149529e9.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import'
*/
const importMethodeebcc8305f47971d9fd330ec149529e9Form = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethodeebcc8305f47971d9fd330ec149529e9.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import'
*/
importMethodeebcc8305f47971d9fd330ec149529e9Form.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethodeebcc8305f47971d9fd330ec149529e9.url(

    queryOptions
   ),
    method: 'post',
})

importMethodeebcc8305f47971d9fd330ec149529e9.form = importMethodeebcc8305f47971d9fd330ec149529e9Form
/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import/process'
*/
const importMethod0353fa0b02bf51d56065bbb0bf71ca4e = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod0353fa0b02bf51d56065bbb0bf71ca4e.url(queryOptions),
    method: 'post',
})

importMethod0353fa0b02bf51d56065bbb0bf71ca4e.definition = {
    methods: ["post"],
    url: '/api/products/import/process',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import/process'
*/
importMethod0353fa0b02bf51d56065bbb0bf71ca4e.url = (queryOptions?: RouteQueryOptions) => {




    return importMethod0353fa0b02bf51d56065bbb0bf71ca4e.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import/process'
*/
importMethod0353fa0b02bf51d56065bbb0bf71ca4e.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod0353fa0b02bf51d56065bbb0bf71ca4e.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import/process'
*/
const importMethod0353fa0b02bf51d56065bbb0bf71ca4eForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod0353fa0b02bf51d56065bbb0bf71ca4e.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::importMethod
* @see app/Http/Controllers/ProductController.php:634
* @route '/api/products/import/process'
*/
importMethod0353fa0b02bf51d56065bbb0bf71ca4eForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importMethod0353fa0b02bf51d56065bbb0bf71ca4e.url(

    queryOptions
   ),
    method: 'post',
})

importMethod0353fa0b02bf51d56065bbb0bf71ca4e.form = importMethod0353fa0b02bf51d56065bbb0bf71ca4eForm

export const importMethod = {
    '/api/products/import': importMethodeebcc8305f47971d9fd330ec149529e9,
    '/api/products/import/process': importMethod0353fa0b02bf51d56065bbb0bf71ca4e,
}


/**
* @see \App\Http\Controllers\ProductController::validateImport
* @see app/Http/Controllers/ProductController.php:466
* @route '/api/products/import/validate'
*/
export const validateImport = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateImport.url(queryOptions),
    method: 'post',
})

validateImport.definition = {
    methods: ["post"],
    url: '/api/products/import/validate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ProductController::validateImport
* @see app/Http/Controllers/ProductController.php:466
* @route '/api/products/import/validate'
*/
validateImport.url = (queryOptions?: RouteQueryOptions) => {




    return validateImport.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::validateImport
* @see app/Http/Controllers/ProductController.php:466
* @route '/api/products/import/validate'
*/
validateImport.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateImport.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::validateImport
* @see app/Http/Controllers/ProductController.php:466
* @route '/api/products/import/validate'
*/
const validateImportForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validateImport.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::validateImport
* @see app/Http/Controllers/ProductController.php:466
* @route '/api/products/import/validate'
*/
validateImportForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validateImport.url(

    queryOptions
   ),
    method: 'post',
})

validateImport.form = validateImportForm

/**
* @see \App\Http\Controllers\ProductController::exportMethod
* @see app/Http/Controllers/ProductController.php:1036
* @route '/api/products/export'
*/
export const exportMethod = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(queryOptions),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/api/products/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ProductController::exportMethod
* @see app/Http/Controllers/ProductController.php:1036
* @route '/api/products/export'
*/
exportMethod.url = (queryOptions?: RouteQueryOptions) => {




    return exportMethod.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::exportMethod
* @see app/Http/Controllers/ProductController.php:1036
* @route '/api/products/export'
*/
exportMethod.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::exportMethod
* @see app/Http/Controllers/ProductController.php:1036
* @route '/api/products/export'
*/
exportMethod.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ProductController::exportMethod
* @see app/Http/Controllers/ProductController.php:1036
* @route '/api/products/export'
*/
const exportMethodForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::exportMethod
* @see app/Http/Controllers/ProductController.php:1036
* @route '/api/products/export'
*/
exportMethodForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ProductController::exportMethod
* @see app/Http/Controllers/ProductController.php:1036
* @route '/api/products/export'
*/
exportMethodForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

exportMethod.form = exportMethodForm

/**
* @see \App\Http\Controllers\ProductController::togglePosVisibility
* @see app/Http/Controllers/ProductController.php:398
* @route '/api/products/{product}/toggle-pos'
*/
export const togglePosVisibility = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: togglePosVisibility.url(args, queryOptions),
    method: 'patch',
})

togglePosVisibility.definition = {
    methods: ["patch"],
    url: '/api/products/{product}/toggle-pos',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ProductController::togglePosVisibility
* @see app/Http/Controllers/ProductController.php:398
* @route '/api/products/{product}/toggle-pos'
*/
togglePosVisibility.url = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { product: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { product: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            product: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        product: typeof args.product === 'object'
        ? args.product.id
        : args.product,
    }

    return togglePosVisibility.definition.url
            .replace('{product}', parsedArgs.product.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ProductController::togglePosVisibility
* @see app/Http/Controllers/ProductController.php:398
* @route '/api/products/{product}/toggle-pos'
*/
togglePosVisibility.patch = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: togglePosVisibility.url(args, queryOptions),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\ProductController::togglePosVisibility
* @see app/Http/Controllers/ProductController.php:398
* @route '/api/products/{product}/toggle-pos'
*/
const togglePosVisibilityForm = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: togglePosVisibility.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ProductController::togglePosVisibility
* @see app/Http/Controllers/ProductController.php:398
* @route '/api/products/{product}/toggle-pos'
*/
togglePosVisibilityForm.patch = (args: { product: string | number | { id: string | number } } | [product: string | number | { id: string | number } ] | string | number | { id: string | number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: togglePosVisibility.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

togglePosVisibility.form = togglePosVisibilityForm

const ProductController = { index, store, show, update, destroy, search, importMethod, validateImport, exportMethod, togglePosVisibility, import: importMethod, export: exportMethod }

export default ProductController