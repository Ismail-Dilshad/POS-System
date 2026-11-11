import React from 'react';
import { cn } from '@/lib/utils';

export interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
    return (
        <div className={cn('space-y-4', className)} data-value={value} data-onvaluechange={onValueChange}>
            {children}
        </div>
    );
}

export interface TabsListProps {
    children: React.ReactNode;
    className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
    return (
        <div className={cn('flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)}>
            {children}
        </div>
    );
}

export interface TabsTriggerProps {
    value: string;
    children: React.ReactNode;
    disabled?: boolean;
    className?: string;
}

export function TabsTrigger({ value, children, disabled, className }: TabsTriggerProps) {
    const parentDiv = React.useContext(TabsContext);
    const isActive = parentDiv?.activeValue === value;

    return (
        <button
            type="button"
            onClick={() => !disabled && parentDiv?.onValueChange(value)}
            disabled={disabled}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                isActive && 'bg-background text-foreground shadow-sm',
                className
            )}
        >
            {children}
        </button>
    );
}

export interface TabsContentProps {
    value: string;
    children: React.ReactNode;
    className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
    const parentDiv = React.useContext(TabsContext);
    const isActive = parentDiv?.activeValue === value;

    if (!isActive) return null;

    return (
        <div className={cn('ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}>
            {children}
        </div>
    );
}

interface TabsContextType {
    activeValue: string;
    onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | null>(null);

// Enhanced Tabs with Context
export function TabsProvider({ value, onValueChange, children, className }: TabsProps) {
    return (
        <TabsContext.Provider value={{ activeValue: value, onValueChange }}>
            <div className={cn('space-y-4', className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}