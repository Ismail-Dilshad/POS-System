export type TimestampInput = string | number | Date | null | undefined;

export interface DateTimeParts {
    date: string | null;
    time: string | null;
}

type IntlPart = Intl.DateTimeFormatPart;

interface AppWindow extends Window {
    __APP_TIMEZONE__?: string;
}

const FALLBACK_TIMEZONE = 'UTC';

const getTargetTimezone = (): string => {
    if (typeof window === 'undefined') {
        return FALLBACK_TIMEZONE;
    }

    const appTimezone = (window as AppWindow).__APP_TIMEZONE__;

    if (appTimezone && typeof appTimezone === 'string' && appTimezone.trim()) {
        return appTimezone.trim();
    }

    try {
        const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return resolved || FALLBACK_TIMEZONE;
    } catch {
        return FALLBACK_TIMEZONE;
    }
};

const toDate = (input: TimestampInput): Date | null => {
    if (input === null || input === undefined) {
        return null;
    }

    if (input instanceof Date && !Number.isNaN(input.getTime())) {
        return input;
    }

    if (typeof input === 'number') {
        const dateFromNumber = new Date(input);
        return Number.isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
    }

    const raw = String(input).trim();

    if (!raw) {
        return null;
    }

    // Attempt ISO/UTC parsing first
    const isoLike = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const directDate = new Date(isoLike);

    if (!Number.isNaN(directDate.getTime())) {
        return directDate;
    }

    // As a last resort, append 'Z' to treat as UTC if not already present
    const utcCandidate = new Date(`${isoLike}Z`);
    if (!Number.isNaN(utcCandidate.getTime())) {
        return utcCandidate;
    }

    return null;
};

const formatParts = (parts: IntlPart[]): Record<string, string> => {
    return parts.reduce<Record<string, string>>((acc, part) => {
        if (part.type !== 'literal') {
            acc[part.type] = part.value;
        }
        return acc;
    }, {});
};

const createFormatters = (timezone: string) => {
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const timeFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    return { dateFormatter, timeFormatter };
};

const getParts = (date: Date): DateTimeParts => {
    const timezone = getTargetTimezone();
    const { dateFormatter, timeFormatter } = createFormatters(timezone);

    const dateParts = formatParts(dateFormatter.formatToParts(date));
    const timeParts = formatParts(timeFormatter.formatToParts(date));

    const dateValue = [dateParts.year, dateParts.month, dateParts.day]
        .filter(Boolean)
        .join('-') || null;

    const timeValue = [timeParts.hour, timeParts.minute, timeParts.second]
        .filter(Boolean)
        .join(':') || null;

    return {
        date: dateValue,
        time: timeValue,
    };
};

export const extractDateTimeParts = (input: TimestampInput): DateTimeParts => {
    const date = toDate(input);

    if (!date) {
        return { date: null, time: null };
    }

    return getParts(date);
};

export const formatDateTimeDisplay = (input: TimestampInput, fallback: string = 'N/A'): string => {
    const { date, time } = extractDateTimeParts(input);

    if (date && time) {
        return `${date} ${time}`;
    }

    if (date) {
        return date;
    }

    if (time) {
        return time;
    }

    return fallback;
};

export const formatDatePart = (input: TimestampInput, fallback: string = 'N/A'): string => {
    const { date } = extractDateTimeParts(input);
    return date ?? fallback;
};

export const formatTimePart = (input: TimestampInput, fallback: string = 'N/A'): string => {
    const { time } = extractDateTimeParts(input);
    return time ?? fallback;
};
