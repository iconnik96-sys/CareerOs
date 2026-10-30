import { supabase } from '../lib/supabase';
import { aiFastApiService } from './aiFastApiService';
import { extractSkillsFromText } from '../utils/skillExtractor';
export const analysisService = {
    async getLatestResumeAnalysis(userId) {
        if (!userId)
            return null;
        try {
            const { data, error } = await supabase
                .from('analyses')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error) {
                console.error('Error fetching latest resume analysis from Supabase:', error);
                return null;
            }
            return data || null;
        }
        catch (err) {
            console.error('Error in getLatestResumeAnalysis:', err);
            return null;
        }
    },
    async runResumeAnalysis(userId, resumeId, resumeText, targetRole = 'Java Backend Developer', jobDescription) {
        if (!resumeText || resumeText.trim().length < 10) {
            throw new Error('Resume text is too short or empty for AI analysis.');
        }
        // 1. Call real FastAPI / Groq AI backend
        let aiResult;
        try {
            aiResult = await aiFastApiService.deepResumeAnalysis({
                resume_text: resumeText,
                target_role: targetRole,
                job_description: jobDescription || ''
            });
        }
        catch (apiErr) {
            console.warn('AI analysis call warning:', apiErr);
            throw apiErr;
        }
        const detectedFromText = extractSkillsFromText(resumeText);
        const combinedDetectedSkills = Array.from(new Set([
            ...(aiResult.detected_skills || []),
            ...detectedFromText
        ]));
        const newAnalysis = {
            user_id: userId,
            resume_id: resumeId,
            target_role: targetRole,
            match_score: aiResult.match_score,
            strengths: aiResult.strengths || [],
            missing_skills: aiResult.missing_skills || [],
            recommendations: aiResult.recommendations || [],
            skill_breakdown: aiResult.skill_breakdown || [],
            detected_skills: combinedDetectedSkills,
            created_at: new Date().toISOString()
        };
        // 2. Persist to Supabase analyses table
        try {
            const insertPayload = {
                user_id: userId,
                resume_id: resumeId,
                target_role: targetRole,
                match_score: newAnalysis.match_score,
                strengths: newAnalysis.strengths,
                missing_skills: newAnalysis.missing_skills,
                recommendations: newAnalysis.recommendations,
                skill_breakdown: newAnalysis.skill_breakdown,
                detected_skills: newAnalysis.detected_skills
            };
            const { data, error } = await supabase
                .from('analyses')
                .insert([insertPayload])
                .select()
                .single();
            if (error) {
                // If column detected_skills does not exist on table, retry without it
                const fallbackPayload = {
                    user_id: userId,
                    resume_id: resumeId,
                    target_role: targetRole,
                    match_score: newAnalysis.match_score,
                    strengths: newAnalysis.strengths,
                    missing_skills: newAnalysis.missing_skills,
                    recommendations: newAnalysis.recommendations,
                    skill_breakdown: newAnalysis.skill_breakdown
                };
                const retryRes = await supabase.from('analyses').insert([fallbackPayload]).select().single();
                if (!retryRes.error && retryRes.data) {
                    return {
                        ...retryRes.data,
                        detected_skills: combinedDetectedSkills
                    };
                }
                console.warn('Could not persist analysis to Supabase:', error.message);
                return {
                    id: 'ana-' + Date.now(),
                    ...newAnalysis
                };
            }
            return {
                ...data,
                detected_skills: data.detected_skills || combinedDetectedSkills
            };
        }
        catch (err) {
            console.warn('Error inserting analysis into Supabase:', err);
            return {
                id: 'ana-' + Date.now(),
                ...newAnalysis
            };
        }
    },
    async analyzeJobDescription(userSkills, jobTitle, company, jobDescription, resumeText, targetRole) {
        try {
            return await aiFastApiService.jobMatchAnalysis({
                user_skills: userSkills,
                resume_text: resumeText || '',
                job_title: jobTitle,
                company: company,
                job_description: jobDescription,
                target_role: targetRole
            });
        } catch (apiErr) {
            console.warn('AI backend jobMatchAnalysis unavailable, using resilient client-side ATS heuristic analysis:', apiErr?.message || apiErr);

            const jdSkills = extractSkillsFromText(jobDescription);
            const userSkillsNorm = new Set((userSkills || []).map(s => String(s).toLowerCase().trim()));
            const resumeSkillsNorm = new Set(extractSkillsFromText(resumeText || '').map(s => s.toLowerCase()));

            const candidateSkills = new Set([...userSkillsNorm, ...resumeSkillsNorm]);
            const matchedSkills = jdSkills.filter(s => candidateSkills.has(s.toLowerCase()));
            const missingSkills = jdSkills.filter(s => !candidateSkills.has(s.toLowerCase()));

            const total = Math.max(jdSkills.length, 1);
            const matchScore = Math.min(95, Math.max(35, Math.round((matchedSkills.length / total) * 100)));

            return {
                match_score: matchScore,
                strengths: matchedSkills.length > 0
                    ? matchedSkills.slice(0, 4).map(s => `Matched core requirement: ${s}`)
                    : ['Demonstrated foundational engineering principles'],
                missing_skills: missingSkills.length > 0
                    ? missingSkills.slice(0, 5)
                    : ['System Design', 'Cloud Deployment'],
                recommendations: missingSkills.slice(0, 3).map(s => `Build a project showcasing ${s} to improve match rate`),
                skill_breakdown: [
                    { category: 'Required Skills', user_skills: matchedSkills, missing_skills: missingSkills, score: matchScore }
                ],
                interview_talking_points: [
                    `Highlight your hands-on experience with ${matchedSkills.slice(0, 3).join(', ') || 'your core technical projects'}.`,
                    `Prepare an explanation for how you plan to bridge experience with ${missingSkills[0] || 'advanced distributed systems'}.`
                ]
            };
        }
    }
};
