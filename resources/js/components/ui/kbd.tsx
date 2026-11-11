import * as React from 'react';
import { cn } from '@/lib/utils';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <kbd
                ref={ref}
                className={cn(
                    'pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-300 bg-slate-100 px-1.5 font-mono text-[10px] font-bold text-slate-700 opacity-100 shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200',
                    className,
                )}
                {...props}
            >
                {children}
            </kbd>
        );
    },
);
Kbd.displayName = 'Kbd';

export { Kbd };
