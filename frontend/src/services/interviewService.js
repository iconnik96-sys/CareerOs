import { supabase } from '../lib/supabase';
import { getRoleSlug, getRoleDisplayName } from '../utils/careerRoles';
import { aiFastApiService } from './aiFastApiService';
import { getCanonicalQuestions } from '../data/canonicalInterviewQuestions';

export const interviewService = {
    /**
     * Fetches technical interview questions for the user's role from Supabase.
     * If database returns empty or fails, falls back to AI generation or canonical question bank.
     */
    async getQuestions(filters = {}) {
        const targetRole = filters.role || 'Frontend Developer';
        const roleSlug = getRoleSlug(targetRole);
        const displayName = getRoleDisplayName(roleSlug);
        const { track = 'TECHNICAL', difficulty = 'All', topic = 'All', count = 10 } = filters;

        // 1. Try querying Supabase
        try {
            let query = supabase
                .from('interview_questions')
                .select('*')
                .eq('role_id', roleSlug);

            if (difficulty && difficulty !== 'All') {
                query = query.eq('difficulty', difficulty);
            }

            if (topic && topic !== 'All') {
                query = query.ilike('topic', `%${topic}%`);
            }

            const { data, error } = await query;

            if (!error && Array.isArray(data) && data.length > 0) {
                return data.slice(0, count);
            }
        } catch (err) {
            console.warn('Could not query interview_questions from Supabase:', err);
        }

        // 2. Fallback: Generate role-specific questions on-demand via FastAPI AI service
        try {
            const aiQuestions = await aiFastApiService.generateInterviewQuestions({
                role: displayName,
                target_role: displayName,
                track,
                difficulty: difficulty !== 'All' ? difficulty : 'Medium',
                topic: topic !== 'All' ? topic : 'General',
                count: count
            });
            const qList = Array.isArray(aiQuestions) ? aiQuestions : aiQuestions?.questions || [];
            if (qList.length > 0) {
                return qList;
            }
        } catch (err) {
            console.info('FastAPI AI question service unavailable; serving canonical curated questions:', err?.message || err);
        }

        // 3. Guaranteed High-Quality Curated Fallback
        return getCanonicalQuestions({ roleSlug, track, difficulty, topic, count });
    },

    async generateMoreQuestions(filters = {}) {
        const targetRole = filters.role || 'Frontend Developer';
        const roleSlug = getRoleSlug(targetRole);
        const displayName = getRoleDisplayName(roleSlug);
        const { track = 'TECHNICAL', difficulty = 'All', topic = 'All', count = 5 } = filters;

        try {
            const aiQuestions = await aiFastApiService.generateInterviewQuestions({
                role: displayName,
                target_role: displayName,
                track,
                difficulty: difficulty !== 'All' ? difficulty : 'Medium',
                topic: topic !== 'All' ? topic : 'General',
                count: count
            });
            const qList = Array.isArray(aiQuestions) ? aiQuestions : aiQuestions?.questions || [];
            if (qList.length > 0) {
                return qList;
            }
        } catch (err) {
            console.info('Generating more questions fallback to canonical bank:', err?.message || err);
        }

        return getCanonicalQuestions({ roleSlug, track, difficulty, topic, count });
    },

    async generateQuestions(filters = {}) {
        return this.getQuestions(filters);
    }
};

