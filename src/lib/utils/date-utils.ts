// /lib/utils/date-utils.ts
import { formatDistanceToNowStrict, format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Formats a given ISO date string into a human-readable "time ago" format (e.g., "5 minutes ago", "2 days ago").
 * @param dateString The ISO date string to format.
 * @returns A string representing the time elapsed since the given date.
 */
export function formatTimeAgo(dateString: string): string {
    try {
        const date = parseISO(dateString); // Use parseISO for ISO strings
        if (isNaN(date.getTime())) {
            console.error("Invalid date string for formatTimeAgo:", dateString);
            return "Tanggal tidak valid";
        }
        return formatDistanceToNowStrict(date, { addSuffix: true, locale: id });
    } catch (error) {
        console.error("Error formatting time with date-fns:", error);
        return "Tanggal tidak valid";
    }
}

/**
 * Formats a given ISO date string into a localized date format (e.g., "16 Juli 2025").
 * @param dateString The ISO date string to format.
 * @param dateFormat The format string for date-fns (default: 'dd MMMM yyyy').
 * @returns A formatted date string.
 */
export function formatDate(dateString: string, dateFormat: string = 'dd MMMM yyyy'): string {
    try {
        const date = parseISO(dateString);
        if (isNaN(date.getTime())) {
            console.error("Invalid date string for formatDate:", dateString);
            return "Tanggal tidak valid";
        }
        return format(date, dateFormat, { locale: id });
    } catch (error) {
        console.error("Error formatting date with date-fns:", error);
        return "Tanggal tidak valid";
    }
}

/**
 * Formats a given ISO date string into a localized date and time format (e.g., "16 Juli 2025, 14:30").
 * @param dateString The ISO date string to format.
 * @param dateTimeFormat The format string for date-fns (default: 'dd MMMM yyyy, HH:mm').
 * @returns A formatted date and time string.
 */
export function formatDateTime(dateString: string, dateTimeFormat: string = 'dd MMMM yyyy, HH:mm'): string {
    try {
        const date = parseISO(dateString);
        if (isNaN(date.getTime())) {
            console.error("Invalid date string for formatDateTime:", dateString);
            return "Tanggal tidak valid";
        }
        return format(date, dateTimeFormat, { locale: id });
    } catch (error) {
        console.error("Error formatting date and time with date-fns:", error);
        return "Tanggal tidak valid";
    }
}