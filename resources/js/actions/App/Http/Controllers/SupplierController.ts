import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SupplierController::exportMethod
* @see app/Http/Controllers/SupplierController.php:666
* @route '/api/suppliers/export'
*/
export const exportMethod = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(queryOptions),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/api/suppliers/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierController::exportMethod
* @see app/Http/Controllers/SupplierController.php:666
* @route '/api/suppliers/export'
*/
exportMethod.url = (queryOptions?: RouteQueryOptions) => {




    return exportMethod.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::exportMethod
* @see app/Http/Controllers/SupplierController.php:666
* @route '/api/suppliers/export'
*/
exportMethod.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::exportMethod
* @see app/Http/Controllers/SupplierController.php:666
* @route '/api/suppliers/export'
*/
exportMethod.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierController::exportMethod
* @see app/Http/Controllers/SupplierController.php:666
* @route '/api/suppliers/export'
*/
const exportMethodForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::exportMethod
* @see app/Http/Controllers/SupplierController.php:666
* @route '/api/suppliers/export'
*/
exportMethodForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::exportMethod
* @see app/Http/Controllers/SupplierController.php:666
* @route '/api/suppliers/export'
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
* @see \App\Http\Controllers\SupplierController::validateImport
* @see app/Http/Controllers/SupplierController.php:733
* @route '/api/suppliers/import/validate'
*/
export const validateImport = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateImport.url(queryOptions),
    method: 'post',
})

validateImport.definition = {
    methods: ["post"],
    url: '/api/suppliers/import/validate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SupplierController::validateImport
* @see app/Http/Controllers/SupplierController.php:733
* @route '/api/suppliers/import/validate'
*/
validateImport.url = (queryOptions?: RouteQueryOptions) => {




    return validateImport.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::validateImport
* @see app/Http/Controllers/SupplierController.php:733
* @route '/api/suppliers/import/validate'
*/
validateImport.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: validateImport.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::validateImport
* @see app/Http/Controllers/SupplierController.php:733
* @route '/api/suppliers/import/validate'
*/
const validateImportForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validateImport.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::validateImport
* @see app/Http/Controllers/SupplierController.php:733
* @route '/api/suppliers/import/validate'
*/
validateImportForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: validateImport.url(

    queryOptions
   ),
    method: 'post',
})

validateImport.form = validateImportForm

/**
* @see \App\Http\Controllers\SupplierController::processImport
* @see app/Http/Controllers/SupplierController.php:892
* @route '/api/suppliers/import/process'
*/
export const processImport = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processImport.url(queryOptions),
    method: 'post',
})

processImport.definition = {
    methods: ["post"],
    url: '/api/suppliers/import/process',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SupplierController::processImport
* @see app/Http/Controllers/SupplierController.php:892
* @route '/api/suppliers/import/process'
*/
processImport.url = (queryOptions?: RouteQueryOptions) => {




    return processImport.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::processImport
* @see app/Http/Controllers/SupplierController.php:892
* @route '/api/suppliers/import/process'
*/
processImport.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: processImport.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::processImport
* @see app/Http/Controllers/SupplierController.php:892
* @route '/api/suppliers/import/process'
*/
const processImportForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processImport.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::processImport
* @see app/Http/Controllers/SupplierController.php:892
* @route '/api/suppliers/import/process'
*/
processImportForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: processImport.url(

    queryOptions
   ),
    method: 'post',
})

processImport.form = processImportForm

/**
* @see \App\Http\Controllers\SupplierController::generateCode
* @see app/Http/Controllers/SupplierController.php:308
* @route '/api/suppliers/generate-code'
*/
export const generateCode = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: generateCode.url(queryOptions),
    method: 'get',
})

generateCode.definition = {
    methods: ["get","head"],
    url: '/api/suppliers/generate-code',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierController::generateCode
* @see app/Http/Controllers/SupplierController.php:308
* @route '/api/suppliers/generate-code'
*/
generateCode.url = (queryOptions?: RouteQueryOptions) => {




    return generateCode.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::generateCode
* @see app/Http/Controllers/SupplierController.php:308
* @route '/api/suppliers/generate-code'
*/
generateCode.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: generateCode.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::generateCode
* @see app/Http/Controllers/SupplierController.php:308
* @route '/api/suppliers/generate-code'
*/
generateCode.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: generateCode.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierController::generateCode
* @see app/Http/Controllers/SupplierController.php:308
* @route '/api/suppliers/generate-code'
*/
const generateCodeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: generateCode.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::generateCode
* @see app/Http/Controllers/SupplierController.php:308
* @route '/api/suppliers/generate-code'
*/
generateCodeForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: generateCode.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::generateCode
* @see app/Http/Controllers/SupplierController.php:308
* @route '/api/suppliers/generate-code'
*/
generateCodeForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: generateCode.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

generateCode.form = generateCodeForm

/**
* @see \App\Http\Controllers\SupplierController::index
* @see app/Http/Controllers/SupplierController.php:34
* @route '/api/suppliers'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/suppliers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierController::index
* @see app/Http/Controllers/SupplierController.php:34
* @route '/api/suppliers'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::index
* @see app/Http/Controllers/SupplierController.php:34
* @route '/api/suppliers'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::index
* @see app/Http/Controllers/SupplierController.php:34
* @route '/api/suppliers'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierController::index
* @see app/Http/Controllers/SupplierController.php:34
* @route '/api/suppliers'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::index
* @see app/Http/Controllers/SupplierController.php:34
* @route '/api/suppliers'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::index
* @see app/Http/Controllers/SupplierController.php:34
* @route '/api/suppliers'
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
* @see \App\Http\Controllers\SupplierController::store
* @see app/Http/Controllers/SupplierController.php:145
* @route '/api/suppliers'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/suppliers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SupplierController::store
* @see app/Http/Controllers/SupplierController.php:145
* @route '/api/suppliers'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::store
* @see app/Http/Controllers/SupplierController.php:145
* @route '/api/suppliers'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::store
* @see app/Http/Controllers/SupplierController.php:145
* @route '/api/suppliers'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::store
* @see app/Http/Controllers/SupplierController.php:145
* @route '/api/suppliers'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\SupplierController::show
* @see app/Http/Controllers/SupplierController.php:113
* @route '/api/suppliers/{supplier}'
*/
export const show = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/suppliers/{supplier}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierController::show
* @see app/Http/Controllers/SupplierController.php:113
* @route '/api/suppliers/{supplier}'
*/
show.url = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { supplier: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            supplier: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        supplier: typeof args.supplier === 'object'
        ? args.supplier.id
        : args.supplier,
    }

    return show.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::show
* @see app/Http/Controllers/SupplierController.php:113
* @route '/api/suppliers/{supplier}'
*/
show.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::show
* @see app/Http/Controllers/SupplierController.php:113
* @route '/api/suppliers/{supplier}'
*/
show.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierController::show
* @see app/Http/Controllers/SupplierController.php:113
* @route '/api/suppliers/{supplier}'
*/
const showForm = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::show
* @see app/Http/Controllers/SupplierController.php:113
* @route '/api/suppliers/{supplier}'
*/
showForm.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::show
* @see app/Http/Controllers/SupplierController.php:113
* @route '/api/suppliers/{supplier}'
*/
showForm.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\SupplierController::update
* @see app/Http/Controllers/SupplierController.php:194
* @route '/api/suppliers/{supplier}'
*/
export const update = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/suppliers/{supplier}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\SupplierController::update
* @see app/Http/Controllers/SupplierController.php:194
* @route '/api/suppliers/{supplier}'
*/
update.url = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { supplier: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            supplier: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        supplier: typeof args.supplier === 'object'
        ? args.supplier.id
        : args.supplier,
    }

    return update.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::update
* @see app/Http/Controllers/SupplierController.php:194
* @route '/api/suppliers/{supplier}'
*/
update.put = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\SupplierController::update
* @see app/Http/Controllers/SupplierController.php:194
* @route '/api/suppliers/{supplier}'
*/
const updateForm = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::update
* @see app/Http/Controllers/SupplierController.php:194
* @route '/api/suppliers/{supplier}'
*/
updateForm.put = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\SupplierController::destroy
* @see app/Http/Controllers/SupplierController.php:276
* @route '/api/suppliers/{supplier}'
*/
export const destroy = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/suppliers/{supplier}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SupplierController::destroy
* @see app/Http/Controllers/SupplierController.php:276
* @route '/api/suppliers/{supplier}'
*/
destroy.url = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { supplier: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            supplier: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        supplier: typeof args.supplier === 'object'
        ? args.supplier.id
        : args.supplier,
    }

    return destroy.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::destroy
* @see app/Http/Controllers/SupplierController.php:276
* @route '/api/suppliers/{supplier}'
*/
destroy.delete = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SupplierController::destroy
* @see app/Http/Controllers/SupplierController.php:276
* @route '/api/suppliers/{supplier}'
*/
const destroyForm = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::destroy
* @see app/Http/Controllers/SupplierController.php:276
* @route '/api/suppliers/{supplier}'
*/
destroyForm.delete = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\SupplierController::checkUsage
* @see app/Http/Controllers/SupplierController.php:253
* @route '/api/suppliers/{supplier}/usage'
*/
export const checkUsage = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkUsage.url(args, queryOptions),
    method: 'get',
})

checkUsage.definition = {
    methods: ["get","head"],
    url: '/api/suppliers/{supplier}/usage',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierController::checkUsage
* @see app/Http/Controllers/SupplierController.php:253
* @route '/api/suppliers/{supplier}/usage'
*/
checkUsage.url = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { supplier: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            supplier: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        supplier: typeof args.supplier === 'object'
        ? args.supplier.id
        : args.supplier,
    }

    return checkUsage.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::checkUsage
* @see app/Http/Controllers/SupplierController.php:253
* @route '/api/suppliers/{supplier}/usage'
*/
checkUsage.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: checkUsage.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::checkUsage
* @see app/Http/Controllers/SupplierController.php:253
* @route '/api/suppliers/{supplier}/usage'
*/
checkUsage.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: checkUsage.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierController::checkUsage
* @see app/Http/Controllers/SupplierController.php:253
* @route '/api/suppliers/{supplier}/usage'
*/
const checkUsageForm = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: checkUsage.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::checkUsage
* @see app/Http/Controllers/SupplierController.php:253
* @route '/api/suppliers/{supplier}/usage'
*/
checkUsageForm.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: checkUsage.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::checkUsage
* @see app/Http/Controllers/SupplierController.php:253
* @route '/api/suppliers/{supplier}/usage'
*/
checkUsageForm.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: checkUsage.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

checkUsage.form = checkUsageForm

/**
* @see \App\Http\Controllers\SupplierController::payments
* @see app/Http/Controllers/SupplierController.php:323
* @route '/api/suppliers/{supplier}/payments'
*/
export const payments = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: payments.url(args, queryOptions),
    method: 'get',
})

payments.definition = {
    methods: ["get","head"],
    url: '/api/suppliers/{supplier}/payments',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SupplierController::payments
* @see app/Http/Controllers/SupplierController.php:323
* @route '/api/suppliers/{supplier}/payments'
*/
payments.url = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { supplier: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { supplier: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            supplier: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        supplier: typeof args.supplier === 'object'
        ? args.supplier.id
        : args.supplier,
    }

    return payments.definition.url
            .replace('{supplier}', parsedArgs.supplier.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::payments
* @see app/Http/Controllers/SupplierController.php:323
* @route '/api/suppliers/{supplier}/payments'
*/
payments.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: payments.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::payments
* @see app/Http/Controllers/SupplierController.php:323
* @route '/api/suppliers/{supplier}/payments'
*/
payments.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: payments.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\SupplierController::payments
* @see app/Http/Controllers/SupplierController.php:323
* @route '/api/suppliers/{supplier}/payments'
*/
const paymentsForm = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: payments.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::payments
* @see app/Http/Controllers/SupplierController.php:323
* @route '/api/suppliers/{supplier}/payments'
*/
paymentsForm.get = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: payments.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\SupplierController::payments
* @see app/Http/Controllers/SupplierController.php:323
* @route '/api/suppliers/{supplier}/payments'
*/
paymentsForm.head = (args: { supplier: number | { id: number } } | [supplier: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: payments.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

payments.form = paymentsForm

/**
* @see \App\Http\Controllers\SupplierController::createPayment
* @see app/Http/Controllers/SupplierController.php:498
* @route '/api/supplier-payments'
*/
export const createPayment = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createPayment.url(queryOptions),
    method: 'post',
})

createPayment.definition = {
    methods: ["post"],
    url: '/api/supplier-payments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SupplierController::createPayment
* @see app/Http/Controllers/SupplierController.php:498
* @route '/api/supplier-payments'
*/
createPayment.url = (queryOptions?: RouteQueryOptions) => {




    return createPayment.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::createPayment
* @see app/Http/Controllers/SupplierController.php:498
* @route '/api/supplier-payments'
*/
createPayment.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createPayment.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::createPayment
* @see app/Http/Controllers/SupplierController.php:498
* @route '/api/supplier-payments'
*/
const createPaymentForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createPayment.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::createPayment
* @see app/Http/Controllers/SupplierController.php:498
* @route '/api/supplier-payments'
*/
createPaymentForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createPayment.url(

    queryOptions
   ),
    method: 'post',
})

createPayment.form = createPaymentForm

/**
* @see \App\Http\Controllers\SupplierController::updatePayment
* @see app/Http/Controllers/SupplierController.php:567
* @route '/api/supplier-payments/{payment}'
*/
export const updatePayment = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatePayment.url(args, queryOptions),
    method: 'put',
})

updatePayment.definition = {
    methods: ["put"],
    url: '/api/supplier-payments/{payment}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\SupplierController::updatePayment
* @see app/Http/Controllers/SupplierController.php:567
* @route '/api/supplier-payments/{payment}'
*/
updatePayment.url = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { payment: args }
    }


    if (Array.isArray(args)) {
        args = {
            payment: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        payment: args.payment,
    }

    return updatePayment.definition.url
            .replace('{payment}', parsedArgs.payment.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::updatePayment
* @see app/Http/Controllers/SupplierController.php:567
* @route '/api/supplier-payments/{payment}'
*/
updatePayment.put = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updatePayment.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\SupplierController::updatePayment
* @see app/Http/Controllers/SupplierController.php:567
* @route '/api/supplier-payments/{payment}'
*/
const updatePaymentForm = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatePayment.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::updatePayment
* @see app/Http/Controllers/SupplierController.php:567
* @route '/api/supplier-payments/{payment}'
*/
updatePaymentForm.put = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatePayment.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updatePayment.form = updatePaymentForm

/**
* @see \App\Http\Controllers\SupplierController::deletePayment
* @see app/Http/Controllers/SupplierController.php:638
* @route '/api/supplier-payments/{payment}'
*/
export const deletePayment = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deletePayment.url(args, queryOptions),
    method: 'delete',
})

deletePayment.definition = {
    methods: ["delete"],
    url: '/api/supplier-payments/{payment}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\SupplierController::deletePayment
* @see app/Http/Controllers/SupplierController.php:638
* @route '/api/supplier-payments/{payment}'
*/
deletePayment.url = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { payment: args }
    }


    if (Array.isArray(args)) {
        args = {
            payment: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        payment: args.payment,
    }

    return deletePayment.definition.url
            .replace('{payment}', parsedArgs.payment.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::deletePayment
* @see app/Http/Controllers/SupplierController.php:638
* @route '/api/supplier-payments/{payment}'
*/
deletePayment.delete = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deletePayment.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\SupplierController::deletePayment
* @see app/Http/Controllers/SupplierController.php:638
* @route '/api/supplier-payments/{payment}'
*/
const deletePaymentForm = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deletePayment.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::deletePayment
* @see app/Http/Controllers/SupplierController.php:638
* @route '/api/supplier-payments/{payment}'
*/
deletePaymentForm.delete = (args: { payment: string | number } | [payment: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deletePayment.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

deletePayment.form = deletePaymentForm

/**
* @see \App\Http\Controllers\SupplierController::deleteAllPayments
* @see app/Http/Controllers/SupplierController.php:1055
* @route '/api/supplier-payments/delete-all'
*/
export const deleteAllPayments = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAllPayments.url(queryOptions),
    method: 'post',
})

deleteAllPayments.definition = {
    methods: ["post"],
    url: '/api/supplier-payments/delete-all',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SupplierController::deleteAllPayments
* @see app/Http/Controllers/SupplierController.php:1055
* @route '/api/supplier-payments/delete-all'
*/
deleteAllPayments.url = (queryOptions?: RouteQueryOptions) => {




    return deleteAllPayments.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\SupplierController::deleteAllPayments
* @see app/Http/Controllers/SupplierController.php:1055
* @route '/api/supplier-payments/delete-all'
*/
deleteAllPayments.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAllPayments.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::deleteAllPayments
* @see app/Http/Controllers/SupplierController.php:1055
* @route '/api/supplier-payments/delete-all'
*/
const deleteAllPaymentsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAllPayments.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\SupplierController::deleteAllPayments
* @see app/Http/Controllers/SupplierController.php:1055
* @route '/api/supplier-payments/delete-all'
*/
deleteAllPaymentsForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAllPayments.url(

    queryOptions
   ),
    method: 'post',
})

deleteAllPayments.form = deleteAllPaymentsForm

const SupplierController = { exportMethod, validateImport, processImport, generateCode, index, store, show, update, destroy, checkUsage, payments, createPayment, updatePayment, deletePayment, deleteAllPayments, export: exportMethod }

export default SupplierController