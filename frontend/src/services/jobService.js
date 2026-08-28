import { supabase } from '../lib/supabase';
import { isJobMatchingRole, parseJobSkills, isSkillMatch } from '../utils/careerRoles';

const LOCAL_SAVED_JOBS_KEY = 'careeros_saved_job_ids';

export const jobService = {
    /**
     * Fetches live jobs directly from the Supabase database where you post jobs daily.
     * Accurately filters by the user's selected target track, matching titles and descriptions.
     */
    async getJobs(filter = {}) {
        try {
            let query = supabase.from('jobs').select('*');

            if (filter.remoteOnly) {
                query = query.eq('is_remote', true);
            }

            if (filter.search && filter.search.trim()) {
                const term = filter.search.trim();
                query = query.or(`title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%,location.ilike.%${term}%`);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('Error querying jobs from Supabase:', error.message);
                return [];
            }

            let allJobs = data || [];

            // Apply intelligent track matching strictly based on title and description
            if (filter.role && filter.role !== 'All') {
                allJobs = allJobs.filter(job => isJobMatchingRole(job, filter.role));
            }

            return allJobs;
        } catch (err) {
            console.error('Failed to fetch jobs from database:', err);
            return [];
        }
    },

    /**
     * Fetches a single job by its ID directly from the database.
     * Automatically retrieves skills from both the `jobs.skills` column
     * AND the relational `job_skills` junction table.
     */
    async getJobById(jobId) {
        if (!jobId) return null;

        try {
            // Attempt query with relational job_skills join
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    job_skills (
                        skill_id,
                        required,
                        skills (
                            id,
                            name
                        )
                    )
                `)
                .eq('id', jobId)
                .single();

            if (!error && data) {
                if (Array.isArray(data.job_skills) && data.job_skills.length > 0) {
                    const relationalSkills = data.job_skills
                        .map(js => js.skills?.name)
                        .filter(Boolean);
                    if (relationalSkills.length > 0) {
                        const parsed = parseJobSkills(data);
                        data.skills = Array.from(new Set([...parsed, ...relationalSkills]));
                    }
                }
                return data;
            }

            // Fallback to simple select if relations are not populated
            const { data: simpleData, error: simpleError } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (simpleError) {
                console.error('Error fetching job by ID from Supabase:', simpleError.message);
                return null;
            }

            return simpleData || null;
        } catch (err) {
            console.error('Error fetching job by ID:', err);
            return null;
        }
    },

    getSavedJobIds() {
        try {
            const saved = localStorage.getItem(LOCAL_SAVED_JOBS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    },

    toggleSaveJob(jobId) {
        const saved = this.getSavedJobIds();
        const exists = saved.includes(jobId);
        const updated = exists ? saved.filter(id => id !== jobId) : [...saved, jobId];
        localStorage.setItem(LOCAL_SAVED_JOBS_KEY, JSON.stringify(updated));
        return !exists;
    },

    /**
     * Accurately computes matching skills and missing skills to prepare
     * for any job from the database.
     */
    calculateSkillMatch(userSkillNames = [], jobSkills = [], job = null) {
        const requiredSkills = (Array.isArray(jobSkills) && jobSkills.length > 0)
            ? jobSkills
            : parseJobSkills(job || { skills: jobSkills });

        if (!requiredSkills || requiredSkills.length === 0) {
            return {
                score: 75,
                matching: userSkillNames.slice(0, 3),
                missing: [],
                requiredSkills: userSkillNames.slice(0, 3)
            };
        }

        const normalizedUser = userSkillNames.map(s => (typeof s === 'string' ? s.trim() : s?.name || '')).filter(Boolean);
        const matching = [];
        const missing = [];

        requiredSkills.forEach(reqSkill => {
            const isMatch = normalizedUser.some(us => isSkillMatch(us, reqSkill));
            if (isMatch) {
                matching.push(reqSkill);
            } else {
                missing.push(reqSkill);
            }
        });

        const score = requiredSkills.length > 0
            ? Math.round((matching.length / requiredSkills.length) * 100)
            : 0;

        return {
            score: Math.max(10, Math.min(100, score)),
            matching,
            missing,
            requiredSkills
        };
    }
};
