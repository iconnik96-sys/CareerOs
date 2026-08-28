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
            if (error) {
                console.error('Error fetching applications from Supabase:', error);
                return [];
            }
            return data || [];
        }
        catch (err) {
            console.error('Error in getApplications:', err);
            return [];
        }
    },
    async addApplication(userId, appData) {
        if (!userId)
            return null;
        try {
            const { data, error } = await supabase
                .from('applications')
                .insert([{ user_id: userId, ...appData }])
                .select()
                .single();
            if (error) {
                console.error('Error creating application in Supabase:', error);
                return null;
            }
            return data;
        }
        catch (err) {
            console.error('Error adding application:', err);
            return null;
        }
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
