import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Terminal,
    Building2,
    CheckCircle2,
    Clock,
    ArrowRight,
    Code2,
    Sparkles,
    Search,
    ShieldCheck,
    Layers,
    Cpu,
    Briefcase,
    Zap
} from 'lucide-react';
import { simulationService } from '../services/simulationService';
import { InconvenienceNotice } from '../components/common/InconvenienceNotice';

export const SimulationsPage = () => {
    const navigate = useNavigate();
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter tracks based on category & search query
    const filteredTracks = useMemo(() => {
        return tracks.filter((track) => {
            const matchesCategory =
                selectedCategory === 'all' ||
                (selectedCategory === 'backend' && (track.role_title?.toLowerCase().includes('backend') || track.title?.toLowerCase().includes('gateway') || track.title?.toLowerCase().includes('api'))) ||
                (selectedCategory === 'fullstack' && track.role_title?.toLowerCase().includes('full')) ||
                (selectedCategory === 'devops' && track.role_title?.toLowerCase().includes('devops'));

            const matchesSearch =
                !searchQuery.trim() ||
                track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                track.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                track.tech_stacks?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

            return matchesCategory && matchesSearch;
        });
    }, [tracks, selectedCategory, searchQuery]);

    const categories = [
        { id: 'all', label: 'All Tracks' },
        { id: 'backend', label: 'Backend & APIs' },
        { id: 'fullstack', label: 'Full-Stack' },
        { id: 'devops', label: 'DevOps & Cloud' }
    ];

    return (
        <div className="page-container" style={{ padding: '2rem 2.5rem 5rem 2.5rem', maxWidth: 'var(--container-max)', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            {/* 1. Modern Hero Section */}
            <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem 2rem',
                maxWidth: '780px',
                margin: '0 auto'
            }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#60a5fa',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    marginBottom: '1rem'
                }}>
                    <Zap size={14} className="text-primary" />
                    <span>Real-World Engineering Practice</span>
                </div>

                <h1 style={{
                    fontSize: '2.4rem',
                    fontWeight: 800,
                    margin: '0 0 0.85rem',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.15,
                    background: 'linear-gradient(180deg, #ffffff 30%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Virtual Work Simulations
                </h1>

                <p style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6
                }}>
                    Work inside real production codebases, resolve realistic sprint tickets in your browser, and earn verified resume bullet points reviewed by a Staff Engineer.
                </p>

                {/* Micro-Trust Highlights */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '1.5rem',
                    marginTop: '1.75rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <Code2 size={16} color="#38bdf8" />
                        <span>Multi-File Production Codebases</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <Sparkles size={16} color="#a78bfa" />
                        <span>Strict Staff AI Code Reviews</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <ShieldCheck size={16} color="#34d399" />
                        <span>Google XYZ STAR Resume Bullets</span>
                    </div>
                </div>
            </div>

            {/* 1.5 Progressive Difficulty Ladder for Students & Freshers */}
            <div style={{
                margin: '1rem 0 2.5rem',
                padding: '1.75rem',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8' }}>
                                Progressive Skill Ladder
                            </span>
                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '100px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                                Fresher to Production Ready
                            </span>
                        </div>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                            Choose Your Simulation Experience Level
                        </h2>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.4 }}>
                        Start with step-by-step guided tickets or dive straight into high-concurrency production outages.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.25rem'
                }}>
                    {/* Level 1 Card: Ticket FIN-101 */}
                    <div
                        onClick={() => {
                            const target = tracks[0]?.track_key || 'finpulse-payments';
                            navigate(`/simulations/${target}?mode=guided&ticket=FIN-101`);
                        }}
                        style={{
                            background: 'rgba(16, 185, 129, 0.06)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                            e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(16, 185, 129, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '100px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                                    color: '#34d399'
                                }}>
                                    🟢 Level 1 • Beginner Friendly
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>~15 mins</span>
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.4rem', color: '#f8fafc' }}>
                                FIN-101: Validate Currency & Amounts
                            </h3>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                                Plain-English mission brief. Implement ISO-4217 uppercase currency and boundary validation in paymentController.ts.
                            </p>
                        </div>
                        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Guided 2-Pane IDE</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
                                Start Ticket <ArrowRight size={14} />
                            </span>
                        </div>
                    </div>

                    {/* Level 2 Card: Ticket FIN-102 */}
                    <div
                        onClick={() => {
                            const target = tracks[0]?.track_key || 'finpulse-payments';
                            navigate(`/simulations/${target}?mode=guided&ticket=FIN-102`);
                        }}
                        style={{
                            background: 'rgba(245, 158, 11, 0.06)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                            e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(245, 158, 11, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '100px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.18)',
                                    color: '#fbbf24'
                                }}>
                                    🟡 Level 2 • Intermediate
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>~30 mins</span>
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.4rem', color: '#f8fafc' }}>
                                FIN-102: Distributed Idempotency Lock
                            </h3>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                                Prevent duplicate transaction race conditions using atomic Redis distributed locks in idempotencyService.ts.
                            </p>
                        </div>
                        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>Guided 2-Pane IDE</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>
                                Start Ticket <ArrowRight size={14} />
                            </span>
                        </div>
                    </div>

                    {/* Level 3 Card: Incident #504 */}
                    <div
                        onClick={() => {
                            const target = tracks[0]?.track_key || 'finpulse-payments';
                            navigate(`/simulations/${target}?mode=pro&ticket=INC-504`);
                        }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.06)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.25rem',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                            e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '100px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.18)',
                                    color: '#f87171'
                                }}>
                                    🔴 Level 3 • Production Outage
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>~45 mins</span>
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.4rem', color: '#f8fafc' }}>
                                Incident #504: Flash Sale Bottleneck
                            </h3>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                                Live terminal, Docker logs, pool starvation diagnosis, WASM unit tests, and Staff AI review in docker-compose.yml.
                            </p>
                        </div>
                        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>4-Pane Incident IDE</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 700, color: '#f87171' }}>
                                Launch Incident <ArrowRight size={14} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Interactive Filter & Search Controls */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                margin: '1.5rem 0 2rem',
                padding: '0.5rem 0'
            }}>
                {/* Category Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {categories.map((cat) => {
                        const isActive = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.8125rem',
                                    fontWeight: isActive ? 700 : 500,
                                    background: isActive
                                        ? 'linear-gradient(135deg, var(--primary), var(--accent-indigo))'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                                    border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isActive ? 'var(--shadow-glow)' : 'none'
                                }}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '260px' }}>
                    <Search
                        size={15}
                        style={{
                            position: 'absolute',
                            left: '0.875rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search stacks (e.g. Python, FastAPI)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.45rem 0.85rem 0.45rem 2.25rem',
                            fontSize: '0.8125rem',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-full)',
                            color: 'var(--text-primary)',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* 3. Main Track Catalog Grid */}
            <div>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
                        <div className="loading-spinner" style={{ width: 40, height: 40, marginBottom: '1rem' }} />
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Loading live engineering simulations...
                        </span>
                    </div>
                ) : error || tracks.length === 0 ? (
                    <InconvenienceNotice
                        title="Workplace Simulation Unavailable"
                        message="We are sorry for the inconvenience. Workplace simulation tracks cannot be loaded right now because the backend service is offline. To prevent unverified practice, mock tracks are not displayed."
                        details={error}
                        onRetry={loadTracks}
                        retryText="Retry Loading Tracks"
                    />
                ) : filteredTracks.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px dashed var(--border-color)'
                    }}>
                        <Layers size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                            No simulations match your filter
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                            Try selecting "All Tracks" or clear your search term.
                        </p>
                        <button
                            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                            className="btn-outline"
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem' }}
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                        gap: '1.75rem'
                    }}>
                        {filteredTracks.map((track) => (
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
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                                    e.currentTarget.style.boxShadow = '0 12px 28px -6px rgba(0, 0, 0, 0.6), 0 0 15px -3px rgba(59, 130, 246, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }}
                            >
                                {/* Card Top Glowing Edge */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: 'linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)'
                                }} />

                                <div>
                                    {/* Company Identity & Difficulty */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.2))',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#60a5fa'
                                            }}>
                                                <Building2 size={22} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                                                    {track.company_name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Briefcase size={11} />
                                                    <span>{track.role_title || 'Software Engineer'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <span className="badge badge-purple" style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {track.difficulty}
                                        </span>
                                    </div>

                                    {/* Track Title */}
                                    <h3 style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        margin: '0 0 0.5rem',
                                        color: '#ffffff',
                                        letterSpacing: '-0.01em'
                                    }}>
                                        {track.title}
                                    </h3>

                                    {/* Tagline / Mission */}
                                    <p style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.5,
                                        margin: '0 0 1.25rem',
                                        minHeight: '2.6rem'
                                    }}>
                                        {track.company_tagline}
                                    </p>

                                    {/* Quick Stats Badges */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                            padding: '0.3rem 0.65rem',
                                            borderRadius: 'var(--radius-full)'
                                        }}>
                                            <Clock size={13} color="#60a5fa" />
                                            <span>~{track.duration_hours || 4}h Practice</span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                            padding: '0.3rem 0.65rem',
                                            borderRadius: 'var(--radius-full)'
                                        }}>
                                            <CheckCircle2 size={13} color="var(--success)" />
                                            <span>3 Production Tickets</span>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                            padding: '0.3rem 0.65rem',
                                            borderRadius: 'var(--radius-full)'
                                        }}>
                                            <Sparkles size={13} color="#f59e0b" />
                                            <span>Staff PR Review</span>
                                        </div>
                                    </div>

                                    {/* Tech Stacks */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{
                                            fontSize: '0.6875rem',
                                            fontWeight: 700,
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.45rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.06em'
                                        }}>
                                            Production Stacks
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                            {(track.tech_stacks || ['Python', 'FastAPI', 'Redis']).map((tech, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        border: '1px solid rgba(59, 130, 246, 0.25)',
                                                        color: '#93c5fd',
                                                        padding: '0.2rem 0.55rem',
                                                        borderRadius: 'var(--radius-sm)'
                                                    }}
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* High-Conversion Primary Action */}
                                <button
                                    onClick={() => navigate(`/simulations/${track.track_key}`)}
                                    className="btn-primary"
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.8rem',
                                        fontWeight: 700,
                                        fontSize: '0.9375rem',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.35)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <span>Enter Company Simulation</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        ))}

                        {/* Coming Soon Preview Card */}
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.4)',
                            border: '1px dashed rgba(255, 255, 255, 0.15)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            opacity: 0.75
                        }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid var(--border-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <Cpu size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                                                CloudScale Networks
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Distributed Systems Engineer
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.6875rem',
                                        fontWeight: 700,
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        color: 'var(--text-muted)',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: 'var(--radius-full)'
                                    }}>
                                        COMING SOON
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 0.5rem' }}>
                                    Distributed Rate Limiter & Token Bucket Pipeline
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                                    Implement sliding window rate limiting across distributed Redis clusters with sub-millisecond latency requirements.
                                </p>

                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                    <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>Go / Golang</span>
                                    <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>Redis Cluster</span>
                                    <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>gRPC</span>
                                </div>
                            </div>

                            <button
                                disabled
                                style={{
                                    marginTop: '1.5rem',
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    cursor: 'not-allowed'
                                }}
                            >
                                In Engineering Review
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
