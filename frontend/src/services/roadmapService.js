import { supabase } from '../lib/supabase';
import { getRoleSlug, getRoleDisplayName } from '../utils/careerRoles';

/**
 * Normalizes any phase JSON format (whether it uses topics, string skills, or structured skill objects)
 * into a consistent structure for the UI to render and track.
 */
function normalizePhases(rawPhases = []) {
    if (!Array.isArray(rawPhases)) return [];

    return rawPhases.map((phase, pIdx) => {
        const phaseNum = phase.phase_number || phase.phase || (pIdx + 1);
        const phaseId = phase.id || `phase-${phaseNum}`;
        const phaseTitle = phase.title || `Phase ${phaseNum}`;
        const phaseDesc = phase.description || '';

        let normalizedSkills = [];

        // Case A: Phase has structured topics with subtopics
        if (Array.isArray(phase.topics) && phase.topics.length > 0) {
            normalizedSkills = phase.topics.map((topic, tIdx) => {
                if (typeof topic === 'string') {
                    return {
                        id: `skill-${phaseNum}-${tIdx + 1}`,
                        name: topic,
                        category: topic.priority || 'Core Topic',
                        estimated_effort: '1-2 weeks',
                        why_learn: `Master ${topic} as part of Phase ${phaseNum}.`,
                        status: phase.completed ? 'COMPLETED' : (pIdx === 0 && tIdx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                        what_to_learn: [],
                        suggested_project: phase.projects?.[0]?.name || 'Build a hands-on project applying these concepts.'
                    };
                }
                return {
                    id: `skill-${phaseNum}-${tIdx + 1}`,
                    name: topic.name || `Topic ${tIdx + 1}`,
                    category: topic.priority || 'Core Topic',
                    estimated_effort: topic.estimated_hours ? `${topic.estimated_hours} hrs` : (phase.duration || '1-2 weeks'),
                    why_learn: topic.description || `Essential milestone for ${topic.name || 'this phase'}.`,
                    status: topic.completed ? 'COMPLETED' : (phase.completed ? 'COMPLETED' : (pIdx === 0 && tIdx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED')),
                    what_to_learn: Array.isArray(topic.subtopics) ? topic.subtopics : (Array.isArray(topic.topics) ? topic.topics : []),
                    suggested_project: phase.projects?.[0]?.name ? `${phase.projects[0].name} (${phase.projects[0].difficulty || 'Hands-on'})` : 'Complete exercises and project milestones for this topic.'
                };
            });
        }
        // Case B: Phase has skills array (strings or objects)
        else if (Array.isArray(phase.skills) && phase.skills.length > 0) {
            normalizedSkills = phase.skills.map((skill, sIdx) => {
                if (typeof skill === 'string') {
                    return {
                        id: `skill-${phaseNum}-${sIdx + 1}`,
                        name: skill,
                        category: 'Core Skill',
                        estimated_effort: phase.duration || '1-2 weeks',
                        why_learn: `Master ${skill} as part of ${phaseTitle}.`,
                        status: phase.completed ? 'COMPLETED' : (pIdx === 0 && sIdx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
                        what_to_learn: Array.isArray(phase.practice) ? phase.practice : [],
                        suggested_project: phase.projects?.[0]?.name || (typeof phase.projects?.[0] === 'string' ? phase.projects[0] : 'Apply this skill in your project portfolio.')
                    };
                }
                return {
                    id: skill.id || `skill-${phaseNum}-${sIdx + 1}`,
                    name: skill.name || `Skill ${sIdx + 1}`,
                    category: skill.category || 'General',
                    estimated_effort: skill.estimated_effort || phase.duration || '1-2 weeks',
                    why_learn: skill.why_learn || skill.description || '',
                    status: skill.status || (phase.completed ? 'COMPLETED' : 'NOT_STARTED'),
                    what_to_learn: Array.isArray(skill.what_to_learn) ? skill.what_to_learn : [],
                    suggested_project: skill.suggested_project || ''
                };
            });
        }
        // Case C: Fallback single milestone skill
        else {
            normalizedSkills = [{
                id: `skill-${phaseNum}-1`,
                name: phaseTitle,
                category: phase.level || 'Milestone',
                estimated_effort: phase.duration || '2 weeks',
                why_learn: phaseDesc,
                status: phase.completed ? 'COMPLETED' : 'NOT_STARTED',
                what_to_learn: Array.isArray(phase.practice) ? phase.practice : [],
                suggested_project: phase.milestone || ''
            }];
        }

        const allCompleted = normalizedSkills.every(s => s.status === 'COMPLETED');
        const hasInProgress = normalizedSkills.some(s => s.status === 'IN_PROGRESS' || s.status === 'COMPLETED');
        const phaseStatus = phase.completed ? 'COMPLETED' : (allCompleted ? 'COMPLETED' : (hasInProgress ? 'IN_PROGRESS' : 'NOT_STARTED'));

        return {
            id: phaseId,
            phase_number: phaseNum,
            title: phaseTitle,
            description: phaseDesc,
            duration: phase.duration || '',
            level: phase.level || '',
            status: phaseStatus,
            skills: normalizedSkills,
            raw_projects: phase.projects || [],
            raw_milestone: phase.milestone || ''
        };
    });
}

export const roadmapService = {
    /**
     * Retrieves the manual database-driven roadmap for the role from Supabase:
     * 1. Checks if the user already has saved progress in public.roadmaps for this role
     * 2. If not, queries the canonical role roadmap from public.role_roadmaps table in Supabase
     * 3. If not found in database, returns []
     */
    async getRoadmap(userId, targetRole = 'Backend Developer') {
        const roleSlug = getRoleSlug(targetRole);
        const displayName = getRoleDisplayName(roleSlug);

        // 1. Check if user already has saved progress for this role in Supabase
        if (userId) {
            try {
                const { data: userRoadmap, error: userError } = await supabase
                    .from('roadmaps')
                    .select('*')
                    .eq('user_id', userId)
                    .or(`target_role.eq.${targetRole},target_role.eq.${displayName},target_role.eq.${roleSlug}`)
                    .maybeSingle();

                if (!userError && userRoadmap?.phases && Array.isArray(userRoadmap.phases) && userRoadmap.phases.length > 0) {
                    return normalizePhases(userRoadmap.phases);
                }
            } catch (err) {
                console.warn('Could not query user roadmap progress:', err);
            }
        }

        // 2. Fetch canonical manual role roadmap from Supabase role_roadmaps table
        // Matches role_id ('backend', 'backend-developer', etc.) or title
        try {
            const { data: roleData, error: roleError } = await supabase
                .from('role_roadmaps')
                .select('*')
                .or(`role_id.eq.${roleSlug},role_id.eq.${roleSlug}-developer,role_id.eq.${targetRole},title.ilike.%${roleSlug}%,title.eq.${displayName}`)
                .limit(1)
                .maybeSingle();

            if (!roleError && roleData?.phases && Array.isArray(roleData.phases) && roleData.phases.length > 0) {
                const normalized = normalizePhases(roleData.phases);

                // Initialize record for logged-in user so they can start tracking progress
                if (userId) {
                    supabase
                        .from('roadmaps')
                        .upsert([
                            {
                                user_id: userId,
                                target_role: displayName,
                                phases: normalized,
                                updated_at: new Date().toISOString()
                            }
                        ], { onConflict: 'user_id,target_role' })
                        .then(() => {})
                        .catch(() => {});
                }
                return normalized;
            }
        } catch (err) {
            console.warn('Could not query role_roadmaps from Supabase:', err);
        }

        // If no roadmap exists in database, return empty array
        return [];
    },

    /**
     * Resets the user's roadmap progress back to the canonical database default from role_roadmaps.
     */
    async resetRoadmapToDefault(userId, targetRole = 'Backend Developer') {
        const roleSlug = getRoleSlug(targetRole);
        const displayName = getRoleDisplayName(roleSlug);

        let defaultPhases = [];

        try {
            const { data: roleData, error } = await supabase
                .from('role_roadmaps')
                .select('*')
                .or(`role_id.eq.${roleSlug},role_id.eq.${roleSlug}-developer,role_id.eq.${targetRole},title.ilike.%${roleSlug}%,title.eq.${displayName}`)
                .limit(1)
                .maybeSingle();

            if (!error && roleData?.phases && Array.isArray(roleData.phases)) {
                defaultPhases = normalizePhases(roleData.phases);
            }
        } catch (err) {
            console.warn('Could not fetch canonical role roadmap for reset:', err);
        }

        if (defaultPhases.length === 0) {
            return [];
        }

        // Reset progress statuses
        const resetPhases = defaultPhases.map((phase, pIdx) => ({
            ...phase,
            status: pIdx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
            skills: (phase.skills || []).map((skill, sIdx) => ({
                ...skill,
                status: pIdx === 0 && sIdx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
            }))
        }));

        if (userId) {
            try {
                await supabase
                    .from('roadmaps')
                    .upsert([
                        {
                            user_id: userId,
                            target_role: displayName,
                            phases: resetPhases,
                            updated_at: new Date().toISOString()
                        }
                    ], { onConflict: 'user_id,target_role' });
            } catch (err) {
                console.error('Error saving reset roadmap to Supabase:', err);
            }
        }

        return resetPhases;
    },

    /**
     * Toggles a skill completion status and persists progress into Supabase.
     */
    async toggleSkillStatus(userId, targetRole, currentPhases, phaseId, skillId) {
        const roleSlug = getRoleSlug(targetRole);
        const displayName = getRoleDisplayName(roleSlug);

        const updated = currentPhases.map(phase => {
            if (phase.id !== phaseId)
                return phase;
            const updatedSkills = phase.skills.map(skill => {
                if (skill.id !== skillId)
                    return skill;
                const nextStatus = skill.status === 'COMPLETED'
                    ? 'NOT_STARTED'
                    : skill.status === 'NOT_STARTED'
                        ? 'IN_PROGRESS'
                        : 'COMPLETED';
                return { ...skill, status: nextStatus };
            });
            const allCompleted = updatedSkills.every(s => s.status === 'COMPLETED');
            const hasInProgress = updatedSkills.some(s => s.status === 'IN_PROGRESS' || s.status === 'COMPLETED');
            const phaseStatus = allCompleted ? 'COMPLETED' : hasInProgress ? 'IN_PROGRESS' : 'NOT_STARTED';
            return {
                ...phase,
                skills: updatedSkills,
                status: phaseStatus
            };
        });

        if (userId) {
            try {
                await supabase
                    .from('roadmaps')
                    .upsert([
                        {
                            user_id: userId,
                            target_role: displayName,
                            phases: updated,
                            updated_at: new Date().toISOString()
                        }
                    ], { onConflict: 'user_id,target_role' });
            }
            catch (err) {
                console.error('Error updating roadmap progress in Supabase:', err);
            }
        }
        return updated;
    },

    /**
     * Calculates the overall completion percentage and stats across all roadmap milestones.
     */
    calculateRoadmapProgress(phases) {
        let total = 0;
        let completed = 0;
        let inProgress = 0;
        (phases || []).forEach(p => {
            (p.skills || []).forEach(s => {
                total++;
                if (s.status === 'COMPLETED')
                    completed++;
                if (s.status === 'IN_PROGRESS')
                    inProgress++;
            });
        });
        const percentage = total > 0 ? Math.round(((completed + (inProgress * 0.4)) / total) * 100) : 0;
        return {
            totalSkills: total,
            completedSkills: completed,
            inProgressSkills: inProgress,
            percentage: Math.min(100, percentage)
        };
    }
};
