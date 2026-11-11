import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see vendor/laravel/framework/src/Illuminate/Filesystem/FilesystemServiceProvider.php:98
* @route '/storage/{path}'
*/
export const local = (args: { path: string | number } | [path: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: local.url(args, queryOptions),
    method: 'get',
})

local.definition = {
    methods: ["get","head"],
    url: '/storage/{path}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see vendor/laravel/framework/src/Illuminate/Filesystem/FilesystemServiceProvider.php:98
* @route '/storage/{path}'
*/
local.url = (args: { path: string | number } | [path: string | number ] | string | number, queryOptions?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { path: args }
    }


    if (Array.isArray(args)) {
        args = {
            path: args[0],
        }
    }

    args = applyUrlDefaults(args)


    const parsedArgs = {
        path: args.path,
    }

    return local.definition.url
            .replace('{path}', parsedArgs.path.toString())
            .replace(/\/+$/, '')
    + queryParams(queryOptions)
}

/**
* @see vendor/laravel/framework/src/Illuminate/Filesystem/FilesystemServiceProvider.php:98
* @route '/storage/{path}'
*/
local.get = (args: { path: string | number } | [path: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: local.url(args, queryOptions),
    method: 'get',
})

/**
* @see vendor/laravel/framework/src/Illuminate/Filesystem/FilesystemServiceProvider.php:98
* @route '/storage/{path}'
*/
local.head = (args: { path: string | number } | [path: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: local.url(args, queryOptions),
    method: 'head',
})

/**
* @see vendor/laravel/framework/src/Illuminate/Filesystem/FilesystemServiceProvider.php:98
* @route '/storage/{path}'
*/
const localForm = (args: { path: string | number } | [path: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: local.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see vendor/laravel/framework/src/Illuminate/Filesystem/FilesystemServiceProvider.php:98
* @route '/storage/{path}'
*/
localForm.get = (args: { path: string | number } | [path: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: local.url(
    args,
    queryOptions
   ),
    method: 'get',
})

/**
* @see vendor/laravel/framework/src/Illuminate/Filesystem/FilesystemServiceProvider.php:98
* @route '/storage/{path}'
*/
localForm.head = (args: { path: string | number } | [path: string | number ] | string | number, queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: local.url(args, {
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

local.form = localForm



const storage = {
    local: Object.assign(local, local),
}

export default storage