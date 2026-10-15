import { supabase } from '../lib/supabase';
export const applicationService = {
    async getApplications(userId) {
        if (!userId)
            return [];
        try {
            const { data, error } = await supabase
                .from('applications')
                .select('*')
                .eq('user_id', userId)
                .order('applied_at', { ascending: false });
            if (!error && data) {
                try {
                    const localApps = JSON.parse(localStorage.getItem(`careeros_apps_${userId}`) || '[]');
                    const remoteIds = new Set(data.map(d => d.id));
                    const merged = [...data];
                    for (const localApp of localApps) {
                        if (!remoteIds.has(localApp.id)) {
                            merged.push(localApp);
                        }
                    }
                    return merged.sort((a, b) => new Date(b.applied_at || b.created_at || 0) - new Date(a.applied_at || a.created_at || 0));
                } catch {
                    return data;
                }
            }
        }
        catch (err) {
            console.error('Error in getApplications:', err);
        }
        try {
            return JSON.parse(localStorage.getItem(`careeros_apps_${userId}`) || '[]');
        } catch {
            return [];
        }
    },
    async addApplication(userId, appData) {
        if (!userId)
            return null;
        let created = null;
        try {
            const { data, error } = await supabase
                .from('applications')
                .insert([{ user_id: userId, ...appData }])
                .select()
                .single();
            if (!error && data) {
                created = data;
            } else if (error) {
                console.warn('Supabase application insert warning (using resilient local persistence):', error.message);
            }
        }
        catch (err) {
            console.warn('Error adding application in Supabase:', err);
        }

        if (!created) {
            created = {
                id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                user_id: userId,
                ...appData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }

        try {
            const key = `careeros_apps_${userId}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = [created, ...existing.filter(a => a.id !== created.id)];
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {
            console.warn('Could not cache application locally', e);
        }

        return created;
    },
    async updateApplication(userId, appId, updates) {
        if (!userId || !appId)
            return null;
        try {
            const { data, error } = await supabase
                .from('applications')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', appId)
                .eq('user_id', userId)
                .select()
                .single();
            if (error) {
                console.error('Error updating application in Supabase:', error);
                return null;
            }
            return data;
        }
        catch (err) {
            console.error('Error updating application:', err);
            return null;
        }
    },
    async updateStatus(userId, appId, status) {
        const res = await this.updateApplication(userId, appId, { status });
        return Boolean(res);
    },
    async deleteApplication(userId, appId) {
        if (!userId || !appId)
            return false;
        try {
            const { error } = await supabase
                .from('applications')
                .delete()
                .eq('id', appId)
                .eq('user_id', userId);
            if (error) {
                console.error('Error deleting application in Supabase:', error);
                return false;
            }
            return true;
        }
        catch (err) {
            console.error('Error deleting application:', err);
            return false;
        }
    },
    getStats(applications) {
        const total = applications.length;
        const interviews = applications.filter(a => a.status === 'INTERVIEW').length;
        const offers = applications.filter(a => a.status === 'OFFER').length;
        const activePipeline = applications.filter(a => ['APPLIED', 'ASSESSMENT', 'INTERVIEW'].includes(a.status)).length;
        const respondedCount = applications.filter(a => ['ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED'].includes(a.status)).length;
        const responseRate = total > 0 ? Math.round((respondedCount / total) * 100) : 0;
        return {
            total,
            interviews,
            offers,
            activePipeline,
            responseRate
        };
    }
};
