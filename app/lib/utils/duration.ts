/**
 * Converts minutes to seconds.
 * @param n - Number of minutes.
 * @returns Number of seconds.
 */
export const minutes = (n: number) => n * 60;

/**
 * Converts hours to seconds.
 * @param n - Number of hours.
 * @returns Number of seconds.
 */
export const hours = (n: number) => n * minutes(60);

/**
 * Converts days to seconds.
 * @param n - Number of days.
 * @returns Number of seconds.
 */
export const days = (n: number) => n * hours(24);

/**
 * Converts seconds to milliseconds.
 * @param seconds - Number of seconds.
 * @returns Number of milliseconds.
 */
export const toMs = (seconds: number) => seconds * 1000;
