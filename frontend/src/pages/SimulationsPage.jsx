import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Terminal,
    Building2,
    CheckCircle2,
    Clock,
    ArrowRight,
    ShieldAlert,
    Code2,
    GitPullRequest,
    MessageSquare,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import { simulationService } from '../services/simulationService';
import { InconvenienceNotice } from '../components/common/InconvenienceNotice';

export const SimulationsPage = () => {
    const navigate = useNavigate();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadTracks();
    }, []);

    const loadTracks = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await simulationService.getTracks();
            setTracks(data || []);
            if (!data || data.length === 0) {
                setError('No simulation tracks are currently deployed on the backend.');
            }
        } catch (err) {
            console.error('Failed to load tracks', err);
            setError(err.message || 'Workplace simulation service is currently unavailable.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header Section */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: 'var(--primary)'
                    }}>
                        <Terminal size={22} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                            Workplace Simulation Sandbox
                        </h1>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                            Hands-on engineering deliberate practice • Experience how real companies, sprint tickets, and PR reviews work
                        </p>
                    </div>
                </div>
            </div>

            {/* Honest Educational Positioning Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.6))',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '2.5rem',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'flex-start',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{
                    padding: '0.625rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    flexShrink: 0
                }}>
                    <ShieldAlert size={24} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            Zero-Risk Flight Simulator for Software Engineers
                        </span>
                        <span className="badge badge-blue" style={{ fontSize: '0.6875rem' }}>
                            Deliberate Practice
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        This sandbox is built for <strong>pure, hands-on workplace practice</strong>—not false job placement guarantees. You will read existing company codebases, submit Pull Requests, participate in daily standups, and iterate on strict code reviews from a Senior Staff Engineer. You gain real engineering muscle memory and verified project bullet points for your resume.
                    </p>
                </div>
            </div>

            {/* Key Pillars Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginBottom: '2.5rem'
            }}>
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', marginBottom: '0.5rem' }}>
                        <Code2 size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Brownfield Codebases</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Navigate existing multi-file architectures instead of starting from an empty blank file.
                    </p>
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', marginBottom: '0.5rem' }}>
                        <GitPullRequest size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Strict Pull Request Reviews</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Receive line-by-line feedback from Staff Engineer Marcus. Iterate through Changes Requested.
                    </p>
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', marginBottom: '0.5rem' }}>
                        <MessageSquare size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Asynchronous Standups</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Practice concise, professional technical communication with Engineering Manager Sarah.
                    </p>
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', marginBottom: '0.5rem' }}>
                        <Sparkles size={18} />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Resume & Interview Proof</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Auto-generate Google XYZ formula STAR bullets and interview talking points from approved tickets.
                    </p>
                </div>
            </div>

            {/* Track Catalog */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem' }}>
                    Available Company Simulations
                </h2>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                        <div className="loading-spinner" style={{ width: 36, height: 36 }} />
                    </div>
                ) : error || tracks.length === 0 ? (
                    <InconvenienceNotice
                        title="Workplace Simulation Unavailable"
                        message="We are sorry for the inconvenience. Workplace simulation tracks cannot be loaded right now because the backend service is offline. To prevent unverified practice, mock tracks are not displayed."
                        details={error}
                        onRetry={loadTracks}
                        retryText="Retry Loading Tracks"
                    />
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                        {tracks.map((track) => (
                            <div
                                key={track.id}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    boxShadow: 'var(--shadow-md)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Top Accent */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: 'linear-gradient(90deg, var(--primary), var(--accent-indigo))'
                                }} />

                                <div>
                                    {/* Company & Role Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem' }}>
                                                <Building2 size={16} />
                                                <span>{track.company_name}</span>
                                            </div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.25rem 0 0', color: 'var(--text-primary)' }}>
                                                {track.title}
                                            </h3>
                                        </div>
                                        <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                                            {track.difficulty}
                                        </span>
                                    </div>

                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                                        {track.company_tagline}
                                    </p>

                                    {/* Meta Tags */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-muted)',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            padding: '0.25rem 0.625rem',
                                            borderRadius: 'var(--radius-full)'
                                        }}>
                                            <Clock size={13} />
                                            <span>~{track.duration_hours || 4} hours deliberate practice</span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-muted)',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            padding: '0.25rem 0.625rem',
                                            borderRadius: 'var(--radius-full)'
                                        }}>
                                            <CheckCircle2 size={13} color="var(--success)" />
                                            <span>3 Production Tickets</span>
                                        </div>
                                    </div>

                                    {/* Tech Stack Pills */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Supported Stacks (Select Any):
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                            {(track.tech_stacks || ['Python', 'Java', 'Node.js']).map((st, i) => (
                                                <span key={i} className="badge badge-gray" style={{ fontSize: '0.75rem' }}>
                                                    {st}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => navigate(`/simulations/${track.track_key}`)}
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        fontWeight: 700
                                    }}
                                >
                                    <span>Enter Company Workspace</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
