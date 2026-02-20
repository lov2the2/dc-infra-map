/**
 * Data formatting utilities for consistent display across components.
 */

/** Format date to locale date string */
export function formatDate(
    date: Date | string | null | undefined,
    locale = "ko-KR",
): string {
    if (!date) return "\u2014";
    return new Date(date).toLocaleDateString(locale);
}

/** Format datetime to locale string */
export function formatDateTime(
    date: Date | string | null | undefined,
    locale = "ko-KR",
): string {
    if (!date) return "\u2014";
    return new Date(date).toLocaleString(locale);
}

/**
 * Format datetime with custom options to locale string.
 * Useful when a specific format is needed (e.g. short month + hour:minute).
 */
export function formatDateTimeOptions(
    date: Date | string | null | undefined,
    options: Intl.DateTimeFormatOptions,
    locale = "ko-KR",
): string {
    if (!date) return "\u2014";
    return new Date(date).toLocaleString(locale, options);
}

/** Return value or em-dash fallback for null/undefined */
export function formatNullable<T>(
    value: T | null | undefined,
    fallback = "\u2014",
): T | string {
    return value ?? fallback;
}

/** Format status string for display (replace underscores, capitalize words) */
export function formatStatus(status: string | null | undefined): string {
    if (!status) return "\u2014";
    return status
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Format number with unit */
export function formatUnit(
    value: number | null | undefined,
    unit: string,
    fallback = "\u2014",
): string {
    if (value === null || value === undefined) return fallback;
    return `${value}${unit}`;
}
