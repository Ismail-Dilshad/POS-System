/**
 * Date and Time Display Component
 * Shows current date and time with live updates
 */

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface DateTimeDisplayProps {
    /**
     * Format for the date display
     * @default 'en-US'
     */
    dateFormat?: string;
    
    /**
     * Whether to show seconds in time
     * @default true
     */
    showSeconds?: boolean;
    
    /**
     * Whether to show the date
     * @default true
     */
    showDate?: boolean;
    
    /**
     * Whether to show the time
     * @default true
     */
    showTime?: boolean;
    
    /**
     * Custom className for styling
     */
    className?: string;
    
    /**
     * Update interval in milliseconds
     * @default 1000
     */
    updateInterval?: number;
}

export function DateTimeDisplay({
    dateFormat = 'en-US',
    showSeconds = true,
    showDate = true,
    showTime = true,
    className = '',
    updateInterval = 1000
}: DateTimeDisplayProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, updateInterval);

        return () => clearInterval(interval);
    }, [updateInterval]);

    const formatDate = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        };
        return date.toLocaleDateString(dateFormat, options);
    };

    const formatTime = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            ...(showSeconds && { second: '2-digit' }),
            hour12: false
        };
        return date.toLocaleTimeString(dateFormat, options);
    };

    const dateString = showDate ? formatDate(currentTime) : '';
    const timeString = showTime ? formatTime(currentTime) : '';

    return (
        <div className={`flex flex-col items-center text-sm ${className}`}>
            {showDate && (
                <div className="text-muted-foreground font-medium">
                    {dateString}
                </div>
            )}
            {showTime && (
                <div className="text-foreground font-mono font-semibold">
                    {timeString}
                </div>
            )}
        </div>
    );
}

/**
 * Compact version for headers
 */
export function CompactDateTimeDisplay({ className = '' }: { className?: string }) {
    return (
        <DateTimeDisplay
            showDate={true}
            showTime={true}
            showSeconds={false}
            className={`text-xs ${className}`}
            updateInterval={60000} // Update every minute for better performance
        />
    );
}

/**
 * Simple centered date/time display for headers
 */
export function CenteredDateTimeDisplay({ className = '' }: { className?: string }) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Update every second for full time

        return () => clearInterval(interval);
    }, []);

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="flex items-center gap-2 h-8 px-3 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="hidden md:inline text-xs text-foreground font-medium">
                    {formatDate(currentTime)}
                </span>
                <span className="hidden md:inline text-xs text-muted-foreground">•</span>
                <span className="text-xs font-mono font-semibold text-foreground">
                    {formatTime(currentTime)}
                </span>
            </div>
        </div>
    );
}
