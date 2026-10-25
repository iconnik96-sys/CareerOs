import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { resumeService } from '../services/resumeService';
import { applicationService } from '../services/applicationService';
import { extractSkillsFromText } from '../utils/skillExtractor';
import { getRoleDisplayName, isSkillMatch } from '../utils/careerRoles';
import { Briefcase, Search, MapPin, Bookmark, BookmarkCheck, ArrowRight, DollarSign, Sparkles, ExternalLink, Check } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const JobsPage = () => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();

    const [jobs, setJobs] = useState([]);
    const [search, setSearch] = useState('');
    const [remoteOnly, setRemoteOnly] = useState(false);
    const [savedIds, setSavedIds] = useState([]);
    const [userSkills, setUserSkills] = useState([]);
    const [appliedJobIds, setAppliedJobIds] = useState(new Set());
    const [applyingJobId, setApplyingJobId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load active user's skills: Career Profile is authoritative source of truth
    useEffect(() => {
        let isMounted = true;
        const loadUserSkills = async () => {
            if (!user?.id) {
                if (isMounted) setUserSkills([]);
                return;
            }
            try {
                const [skillsData, resumeData] = await Promise.all([
                    profileService.getUserSkills(user.id),
                    resumeService.getResume(user.id).catch(() => null)
                ]);

                const profileSkillNames = (skillsData || [])
                    .map(s => (typeof s === 'string' ? s : s?.skill?.name || s?.name || ''))
                    .filter(Boolean);

                // If user has customized their Career Profile skills, treat them as the single source of truth
                // so removed skills (e.g. Git) are not resurrected by an old uploaded resume text.
                // Only fall back to resume-extracted skills if user has not yet set up profile skills.
                let activeSkills = profileSkillNames;
                if (activeSkills.length === 0 && resumeData?.parsed_text) {
                    activeSkills = extractSkillsFromText(resumeData.parsed_text);
                }

                if (isMounted) {
                    setUserSkills(activeSkills);
                }
            } catch (err) {
                console.error('Error loading user skills for job matching:', err);
                if (isMounted) setUserSkills([]);
            }
        };
        loadUserSkills();
        return () => { isMounted = false; };
    }, [user?.id]);

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            const data = await jobService.getJobs({
                search,
                remoteOnly
            });
            setJobs(data || []);
            setSavedIds(jobService.getSavedJobIds());
            setLoading(false);
        };
        fetchJobs();
    }, [search, remoteOnly]);

    // Fetch existing tracked applications to mark jobs already applied
    useEffect(() => {
        if (!user?.id) {
            setAppliedJobIds(new Set());
            return;
        }
        let isMounted = true;
        applicationService.getApplications(user.id).then(apps => {
            if (isMounted && apps && Array.isArray(apps)) {
                const ids = new Set();
                apps.forEach(a => {
                    if (a.job_id) ids.add(String(a.job_id));
                    if (a.company && a.role) {
                        ids.add(`${String(a.company).toLowerCase().trim()}_${String(a.role).toLowerCase().trim()}`);
                    }
                });
                setAppliedJobIds(ids);
            }
        }).catch(err => console.error('Error fetching applications for jobs page:', err));
        return () => { isMounted = false; };
    }, [user?.id]);

    const handleToggleSave = (jobId, title) => {
        const isSaved = jobService.toggleSaveJob(jobId);
        setSavedIds(jobService.getSavedJobIds());
        if (isSaved) {
            showToast(`Saved "${title}" to your bookmarks`, 'success');
        }
        else {
            showToast(`Removed "${title}" from bookmarks`, 'info');
        }
    };

    // Single-Click Apply Sync: Automatically creates an entry in Application Tracker in "Applied" column
    const handleApplyJob = async (job, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!user?.id) {
            showToast('Please sign in to track and apply to opportunities', 'warning');
            return;
        }

        const jobKey = `${String(job.company).toLowerCase().trim()}_${String(job.title).toLowerCase().trim()}`;
        if (appliedJobIds.has(String(job.id)) || appliedJobIds.has(jobKey)) {
            showToast(`You have already tracked an application for ${job.company}!`, 'info');
            return;
        }

        setApplyingJobId(job.id);
        try {
            await applicationService.addApplication(user.id, {
                job_id: job.id,
                company: job.company,
                role: job.title,
                location: job.location,
                status: 'APPLIED',
                salary: job.salary_range || 'Competitive',
                applied_at: new Date().toISOString(),
                notes: `Single-Click Apply from Job Discovery. Match score: ${job.matchScore || 0}%. Required skills: ${(job.skills || []).join(', ')}.`
            });

            setAppliedJobIds(prev => new Set([...prev, String(job.id), jobKey]));

            const applyUrl = job.source_url || job.apply_url || job.url;
            if (applyUrl && applyUrl !== '#') {
                window.open(applyUrl, '_blank', 'noopener,noreferrer');
            }

            showToast(`🚀 Applied! Automatically added ${job.title} at ${job.company} to Application Tracker in "Applied" column.`, 'success');
        } catch (err) {
            console.error('Error applying to job:', err);
            showToast('Failed to sync application to tracker. Please try again.', 'error');
        } finally {
            setApplyingJobId(null);
        }
    };

    // Calculate match score for every job and rank from highest percentage to lowest
    const rankedJobs = useMemo(() => {
        const enriched = jobs.map(job => {
            const skillMatch = jobService.calculateSkillMatch(userSkills, job.skills, job);
            return {
                ...job,
                skillMatch,
                matchScore: skillMatch.score
            };
        });

        // Sort descending: highest match percent on top; tie-breaker by recency
        return enriched.sort((a, b) => {
            if (b.matchScore !== a.matchScore) {
                return b.matchScore - a.matchScore;
            }
            return (b.created_at || '').localeCompare(a.created_at || '');
        });
    }, [jobs, userSkills]);

    return (
        <div className="page-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                    <h1 className="page-title">Jobs & Hiring Pipeline</h1>
                    <p className="page-subtitle">
                        Explore curated opportunities for freshers and early-career engineering talent matched with your skills.
                    </p>
                </div>

                {/* Seamless Pipeline Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <Link to="/jobs" style={{ textDecoration: 'none' }}>
                        <Button variant="primary" size="sm" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}>
                            Explore Matches ({jobs.length})
                        </Button>
                    </Link>
                    <Link to="/applications" style={{ textDecoration: 'none' }}>
                        <Button variant="ghost" size="sm" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            Applications Pipeline (Kanban)
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '260px' }}>
                        <Input
                            placeholder="Search by role title, company, skills, or location..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            leftIcon={<Search size={16} />}
                            style={{ marginBottom: 0 }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: 'auto' }}>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                            Ranked by Match Score
                        </span>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={remoteOnly}
                                onChange={e => setRemoteOnly(e.target.checked)}
                            />
                            Remote Only
                        </label>
                    </div>
                </div>
            </Card>

            {/* Jobs Grid */}
            {loading ? (
                <LoadingSpinner message="Querying live opportunities & calculating skill match scores..." />
            ) : jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <Briefcase size={36} className="text-muted" style={{ margin: '0 auto 0.75rem auto' }} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No matching jobs found</h3>
                    <p className="text-body text-xs" style={{ marginTop: '4px' }}>Try searching for a different keyword or removing filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
                    {rankedJobs.map(job => {
                        const isSaved = savedIds.includes(job.id);
                        const skillMatch = job.skillMatch;
                        const matchScore = job.matchScore;
                        const roleBadgeName = getRoleDisplayName(job.title || job.role_id);
                        const matchingSet = new Set((skillMatch.matching || []).map(s => s.toLowerCase()));

                        // Color badge according to actual skill overlap percentage
                        let matchBadgeClass = 'badge-neutral';
                        if (userSkills.length > 0) {
                            if (matchScore >= 70) matchBadgeClass = 'badge-success';
                            else if (matchScore >= 40) matchBadgeClass = 'badge-primary';
                            else if (matchScore > 0) matchBadgeClass = 'badge-warning';
                        }

                        return (
                            <div
                                key={job.id}
                                className="card"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                    position: 'relative'
                                }}
                            >
                                <div>
                                    {/* Top Bar */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                                <span
                                                    className={`badge ${matchBadgeClass}`}
                                                    title={userSkills.length > 0
                                                        ? `${skillMatch.matching.length} of ${skillMatch.requiredSkills.length} required skills match (${skillMatch.matching.join(', ') || 'None'})`
                                                        : 'Add skills to your profile to calculate personalized match score'}
                                                >
                                                    {matchScore}% Match
                                                </span>
                                                {job.is_remote && (
                                                    <span className="badge badge-primary">Remote</span>
                                                )}
                                                <span className="badge badge-neutral text-xs">
                                                    {roleBadgeName}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                {job.title}
                                            </h3>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                {job.company}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggleSave(job.id, job.title)}
                                            className="btn-ghost"
                                            style={{ padding: '6px', color: isSaved ? 'var(--primary)' : 'var(--text-muted)' }}
                                            title={isSaved ? 'Remove from Saved' : 'Save Job'}
                                        >
                                            {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                                        </button>
                                    </div>

                                    {/* Metadata */}
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <MapPin size={14} /> {job.location}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Briefcase size={14} /> {job.experience_min}–{job.experience_max} yrs
                                        </span>
                                        {job.salary_range && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <DollarSign size={14} /> {job.salary_range}
                                            </span>
                                        )}
                                    </div>

                                    {/* Skills Tags: Highlight matched skills */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                                        {(skillMatch.requiredSkills?.length > 0 ? skillMatch.requiredSkills : (job.skills || [])).map(sk => {
                                            const isMatched = matchingSet.has(sk.toLowerCase()) || userSkills.some(us => isSkillMatch(us, sk));
                                            return (
                                                <span
                                                    key={sk}
                                                    className={`badge ${isMatched ? 'badge-success' : 'badge-neutral'}`}
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        border: isMatched ? '1px solid rgba(16, 185, 129, 0.4)' : undefined
                                                    }}
                                                    title={isMatched ? 'Matching skill in your profile' : 'Missing skill'}
                                                >
                                                    {isMatched ? '✓ ' : ''}{sk}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleToggleSave(job.id, job.title)}
                                        className="btn-ghost"
                                        style={{ fontSize: '0.8125rem', color: isSaved ? 'var(--primary)' : 'var(--text-muted)' }}
                                    >
                                        {isSaved ? 'Saved' : 'Save Job'}
                                    </button>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Link to={`/jobs/${job.id}`}>
                                            <Button variant="outline" size="sm">
                                                View Details
                                            </Button>
                                        </Link>

                                        {(appliedJobIds.has(String(job.id)) || appliedJobIds.has(`${String(job.company).toLowerCase().trim()}_${String(job.title).toLowerCase().trim()}`)) ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled
                                                leftIcon={<Check size={14} style={{ color: 'var(--success)' }} />}
                                                style={{ borderColor: 'rgba(34, 197, 94, 0.4)', color: 'var(--success)', cursor: 'default', backgroundColor: 'rgba(34, 197, 94, 0.08)' }}
                                            >
                                                Applied
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={(e) => handleApplyJob(job, e)}
                                                disabled={applyingJobId === job.id}
                                                leftIcon={applyingJobId === job.id ? <LoadingSpinner size="xs" /> : <ExternalLink size={13} />}
                                                title={`Apply to ${job.company} & sync to Application Tracker`}
                                            >
                                                {applyingJobId === job.id ? 'Applying...' : 'Apply'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

