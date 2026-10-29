// Centralized Founder & Admin Authorization Helper
const DEFAULT_FOUNDER_EMAILS = ['nikhil@gmail.com'];

export function isFounderUser(user, profile) {
    const rawEnv = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FOUNDER_EMAILS) || '';
    const envEmails = rawEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    const allowed = new Set([...DEFAULT_FOUNDER_EMAILS, ...envEmails]);

    const userEmail = user?.email?.toLowerCase().trim();
    const profileEmail = profile?.email?.toLowerCase().trim();
    const role = (profile?.role || '').toLowerCase();

    return Boolean(
        (userEmail && allowed.has(userEmail)) ||
        (profileEmail && allowed.has(profileEmail)) ||
        role === 'founder' ||
        role === 'admin'
    );
}

export function isCampusAdmin(user, profile) {
    if (isFounderUser(user, profile)) return true;
    const role = (profile?.role || '').toLowerCase();
    return role === 'tpo' || role === 'college_admin' || Boolean(profile?.is_tpo);
}

export function getPrimaryFounderEmail() {
    const rawEnv = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FOUNDER_EMAILS) || '';
    const firstEnv = rawEnv.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)[0];
    return firstEnv || DEFAULT_FOUNDER_EMAILS[0];
}
