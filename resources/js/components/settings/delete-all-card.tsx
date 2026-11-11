import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { DeleteAllConfirmationModal } from '@/components/modals/delete-all-confirmation-modal';
import { useToast } from '@/components/ui/toast';

export interface DeleteAllCardProps {
    title: string;
    description: string;
    confirmMessage: string;
    onDelete: (password: string) => Promise<{ success: boolean; data?: { deleted_count?: number }; message?: string }>;
    successMessage: string;
    successCountMessage: (count: number) => string;
    icon?: React.ReactNode;
}

export function DeleteAllCard({
    title,
    description,
    confirmMessage,
    onDelete,
    successMessage,
    successCountMessage,
    icon,
}: DeleteAllCardProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleDeleteClick = () => {
        if (!password.trim()) {
            toast({
                title: t('settings.password_required'),
                description: t('settings.enter_password'),
                type: 'error',
            });
            return;
        }
        setShowConfirmDialog(true);
    };

    const handleConfirm = async (confirmPassword: string) => {
        setIsDeleting(true);
        try {
            const response = await onDelete(confirmPassword);
            if (response.success) {
                toast({
                    title: successMessage,
                    description: response.data?.deleted_count !== undefined
                        ? successCountMessage(response.data.deleted_count)
                        : undefined,
                    type: 'success',
                });
                setPassword('');
                setShowConfirmDialog(false);
            } else {
                toast({
                    title: t('settings.invalid_password'),
                    description: response.message || t('settings.invalid_password'),
                    type: 'error',
                });
            }
        } catch (error) {
            toast({
                title: t('settings.error_messages.failed_to_delete_backup'),
                description: error instanceof Error ? error.message : t('settings.invalid_password'),
                type: 'error',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card className="border-red-200 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700 transition-colors">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        {icon || <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />}
                        <span className="text-red-700 dark:text-red-300">{title}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        {description}
                    </p>

                    <div className="rounded-md border border-red-200 bg-red-50/50 dark:border-red-800/50 dark:bg-red-900/10 p-2.5">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <p className="text-xs font-medium text-red-800 dark:text-red-200 leading-relaxed">
                                {confirmMessage}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`password-${title}`} className="text-xs">
                            {t('settings.password_required')}
                        </Label>
                        <Input
                            id={`password-${title}`}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('settings.password_placeholder')}
                            className="h-9 text-sm"
                            disabled={isDeleting}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && password.trim()) {
                                    handleDeleteClick();
                                }
                            }}
                        />
                    </div>

                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteClick}
                        disabled={isDeleting || !password.trim()}
                        className="w-full h-9 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                <span className="text-xs">{t('common.deleting') || 'Deleting...'}</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                <span className="text-xs">{t('common.delete')}</span>
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <DeleteAllConfirmationModal
                isOpen={showConfirmDialog}
                title={title}
                description={confirmMessage}
                onConfirm={handleConfirm}
                onClose={() => setShowConfirmDialog(false)}
                isLoading={isDeleting}
            />
        </>
    );
}

