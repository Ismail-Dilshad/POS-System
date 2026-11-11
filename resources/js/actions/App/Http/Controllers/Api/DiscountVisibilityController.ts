import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::show
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:14
* @route '/api/pos/discount-visibility'
*/
export const show = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/pos/discount-visibility',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::show
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:14
* @route '/api/pos/discount-visibility'
*/
show.url = (queryOptions?: RouteQueryOptions) => {




    return show.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::show
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:14
* @route '/api/pos/discount-visibility'
*/
show.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::show
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:14
* @route '/api/pos/discount-visibility'
*/
show.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::show
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:14
* @route '/api/pos/discount-visibility'
*/
const showForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::show
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:14
* @route '/api/pos/discount-visibility'
*/
showForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::show
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:14
* @route '/api/pos/discount-visibility'
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
* @see \App\Http\Controllers\Api\DiscountVisibilityController::update
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:23
* @route '/api/pos/discount-visibility'
*/
export const update = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(queryOptions),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/api/pos/discount-visibility',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::update
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:23
* @route '/api/pos/discount-visibility'
*/
update.url = (queryOptions?: RouteQueryOptions) => {




    return update.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::update
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:23
* @route '/api/pos/discount-visibility'
*/
update.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::update
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:23
* @route '/api/pos/discount-visibility'
*/
const updateForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\DiscountVisibilityController::update
* @see app/Http/Controllers/Api/DiscountVisibilityController.php:23
* @route '/api/pos/discount-visibility'
*/
updateForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(

    queryOptions
   ),
    method: 'post',
})

update.form = updateForm

const DiscountVisibilityController = { show, update }

export default DiscountVisibilityController