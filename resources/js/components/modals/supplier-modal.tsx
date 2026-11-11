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
import { useToast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/use-translation';
import { supplierService, type Supplier } from '@/services/business/supplierService';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SupplierFormData {
    name: string;
    phone: string;
    supplier_code: string;
    email: string;

    // Business info
    business_name: string;
    business_address: string;
    business_phone: string;
    business_email: string;

    // Biller person info
    billing_contact_name: string;
    billing_contact_phone: string;
    billing_contact_email: string;
    biller_position: string;
}

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    editSupplier?: Supplier; // Supplier data for editing mode
}

export function SupplierModal({
    isOpen,
    onClose,
    onSuccess,
    editSupplier,
}: SupplierModalProps) {
    const { toast } = useToast();
    const { t } = useTranslation();

    const [formData, setFormData] = useState<SupplierFormData>({
        name: '',
        phone: '',
        supplier_code: '',
        email: '',

        business_name: '',
        business_address: '',
        business_phone: '',
        business_email: '',

        billing_contact_name: '',
        billing_contact_phone: '',
        billing_contact_email: '',
        biller_position: '',
    });

    const [saving, setSaving] = useState(false);
    const [generatingCode, setGeneratingCode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form data when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editSupplier) {
                // Edit mode - populate form with existing supplier data
                setFormData({
                    name: editSupplier.name || '',
                    phone: editSupplier.phone || '',
                    supplier_code: editSupplier.supplier_code || '',
                    email: editSupplier.email || '',

                    business_name: editSupplier.business_name || '',
                    business_address: editSupplier.business_address || '',
                    business_phone: editSupplier.business_phone || '',
                    business_email: editSupplier.business_email || '',

                    billing_contact_name:
                        editSupplier.billing_contact_name || '',
                    billing_contact_phone:
                        editSupplier.billing_contact_phone || '',
                    billing_contact_email:
                        editSupplier.billing_contact_email || '',
                    biller_position: editSupplier.biller_position || '',
                });
            } else {
                // Add mode - reset form and auto-generate supplier code
                setFormData({
                    name: '',
                    phone: '',
                    supplier_code: '',
                    email: '',

                    business_name: '',
                    business_address: '',
                    business_phone: '',
                    business_email: '',

                    billing_contact_name: '',
                    billing_contact_phone: '',
                    billing_contact_email: '',
                    biller_position: '',
                });

                // Auto-generate supplier code for new suppliers
                generateSupplierCode();
            }
            setError(null);
        }
    }, [isOpen, editSupplier]);

    const generateSupplierCode = async () => {
        setGeneratingCode(true);
        try {
            const response = await fetch('/api/suppliers/generate-code');
            const data = await response.json();

            if (data.success) {
                setFormData((prev) => ({
                    ...prev,
                    supplier_code: data.data.supplier_code,
                }));
            }
        } catch {
            // Failed to generate supplier code
        } finally {
            setGeneratingCode(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            supplier_code: '',
            email: '',
            business_name: '',
            business_address: '',
            business_phone: '',
            business_email: '',
            billing_contact_name: '',
            billing_contact_phone: '',
            billing_contact_email: '',
            biller_position: '',
        });
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleInputChange = (
        field: keyof SupplierFormData,
        value: string,
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent duplicate submissions
        if (saving) {
            return;
        }

        if (!formData.name) {
            setError(t('supplier_modal.validation.name_required'));
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Save supplier - create or update
            const isEditing = !!editSupplier;
            const response = isEditing
                ? await supplierService.updateSupplier(
                      editSupplier.id,
                      formData,
                  )
                : await supplierService.createSupplier(formData);

            if (!response.success) {
                // Handle validation errors
                if (response.errors) {
                    const firstError = Object.values(response.errors)[0];
                    const errorMessage = Array.isArray(firstError)
                        ? firstError[0]
                        : firstError;
                    toast({
                        title: isEditing
                            ? t('supplier_modal.error_messages.update_failed')
                            : t('supplier_modal.error_messages.create_failed'),
                        description: errorMessage,
                        type: 'error',
                    });
                    setError(errorMessage);
                } else {
                    const errorMessage =
                        response.message ||
                        (isEditing
                            ? t(
                                  'supplier_modal.error_messages.update_failed_desc',
                              )
                            : t(
                                  'supplier_modal.error_messages.create_failed_desc',
                              ));
                    toast({
                        title: isEditing
                            ? t('supplier_modal.error_messages.update_failed')
                            : t('supplier_modal.error_messages.create_failed'),
                        description: errorMessage,
                        type: 'error',
                    });
                    setError(errorMessage);
                }
                return;
            }

            // Show success toast
            toast({
                title: isEditing
                    ? t('supplier_modal.success_messages.supplier_updated')
                    : t('supplier_modal.success_messages.supplier_created'),
                description: isEditing
                    ? `Supplier "${formData.name}" has been updated successfully.`
                    : `Supplier "${formData.name}" has been created successfully.`,
                type: 'success',
            });

            onSuccess?.();
            handleClose();
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : t('supplier_modal.error_messages.unknown_error');
            toast({
                title: t('supplier_modal.error_messages.validation_failed'),
                description: errorMessage,
                type: 'error',
            });
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent
                className="max-h-[90vh] overflow-y-auto border-emerald-200 shadow-[0_4px_8px_0_rgba(0,0,0,0.2),0_2px_4px_0_rgba(0,0,0,0.1)] dark:border-emerald-800 dark:shadow-[0_4px_8px_0_rgba(0,0,0,0.4),0_2px_4px_0_rgba(0,0,0,0.3)] [&>button]:hidden"
                style={{
                    zIndex: 9999,
                    maxWidth: '75vw',
                    width: '1100px',
                }}
            >
                <DialogHeader className="border-b border-emerald-200 pb-4 dark:border-emerald-800">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-800 dark:text-emerald-200">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                            <Plus className="h-4 w-4 text-white" />
                        </div>
                        {editSupplier
                            ? t('supplier_modal.edit_title')
                            : t('supplier_modal.add_title')}
                    </DialogTitle>
                </DialogHeader>

                <form
                    id="supplier-form"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">
                                    {t('supplier_modal.form_fields.name')} *
                                </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    handleInputChange('name', e.target.value)
                                }
                                placeholder={t(
                                    'supplier_modal.form_fields.name_placeholder',
                                )}
                                required
                                className="h-11"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium">
                                {t('supplier_modal.form_fields.phone')}
                            </Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) =>
                                    handleInputChange('phone', e.target.value)
                                }
                                placeholder={t(
                                    'supplier_modal.form_fields.phone_placeholder',
                                )}
                                className="h-11"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">
                                {t('supplier_modal.form_fields.email')}
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    handleInputChange('email', e.target.value)
                                }
                                placeholder={t(
                                    'supplier_modal.form_fields.email_placeholder',
                                )}
                                className="h-11"
                            />
                        </div>

                        {/* Supplier Code */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="supplier_code"
                                className="text-sm font-medium"
                            >
                                {t('supplier_modal.form_fields.supplier_code')}
                            </Label>
                            <div className="flex space-x-2">
                                <Input
                                    id="supplier_code"
                                    value={formData.supplier_code}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'supplier_code',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t('supplier_modal.form_fields.supplier_code_placeholder')}
                                    className="h-11 flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={generateSupplierCode}
                                    disabled={generatingCode}
                                    className="h-11 w-11"
                                >
                                    {generatingCode ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Business Name */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="business_name"
                                className="text-sm font-medium"
                            >
                                {t('supplier_modal.form_fields.business_name')}
                            </Label>
                            <Input
                                id="business_name"
                                value={formData.business_name}
                                onChange={(e) =>
                                    handleInputChange(
                                        'business_name',
                                        e.target.value,
                                    )
                                }
                                placeholder={t(
                                    'supplier_modal.form_fields.business_name_placeholder',
                                )}
                                className="h-11"
                            />
                        </div>

                        {/* Business Phone */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="business_phone"
                                className="text-sm font-medium"
                            >
                                {t('supplier_modal.form_fields.business_phone')}
                            </Label>
                            <Input
                                id="business_phone"
                                value={formData.business_phone}
                                onChange={(e) =>
                                    handleInputChange(
                                        'business_phone',
                                        e.target.value,
                                    )
                                }
                                placeholder={t(
                                    'supplier_modal.form_fields.business_phone_placeholder',
                                )}
                                className="h-11"
                            />
                        </div>

                        {/* Business Email */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="business_email"
                                className="text-sm font-medium"
                            >
                                {t('supplier_modal.form_fields.business_email')}
                            </Label>
                            <Input
                                id="business_email"
                                type="email"
                                value={formData.business_email}
                                onChange={(e) =>
                                    handleInputChange(
                                        'business_email',
                                        e.target.value,
                                    )
                                }
                                placeholder={t(
                                    'supplier_modal.form_fields.business_email_placeholder',
                                )}
                                className="h-11"
                            />
                        </div>

                        {/* Business Address */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="business_address"
                                className="text-sm font-medium"
                            >
                                {t('supplier_modal.form_fields.business_address')}
                            </Label>
                            <Input
                                id="business_address"
                                value={formData.business_address}
                                onChange={(e) =>
                                    handleInputChange(
                                        'business_address',
                                        e.target.value,
                                    )
                                }
                                placeholder={t(
                                    'supplier_modal.form_fields.business_address_placeholder',
                                )}
                                className="h-11"
                            />
                        </div>

                        {/* Billing Contact Name */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="billing_contact_name"
                                className="text-sm font-medium"
                            >
                                {t('supplier_modal.form_fields.billing_contact_name')}
                            </Label>
                            <Input
                                id="billing_contact_name"
                                value={formData.billing_contact_name}
                                onChange={(e) =>
                                    handleInputChange(
                                        'billing_contact_name',
                                        e.target.value,
                                    )
                                }
                                placeholder={t(
                                    'supplier_modal.enter_person_full_name',
                                )}
                                className="h-11"
                            />
                        </div>

                        {/* Billing Contact Phone */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="billing_contact_phone"
                                className="text-sm font-medium"
                            >
                                {t('supplier_modal.form_fields.billing_contact_phone')}
                            </Label>
                            <Input
                                id="billing_contact_phone"
                                value={formData.billing_contact_phone}
                                onChange={(e) =>
                                    handleInputChange(
                                        'billing_contact_phone',
                                        e.target.value,
                                    )
                                }
                                placeholder={t(
                                    'supplier_modal.enter_person_phone',
                                )}
                                className="h-11"
                            />
                        </div>

                        {/* Billing Contact Email */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="billing_contact_email"
                                className="text-sm font-medium"
                            >
                                {t('supplier_modal.form_fields.billing_contact_email')}
                            </Label>
                            <Input
                                id="billing_contact_email"
                                type="email"
                                value={formData.billing_contact_email}
                                onChange={(e) =>
                                    handleInputChange(
                                        'billing_contact_email',
                                        e.target.value,
                                    )
                                }
                                placeholder={t(
                                    'supplier_modal.enter_person_email',
                                )}
                                className="h-11"
                            />
                        </div>

                        {/* Billing Position */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="biller_position"
                                className="text-sm font-medium"
                            >
                                {t('supplier_modal.form_fields.biller_position')}
                            </Label>
                            <Input
                                id="biller_position"
                                value={formData.biller_position}
                                onChange={(e) =>
                                    handleInputChange(
                                        'biller_position',
                                        e.target.value,
                                    )
                                }
                                placeholder={t('supplier_modal.form_fields.biller_position_placeholder')}
                                className="h-11"
                            />
                        </div>
                    </div>
                </form>

                <DialogFooter className="gap-2 border-t border-emerald-200 pt-4 dark:border-emerald-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={saving}
                    >
                        {t('supplier_modal.buttons.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        disabled={saving || !formData.name}
                        onClick={handleSubmit}
                        form="supplier-form"
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {editSupplier ? t('supplier_modal.status.updating') : t('supplier_modal.status.creating')}
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                {editSupplier
                                    ? t('supplier_modal.buttons.update')
                                    : t('supplier_modal.buttons.create')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
