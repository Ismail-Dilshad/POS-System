import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string | string[] }) {
    const errorMessage = Array.isArray(message) ? message[0] : message;

    return errorMessage ? (
        <p
            {...props}
            className={cn('text-sm text-red-600 dark:text-red-400', className)}
        >
            {errorMessage}
        </p>
    ) : null;
}
