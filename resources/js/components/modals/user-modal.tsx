import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { type User } from '@/services/business/userService';
import {
    Eye,
    EyeOff,
    Phone,
    RefreshCw,
    Shield,
    UserCheck,
    User as UserIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user?: User | null;
    onSave: (user: User) => void;
}

export function UserModal({ isOpen, onClose, user, onSave }: UserModalProps) {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [formData, setFormData] = useState<User>({
        full_name: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'dataentry',
        is_active: true,
        phone: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                username: user.username || '',
                password: '', // Don't pre-fill password for security
                confirmPassword: '', // Don't pre-fill confirm password
                role: user.role || 'dataentry',
                is_active: user.is_active ?? true,
                phone: user.phone || '',
            });
        } else {
            setFormData({
                full_name: '',
                username: '',
                password: '',
                confirmPassword: '',
                role: 'dataentry',
                is_active: true,
                phone: '',
            });
        }
        setErrors({});
    }, [user]);

    const handleInputChange = (field: keyof User, value: string | boolean) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error for this field
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: '',
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Required fields
        if (!formData.full_name.trim()) {
            newErrors.full_name = t('user_modal.validation.full_name_required');
        }

        if (!formData.username.trim()) {
            newErrors.username = t('user_modal.validation.username_required');
        } else if (formData.username.length < 3) {
            newErrors.username = t('user_modal.validation.username_min_length');
        }

        if (!user && !formData.password) {
            newErrors.password = t('user_modal.validation.password_required');
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = t('user_modal.validation.password_min_length');
        }

        // Confirm password validation
        if (!user && !formData.confirmPassword) {
            newErrors.confirmPassword = t('user_modal.validation.confirm_password_placeholder');
        } else if (
            formData.password &&
            formData.confirmPassword &&
            formData.password !== formData.confirmPassword
        ) {
            newErrors.confirmPassword = t('user_modal.validation.passwords_not_match');
        }

        // Phone validation
        if (formData.phone && !/^[+]?[0-9\s-()]{10,}$/.test(formData.phone)) {
            newErrors.phone = t('user_modal.validation.phone_invalid');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            await onSave(formData);
            toast({
                title: user ? t('user_modal.success_messages.user_updated') : t('user_modal.success_messages.user_created'),
                description: user
                    ? t('user_modal.success_messages.user_updated_desc')
                    : t('user_modal.success_messages.user_created_desc'),
                type: 'success',
            });
            onClose();
        } catch (error: unknown) {
            toast({
                title: t('user_modal.error_messages.validation_failed'),
                description:
                    (error as { message?: string }).message ||
                    t('user_modal.error_messages.create_failed_desc'),
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-h-[90vh] overflow-y-auto border-teal-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-teal-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)] [&>button]:hidden"
                style={{
                    zIndex: 9999,
                    maxWidth: '60vw',
                    width: '800px',
                }}
            >
                <DialogHeader className="border-b border-teal-200 pb-4 dark:border-teal-800">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-teal-800 dark:text-teal-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg">
                            <UserIcon className="h-4 w-4 text-white" />
                        </div>
                        {user ? t('user_modal.edit_title') : t('user_modal.add_title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <UserCheck className="h-4 w-4" />
                            Basic Information
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="full_name"
                                    className="text-sm font-medium"
                                >
                                    Full Name *
                                </Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'full_name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t('user_modal.form_fields.full_name_placeholder')}
                                    className={
                                        errors.full_name ? 'border-red-500' : ''
                                    }
                                />
                                {errors.full_name && (
                                    <p className="text-sm text-red-600">
                                        {errors.full_name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="username"
                                    className="text-sm font-medium"
                                >
                                    Username *
                                </Label>
                                <Input
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'username',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t('user_modal.form_fields.username_placeholder')}
                                    className={
                                        errors.username ? 'border-red-500' : ''
                                    }
                                />
                                {errors.username && (
                                    <p className="text-sm text-red-600">
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-medium"
                                >
                                    Password {!user && '*'}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={formData.password}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        placeholder={
                                            user
                                                ? t('user_modal.form_fields.password_placeholder')
                                                : t('user_modal.form_fields.password_placeholder')
                                        }
                                        className={
                                            errors.password
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="confirmPassword"
                                    className="text-sm font-medium"
                                >
                                    Confirm Password {!user && '*'}
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={formData.confirmPassword || ''}
                                        onChange={(e) =>
                                            handleInputChange(
                                                'confirmPassword',
                                                e.target.value,
                                            )
                                        }
                                        placeholder={t('user_modal.form_fields.confirm_password_placeholder')}
                                        className={
                                            errors.confirmPassword
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-600">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Role and Permissions */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            {t('user_modal.role_section.title', {
                                defaultValue: 'Role and Permissions',
                            })}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="role"
                                className="text-sm font-medium"
                            >
                                {t('user_modal.form_fields.role')}{' '}
                                <span aria-hidden="true">*</span>
                            </Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value) =>
                                    handleInputChange('role', value)
                                }
                            >
                                <SelectTrigger
                                    className={
                                        errors.role ? 'border-red-500' : ''
                                    }
                                >
                                    <SelectValue placeholder={t('user_modal.form_fields.role_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-red-600" />
                                            <span>
                                                {t('user_modal.role_options.admin')}
                                            </span>
                                            <Badge
                                                variant="destructive"
                                                className="text-xs"
                                            >
                                                {t(
                                                    'user_modal.role_section.badges.admin',
                                                    {
                                                        defaultValue:
                                                            'Full Access',
                                                    },
                                                )}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="cashier">
                                        <div className="flex items-center gap-2">
                                            <UserIcon className="h-4 w-4 text-primary" />
                                            <span>
                                                {t('user_modal.role_options.cashier')}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {t(
                                                    'user_modal.role_section.badges.cashier',
                                                    {
                                                        defaultValue:
                                                            'Transactions & POS',
                                                    },
                                                )}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="dataentry">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="h-4 w-4 text-green-600" />
                                            <span>
                                                {t('user_modal.role_options.dataentry')}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {t(
                                                    'user_modal.role_section.badges.dataentry',
                                                    {
                                                        defaultValue:
                                                            'Data Entry',
                                                    },
                                                )}
                                            </Badge>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-sm text-red-600">
                                    {errors.role}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">
                                    Account Status
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Enable or disable user account
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) =>
                                    handleInputChange('is_active', checked)
                                }
                                className={
                                    formData.is_active
                                        ? '!bg-gradient-to-r !from-green-500 !to-green-600 hover:!from-green-600 hover:!to-green-700'
                                        : ''
                                }
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            Contact Information (Optional)
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="phone"
                                    className="text-sm font-medium"
                                >
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'phone',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t('user_modal.form_fields.phone_placeholder')}
                                    className={
                                        errors.phone ? 'border-red-500' : ''
                                    }
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-600">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="border-t border-teal-200 pt-4 dark:border-teal-800">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                {user ? 'Updating...' : 'Creating...'}
                            </>
                        ) : (
                            <>
                                <UserIcon className="mr-2 h-4 w-4" />
                                {user ? t('user_modal.buttons.update') : t('user_modal.buttons.create')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
