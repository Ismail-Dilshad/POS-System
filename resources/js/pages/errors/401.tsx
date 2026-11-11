import { portalPath } from '@/lib/portal';
import AppLogoIcon from '@/components/layout/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTranslation } from '@/hooks/use-translation';
import { home } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Lock } from 'lucide-react';

export default function Unauthorized() {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('error_pages.head.401')} />

            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#4A6CF7] via-[#6B7CF7] to-[#4A6CF7] dark:from-[#0F1419] dark:via-[#1A2332] dark:to-[#0F1419]">
                {/* Enhanced Background Pattern */}
                <div className="absolute inset-0 opacity-40 dark:opacity-60">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='https://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F7A64A' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            backgroundRepeat: 'repeat',
                        }}
                    ></div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-20 left-20 h-32 w-32 animate-pulse rounded-full bg-[#4A6CF7]/20 blur-xl dark:bg-[#4A6CF7]/30"></div>
                <div
                    className="absolute right-20 bottom-20 h-40 w-40 animate-pulse rounded-full bg-[#F7A64A]/20 blur-xl dark:bg-[#F7A64A]/25"
                    style={{ animationDelay: '2s' }}
                ></div>
                <div
                    className="absolute top-1/2 left-1/4 h-24 w-24 animate-pulse rounded-full bg-[#4A6CF7]/20 blur-xl dark:bg-[#4A6CF7]/25"
                    style={{ animationDelay: '4s' }}
                ></div>

                <div className="relative flex min-h-screen">
                    {/* Main Content */}
                    <div className="flex flex-1 flex-col items-center justify-center bg-white p-6 dark:bg-gradient-to-br dark:from-[#0F1419] dark:via-[#1A2332] dark:to-[#0F1419] lg:p-12">
                        <div className="w-full max-w-md">
                            {/* Logo */}
                            <div className="mb-8 flex items-center justify-center">
                                <Link
                                    href={home.url()}
                                    className="flex items-center gap-3 font-medium text-[#4A6CF7] dark:text-white"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F3F3F] shadow-lg">
                                        <AppLogoIcon className="size-8 fill-current text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h1 className="text-xl font-bold">
                                            {t('auth_layout.market_system')}
                                        </h1>
                                        <p className="text-sm text-[#4A6CF7]/70 dark:text-white/70">
                                            {t('auth_layout.business_system')}
                                        </p>
                                    </div>
                                </Link>
                            </div>

                            <Card className="hover:shadow-3xl rounded-3xl border-0 bg-white/95 shadow-2xl ring-1 ring-[#4A6CF7]/20 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] dark:bg-[#1d1f20]/95 dark:ring-[#4A6CF7]/40 dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] dark:backdrop-blur-xl">
                                <CardHeader className="px-6 pt-6 pb-2 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#F39C12] to-[#E67E22] shadow-lg">
                                            <Lock className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    {/* Large 401 */}
                                    <div className="mb-6 bg-gradient-to-r from-[#F39C12] to-[#E67E22] bg-clip-text text-center text-6xl font-bold text-transparent">
                                        401
                                    </div>

                                    {/* Error Message */}
                                    <div className="space-y-4 text-center">
                                        <h1 className="text-xl font-semibold text-[#4A6CF7] dark:text-white">
                                            {t('error_pages.401.title')}
                                        </h1>
                                        <p className="text-sm text-muted-foreground">
                                            {t('error_pages.401.description')}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                                        <Button
                                            asChild
                                            variant="default"
                                            className="w-full bg-gradient-to-r from-[#4A6CF7] to-[#F7A64A] text-white hover:from-[#3A5CE7] hover:to-[#E7963A] sm:w-auto"
                                        >
                                            <Link href={portalPath('login')}>
                                                <Lock className="mr-2 h-4 w-4" />
                                                {t('auth.login')}
                                            </Link>
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={() => window.history.back()}
                                            className="w-full border-[#4A6CF7]/20 text-[#4A6CF7] hover:bg-[#4A6CF7]/10 dark:border-[#4A6CF7]/40 dark:text-[#4A6CF7] dark:hover:bg-[#4A6CF7]/20 sm:w-auto"
                                        >
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            {t('error_pages.common.go_back')}
                                        </Button>
                                    </div>

                                    {/* Help Text */}
                                    <div className="mt-4 text-center text-xs text-muted-foreground">
                                        {t('error_pages.common.sign_in_prompt')}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Side - Branding */}
                    <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#4A6CF7] via-[#F7A64A] to-[#2A4CF7] p-12 text-white lg:flex lg:w-1/2">
                        {/* Enhanced Background Elements */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
                        <div className="absolute top-0 right-0 h-96 w-96 translate-x-48 -translate-y-48 rounded-full bg-white/10"></div>
                        <div className="absolute bottom-0 left-0 h-80 w-80 -translate-x-40 translate-y-40 rounded-full bg-white/10"></div>

                        <div className="relative z-10 w-full max-w-md">
                            <div className="rounded-3xl border-0 bg-white/25 p-6 shadow-2xl backdrop-blur-md">
                                <div className="flex items-center justify-between text-3xl font-bold text-white">
                                    <span>{t('auth_layout.market_system')}</span>
                                    <span className="text-[#F7A64A]">401</span>
                                </div>
                                <p className="mt-4 text-white/90">
                                    {t('error_pages.common.authentication_required')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}