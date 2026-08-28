import { supabase } from '../lib/supabase';
export const profileService = {
    async getProfile(userId) {
        if (!userId)
            return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    // Record not found yet, auto-create profile row
                    return this.createProfile(userId, {
                        full_name: '',
                        degree: '',
                        graduation_year: new Date().getFullYear(),
                        target_role: '',
                        location: '',
                        experience_level: '0-2 years (Fresher)',
                        career_readiness: 0,
                        onboarding_completed: false,
                    });
                }
                console.error('Error fetching profile from Supabase:', error);
                return null;
            }
            return data;
        }
        catch (err) {
            console.error('Profile fetch failed:', err);
            return null;
        }
    },
    async updateProfile(userId, updates) {
        if (!userId)
            return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('user_id', userId)
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (err) {
            console.error('Error updating profile in Supabase:', err);
            return null;
        }
    },
    async createProfile(userId, initialData) {
        if (!userId)
            return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .upsert([{ user_id: userId, ...initialData }], { onConflict: 'user_id' })
                .select()
                .single();
            if (error)
                throw error;
            return data;
        }
        catch (err) {
            console.error('Error creating profile in Supabase:', err);
            return null;
        }
    },
    async getUserSkills(userId) {
        if (!userId)
            return [];
        try {
            const { data, error } = await supabase
                .from('user_skills')
                .select(`
          id,
          user_id,
          skill_id,
          proficiency,
          created_at,
          skills (
            id,
            name,
            category
          )
        `)
                .eq('user_id', userId);
            if (error) {
                console.error('Error fetching user skills:', error);
                return [];
            }
            return (data || []).map((item) => ({
                id: item.id,
                user_id: item.user_id,
                skill_id: item.skill_id,
                proficiency: item.proficiency,
                created_at: item.created_at,
                skill: item.skills
            }));
        }
        catch (err) {
            console.error('Error fetching user skills:', err);
            return [];
        }
    },
    async addSkillToUser(userId, skillName, category = 'General') {
        if (!userId || !skillName.trim())
            return null;
        try {
            // 1. Get or create skill in skills table
            let { data: skillData, error: skillError } = await supabase
                .from('skills')
                .select('*')
                .ilike('name', skillName.trim())
                .maybeSingle();
            if (!skillData) {
                const { data: createdSkill, error: createError } = await supabase
                    .from('skills')
                    .insert([{ name: skillName.trim(), category }])
                    .select()
                    .single();
                if (createError)
                    throw createError;
                skillData = createdSkill;
            }
            // 2. Insert into user_skills junction table
            const { data: userSkillData, error: userSkillError } = await supabase
                .from('user_skills')
                .upsert([{ user_id: userId, skill_id: skillData.id, proficiency: 80 }], { onConflict: 'user_id,skill_id' })
                .select(`
          id,
          user_id,
          skill_id,
          proficiency,
          created_at,
          skills (id, name, category)
        `)
                .single();
            if (userSkillError)
                throw userSkillError;
            return {
                id: userSkillData.id,
                user_id: userSkillData.user_id,
                skill_id: userSkillData.skill_id,
                proficiency: userSkillData.proficiency,
                skill: userSkillData.skills
            };
        }
        catch (err) {
            console.error('Error adding user skill:', err);
            return null;
        }
    },
    async removeUserSkill(userId, userSkillId) {
        if (!userId || !userSkillId)
            return false;
        try {
            const { error } = await supabase
                .from('user_skills')
                .delete()
                .eq('id', userSkillId)
                .eq('user_id', userId);
            if (error)
                throw error;
            return true;
        }
        catch (err) {
            console.error('Error removing user skill:', err);
            return false;
        }
    },
    async getAllSkills() {
        try {
            const { data, error } = await supabase.from('skills').select('*').order('name');
            if (error)
                throw error;
            return data || [];
        }
        catch (err) {
            console.error('Error fetching all skills:', err);
            return [];
        }
    },
    async deleteAccount(userId) {
        if (!userId)
            return false;
        try {
            // 1. Attempt to execute stored procedure to delete from auth.users (cascades to all user tables)
            const { error: rpcError } = await supabase.rpc('delete_user_account');
            if (rpcError) {
                console.warn('RPC delete_user_account notice:', rpcError);
            }

            // 2. Explicitly wipe profile and all user records from database tables
            await Promise.allSettled([
                supabase.from('profiles').delete().eq('user_id', userId),
                supabase.from('user_skills').delete().eq('user_id', userId),
                supabase.from('applications').delete().eq('user_id', userId),
                supabase.from('resumes').delete().eq('user_id', userId),
                supabase.from('analyses').delete().eq('user_id', userId),
                supabase.from('projects').delete().eq('user_id', userId),
                supabase.from('roadmaps').delete().eq('user_id', userId)
            ]);

            return true;
        } catch (err) {
            console.error('Error deleting account from database:', err);
            return false;
        }
    }
};
