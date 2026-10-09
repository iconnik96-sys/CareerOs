import axios from 'axios';
const FASTAPI_BASE_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';
const client = axios.create({
    baseURL: FASTAPI_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});
function formatApiError(err) {
    if (axios.isAxiosError(err)) {
        if (err.response?.status === 503) {
            const detail = err.response.data?.detail || 'AI features are not configured yet. Please configure GROQ_API_KEY in backend/.env.';
            return new Error(detail);
        }
        if (err.response?.status === 500) {
            const detail = err.response.data?.detail || 'AI request failed, please try again.';
            return new Error(detail);
        }
        if (err.code === 'ECONNREFUSED' || !err.response) {
            return new Error('AI Backend is unreachable. Please verify that the FastAPI server is running on http://localhost:8000.');
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
    async generateRoadmap(req) {
        try {
            const res = await client.post('/api/ai/generate-roadmap', req);
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
            return {
                reply: '⚠️ **Unable to connect to AI Backend.**\n\nPlease ensure the FastAPI server is running on `http://localhost:8000`.',
                suggested_followups: [],
                quick_tips: []
            };
        }
    }
};
