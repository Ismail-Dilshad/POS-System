import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\BackupController::createBackup
* @see app/Http/Controllers/Api/BackupController.php:14
* @route '/api/backup/create'
*/
export const createBackup = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createBackup.url(queryOptions),
    method: 'post',
})

createBackup.definition = {
    methods: ["post"],
    url: '/api/backup/create',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BackupController::createBackup
* @see app/Http/Controllers/Api/BackupController.php:14
* @route '/api/backup/create'
*/
createBackup.url = (queryOptions?: RouteQueryOptions) => {




    return createBackup.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\BackupController::createBackup
* @see app/Http/Controllers/Api/BackupController.php:14
* @route '/api/backup/create'
*/
createBackup.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: createBackup.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\BackupController::createBackup
* @see app/Http/Controllers/Api/BackupController.php:14
* @route '/api/backup/create'
*/
const createBackupForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createBackup.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\BackupController::createBackup
* @see app/Http/Controllers/Api/BackupController.php:14
* @route '/api/backup/create'
*/
createBackupForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: createBackup.url(

    queryOptions
   ),
    method: 'post',
})

createBackup.form = createBackupForm

/**
* @see \App\Http\Controllers\Api\BackupController::importBackup
* @see app/Http/Controllers/Api/BackupController.php:222
* @route '/api/backup/import'
*/
export const importBackup = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importBackup.url(queryOptions),
    method: 'post',
})

importBackup.definition = {
    methods: ["post"],
    url: '/api/backup/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BackupController::importBackup
* @see app/Http/Controllers/Api/BackupController.php:222
* @route '/api/backup/import'
*/
importBackup.url = (queryOptions?: RouteQueryOptions) => {




    return importBackup.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\BackupController::importBackup
* @see app/Http/Controllers/Api/BackupController.php:222
* @route '/api/backup/import'
*/
importBackup.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importBackup.url(queryOptions),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\BackupController::importBackup
* @see app/Http/Controllers/Api/BackupController.php:222
* @route '/api/backup/import'
*/
const importBackupForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importBackup.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\BackupController::importBackup
* @see app/Http/Controllers/Api/BackupController.php:222
* @route '/api/backup/import'
*/
importBackupForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: importBackup.url(

    queryOptions
   ),
    method: 'post',
})

importBackup.form = importBackupForm

/**
* @see \App\Http\Controllers\Api\BackupController::downloadBackup
* @see app/Http/Controllers/Api/BackupController.php:99
* @route '/api/backup/download'
*/
export const downloadBackup = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadBackup.url(queryOptions),
    method: 'get',
})

downloadBackup.definition = {
    methods: ["get","head"],
    url: '/api/backup/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\BackupController::downloadBackup
* @see app/Http/Controllers/Api/BackupController.php:99
* @route '/api/backup/download'
*/
downloadBackup.url = (queryOptions?: RouteQueryOptions) => {




    return downloadBackup.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\BackupController::downloadBackup
* @see app/Http/Controllers/Api/BackupController.php:99
* @route '/api/backup/download'
*/
downloadBackup.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: downloadBackup.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BackupController::downloadBackup
* @see app/Http/Controllers/Api/BackupController.php:99
* @route '/api/backup/download'
*/
downloadBackup.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: downloadBackup.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\BackupController::downloadBackup
* @see app/Http/Controllers/Api/BackupController.php:99
* @route '/api/backup/download'
*/
const downloadBackupForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: downloadBackup.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BackupController::downloadBackup
* @see app/Http/Controllers/Api/BackupController.php:99
* @route '/api/backup/download'
*/
downloadBackupForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: downloadBackup.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BackupController::downloadBackup
* @see app/Http/Controllers/Api/BackupController.php:99
* @route '/api/backup/download'
*/
downloadBackupForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: downloadBackup.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

downloadBackup.form = downloadBackupForm

/**
* @see \App\Http\Controllers\Api\BackupController::listBackups
* @see app/Http/Controllers/Api/BackupController.php:122
* @route '/api/backup/list'
*/
export const listBackups = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: listBackups.url(queryOptions),
    method: 'get',
})

listBackups.definition = {
    methods: ["get","head"],
    url: '/api/backup/list',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\BackupController::listBackups
* @see app/Http/Controllers/Api/BackupController.php:122
* @route '/api/backup/list'
*/
listBackups.url = (queryOptions?: RouteQueryOptions) => {




    return listBackups.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\BackupController::listBackups
* @see app/Http/Controllers/Api/BackupController.php:122
* @route '/api/backup/list'
*/
listBackups.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: listBackups.url(queryOptions),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BackupController::listBackups
* @see app/Http/Controllers/Api/BackupController.php:122
* @route '/api/backup/list'
*/
listBackups.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: listBackups.url(queryOptions),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\BackupController::listBackups
* @see app/Http/Controllers/Api/BackupController.php:122
* @route '/api/backup/list'
*/
const listBackupsForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: listBackups.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BackupController::listBackups
* @see app/Http/Controllers/Api/BackupController.php:122
* @route '/api/backup/list'
*/
listBackupsForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: listBackups.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\BackupController::listBackups
* @see app/Http/Controllers/Api/BackupController.php:122
* @route '/api/backup/list'
*/
listBackupsForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: listBackups.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

listBackups.form = listBackupsForm

/**
* @see \App\Http\Controllers\Api\BackupController::deleteBackup
* @see app/Http/Controllers/Api/BackupController.php:189
* @route '/api/backup/delete'
*/
export const deleteBackup = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteBackup.url(queryOptions),
    method: 'delete',
})

deleteBackup.definition = {
    methods: ["delete"],
    url: '/api/backup/delete',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\BackupController::deleteBackup
* @see app/Http/Controllers/Api/BackupController.php:189
* @route '/api/backup/delete'
*/
deleteBackup.url = (queryOptions?: RouteQueryOptions) => {




    return deleteBackup.definition.url
    + queryParams(queryOptions)
}

/**
* @see \App\Http\Controllers\Api\BackupController::deleteBackup
* @see app/Http/Controllers/Api/BackupController.php:189
* @route '/api/backup/delete'
*/
deleteBackup.delete = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: deleteBackup.url(queryOptions),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\BackupController::deleteBackup
* @see app/Http/Controllers/Api/BackupController.php:189
* @route '/api/backup/delete'
*/
const deleteBackupForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteBackup.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\BackupController::deleteBackup
* @see app/Http/Controllers/Api/BackupController.php:189
* @route '/api/backup/delete'
*/
deleteBackupForm.delete = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: deleteBackup.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

deleteBackup.form = deleteBackupForm

const BackupController = { createBackup, importBackup, downloadBackup, listBackups, deleteBackup }

export default BackupController