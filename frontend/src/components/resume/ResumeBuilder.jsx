import React, { useState } from 'react';
import {
    Sparkles, Plus, Trash2, Wand2, Download, Printer,
    Sliders, ChevronDown, ChevronUp, Check, RefreshCw,
    User, GraduationCap, Briefcase, Code, Award, FolderGit2,
    FileText, Layers, Eye, EyeOff
} from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { aiFastApiService } from '../../services/aiFastApiService';

export const ResumeBuilder = ({
    initialProfile,
    resumeData,
    setResumeData,
    settings,
    setSettings,
    onDownloadPdf,
    isDownloadingPdf,
    onImportFromProfile,
    isImportingProfile,
    showToast
}) => {
    // Accordion state to keep UI clean and scannable
    const [openSections, setOpenSections] = useState({
        personal: true,
        education: true,
        skills: true,
        projects: true,
        experience: false,
        certifications: false,
        achievements: false,
        custom: false,
        styling: true
    });

    const toggleSection = (sec) => {
        setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
    };

    // AI Bullet polisher modal / inline state
    const [activeAiTarget, setActiveAiTarget] = useState(null);
    const [aiPolishLoading, setAiPolishLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);

    // Section Visibility & Removal Tracking
    const [visibleSections, setVisibleSections] = useState({
        personal: true,
        education: true,
        skills: true,
        projects: true,
        experience: true,
        certifications: true,
        achievements: true
    });

    const removeSection = (sectionKey) => {
        setVisibleSections(prev => ({ ...prev, [sectionKey]: false }));
        if (showToast) showToast(`Removed ${sectionKey} section from resume`, 'info');
    };

    const addSection = (sectionKey) => {
        setVisibleSections(prev => ({ ...prev, [sectionKey]: true }));
        setOpenSections(prev => ({ ...prev, [sectionKey]: true }));
        if (showToast) showToast(`Added ${sectionKey} section to resume`, 'success');
    };

    // Helper update handlers
    const updatePersonal = (field, val) => {
        setResumeData(prev => ({
            ...prev,
            personal: { ...prev.personal, [field]: val }
        }));
    };

    // Education handlers
    const addEducation = () => {
        setResumeData(prev => ({
            ...prev,
            education: [
                ...(prev.education || []),
                { institution: '', degree: 'B.Tech in Computer Science', field: '', dates: '2021 - 2025', gpa: '8.8 / 10', details: '' }
            ]
        }));
    };

    const updateEducation = (idx, field, val) => {
        setResumeData(prev => {
            const list = [...(prev.education || [])];
            list[idx] = { ...list[idx], [field]: val };
            return { ...prev, education: list };
        });
    };

    const removeEducation = (idx) => {
        setResumeData(prev => ({
            ...prev,
            education: (prev.education || []).filter((_, i) => i !== idx)
        }));
    };

    // Skills handlers
    const updateSkillCategory = (idx, field, val) => {
        setResumeData(prev => {
            const cats = [...(prev.skills?.categories || [])];
            cats[idx] = { ...cats[idx], [field]: val };
            return { ...prev, skills: { ...prev.skills, categories: cats } };
        });
    };

    const addSkillCategory = () => {
        setResumeData(prev => ({
            ...prev,
            skills: {
                ...prev.skills,
                categories: [
                    ...(prev.skills?.categories || []),
                    { name: 'Tools & DevOps', items: 'Docker, Git, AWS, Linux, Kubernetes' }
                ]
            }
        }));
    };

    const removeSkillCategory = (idx) => {
        setResumeData(prev => ({
            ...prev,
            skills: {
                ...prev.skills,
                categories: (prev.skills?.categories || []).filter((_, i) => i !== idx)
            }
        }));
    };

    // Project handlers
    const addProject = () => {
        setResumeData(prev => ({
            ...prev,
            projects: [
                ...(prev.projects || []),
                {
                    title: 'New High-Impact Project',
                    techStack: 'React, Node.js, PostgreSQL',
                    link: 'https://github.com/user/project',
                    liveLink: 'https://project-demo.vercel.app',
                    dates: '2024',
                    bullets: [
                        'Architected and deployed scalable REST endpoints serving 5,000+ daily requests with 99.9% uptime.',
                        'Optimized SQL query performance and database indexing, decreasing median API response latency by 42%.'
                    ]
                }
            ]
        }));
    };

    const updateProject = (idx, field, val) => {
        setResumeData(prev => {
            const list = [...(prev.projects || [])];
            list[idx] = { ...list[idx], [field]: val };
            return { ...prev, projects: list };
        });
    };

    const removeProject = (idx) => {
        setResumeData(prev => ({
            ...prev,
            projects: (prev.projects || []).filter((_, i) => i !== idx)
        }));
    };

    const addProjectBullet = (projIdx) => {
        setResumeData(prev => {
            const list = [...(prev.projects || [])];
            list[projIdx].bullets = [...(list[projIdx].bullets || []), 'Engineered key workflow module delivering measurable performance improvements.'];
            return { ...prev, projects: list };
        });
    };

    const updateProjectBullet = (projIdx, bulletIdx, val) => {
        setResumeData(prev => {
            const list = [...(prev.projects || [])];
            const bullets = [...(list[projIdx].bullets || [])];
            bullets[bulletIdx] = val;
            list[projIdx].bullets = bullets;
            return { ...prev, projects: list };
        });
    };

    const removeProjectBullet = (projIdx, bulletIdx) => {
        setResumeData(prev => {
            const list = [...(prev.projects || [])];
            list[projIdx].bullets = (list[projIdx].bullets || []).filter((_, bI) => bI !== bulletIdx);
            return { ...prev, projects: list };
        });
    };

    // Experience handlers
    const addExperience = () => {
        setResumeData(prev => ({
            ...prev,
            experience: [
                ...(prev.experience || []),
                {
                    company: 'Tech Innovators Inc.',
                    role: 'Software Engineering Intern',
                    dates: 'June 2024 - Aug 2024',
                    location: 'Bengaluru, India',
                    bullets: [
                        'Developed distributed caching layer using Redis, reducing redundant database lookups by 65%.',
                        'Authored comprehensive unit & integration tests achieving 90%+ branch test coverage.'
                    ]
                }
            ]
        }));
    };

    const updateExperience = (idx, field, val) => {
        setResumeData(prev => {
            const list = [...(prev.experience || [])];
            list[idx] = { ...list[idx], [field]: val };
            return { ...prev, experience: list };
        });
    };

    const removeExperience = (idx) => {
        setResumeData(prev => ({
            ...prev,
            experience: (prev.experience || []).filter((_, i) => i !== idx)
        }));
    };

    const addExperienceBullet = (expIdx) => {
        setResumeData(prev => {
            const list = [...(prev.experience || [])];
            list[expIdx].bullets = [...(list[expIdx].bullets || []), 'Implemented critical system enhancement increasing overall team delivery velocity.'];
            return { ...prev, experience: list };
        });
    };

    const updateExperienceBullet = (expIdx, bulletIdx, val) => {
        setResumeData(prev => {
            const list = [...(prev.experience || [])];
            const bullets = [...(list[expIdx].bullets || [])];
            bullets[bulletIdx] = val;
            list[expIdx].bullets = bullets;
            return { ...prev, experience: list };
        });
    };

    const removeExperienceBullet = (expIdx, bulletIdx) => {
        setResumeData(prev => {
            const list = [...(prev.experience || [])];
            list[expIdx].bullets = (list[expIdx].bullets || []).filter((_, bI) => bI !== bulletIdx);
            return { ...prev, experience: list };
        });
    };

    // Certifications handlers
    const addCertification = () => {
        setResumeData(prev => ({
            ...prev,
            certifications: [
                ...(prev.certifications || []),
                { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2024', link: '' }
            ]
        }));
    };

    const updateCertification = (idx, field, val) => {
        setResumeData(prev => {
            const list = [...(prev.certifications || [])];
            list[idx] = { ...list[idx], [field]: val };
            return { ...prev, certifications: list };
        });
    };

    const removeCertification = (idx) => {
        setResumeData(prev => ({
            ...prev,
            certifications: (prev.certifications || []).filter((_, i) => i !== idx)
        }));
    };

    // Achievements handlers
    const addAchievement = () => {
        setResumeData(prev => ({
            ...prev,
            achievements: [
                ...(prev.achievements || []),
                'Finalist in Smart India Hackathon among 1,200+ competing engineering teams nationwide.'
            ]
        }));
    };

    const updateAchievement = (idx, val) => {
        setResumeData(prev => {
            const list = [...(prev.achievements || [])];
            list[idx] = val;
            return { ...prev, achievements: list };
        });
    };

    const removeAchievement = (idx) => {
        setResumeData(prev => ({
            ...prev,
            achievements: (prev.achievements || []).filter((_, i) => i !== idx)
        }));
    };

    // AI Bullet Enhancer trigger
    const triggerAiPolish = async (type, itemIdx, bulletIdx, currentText) => {
        if (!currentText || !currentText.trim()) return;
        setActiveAiTarget({ type, itemIdx, bulletIdx, text: currentText });
        setAiPolishLoading(true);
        setAiSuggestions(null);

        try {
            const res = await aiFastApiService.enhanceResumeBullet({
                raw_bullet: currentText,
                target_role: resumeData.personal?.targetRole || 'Software Engineer',
                technologies: ['Full Stack', 'Cloud', 'SQL'],
                focus_area: 'Impact & Metrics'
            });
            setAiSuggestions(res);
            if (showToast) showToast('Generated STAR-polished bullet options!', 'success');
        } catch {
            if (showToast) showToast('AI polishing is unavailable right now, continuing manually.', 'warning');
            setActiveAiTarget(null);
        } finally {
            setAiPolishLoading(false);
        }
    };

    const applyAiPolish = (newBullet) => {
        if (!activeAiTarget) return;
        const { type, itemIdx, bulletIdx } = activeAiTarget;
        if (type === 'project') {
            updateProjectBullet(itemIdx, bulletIdx, newBullet);
        } else if (type === 'experience') {
            updateExperienceBullet(itemIdx, bulletIdx, newBullet);
        }
        setActiveAiTarget(null);
        setAiSuggestions(null);
        if (showToast) showToast('Bullet successfully upgraded!', 'success');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top Toolbar / Spacing & Controls bar */}
            <Card style={{ padding: '0.875rem 1.25rem', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <Sliders size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                            Layout Tuning:
                        </span>

                        {/* Template selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Style:</span>
                            <select
                                className="form-input"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', height: '30px', width: 'auto' }}
                                value={settings.template}
                                onChange={e => setSettings(s => ({ ...s, template: e.target.value }))}
                            >
                                <option value="classic">Overleaf Classic LaTeX (Serif)</option>
                                <option value="modern">Modern Tech Sans (Executive)</option>
                                <option value="minimal">Minimal ATS-Clean</option>
                            </select>
                        </div>

                        {/* Font Size slider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Font Size:</span>
                            <input
                                type="range"
                                min="8.5"
                                max="11.5"
                                step="0.25"
                                value={settings.fontSize}
                                onChange={e => setSettings(s => ({ ...s, fontSize: parseFloat(e.target.value) }))}
                                style={{ width: '80px', accentColor: 'var(--primary)' }}
                                title={`${settings.fontSize}pt`}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{settings.fontSize}pt</span>
                        </div>

                        {/* Vertical Spacing slider */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vertical Gap:</span>
                            <input
                                type="range"
                                min="8"
                                max="24"
                                step="1"
                                value={settings.sectionSpacing}
                                onChange={e => setSettings(s => ({ ...s, sectionSpacing: parseInt(e.target.value) }))}
                                style={{ width: '80px', accentColor: 'var(--primary)' }}
                                title={`${settings.sectionSpacing}px`}
                            />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{settings.sectionSpacing}px</span>
                        </div>
                    </div>

                    {/* Action buttons: Sync from Profile & Direct PDF Download */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {onImportFromProfile && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onImportFromProfile}
                                disabled={isImportingProfile}
                                leftIcon={isImportingProfile ? <LoadingSpinner size="xs" /> : <RefreshCw size={14} />}
                                title="Import and populate resume with your latest Career Profile, Skills, and Projects"
                            >
                                {isImportingProfile ? 'Importing Profile...' : 'Sync from Career Profile'}
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={onDownloadPdf}
                            disabled={isDownloadingPdf}
                            leftIcon={isDownloadingPdf ? <LoadingSpinner size="xs" /> : <Download size={14} />}
                        >
                            {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
                        </Button>
                    </div>
                </div>

                {/* Add Section Quick-Bar */}
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Manage Sections:
                    </span>
                    {!visibleSections.personal && (
                        <button type="button" onClick={() => addSection('personal')} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none' }}>
                            + Personal Info
                        </button>
                    )}
                    {!visibleSections.education && (
                        <button type="button" onClick={() => addSection('education')} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none' }}>
                            + Education
                        </button>
                    )}
                    {!visibleSections.skills && (
                        <button type="button" onClick={() => addSection('skills')} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none' }}>
                            + Skills
                        </button>
                    )}
                    {!visibleSections.projects && (
                        <button type="button" onClick={() => addSection('projects')} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none' }}>
                            + Projects
                        </button>
                    )}
                    {!visibleSections.experience && (
                        <button type="button" onClick={() => addSection('experience')} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none' }}>
                            + Experience
                        </button>
                    )}
                    {!visibleSections.certifications && (
                        <button type="button" onClick={() => addSection('certifications')} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none' }}>
                            + Certifications
                        </button>
                    )}
                    {!visibleSections.achievements && (
                        <button type="button" onClick={() => addSection('achievements')} className="badge badge-purple" style={{ cursor: 'pointer', border: 'none' }}>
                            + Achievements
                        </button>
                    )}
                </div>
            </Card>

            {/* AI Bullet Polish Modal Dialog if active */}
            {activeAiTarget && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div style={{
                        maxWidth: '560px',
                        width: '100%',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-color)',
                        padding: '1.5rem',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Wand2 size={18} style={{ color: 'var(--primary)' }} />
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>STAR AI Bullet Polisher</h3>
                            </div>
                            <button
                                onClick={() => setActiveAiTarget(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Current Draft:</span>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>{activeAiTarget.text}</p>
                        </div>

                        {aiPolishLoading ? (
                            <LoadingSpinner message="Generating quantified STAR achievements via AI..." />
                        ) : aiSuggestions ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Choose an enhanced variation:</span>
                                {aiSuggestions.variations?.map((v, vIdx) => (
                                    <div
                                        key={vIdx}
                                        style={{
                                            padding: '0.85rem',
                                            backgroundColor: 'var(--bg-card)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            transition: 'border-color 0.15s ease'
                                        }}
                                        onClick={() => applyAiPolish(v.enhanced_bullet)}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                            <Badge variant={vIdx === 0 ? 'success' : 'purple'}>{v.version_title}</Badge>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Click to Apply →</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                                            • {v.enhanced_bullet}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <Button variant="secondary" size="sm" onClick={() => setActiveAiTarget(null)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 1: PERSONAL INFO */}
            {/* ============================================================== */}
            {visibleSections.personal && (
                <Card style={{ padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                            onClick={() => toggleSection('personal')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}
                        >
                            <User size={16} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Candidate Profile & Contact Details</h3>
                            {openSections.personal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <button
                            type="button"
                            title="Remove section from resume"
                            onClick={() => removeSection('personal')}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>

                    {openSections.personal && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={resumeData.personal?.fullName || ''}
                                    onChange={e => updatePersonal('fullName', e.target.value)}
                                    placeholder="e.g. Aarav Sharma"
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Target Role / Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={resumeData.personal?.targetRole || ''}
                                    onChange={e => updatePersonal('targetRole', e.target.value)}
                                    placeholder="e.g. Backend Software Engineer"
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={resumeData.personal?.email || ''}
                                    onChange={e => updatePersonal('email', e.target.value)}
                                    placeholder="e.g. aarav@example.com"
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Phone Number</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={resumeData.personal?.phone || ''}
                                    onChange={e => updatePersonal('phone', e.target.value)}
                                    placeholder="e.g. +91 98765 43210"
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Location</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={resumeData.personal?.location || ''}
                                    onChange={e => updatePersonal('location', e.target.value)}
                                    placeholder="e.g. Bengaluru, India"
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>LinkedIn Profile URL / Handle</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={resumeData.personal?.linkedin || ''}
                                    onChange={e => updatePersonal('linkedin', e.target.value)}
                                    placeholder="e.g. linkedin.com/in/aarav-sharma"
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>GitHub Profile</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={resumeData.personal?.github || ''}
                                    onChange={e => updatePersonal('github', e.target.value)}
                                    placeholder="e.g. github.com/aaravsharma"
                                />
                            </div>
                            <div>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Portfolio / Website</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={resumeData.personal?.portfolio || ''}
                                    onChange={e => updatePersonal('portfolio', e.target.value)}
                                    placeholder="e.g. https://aarav.dev"
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Executive Bio / Summary (Optional)</label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={resumeData.personal?.summary || ''}
                                    onChange={e => updatePersonal('summary', e.target.value)}
                                    placeholder="Brief 2-line summary highlighting your engineering focus and major achievements..."
                                />
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* ============================================================== */}
            {/* SECTION 2: EDUCATION */}
            {/* ============================================================== */}
            {visibleSections.education && (
                <Card style={{ padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                            onClick={() => toggleSection('education')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}
                        >
                            <GraduationCap size={16} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Education ({resumeData.education?.length || 0})</h3>
                            {openSections.education ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Button variant="secondary" size="sm" onClick={addEducation} leftIcon={<Plus size={13} />}>
                                Add College
                            </Button>
                            <button
                                type="button"
                                title="Remove section from resume"
                                onClick={() => removeSection('education')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {openSections.education && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                            {resumeData.education?.map((edu, idx) => (
                                <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => removeEducation(idx)}
                                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                        title="Delete entry"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem', paddingRight: '1.5rem' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>College / University</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={edu.institution || ''}
                                                onChange={e => updateEducation(idx, 'institution', e.target.value)}
                                                placeholder="e.g. National Institute of Technology"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Degree & Major</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={edu.degree || ''}
                                                onChange={e => updateEducation(idx, 'degree', e.target.value)}
                                                placeholder="e.g. B.Tech Computer Science"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Graduation Years</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={edu.dates || ''}
                                                onChange={e => updateEducation(idx, 'dates', e.target.value)}
                                                placeholder="e.g. 2021 - 2025"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>CGPA / Percentage</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={edu.gpa || ''}
                                                onChange={e => updateEducation(idx, 'gpa', e.target.value)}
                                                placeholder="e.g. 8.9 / 10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ============================================================== */}
            {/* SECTION 3: TECHNICAL SKILLS */}
            {/* ============================================================== */}
            {visibleSections.skills && (
                <Card style={{ padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                            onClick={() => toggleSection('skills')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}
                        >
                            <Code size={16} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Technical Skills</h3>
                            {openSections.skills ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Button variant="secondary" size="sm" onClick={addSkillCategory} leftIcon={<Plus size={13} />}>
                                Add Category
                            </Button>
                            <button
                                type="button"
                                title="Remove section from resume"
                                onClick={() => removeSection('skills')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {openSections.skills && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                            {resumeData.skills?.categories?.map((cat, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 32px', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cat.name || ''}
                                        onChange={e => updateSkillCategory(idx, 'name', e.target.value)}
                                        placeholder="Category name"
                                    />
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={Array.isArray(cat.items) ? cat.items.join(', ') : cat.items || ''}
                                        onChange={e => updateSkillCategory(idx, 'items', e.target.value)}
                                        placeholder="Comma-separated technologies..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSkillCategory(idx)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        title="Remove category"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ============================================================== */}
            {/* SECTION 4: KEY PROJECTS */}
            {/* ============================================================== */}
            {visibleSections.projects && (
                <Card style={{ padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                            onClick={() => toggleSection('projects')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}
                        >
                            <FolderGit2 size={16} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Key Projects ({resumeData.projects?.length || 0})</h3>
                            {openSections.projects ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Button variant="secondary" size="sm" onClick={addProject} leftIcon={<Plus size={13} />}>
                                Add Project
                            </Button>
                            <button
                                type="button"
                                title="Remove section from resume"
                                onClick={() => removeSection('projects')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {openSections.projects && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                            {resumeData.projects?.map((proj, pIdx) => (
                                <div key={pIdx} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => removeProject(pIdx)}
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                        title="Delete project"
                                    >
                                        <Trash2 size={15} />
                                    </button>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', paddingRight: '2rem', marginBottom: '0.75rem' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Project Title</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={proj.title || ''}
                                                onChange={e => updateProject(pIdx, 'title', e.target.value)}
                                                placeholder="e.g. Distributed Payment Gateway"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Tech Stack</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={proj.techStack || ''}
                                                onChange={e => updateProject(pIdx, 'techStack', e.target.value)}
                                                placeholder="e.g. Java, Spring Boot, Kafka, Docker"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Repository Link (GitHub)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={proj.link || ''}
                                                onChange={e => updateProject(pIdx, 'link', e.target.value)}
                                                placeholder="e.g. https://github.com/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Live Link (Deployment)</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={proj.liveLink || ''}
                                                onChange={e => updateProject(pIdx, 'liveLink', e.target.value)}
                                                placeholder="e.g. https://my-app.vercel.app"
                                            />
                                        </div>
                                    </div>

                                    {/* Project Bullet Points */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Impact Bullets:
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => addProjectBullet(pIdx)}
                                                style={{ fontSize: '0.72rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                + Add Bullet
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {proj.bullets?.map((bullet, bIdx) => (
                                                <div key={bIdx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                                                    <span style={{ color: 'var(--text-muted)', marginTop: '6px' }}>•</span>
                                                    <textarea
                                                        className="form-input"
                                                        rows={2}
                                                        style={{ flex: 1, fontSize: '0.8rem', lineHeight: 1.4 }}
                                                        value={bullet}
                                                        onChange={e => updateProjectBullet(pIdx, bIdx, e.target.value)}
                                                        placeholder="Describe quantified impact (XYZ: Accomplished [X] by doing [Y], resulting in [Z])..."
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => triggerAiPolish('project', pIdx, bIdx, bullet)}
                                                            className="badge badge-purple"
                                                            style={{ cursor: 'pointer', border: 'none', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                                            title="Polish with AI"
                                                        >
                                                            <Wand2 size={12} /> AI
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeProjectBullet(pIdx, bIdx)}
                                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                                            title="Delete bullet"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ============================================================== */}
            {/* SECTION 5: WORK EXPERIENCE */}
            {/* ============================================================== */}
            {visibleSections.experience && (
                <Card style={{ padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                            onClick={() => toggleSection('experience')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}
                        >
                            <Briefcase size={16} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Work Experience ({resumeData.experience?.length || 0})</h3>
                            {openSections.experience ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Button variant="secondary" size="sm" onClick={addExperience} leftIcon={<Plus size={13} />}>
                                Add Experience
                            </Button>
                            <button
                                type="button"
                                title="Remove section from resume"
                                onClick={() => removeSection('experience')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {openSections.experience && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                            {resumeData.experience?.map((exp, eIdx) => (
                                <div key={eIdx} style={{ padding: '0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => removeExperience(eIdx)}
                                        style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                        title="Delete experience"
                                    >
                                        <Trash2 size={15} />
                                    </button>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', paddingRight: '2rem', marginBottom: '0.75rem' }}>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Role / Job Title</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={exp.role || ''}
                                                onChange={e => updateExperience(eIdx, 'role', e.target.value)}
                                                placeholder="e.g. Software Engineer Intern"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Company Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={exp.company || ''}
                                                onChange={e => updateExperience(eIdx, 'company', e.target.value)}
                                                placeholder="e.g. Razorpay"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Dates</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={exp.dates || ''}
                                                onChange={e => updateExperience(eIdx, 'dates', e.target.value)}
                                                placeholder="e.g. May 2024 - July 2024"
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label" style={{ fontSize: '0.72rem' }}>Location</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={exp.location || ''}
                                                onChange={e => updateExperience(eIdx, 'location', e.target.value)}
                                                placeholder="e.g. Bengaluru, India (Remote)"
                                            />
                                        </div>
                                    </div>

                                    {/* Experience Bullet Points */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                                                Experience Bullets:
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => addExperienceBullet(eIdx)}
                                                style={{ fontSize: '0.72rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                                            >
                                                + Add Bullet
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {exp.bullets?.map((bullet, bIdx) => (
                                                <div key={bIdx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                                                    <span style={{ color: 'var(--text-muted)', marginTop: '6px' }}>•</span>
                                                    <textarea
                                                        className="form-input"
                                                        rows={2}
                                                        style={{ flex: 1, fontSize: '0.8rem', lineHeight: 1.4 }}
                                                        value={bullet}
                                                        onChange={e => updateExperienceBullet(eIdx, bIdx, e.target.value)}
                                                        placeholder="Describe technical contribution and business impact..."
                                                    />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => triggerAiPolish('experience', eIdx, bIdx, bullet)}
                                                            className="badge badge-purple"
                                                            style={{ cursor: 'pointer', border: 'none', padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                                            title="Polish with AI"
                                                        >
                                                            <Wand2 size={12} /> AI
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExperienceBullet(eIdx, bIdx)}
                                                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                                            title="Delete bullet"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ============================================================== */}
            {/* SECTION 6: CERTIFICATIONS */}
            {/* ============================================================== */}
            {visibleSections.certifications && (
                <Card style={{ padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                            onClick={() => toggleSection('certifications')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}
                        >
                            <Award size={16} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Certifications ({resumeData.certifications?.length || 0})</h3>
                            {openSections.certifications ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Button variant="secondary" size="sm" onClick={addCertification} leftIcon={<Plus size={13} />}>
                                Add Certification
                            </Button>
                            <button
                                type="button"
                                title="Remove section from resume"
                                onClick={() => removeSection('certifications')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {openSections.certifications && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                            {resumeData.certifications?.map((cert, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 32px', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cert.name || ''}
                                        onChange={e => updateCertification(idx, 'name', e.target.value)}
                                        placeholder="Certificate title"
                                    />
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cert.issuer || ''}
                                        onChange={e => updateCertification(idx, 'issuer', e.target.value)}
                                        placeholder="Issuing Org (AWS, Google)"
                                    />
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={cert.date || ''}
                                        onChange={e => updateCertification(idx, 'date', e.target.value)}
                                        placeholder="Year / Date"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeCertification(idx)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        title="Remove certificate"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}

            {/* ============================================================== */}
            {/* SECTION 7: HONORS & ACHIEVEMENTS */}
            {/* ============================================================== */}
            {visibleSections.achievements && (
                <Card style={{ padding: '0.75rem 1.25rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div
                            onClick={() => toggleSection('achievements')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', flex: 1 }}
                        >
                            <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Honors & Achievements ({resumeData.achievements?.length || 0})</h3>
                            {openSections.achievements ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Button variant="secondary" size="sm" onClick={addAchievement} leftIcon={<Plus size={13} />}>
                                Add Honor
                            </Button>
                            <button
                                type="button"
                                title="Remove section from resume"
                                onClick={() => removeSection('achievements')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {openSections.achievements && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                            {resumeData.achievements?.map((ach, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ flex: 1 }}
                                        value={ach}
                                        onChange={e => updateAchievement(idx, e.target.value)}
                                        placeholder="e.g. Secured Global Rank 450 in LeetCode Weekly Contest..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeAchievement(idx)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                        title="Remove item"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};
