import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    supabaseUrl.startsWith('http')
);

// Fallback stub client if Supabase is not configured yet
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })
    : createClient('https://mock-instance.supabase.co', 'mock-anon-key', {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });

/**
 * Probes the connected Supabase instance and checks if required tables (public.profiles) exist.
 * Logs high-visibility actionable console warnings if there is a project mismatch, missing schema, or network error.
 */
export async function checkSupabaseHealth() {
    if (!isSupabaseConfigured) {
        console.warn('ℹ️ [CareerOS] Supabase is not configured. Running with mock instance.');
        return { ok: false, reason: 'unconfigured' };
    }

    try {
        const { error } = await supabase.from('profiles').select('id').limit(1);

        if (error) {
            const projectRef = supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] || 'project';
            const isMissingTable =
                error.code === 'PGRST205' ||
                error.message?.includes('Could not find the table') ||
                error.message?.includes('relation "public.profiles" does not exist') ||
                error.code === '42P01';

            if (isMissingTable) {
                console.error(
                    `%c🚨 [CareerOS Supabase Warning] Database Schema Missing in Project!%c\n\n` +
                    `• Connected Project URL: ${supabaseUrl}\n` +
                    `• Issue: The 'public.profiles' table was not found (error code: ${error.code || 'PGRST205'}).\n` +
                    `• Solution: Open the Supabase SQL Editor and run 'supabase/schema.sql':\n` +
                    `  👉 https://supabase.com/dashboard/project/${projectRef}/sql\n\n` +
                    `Until 'schema.sql' is run, user signups and profile data will not persist.`,
                    'background: #e11d48; color: #ffffff; font-size: 13px; font-weight: bold; padding: 6px 12px; border-radius: 4px;',
                    'color: inherit; font-size: 12px;'
                );
                return { ok: false, reason: 'missing_schema', error };
            }

            console.warn(`⚠️ [CareerOS Supabase Health Check] Query returned error:`, error.message || error);
            return { ok: false, reason: 'query_error', error };
        }

        console.log(
            `%c✅ [CareerOS] Supabase connection and schema verified (%c${supabaseUrl}%c)`,
            'color: #10b981; font-weight: bold;',
            'color: #6366f1; font-weight: normal;',
            'color: #10b981; font-weight: bold;'
        );
        return { ok: true };
    }
    catch (err) {
        console.error('❌ [CareerOS Supabase Health Check] Network connection error:', err);
        return { ok: false, reason: 'network_error', error: err };
    }
}

