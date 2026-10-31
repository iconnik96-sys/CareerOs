// Centralized Founder & Admin Authorization Helper
const DEFAULT_FOUNDER_EMAILS = ['nikhil@gmail.com'];

export function isFounderUser(user, profile) {
    const rawEnv = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FOUNDER_EMAILS) || '';
    const envEmails = rawEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const allowed = new Set([...DEFAULT_FOUNDER_EMAILS, ...envEmails]);

    const userEmail = user?.email?.toLowerCase().trim();
    // Security Hardening: Only trust server-controlled app_metadata for elevated roles.
    // Client-writable profile.role or user_metadata is strictly ignored for admin privileges.
    const serverRole = (user?.app_metadata?.role || '').toLowerCase().trim();

    return Boolean(
        (userEmail && allowed.has(userEmail)) ||
        serverRole === 'founder' ||
        serverRole === 'admin'
    );
}

export function isCampusAdmin(user, profile) {
    if (isFounderUser(user, profile)) return true;
    const serverRole = (user?.app_metadata?.role || '').toLowerCase().trim();
    // Allow verified TPO through server-assigned role or verified email
    return serverRole === 'tpo' || serverRole === 'college_admin' || Boolean(user?.app_metadata?.is_tpo);
}

export function getPrimaryFounderEmail() {
    const rawEnv = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FOUNDER_EMAILS) || '';
    const firstEnv = rawEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)[0];
    return firstEnv || DEFAULT_FOUNDER_EMAILS[0];
}
