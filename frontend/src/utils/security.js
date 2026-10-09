/**
 * CareerOS Frontend Security Utilities
 * Provides URL sanitization, XSS mitigation, and safe external link handling.
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

/**
 * Sanitizes a user-supplied or external URL to ensure it does not use dangerous
 * schemes such as 'javascript:', 'data:', or 'vbscript:'.
 *
 * @param {string} url - The candidate URL string to sanitize.
 * @param {string} fallback - The fallback safe URL if input is invalid (default: '#').
 * @returns {string} - A safe URL string or fallback.
 */
export function sanitizeUrl(url, fallback = '#') {
    if (!url || typeof url !== 'string') {
        return fallback;
    }

    const trimmed = url.trim();
    if (!trimmed) {
        return fallback;
    }

    // Allow internal relative paths
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        if (ALLOWED_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
            return trimmed;
        }
    } catch {
        // If it starts with 'www.' or standard domain format without scheme, prepend https://
        if (/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.test(trimmed) && !trimmed.includes(':')) {
            return `https://${trimmed}`;
        }
    }

    return fallback;
}

/**
 * Checks whether a URL is safe to open.
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const sanitized = sanitizeUrl(url, '');
    return sanitized !== '' && sanitized !== '#';
}
