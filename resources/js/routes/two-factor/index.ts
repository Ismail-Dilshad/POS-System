import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import loginDf2c2a from './login'
/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
export const login = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/two-factor-challenge',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
login.url = (queryOptions?: RouteQueryOptions) => {




    return login.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
login.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
login.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
const loginForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
loginForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController::login
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticatedSessionController.php:42
* @route '/two-factor-challenge'
*/
loginForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

login.form = loginForm

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::enable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:21
* @route '/user/two-factor-authentication'
*/
export const enable = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enable.url(queryOptions),
    method: 'post',
})

enable.definition = {
    methods: ["post"],
    url: '/user/two-factor-authentication',
} satisfies RouteDefinition<["post"]>

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::enable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:21
* @route '/user/two-factor-authentication'
*/
enable.url = (queryOptions?: RouteQueryOptions) => {




    return enable.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::enable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:21
* @route '/user/two-factor-authentication'
*/
enable.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: enable.url(queryOptions),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::enable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:21
* @route '/user/two-factor-authentication'
*/
const enableForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: enable.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::enable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:21
* @route '/user/two-factor-authentication'
*/
enableForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: enable.url(

    queryOptions
   ),
    method: 'post',
})

enable.form = enableForm

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedTwoFactorAuthenticationController::confirm
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedTwoFactorAuthenticationController.php:19
* @route '/user/confirmed-two-factor-authentication'
*/
export const confirm = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(queryOptions),
    method: 'post',
})

confirm.definition = {
    methods: ["post"],
    url: '/user/confirmed-two-factor-authentication',
} satisfies RouteDefinition<["post"]>

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedTwoFactorAuthenticationController::confirm
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedTwoFactorAuthenticationController.php:19
* @route '/user/confirmed-two-factor-authentication'
*/
confirm.url = (queryOptions?: RouteQueryOptions) => {




    return confirm.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedTwoFactorAuthenticationController::confirm
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedTwoFactorAuthenticationController.php:19
* @route '/user/confirmed-two-factor-authentication'
*/
confirm.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: confirm.url(queryOptions),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedTwoFactorAuthenticationController::confirm
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedTwoFactorAuthenticationController.php:19
* @route '/user/confirmed-two-factor-authentication'
*/
const confirmForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: confirm.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\ConfirmedTwoFactorAuthenticationController::confirm
* @see vendor/laravel/fortify/src/Http/Controllers/ConfirmedTwoFactorAuthenticationController.php:19
* @route '/user/confirmed-two-factor-authentication'
*/
confirmForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: confirm.url(

    queryOptions
   ),
    method: 'post',
})

confirm.form = confirmForm

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::disable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:35
* @route '/user/two-factor-authentication'
*/
export const disable = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: disable.url(queryOptions),
    method: 'delete',
})

disable.definition = {
    methods: ["delete"],
    url: '/user/two-factor-authentication',
} satisfies RouteDefinition<["delete"]>

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::disable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:35
* @route '/user/two-factor-authentication'
*/
disable.url = (queryOptions?: RouteQueryOptions) => {




    return disable.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::disable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:35
* @route '/user/two-factor-authentication'
*/
disable.delete = (queryOptions?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: disable.url(queryOptions),
    method: 'delete',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::disable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:35
* @route '/user/two-factor-authentication'
*/
const disableForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: disable.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorAuthenticationController::disable
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorAuthenticationController.php:35
* @route '/user/two-factor-authentication'
*/
disableForm.delete = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: disable.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

disable.form = disableForm

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::qrCode
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
export const qrCode = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: qrCode.url(queryOptions),
    method: 'get',
})

qrCode.definition = {
    methods: ["get","head"],
    url: '/user/two-factor-qr-code',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::qrCode
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
qrCode.url = (queryOptions?: RouteQueryOptions) => {




    return qrCode.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::qrCode
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
qrCode.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: qrCode.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::qrCode
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
qrCode.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: qrCode.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::qrCode
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
const qrCodeForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: qrCode.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::qrCode
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
qrCodeForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: qrCode.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorQrCodeController::qrCode
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorQrCodeController.php:16
* @route '/user/two-factor-qr-code'
*/
qrCodeForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: qrCode.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

qrCode.form = qrCodeForm

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::secretKey
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
export const secretKey = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: secretKey.url(queryOptions),
    method: 'get',
})

secretKey.definition = {
    methods: ["get","head"],
    url: '/user/two-factor-secret-key',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::secretKey
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
secretKey.url = (queryOptions?: RouteQueryOptions) => {




    return secretKey.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::secretKey
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
secretKey.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: secretKey.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::secretKey
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
secretKey.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: secretKey.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::secretKey
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
const secretKeyForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: secretKey.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::secretKey
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
secretKeyForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: secretKey.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\TwoFactorSecretKeyController::secretKey
* @see vendor/laravel/fortify/src/Http/Controllers/TwoFactorSecretKeyController.php:17
* @route '/user/two-factor-secret-key'
*/
secretKeyForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: secretKey.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

secretKey.form = secretKeyForm

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::recoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
export const recoveryCodes = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recoveryCodes.url(queryOptions),
    method: 'get',
})

recoveryCodes.definition = {
    methods: ["get","head"],
    url: '/user/two-factor-recovery-codes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::recoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
recoveryCodes.url = (queryOptions?: RouteQueryOptions) => {




    return recoveryCodes.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::recoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
recoveryCodes.get = (queryOptions?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: recoveryCodes.url(queryOptions),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::recoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
recoveryCodes.head = (queryOptions?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: recoveryCodes.url(queryOptions),
    method: 'head',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::recoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
const recoveryCodesForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: recoveryCodes.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::recoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
recoveryCodesForm.get = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: recoveryCodes.url(

    queryOptions
   ),
    method: 'get',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::recoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:19
* @route '/user/two-factor-recovery-codes'
*/
recoveryCodesForm.head = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: recoveryCodes.url({
        [queryOptions?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(queryOptions?.query ?? queryOptions?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

recoveryCodes.form = recoveryCodesForm

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::regenerateRecoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
export const regenerateRecoveryCodes = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: regenerateRecoveryCodes.url(queryOptions),
    method: 'post',
})

regenerateRecoveryCodes.definition = {
    methods: ["post"],
    url: '/user/two-factor-recovery-codes',
} satisfies RouteDefinition<["post"]>

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::regenerateRecoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
regenerateRecoveryCodes.url = (queryOptions?: RouteQueryOptions) => {




    return regenerateRecoveryCodes.definition.url
    + queryParams(queryOptions)
}

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::regenerateRecoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
regenerateRecoveryCodes.post = (queryOptions?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: regenerateRecoveryCodes.url(queryOptions),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::regenerateRecoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
const regenerateRecoveryCodesForm = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: regenerateRecoveryCodes.url(

    queryOptions
   ),
    method: 'post',
})

/**
* @see \Laravel\Fortify\Http\Controllers\RecoveryCodeController::regenerateRecoveryCodes
* @see vendor/laravel/fortify/src/Http/Controllers/RecoveryCodeController.php:38
* @route '/user/two-factor-recovery-codes'
*/
regenerateRecoveryCodesForm.post = (queryOptions?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: regenerateRecoveryCodes.url(

    queryOptions
   ),
    method: 'post',
})

regenerateRecoveryCodes.form = regenerateRecoveryCodesForm



const twoFactor = {
    login: Object.assign(login, loginDf2c2a),
    enable: Object.assign(enable, enable),
    confirm: Object.assign(confirm, confirm),
    disable: Object.assign(disable, disable),
    qrCode: Object.assign(qrCode, qrCode),
    secretKey: Object.assign(secretKey, secretKey),
    recoveryCodes: Object.assign(recoveryCodes, recoveryCodes),
    regenerateRecoveryCodes: Object.assign(regenerateRecoveryCodes, regenerateRecoveryCodes),
}

export default twoFactor