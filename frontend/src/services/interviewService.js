import { supabase } from '../lib/supabase';
import { getRoleSlug, getRoleDisplayName } from '../utils/careerRoles';
import { aiFastApiService } from './aiFastApiService';

export const interviewService = {
    /**
     * Fetches technical interview questions for the user's role from the Supabase database.
     * If no questions are stored in database, falls back to real-time AI question generation.
     */
    async getQuestions(filters = {}) {
        const targetRole = filters.role || 'Backend Developer';
        const roleSlug = getRoleSlug(targetRole);
        const displayName = getRoleDisplayName(roleSlug);
        const { difficulty = 'All', topic = 'All', count = 10 } = filters;

        try {
            let query = supabase
                .from('interview_questions')
                .select('*')
                .or(`role_id.eq.${roleSlug},role_id.ilike.%${targetRole}%`);

            if (difficulty && difficulty !== 'All') {
                query = query.eq('difficulty', difficulty);
            }

            if (topic && topic !== 'All') {
                query = query.ilike('topic', `%${topic}%`);
            }

            const { data, error } = await query;

            if (!error && data && data.length > 0) {
                return data;
            }
        } catch (err) {
            console.warn('Could not query interview_questions from Supabase:', err);
        }

        // Fallback: Generate role-specific questions on-demand via FastAPI AI service
        try {
            const aiQuestions = await aiFastApiService.generateInterviewQuestions({
                role: displayName,
                target_role: displayName,
                difficulty: difficulty !== 'All' ? difficulty : 'Medium',
                topic: topic !== 'All' ? topic : 'General',
                count: count
            });
            return aiQuestions || [];
        } catch (err) {
            console.error('Error generating AI interview questions:', err);
            return [];
        }
    },

    async generateMoreQuestions(filters = {}) {
        const targetRole = filters.role || 'Backend Developer';
        const roleSlug = getRoleSlug(targetRole);
        const displayName = getRoleDisplayName(roleSlug);
        const { difficulty = 'All', topic = 'All', count = 5 } = filters;

        try {
            const aiQuestions = await aiFastApiService.generateInterviewQuestions({
                role: displayName,
                target_role: displayName,
                difficulty: difficulty !== 'All' ? difficulty : 'Medium',
                topic: topic !== 'All' ? topic : 'General',
                count: count
            });
            return aiQuestions || [];
        } catch (err) {
            console.error('Error generating additional AI interview questions:', err);
            throw err;
        }
    },

    async generateQuestions(filters = {}) {
        return this.getQuestions(filters);
    }
};
