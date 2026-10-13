import axios from 'axios';
import { supabase } from '../lib/supabase';

const FASTAPI_BASE_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';

const client = axios.create({
    baseURL: FASTAPI_BASE_URL,
    timeout: 35000,
    headers: {
        'Content-Type': 'application/json'
    }
});

function formatApiError(err) {
    if (axios.isAxiosError(err)) {
        if (err.response?.status === 503) {
            return new Error(err.response.data?.detail || 'AI reviewer is not configured yet. Please configure GROQ_API_KEY in backend/.env.');
        }
        if (err.response?.status === 429) {
            return new Error('Rate limit reached for AI requests. Please wait a minute before submitting again.');
        }
        if (err.code === 'ECONNREFUSED' || !err.response) {
            return new Error('AI Backend is unreachable. Please verify that the FastAPI backend is running on http://localhost:8000.');
        }
        if (err.response?.data?.detail) {
            return new Error(err.response.data.detail);
        }
    }
    return new Error(err?.message || 'An unexpected simulation error occurred.');
}

export const simulationService = {
    // 1. Fetch all tracks
    async getTracks() {
        try {
            const res = await client.get('/api/ai/simulation/tracks');
            return res.data.tracks || [];
        } catch (err) {
            console.warn('Could not fetch simulation tracks from backend, using fallback:', err);
            // Return fallback default track so UI never crashes
            return [{
                id: 'track-finpulse-001',
                track_key: 'finpulse-payments',
                title: 'FinPulse — High-Throughput Payment Gateway',
                company_name: 'FinPulse Global',
                company_tagline: 'Processing 50,000+ real-time checkout transactions per second across global merchant APIs.',
                role_title: 'Junior Backend Engineer',
                difficulty: 'Intermediate',
                duration_hours: 4,
                tech_stacks: ['Python (FastAPI)', 'Java (Spring Boot)', 'Node.js (Express)'],
                github_templates: {
                    python: 'https://github.com/CareerOS-HQ/finpulse-payments-python',
                    java: 'https://github.com/CareerOS-HQ/finpulse-payments-java',
                    node: 'https://github.com/CareerOS-HQ/finpulse-payments-node'
                }
            }];
        }
    },

    // 2. Fetch track by key with tickets
    async getTrack(trackKey) {
        try {
            const res = await client.get(`/api/ai/simulation/tracks/${trackKey}`);
            return res.data;
        } catch (err) {
            throw formatApiError(err);
        }
    },

    // 3. Submit Pull Request / Code for AI Review
    async submitReview(payload) {
        try {
            const res = await client.post('/api/ai/simulation/review', payload);
            return res.data;
        } catch (err) {
            throw formatApiError(err);
        }
    },

    // 4. Daily Standup Check-in with Manager Sarah
    async sendStandup(payload) {
        try {
            const res = await client.post('/api/ai/simulation/standup', payload);
            return res.data;
        } catch (err) {
            throw formatApiError(err);
        }
    },

    // 5. Ask Socratic Mentor Marcus for a Hint
    async askMentorHint(payload) {
        try {
            const res = await client.post('/api/ai/simulation/mentor-hint', payload);
            return res.data;
        } catch (err) {
            throw formatApiError(err);
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
