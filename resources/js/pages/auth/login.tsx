import InputError from '@/components/forms/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, Lock, User } from 'lucide-react';
import { useState } from 'react';

interface LoginProps {
    status?: string;
    portal_role: string;
    login_url: string;
    portal_links: Array<{ role: string; url: string }>;
}

export default function Login({ status, portal_role, login_url, portal_links }: LoginProps) {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthLayout
            title={t('login_page.welcome_back')}
            description={t('login_page.sign_in_description')}
        >
            <Head title={t('auth.login')} />

            <p className="mb-3 text-center font-medium">{t('portal_login.' + portal_role)}</p>
            <nav aria-label={t('portal_login.choose')} className="mb-4 flex flex-wrap justify-center gap-3 text-sm">
                {portal_links.map(link => <a key={link.role} href={link.url} aria-current={link.role === portal_role ? 'page' : undefined} className={link.role === portal_role ? 'font-semibold underline' : 'text-muted-foreground hover:underline'}>{t('portal_login.' + link.role)}</a>)}
            </nav>
            <Form
                action={login_url}
                method="post"
                resetOnSuccess={['password']}
                className="space-y-4"
            >
                {({
                    processing,
                    errors,
                }: {
                    processing: boolean;
                    errors: Record<string, string[]>;
                }) => (
                    <>
                        {/* Main Form Container */}
                        <div className="space-y-2 px-4">
                            {/* Form Fields Section */}
                            <div className="space-y-4">
                                {/* Username Field */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="username"
                                        className="flex items-center gap-2 text-sm font-semibold text-[#4A6CF7] dark:text-white/90"
                                    >
                                        <User className="h-4 w-4 text-[#4A6CF7] dark:text-[#4A6CF7]" />
                                        {t('auth.username')}
                                    </Label>
                                    <div className="group relative">
                                        <User className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-[#4A6CF7]/60 transition-colors duration-200 group-focus-within:text-[#4A6CF7] dark:text-[#4A6CF7]/70 dark:group-focus-within:text-[#4A6CF7]" />
                                        <Input
                                            id="username"
                                            type="text"
                                            name="username"
                                            required
                                            autoFocus={true}
                                            tabIndex={1}
                                            autoComplete="username"
                                            placeholder={t('auth.username')}
                                            className="h-12 rounded-xl bg-white/80 pr-4 pl-12 text-base transition-all duration-300 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(74,108,247,0.3)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_0_1px_rgba(74,108,247,0.4)] focus:shadow-[0_0_0_1px_rgba(0,0,0,0.3)] dark:focus:shadow-[0_0_0_1px_rgba(74,108,247,0.5)] focus:ring-4 focus:ring-muted/20 dark:bg-[#212324] dark:text-white dark:placeholder-white/60"
                                        />
                                    </div>
                                    <InputError message={errors.username} />
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="password"
                                        className="flex items-center gap-2 text-sm font-semibold text-[#4A6CF7] dark:text-white/90"
                                    >
                                        <Lock className="h-4 w-4 text-[#4A6CF7] dark:text-[#4A6CF7]" />
                                        {t('auth.password')}
                                    </Label>
                                    <div className="group relative">
                                        <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-[#4A6CF7]/60 transition-colors duration-200 group-focus-within:text-[#4A6CF7] dark:text-[#4A6CF7]/70 dark:group-focus-within:text-[#4A6CF7]" />
                                        <Input
                                            id="password"
                                            type={
                                                showPassword ? 'text' : 'password'
                                            }
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder={t('auth.password')}
                                            className="h-12 rounded-xl bg-white/80 pr-12 pl-12 text-base transition-all duration-300 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(74,108,247,0.3)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_0_0_1px_rgba(74,108,247,0.4)] focus:shadow-[0_0_0_1px_rgba(0,0,0,0.3)] dark:focus:shadow-[0_0_0_1px_rgba(74,108,247,0.5)] focus:ring-4 focus:ring-muted/20 dark:bg-[#212324] dark:text-white dark:placeholder-white/60"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 transform rounded-md p-1 text-muted-foreground/60 transition-colors duration-200 hover:bg-muted/10 hover:text-muted-foreground dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>
                            </div>

                            {/* Remember Me Section */}
                            <div className="flex items-center space-x-3 rounded-xl border-0 bg-[#4A6CF7]/5 p-4 dark:bg-[#4A6CF7]/15 dark:ring-1 dark:ring-[#4A6CF7]/20">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    defaultChecked={true}
                                    className="border-2 border-border transition-all duration-200 hover:border-muted-foreground/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white dark:border-[#4A6CF7]/40 dark:hover:border-[#4A6CF7]/60"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer text-sm font-medium text-foreground transition-colors duration-200 hover:text-muted-foreground dark:text-white/90 dark:hover:text-white"
                                >
                                    {t('auth.remember_me')}
                                </Label>
                            </div>

                            {/* Login Button Section */}
                            <div className="pt-1">
                                <Button
                                    type="submit"
                                        className="h-12 w-full transform rounded-xl border-0 bg-gradient-to-r from-primary to-secondary text-base font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:from-primary/90 hover:to-secondary/90 hover:shadow-2xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-[0_8px_32px_rgba(74,108,247,0.3)] dark:hover:shadow-[0_12px_40px_rgba(74,108,247,0.4)]"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                                            {t('auth.signing_in')}
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="mr-2 h-5 w-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                                />
                                            </svg>
                                            {t('auth.login_button')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-6 rounded-xl border-2 border-[#4A6CF7]/30 bg-gradient-to-r from-[#4A6CF7]/10 to-[#F7A64A]/10 p-4 text-center text-sm font-semibold text-[#4A6CF7] shadow-lg duration-300 animate-in slide-in-from-top-2 dark:border-[#4A6CF7]/50 dark:from-[#4A6CF7]/20 dark:to-[#F7A64A]/20 dark:bg-gradient-to-r dark:from-[#4A6CF7]/15 dark:to-[#F7A64A]/15 dark:text-white dark:shadow-[0_8px_32px_rgba(74,108,247,0.2)]">
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-[#4A6CF7] dark:bg-white"></div>
                        {status}
                        <div className="h-2 w-2 animate-pulse rounded-full bg-[#4A6CF7] dark:bg-white"></div>
                    </div>
                </div>
            )}
        </AuthLayout>
    );
}
