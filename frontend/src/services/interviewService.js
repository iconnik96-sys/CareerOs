import { supabase } from '../lib/supabase';
import { getRoleSlug, getRoleDisplayName } from '../utils/careerRoles';
import { aiFastApiService } from './aiFastApiService';
import { CANONICAL_INTERVIEW_QUESTIONS } from '../data/canonicalInterviewQuestions';

// In-memory cache & deduplication to eliminate redundant LLM calls on re-renders
const questionCache = new Map();
const inFlightRequests = new Map();

export const interviewService = {
    /**
     * Fetches technical interview questions for the user's role from Supabase.
     * If database returns empty, tries on-demand AI generation via FastAPI.
     * If AI service is unreachable, seamlessly falls back to canonical question bank.
     * Uses session caching and in-flight deduplication to avoid duplicate token consumption.
     */
    async getQuestions(filters = {}) {
        const targetRole = filters.role || 'Frontend Developer';
        const roleSlug = getRoleSlug(targetRole);
        const displayName = getRoleDisplayName(roleSlug);
        const { track = 'TECHNICAL', difficulty = 'All', topic = 'All', count = 5 } = filters;
        const cacheKey = `${roleSlug}_${track}_${difficulty}_${topic}`;

        // 0. Return cached questions if available for this session
        if (questionCache.has(cacheKey)) {
            const cached = questionCache.get(cacheKey);
            if (Array.isArray(cached) && cached.length > 0) {
                return cached.slice(0, count);
            }
        }

        // Deduplicate concurrent in-flight requests (e.g. React StrictMode or multiple component mounts)
        if (inFlightRequests.has(cacheKey)) {
            return inFlightRequests.get(cacheKey);
        }

        const fetchPromise = (async () => {
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
                    questionCache.set(cacheKey, data);
                    return data.slice(0, count);
                }
            } catch (err) {
                console.warn('Could not query interview_questions from Supabase:', err);
            }

            // 2. Generate role-specific questions on-demand via FastAPI AI service
            try {
                const aiQuestions = await aiFastApiService.generateInterviewQuestions({
                    role: displayName,
                    target_role: displayName,
                    track,
                    difficulty: difficulty !== 'All' ? difficulty : 'Medium',
                    topic: topic !== 'All' ? topic : 'General',
                    count: Math.min(count, 5)
                });
                const qList = Array.isArray(aiQuestions) ? aiQuestions : aiQuestions?.questions || [];
                if (qList.length > 0) {
                    questionCache.set(cacheKey, qList);
                    return qList;
                }
            } catch (err) {
                console.warn('FastAPI AI question service unavailable; falling back to curated canonical bank:', err?.message || err);
            }

            // 3. Resilient fallback to Canonical Curated Technical Question Bank
            let fallbackList = CANONICAL_INTERVIEW_QUESTIONS.filter(q => q.role_id === roleSlug || q.role_id === 'common');
            if (difficulty && difficulty !== 'All') {
                const diffFiltered = fallbackList.filter(q => q.difficulty?.toLowerCase() === difficulty.toLowerCase());
                if (diffFiltered.length > 0) fallbackList = diffFiltered;
            }
            if (topic && topic !== 'All') {
                const topicFiltered = fallbackList.filter(q => q.topic?.toLowerCase().includes(topic.toLowerCase()));
                if (topicFiltered.length > 0) fallbackList = topicFiltered;
            }
            if (fallbackList.length > 0) {
                questionCache.set(cacheKey, fallbackList);
                return fallbackList.slice(0, count);
            }

            // 4. Guaranteed non-empty fallback
            const defaultSlice = CANONICAL_INTERVIEW_QUESTIONS.slice(0, count);
            questionCache.set(cacheKey, defaultSlice);
            return defaultSlice;
        })();

        inFlightRequests.set(cacheKey, fetchPromise);
        try {
            return await fetchPromise;
        } finally {
            inFlightRequests.delete(cacheKey);
        }
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
            console.warn('Generating more questions from backend failed; providing canonical bank:', err?.message || err);
        }

        const fallback = CANONICAL_INTERVIEW_QUESTIONS.filter(q => q.role_id === roleSlug || q.role_id === 'common');
        return fallback.slice(0, count);
    },

    async generateQuestions(filters = {}) {
        return this.getQuestions(filters);
    }
};

