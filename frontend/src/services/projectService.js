import { supabase } from '../lib/supabase';
export const projectService = {
    async getProjects(userId) {
        if (!userId)
            return [];
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error fetching projects from Supabase:', error);
                return [];
            }
            return data || [];
        }
        catch (err) {
            console.error('Error in getProjects:', err);
            return [];
        }
    },
    async addProject(userId, projectData) {
        if (!userId)
            return null;
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([{ user_id: userId, ...projectData }])
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (err) {
            console.error('Error adding project to Supabase:', err);
            return null;
        }
    },
    async updateProject(userId, projectId, updates) {
        if (!userId || !projectId)
            return null;
        try {
            const { data, error } = await supabase
                .from('projects')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', projectId)
                .eq('user_id', userId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (err) {
            console.error('Error updating project in Supabase:', err);
            return null;
        }
    },
    async deleteProject(userId, projectId) {
        if (!userId || !projectId)
            return false;
        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)
                .eq('user_id', userId);
            if (error)
                throw error;
            return true;
        }
        catch (err) {
            console.error('Error deleting project from Supabase:', err);
            return false;
        }
    }
};
