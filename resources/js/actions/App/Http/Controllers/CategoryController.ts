import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CategoryController::exportMethod
* @see app/Http/Controllers/CategoryController.php:201
* @route '/api/categories/export'
*/
export const exportMethod = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(queryOptions),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/api/categories/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CategoryController::exportMethod
* @see app/Http/Controllers/CategoryController.php:201
* @route '/api/categories/export'
*/
exportMethod.url = (queryOptions?: RouteQueryOptions) => {




    return exportMethod.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CategoryController::exportMethod
* @see app/Http/Controllers/CategoryController.php:201
* @route '/api/categories/export'
*/
exportMethod.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::exportMethod
* @see app/Http/Controllers/CategoryController.php:201
* @route '/api/categories/export'
*/
exportMethod.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CategoryController::exportMethod
* @see app/Http/Controllers/CategoryController.php:201
* @route '/api/categories/export'
*/
const exportMethodForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::exportMethod
* @see app/Http/Controllers/CategoryController.php:201
* @route '/api/categories/export'
*/
exportMethodForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::exportMethod
* @see app/Http/Controllers/CategoryController.php:201
* @route '/api/categories/export'
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
* @see \App\Http\Controllers\CategoryController::validateImport
* @see app/Http/Controllers/CategoryController.php:252
* @route '/api/categories/import/validate'
*/
export const validateImport = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateImport.url(queryOptions),
    method: 'post',
})

validateImport.definition = {
    methods: ["post"],
    url: '/api/categories/import/validate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CategoryController::validateImport
* @see app/Http/Controllers/CategoryController.php:252
* @route '/api/categories/import/validate'
*/
validateImport.url = (queryOptions?: RouteQueryOptions) => {




    return validateImport.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CategoryController::validateImport
* @see app/Http/Controllers/CategoryController.php:252
* @route '/api/categories/import/validate'
*/
validateImport.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateImport.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CategoryController::validateImport
* @see app/Http/Controllers/CategoryController.php:252
* @route '/api/categories/import/validate'
*/
const validateImportForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validateImport.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CategoryController::validateImport
* @see app/Http/Controllers/CategoryController.php:252
* @route '/api/categories/import/validate'
*/
validateImportForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validateImport.url(

    queryOptions
   ),
    method: 'post',
})

validateImport.form = validateImportForm

/**
* @see \App\Http\Controllers\CategoryController::processImport
* @see app/Http/Controllers/CategoryController.php:413
* @route '/api/categories/import/process'
*/
export const processImport = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processImport.url(queryOptions),
    method: 'post',
})

processImport.definition = {
    methods: ["post"],
    url: '/api/categories/import/process',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CategoryController::processImport
* @see app/Http/Controllers/CategoryController.php:413
* @route '/api/categories/import/process'
*/
processImport.url = (queryOptions?: RouteQueryOptions) => {




    return processImport.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CategoryController::processImport
* @see app/Http/Controllers/CategoryController.php:413
* @route '/api/categories/import/process'
*/
processImport.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processImport.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CategoryController::processImport
* @see app/Http/Controllers/CategoryController.php:413
* @route '/api/categories/import/process'
*/
const processImportForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processImport.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CategoryController::processImport
* @see app/Http/Controllers/CategoryController.php:413
* @route '/api/categories/import/process'
*/
processImportForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processImport.url(

    queryOptions
   ),
    method: 'post',
})

processImport.form = processImportForm

/**
* @see \App\Http\Controllers\CategoryController::index
* @see app/Http/Controllers/CategoryController.php:26
* @route '/api/categories'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/categories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CategoryController::index
* @see app/Http/Controllers/CategoryController.php:26
* @route '/api/categories'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CategoryController::index
* @see app/Http/Controllers/CategoryController.php:26
* @route '/api/categories'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::index
* @see app/Http/Controllers/CategoryController.php:26
* @route '/api/categories'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CategoryController::index
* @see app/Http/Controllers/CategoryController.php:26
* @route '/api/categories'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::index
* @see app/Http/Controllers/CategoryController.php:26
* @route '/api/categories'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::index
* @see app/Http/Controllers/CategoryController.php:26
* @route '/api/categories'
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
* @see \App\Http\Controllers\CategoryController::store
* @see app/Http/Controllers/CategoryController.php:59
* @route '/api/categories'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/categories',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CategoryController::store
* @see app/Http/Controllers/CategoryController.php:59
* @route '/api/categories'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CategoryController::store
* @see app/Http/Controllers/CategoryController.php:59
* @route '/api/categories'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CategoryController::store
* @see app/Http/Controllers/CategoryController.php:59
* @route '/api/categories'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CategoryController::store
* @see app/Http/Controllers/CategoryController.php:59
* @route '/api/categories'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\CategoryController::show
* @see app/Http/Controllers/CategoryController.php:93
* @route '/api/categories/{category}'
*/
export const show = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/categories/{category}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CategoryController::show
* @see app/Http/Controllers/CategoryController.php:93
* @route '/api/categories/{category}'
*/
show.url = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { category: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { category: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            category: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        category: typeof args.category === 'object'
        ? args.category.id
        : args.category,
    }

    return show.definition.url
            .replace('{category}', parsedArgs.category.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CategoryController::show
* @see app/Http/Controllers/CategoryController.php:93
* @route '/api/categories/{category}'
*/
show.get = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::show
* @see app/Http/Controllers/CategoryController.php:93
* @route '/api/categories/{category}'
*/
show.head = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CategoryController::show
* @see app/Http/Controllers/CategoryController.php:93
* @route '/api/categories/{category}'
*/
const showForm = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::show
* @see app/Http/Controllers/CategoryController.php:93
* @route '/api/categories/{category}'
*/
showForm.get = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::show
* @see app/Http/Controllers/CategoryController.php:93
* @route '/api/categories/{category}'
*/
showForm.head = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\CategoryController::update
* @see app/Http/Controllers/CategoryController.php:107
* @route '/api/categories/{category}'
*/
export const update = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/categories/{category}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\CategoryController::update
* @see app/Http/Controllers/CategoryController.php:107
* @route '/api/categories/{category}'
*/
update.url = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { category: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { category: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            category: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        category: typeof args.category === 'object'
        ? args.category.id
        : args.category,
    }

    return update.definition.url
            .replace('{category}', parsedArgs.category.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CategoryController::update
* @see app/Http/Controllers/CategoryController.php:107
* @route '/api/categories/{category}'
*/
update.put = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\CategoryController::update
* @see app/Http/Controllers/CategoryController.php:107
* @route '/api/categories/{category}'
*/
const updateForm = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CategoryController::update
* @see app/Http/Controllers/CategoryController.php:107
* @route '/api/categories/{category}'
*/
updateForm.put = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\CategoryController::destroy
* @see app/Http/Controllers/CategoryController.php:169
* @route '/api/categories/{category}'
*/
export const destroy = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/categories/{category}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\CategoryController::destroy
* @see app/Http/Controllers/CategoryController.php:169
* @route '/api/categories/{category}'
*/
destroy.url = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { category: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { category: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            category: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        category: typeof args.category === 'object'
        ? args.category.id
        : args.category,
    }

    return destroy.definition.url
            .replace('{category}', parsedArgs.category.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CategoryController::destroy
* @see app/Http/Controllers/CategoryController.php:169
* @route '/api/categories/{category}'
*/
destroy.delete = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\CategoryController::destroy
* @see app/Http/Controllers/CategoryController.php:169
* @route '/api/categories/{category}'
*/
const destroyForm = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\CategoryController::destroy
* @see app/Http/Controllers/CategoryController.php:169
* @route '/api/categories/{category}'
*/
destroyForm.delete = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\CategoryController::checkUsage
* @see app/Http/Controllers/CategoryController.php:146
* @route '/api/categories/{category}/usage'
*/
export const checkUsage = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkUsage.url(args, queryOptions),
    method: 'get',
})

checkUsage.definition = {
    methods: ["get","head"],
    url: '/api/categories/{category}/usage',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CategoryController::checkUsage
* @see app/Http/Controllers/CategoryController.php:146
* @route '/api/categories/{category}/usage'
*/
checkUsage.url = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { category: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { category: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            category: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        category: typeof args.category === 'object'
        ? args.category.id
        : args.category,
    }

    return checkUsage.definition.url
            .replace('{category}', parsedArgs.category.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\CategoryController::checkUsage
* @see app/Http/Controllers/CategoryController.php:146
* @route '/api/categories/{category}/usage'
*/
checkUsage.get = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkUsage.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::checkUsage
* @see app/Http/Controllers/CategoryController.php:146
* @route '/api/categories/{category}/usage'
*/
checkUsage.head = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: checkUsage.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\CategoryController::checkUsage
* @see app/Http/Controllers/CategoryController.php:146
* @route '/api/categories/{category}/usage'
*/
const checkUsageForm = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: checkUsage.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::checkUsage
* @see app/Http/Controllers/CategoryController.php:146
* @route '/api/categories/{category}/usage'
*/
checkUsageForm.get = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: checkUsage.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\CategoryController::checkUsage
* @see app/Http/Controllers/CategoryController.php:146
* @route '/api/categories/{category}/usage'
*/
checkUsageForm.head = (args: { category: number | { id: number } } | [category: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: checkUsage.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

checkUsage.form = checkUsageForm

const CategoryController = { exportMethod, validateImport, processImport, index, store, show, update, destroy, checkUsage, export: exportMethod }

export default CategoryController