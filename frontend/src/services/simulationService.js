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

// Automatically inject session token for authenticated simulation requests
client.interceptors.request.use(async (config) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            config.headers['Authorization'] = `Bearer ${session.access_token}`;
        }
    } catch {
        // Fallback gracefully if Supabase is offline
    }
    return config;
});

function formatApiError(err) {
    if (axios.isAxiosError(err)) {
        if (err.response?.status === 503) {
            return new Error(err.response.data?.detail || 'AI reviewer is not configured yet. Please configure GROQ_API_KEY in Render environment variables.');
        }
        if (err.response?.status === 429) {
            return new Error('Rate limit reached for AI requests. Please wait a minute before submitting again.');
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
    return new Error(err?.message || 'An unexpected simulation error occurred.');
}

// ====================================================================
// Simulation Service Export
// ====================================================================

export const simulationService = {
    // 1. Fetch all tracks
    async getTracks() {
        try {
            const res = await client.get('/api/ai/simulation/tracks');
            return res.data.tracks || [];
        } catch (err) {
            console.error('Failed to fetch simulation tracks from backend:', err);
            throw new Error(err.response?.data?.detail || err.message || 'Workplace simulation tracks could not be loaded from the backend.');
        }
    },

    // 2. Fetch track by key with tickets
    async getTrack(trackKey) {
        try {
            const res = await client.get(`/api/ai/simulation/tracks/${trackKey}`);
            return res.data;
        } catch (err) {
            console.error('Failed to fetch simulation track from backend:', err);
            throw new Error(err.response?.data?.detail || err.message || 'Simulation track could not be loaded from the backend.');
        }
    },

    // 3. Submit Pull Request / Code for AI Review
    async submitReview(payload) {
        try {
            const res = await client.post('/api/ai/simulation/review', payload);
            return res.data;
        } catch (err) {
            console.error('AI code review failed on backend:', err);
            throw new Error(err.response?.data?.detail || err.message || 'AI code review service is currently unavailable. No simulated score was generated.');
        }
    },

    // 4. Daily Standup Check-in with Manager Sarah
    async sendStandup(payload) {
        try {
            const res = await client.post('/api/ai/simulation/standup', payload);
            return res.data;
        } catch (err) {
            console.error('Standup check-in failed on backend:', err);
            throw new Error(err.response?.data?.detail || err.message || 'Daily standup service is currently unavailable.');
        }
    },

    // 5. Ask Socratic Mentor Marcus for a Hint
    async askMentorHint(payload) {
        try {
            const res = await client.post('/api/ai/simulation/mentor-hint', payload);
            return res.data;
        } catch (err) {
            console.error('Mentor hint failed on backend:', err);
            throw new Error(err.response?.data?.detail || err.message || 'Mentor hint service is currently unavailable.');
        }
    },

    // 6. Local / Supabase Progress Sync
    getProgress(trackKey) {
        try {
            const raw = localStorage.getItem(`careeros_sim_progress_${trackKey}`);
            if (raw) return JSON.parse(raw);
        } catch {}
        return {
            selectedLanguage: 'python',
            completedTickets: [],
            currentTicketCode: 'FIN-101',
            earnedBullets: []
        };
    },

    saveProgress(trackKey, progress) {
        try {
            localStorage.setItem(`careeros_sim_progress_${trackKey}`, JSON.stringify(progress));
        } catch {}
    }
};
