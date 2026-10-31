import axios from 'axios';
import { supabase } from '../lib/supabase';

const FASTAPI_BASE_URL = (import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');
const client = axios.create({
    baseURL: FASTAPI_BASE_URL,
    timeout: 60000, // 60s timeout to accommodate Render free tier cold starts (~50s)
    headers: {
        'Content-Type': 'application/json'
    }
});

// Automatically inject session token and user email if authenticated
client.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers['Authorization'] = `Bearer ${session.access_token}`;
            if (session.user?.email) {
                config.headers['X-Founder-Email'] = session.user.email;
            }
        }
    } catch {
        // Fallback gracefully if Supabase is offline or uninitialized
    }
    return config;
});

function formatApiError(err) {
    if (axios.isAxiosError(err)) {
        if (err.response?.status === 503) {
            const detail = err.response.data?.detail || 'AI features are not configured yet. Please configure GROQ_API_KEY in Render environment variables.';
            return new Error(detail);
        }
        if (err.response?.status === 500) {
            const detail = err.response.data?.detail || 'AI request failed, please try again.';
            return new Error(detail);
        }
        if (err.code === 'ECONNABORTED') {
            return new Error(`AI request timed out. The backend at ${FASTAPI_BASE_URL} may be spinning up from sleep (Render free tier cold start takes ~50s). Please wait a moment and try again.`);
        }
        if (err.code === 'ECONNREFUSED' || !err.response) {
            const isDeployed = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            if (isDeployed && FASTAPI_BASE_URL.includes('localhost')) {
                return new Error('AI Backend is configured as "localhost" on your deployed website. In Netlify Site Settings ➔ Environment Variables, add VITE_AI_BACKEND_URL pointing to your Render backend URL (e.g., https://your-app.onrender.com), then trigger a redeploy.');
            }
            return new Error(`AI Backend is unreachable at ${FASTAPI_BASE_URL}. If hosted on Render free tier, the service may be spinning up from sleep (~50s cold start). Please wait 30 seconds and try again.`);
        }
        if (err.response?.data?.detail) {
            return new Error(err.response.data.detail);
        }
    }
    return new Error(err?.message || 'An unexpected AI error occurred.');
}
export const aiFastApiService = {
    async checkHealth() {
        try {
            const res = await client.get('/api/health');
            return {
                isOnline: res.status === 200,
                groqConfigured: res.data?.groq_configured ?? false,
                details: res.data
            };
        }
        catch {
            return { isOnline: false, groqConfigured: false };
        }
    },
    async parseResumeFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await client.post('/api/ai/parse-resume-file', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async parseAndExtractResume(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await client.post('/api/ai/parse-and-extract-profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async deepResumeAnalysis(req) {
        try {
            const res = await client.post('/api/ai/deep-resume-analysis', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async getCompaniesKnowledge() {
        try {
            const res = await client.get('/api/ai/companies-knowledge');
            return res.data || [];
        } catch {
            return [];
        }
    },
    async generateRagCompanyOutreach(req) {
        try {
            const res = await client.post('/api/ai/rag-company-outreach', req);
            return res.data;
        } catch (err) {
            throw formatApiError(err);
        }
    },
    async generateCoverLetter(req) {
        try {
            const res = await client.post('/api/ai/cover-letter', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async generateOutreach(req) {
        try {
            const res = await client.post('/api/ai/outreach-message', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async enhanceResumeBullet(req) {
        try {
            const res = await client.post('/api/ai/enhance-bullet', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async evaluateInterviewAnswer(req) {
        try {
            const res = await client.post('/api/ai/evaluate-interview-answer', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async evaluateInterviewSession(req) {
        try {
            const res = await client.post('/api/ai/evaluate-interview-session', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async generateInterviewQuestions(req) {
        try {
            const res = await client.post('/api/ai/generate-interview-questions', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async clarifyInterviewQuestion(req) {
        try {
            const res = await client.post('/api/ai/clarify-interview-question', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async executeVoiceTurn(req) {
        try {
            const res = await client.post('/api/ai/interview-voice-turn', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async jobMatchAnalysis(req) {
        try {
            const res = await client.post('/api/ai/job-match-analysis', req);
            return res.data;
        }
        catch (err) {
            throw formatApiError(err);
        }
    },
    async suggestRoleSkills(role) {
        try {
            const res = await client.post('/api/ai/suggest-role-skills', { role });
            return res.data?.skills || [];
        }
        catch (err) {
            console.warn('Could not fetch AI role skills:', err);
            return [];
        }
    },
    async chatCopilot(req) {
        try {
            const res = await client.post('/api/ai/copilot-chat', req);
            return res.data;
        }
        catch (err) {
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 503) {
                    return {
                        reply: '⚠️ **AI features are not configured yet.**\n\nPlease configure `GROQ_API_KEY` in the `backend/.env` file to enable CareerOS Copilot.',
                        suggested_followups: [],
                        quick_tips: []
                    };
                }
                if (err.response?.status === 500) {
                    return {
                        reply: '⚠️ **AI request failed, please try again.**\n\nThe Groq model encountered an error generating this response.',
                        suggested_followups: [],
                        quick_tips: []
                    };
                }
            }
            const isDeployed = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
            let failureMsg = `⚠️ **Unable to connect to AI Backend.**\n\nIf hosted on Render free tier, the service may be spinning up from sleep (~50s cold start). Please wait 30 seconds and retry.`;
            if (isDeployed && FASTAPI_BASE_URL.includes('localhost')) {
                failureMsg = `⚠️ **AI Backend is set to localhost on a deployed website.**\n\nPlease add \`VITE_AI_BACKEND_URL\` in your Netlify site settings pointing to your Render backend URL (e.g., \`https://your-app.onrender.com\`), then redeploy.`;
            }
            return {
                reply: failureMsg,
                suggested_followups: [],
                quick_tips: []
            };
        }
    },
    async getAdminMetrics(founderEmail) {
        try {
            const headers = founderEmail ? { 'X-Founder-Email': founderEmail } : {};
            const res = await client.get('/api/admin/metrics', {
                params: { founder_email: founderEmail },
                headers
            });
            return res.data;
        } catch (err) {
            throw formatApiError(err);
        }
    },
    async switchAdminModel(model, founderEmail) {
        try {
            const headers = founderEmail ? { 'X-Founder-Email': founderEmail } : {};
            const res = await client.post('/api/admin/switch-model', { model }, { headers });
            return res.data;
        } catch (err) {
            throw formatApiError(err);
        }
    },
    async resetAdminMetrics(founderEmail) {
        try {
            const headers = founderEmail ? { 'X-Founder-Email': founderEmail } : {};
            const res = await client.post('/api/admin/reset-metrics', {}, { headers });
            return res.data;
        } catch (err) {
            throw formatApiError(err);
        }
    }
};

