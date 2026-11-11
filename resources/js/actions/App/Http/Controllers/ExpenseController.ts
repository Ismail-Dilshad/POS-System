import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ExpenseController::index
* @see app/Http/Controllers/ExpenseController.php:20
* @route '/api/expenses'
*/
export const index = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/expenses',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExpenseController::index
* @see app/Http/Controllers/ExpenseController.php:20
* @route '/api/expenses'
*/
index.url = (queryOptions?: RouteQueryOptions) => {




    return index.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ExpenseController::index
* @see app/Http/Controllers/ExpenseController.php:20
* @route '/api/expenses'
*/
index.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::index
* @see app/Http/Controllers/ExpenseController.php:20
* @route '/api/expenses'
*/
index.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExpenseController::index
* @see app/Http/Controllers/ExpenseController.php:20
* @route '/api/expenses'
*/
const indexForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::index
* @see app/Http/Controllers/ExpenseController.php:20
* @route '/api/expenses'
*/
indexForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::index
* @see app/Http/Controllers/ExpenseController.php:20
* @route '/api/expenses'
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
* @see \App\Http\Controllers\ExpenseController::getAll
* @see app/Http/Controllers/ExpenseController.php:321
* @route '/api/expenses/all'
*/
export const getAll = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAll.url(queryOptions),
    method: 'get',
})

getAll.definition = {
    methods: ["get","head"],
    url: '/api/expenses/all',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExpenseController::getAll
* @see app/Http/Controllers/ExpenseController.php:321
* @route '/api/expenses/all'
*/
getAll.url = (queryOptions?: RouteQueryOptions) => {




    return getAll.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ExpenseController::getAll
* @see app/Http/Controllers/ExpenseController.php:321
* @route '/api/expenses/all'
*/
getAll.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: getAll.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::getAll
* @see app/Http/Controllers/ExpenseController.php:321
* @route '/api/expenses/all'
*/
getAll.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: getAll.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExpenseController::getAll
* @see app/Http/Controllers/ExpenseController.php:321
* @route '/api/expenses/all'
*/
const getAllForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::getAll
* @see app/Http/Controllers/ExpenseController.php:321
* @route '/api/expenses/all'
*/
getAllForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::getAll
* @see app/Http/Controllers/ExpenseController.php:321
* @route '/api/expenses/all'
*/
getAllForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: getAll.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

getAll.form = getAllForm

/**
* @see \App\Http\Controllers\ExpenseController::statistics
* @see app/Http/Controllers/ExpenseController.php:283
* @route '/api/expenses/statistics'
*/
export const statistics = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

statistics.definition = {
    methods: ["get","head"],
    url: '/api/expenses/statistics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExpenseController::statistics
* @see app/Http/Controllers/ExpenseController.php:283
* @route '/api/expenses/statistics'
*/
statistics.url = (queryOptions?: RouteQueryOptions) => {




    return statistics.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ExpenseController::statistics
* @see app/Http/Controllers/ExpenseController.php:283
* @route '/api/expenses/statistics'
*/
statistics.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: statistics.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::statistics
* @see app/Http/Controllers/ExpenseController.php:283
* @route '/api/expenses/statistics'
*/
statistics.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: statistics.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExpenseController::statistics
* @see app/Http/Controllers/ExpenseController.php:283
* @route '/api/expenses/statistics'
*/
const statisticsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::statistics
* @see app/Http/Controllers/ExpenseController.php:283
* @route '/api/expenses/statistics'
*/
statisticsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: statistics.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::statistics
* @see app/Http/Controllers/ExpenseController.php:283
* @route '/api/expenses/statistics'
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
* @see \App\Http\Controllers\ExpenseController::exportMethod
* @see app/Http/Controllers/ExpenseController.php:440
* @route '/api/expenses/export'
*/
export const exportMethod = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(queryOptions),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/api/expenses/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExpenseController::exportMethod
* @see app/Http/Controllers/ExpenseController.php:440
* @route '/api/expenses/export'
*/
exportMethod.url = (queryOptions?: RouteQueryOptions) => {




    return exportMethod.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ExpenseController::exportMethod
* @see app/Http/Controllers/ExpenseController.php:440
* @route '/api/expenses/export'
*/
exportMethod.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::exportMethod
* @see app/Http/Controllers/ExpenseController.php:440
* @route '/api/expenses/export'
*/
exportMethod.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExpenseController::exportMethod
* @see app/Http/Controllers/ExpenseController.php:440
* @route '/api/expenses/export'
*/
const exportMethodForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::exportMethod
* @see app/Http/Controllers/ExpenseController.php:440
* @route '/api/expenses/export'
*/
exportMethodForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: exportMethod.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::exportMethod
* @see app/Http/Controllers/ExpenseController.php:440
* @route '/api/expenses/export'
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
* @see \App\Http\Controllers\ExpenseController::store
* @see app/Http/Controllers/ExpenseController.php:138
* @route '/api/expenses'
*/
export const store = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/expenses',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ExpenseController::store
* @see app/Http/Controllers/ExpenseController.php:138
* @route '/api/expenses'
*/
store.url = (queryOptions?: RouteQueryOptions) => {




    return store.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ExpenseController::store
* @see app/Http/Controllers/ExpenseController.php:138
* @route '/api/expenses'
*/
store.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExpenseController::store
* @see app/Http/Controllers/ExpenseController.php:138
* @route '/api/expenses'
*/
const storeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExpenseController::store
* @see app/Http/Controllers/ExpenseController.php:138
* @route '/api/expenses'
*/
storeForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(

    queryOptions
   ),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\ExpenseController::show
* @see app/Http/Controllers/ExpenseController.php:183
* @route '/api/expenses/{expense}'
*/
export const show = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/expenses/{expense}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ExpenseController::show
* @see app/Http/Controllers/ExpenseController.php:183
* @route '/api/expenses/{expense}'
*/
show.url = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { expense: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { expense: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            expense: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        expense: typeof args.expense === 'object'
        ? args.expense.id
        : args.expense,
    }

    return show.definition.url
            .replace('{expense}', parsedArgs.expense.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ExpenseController::show
* @see app/Http/Controllers/ExpenseController.php:183
* @route '/api/expenses/{expense}'
*/
show.get = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::show
* @see app/Http/Controllers/ExpenseController.php:183
* @route '/api/expenses/{expense}'
*/
show.head = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\ExpenseController::show
* @see app/Http/Controllers/ExpenseController.php:183
* @route '/api/expenses/{expense}'
*/
const showForm = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::show
* @see app/Http/Controllers/ExpenseController.php:183
* @route '/api/expenses/{expense}'
*/
showForm.get = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\ExpenseController::show
* @see app/Http/Controllers/ExpenseController.php:183
* @route '/api/expenses/{expense}'
*/
showForm.head = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ExpenseController::update
* @see app/Http/Controllers/ExpenseController.php:211
* @route '/api/expenses/{expense}'
*/
export const update = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/expenses/{expense}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ExpenseController::update
* @see app/Http/Controllers/ExpenseController.php:211
* @route '/api/expenses/{expense}'
*/
update.url = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { expense: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { expense: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            expense: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        expense: typeof args.expense === 'object'
        ? args.expense.id
        : args.expense,
    }

    return update.definition.url
            .replace('{expense}', parsedArgs.expense.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ExpenseController::update
* @see app/Http/Controllers/ExpenseController.php:211
* @route '/api/expenses/{expense}'
*/
update.put = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, queryOptions),
    method: 'put',
})

/**
* @see \App\Http\Controllers\ExpenseController::update
* @see app/Http/Controllers/ExpenseController.php:211
* @route '/api/expenses/{expense}'
*/
const updateForm = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PUT',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExpenseController::update
* @see app/Http/Controllers/ExpenseController.php:211
* @route '/api/expenses/{expense}'
*/
updateForm.put = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ExpenseController::destroy
* @see app/Http/Controllers/ExpenseController.php:262
* @route '/api/expenses/{expense}'
*/
export const destroy = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/expenses/{expense}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ExpenseController::destroy
* @see app/Http/Controllers/ExpenseController.php:262
* @route '/api/expenses/{expense}'
*/
destroy.url = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { expense: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { expense: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            expense: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        expense: typeof args.expense === 'object'
        ? args.expense.id
        : args.expense,
    }

    return destroy.definition.url
            .replace('{expense}', parsedArgs.expense.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ExpenseController::destroy
* @see app/Http/Controllers/ExpenseController.php:262
* @route '/api/expenses/{expense}'
*/
destroy.delete = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\ExpenseController::destroy
* @see app/Http/Controllers/ExpenseController.php:262
* @route '/api/expenses/{expense}'
*/
const destroyForm = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExpenseController::destroy
* @see app/Http/Controllers/ExpenseController.php:262
* @route '/api/expenses/{expense}'
*/
destroyForm.delete = (args: { expense: number | { id: number } } | [expense: number | { id: number } ] | number | { id: number }, queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ExpenseController::deleteAll
* @see app/Http/Controllers/ExpenseController.php:498
* @route '/api/expenses/delete-all'
*/
export const deleteAll = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

deleteAll.definition = {
    methods: ["post"],
    url: '/api/expenses/delete-all',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ExpenseController::deleteAll
* @see app/Http/Controllers/ExpenseController.php:498
* @route '/api/expenses/delete-all'
*/
deleteAll.url = (queryOptions?: RouteQueryOptions) => {




    return deleteAll.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\ExpenseController::deleteAll
* @see app/Http/Controllers/ExpenseController.php:498
* @route '/api/expenses/delete-all'
*/
deleteAll.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: deleteAll.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExpenseController::deleteAll
* @see app/Http/Controllers/ExpenseController.php:498
* @route '/api/expenses/delete-all'
*/
const deleteAllForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\ExpenseController::deleteAll
* @see app/Http/Controllers/ExpenseController.php:498
* @route '/api/expenses/delete-all'
*/
deleteAllForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteAll.url(

    queryOptions
   ),
    method: 'post',
})

deleteAll.form = deleteAllForm

const ExpenseController = { index, getAll, statistics, exportMethod, store, show, update, destroy, deleteAll, export: exportMethod }

export default ExpenseController