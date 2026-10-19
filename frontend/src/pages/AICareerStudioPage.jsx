import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { aiFastApiService } from '../services/aiFastApiService';
import { downloadCoverLetterPdf } from '../utils/pdfGenerator';
import { downloadResumePdf } from '../utils/pdfExport';
import { runLiveAtsCheck } from '../utils/atsResumeChecker';
import {
    Sparkles, Wand2, Copy, Check, Download,
    AlertCircle, Activity, Database, Zap, BookmarkCheck,
    MessageSquare, FileText, Target
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { profileService } from '../services/profileService';
import { projectService } from '../services/projectService';
import { ResumeBuilder } from '../components/resume/ResumeBuilder';
import { ResumePreview } from '../components/resume/ResumePreview';
import { LiveAtsChecker } from '../components/resume/LiveAtsChecker';

const POPULAR_COMPANIES = [
    'Razorpay', 'Swiggy', 'Postman', 'CRED', 'Zomato',
    'PhonePe', 'Groww', 'Zepto', 'Stripe', 'Google', 'Amazon'
];

export const categorizeSkillsList = (skillNames = []) => {
    const cats = {
        'Languages': [],
        'Frameworks & Libs': [],
        'Databases & Cache': [],
        'DevOps & Tools': []
    };

    const langSet = new Set(['java', 'python', 'c', 'c++', 'cpp', 'javascript', 'typescript', 'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'c#', 'csharp', 'sql', 'html', 'css', 'bash', 'shell']);
    const dbSet = new Set(['postgresql', 'postgres', 'mysql', 'mongodb', 'mongo', 'redis', 'cassandra', 'sqlite', 'dynamodb', 'oracle', 'firebase', 'supabase', 'elasticsearch', 'prisma', 'hibernate']);
    const devopsSet = new Set(['docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure', 'git', 'github', 'gitlab', 'linux', 'ci/cd', 'kafka', 'rabbitmq', 'jenkins', 'nginx', 'terraform', 'postman', 'vite']);

    for (const raw of skillNames) {
        const s = String(raw).trim();
        if (!s) continue;
        const low = s.toLowerCase();
        if (langSet.has(low)) {
            cats['Languages'].push(s);
        } else if (dbSet.has(low)) {
            cats['Databases & Cache'].push(s);
        } else if (devopsSet.has(low)) {
            cats['DevOps & Tools'].push(s);
        } else {
            cats['Frameworks & Libs'].push(s);
        }
    }

    const categories = [];
    if (cats['Languages'].length) categories.push({ name: 'Languages', items: cats['Languages'].join(', ') });
    if (cats['Frameworks & Libs'].length) categories.push({ name: 'Frameworks & Libs', items: cats['Frameworks & Libs'].join(', ') });
    if (cats['Databases & Cache'].length) categories.push({ name: 'Databases & Cache', items: cats['Databases & Cache'].join(', ') });
    if (cats['DevOps & Tools'].length) categories.push({ name: 'DevOps & Tools', items: cats['DevOps & Tools'].join(', ') });

    if (categories.length === 0) {
        categories.push({ name: 'Technical Skills', items: skillNames.join(', ') || 'Java, Spring Boot, PostgreSQL, Docker' });
    }
    return categories;
};

const getInitialResumeData = (profile) => {
    const candidateName = profile?.full_name?.trim() || 'Nikhil Ingale';
    const slug = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'nikhilingale';
    const defaultEmail = profile?.email || `${slug}.dev@gmail.com`;
    const defaultLinkedin = profile?.linkedin_url || `linkedin.com/in/${slug}`;
    const defaultGithub = profile?.github_url || `github.com/${slug}`;
    const defaultPortfolio = profile?.portfolio_url || `https://${slug}.dev`;

    try {
        const saved = localStorage.getItem('careeros_resume_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.personal && parsed.education) {
                // If profile has real name and links contain legacy placeholder 'aarav', modernize them
                if (profile?.full_name && parsed.personal.fullName !== profile.full_name) {
                    parsed.personal.fullName = profile.full_name;
                }
                const name = parsed.personal?.fullName || candidateName;
                const activeSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'nikhilingale';
                if (!parsed.personal.linkedin || parsed.personal.linkedin.includes('aarav')) {
                    parsed.personal.linkedin = profile?.linkedin_url || `linkedin.com/in/${activeSlug}`;
                }
                if (!parsed.personal.github || parsed.personal.github.includes('aarav')) {
                    parsed.personal.github = profile?.github_url || `github.com/${activeSlug}`;
                }
                if (!parsed.personal.portfolio || parsed.personal.portfolio.includes('aarav')) {
                    parsed.personal.portfolio = profile?.portfolio_url || `https://${activeSlug}.dev`;
                }
                return parsed;
            }
        }
    } catch (e) {
        console.error('Failed to parse saved resume from localStorage', e);
    }

    return {
        personal: {
            fullName: candidateName,
            targetRole: profile?.target_role || 'Backend Software Engineer',
            email: defaultEmail,
            phone: profile?.phone || '+91 98765 43210',
            location: profile?.location || 'Bengaluru, India',
            linkedin: defaultLinkedin,
            github: defaultGithub,
            portfolio: defaultPortfolio,
            summary: profile?.bio || 'Results-driven Backend Engineer specializing in high-throughput distributed systems, microservice architectures, and relational database tuning.'
        },
        education: [
            {
                institution: profile?.college || 'Indian Institute of Technology / NIT',
                degree: profile?.degree || 'B.Tech in Computer Science & Engineering',
                field: 'Computer Science',
                dates: profile?.graduation_year ? `${Number(profile.graduation_year) - 4} - ${profile.graduation_year}` : '2021 - 2025',
                gpa: '8.9 / 10',
                details: 'Coursework: Data Structures & Algorithms, Distributed Systems, Database Management, Computer Networks'
            }
        ],
        skills: {
            categories: [
                { name: 'Languages', items: 'Java 17, Go, Python, TypeScript, SQL' },
                { name: 'Frameworks & Libs', items: 'Spring Boot, Node.js, Express, React, JUnit' },
                { name: 'Databases & Cache', items: 'PostgreSQL, Redis, MySQL, MongoDB' },
                { name: 'DevOps & Cloud', items: 'Docker, AWS (EC2, S3), Git, CI/CD pipelines, Kafka' }
            ]
        },
        projects: [
            {
                title: 'High-Throughput Distributed Payment Gateway',
                techStack: 'Java 17, Spring Boot, Redis, Kafka, PostgreSQL',
                link: 'https://github.com/aaravsharma/payment-gateway',
                liveLink: 'https://payment-gateway-live.vercel.app',
                dates: '2024',
                bullets: [
                    'Engineered an idempotent transaction processing pipeline handling 4,500+ TPS with sub-80ms p99 response times.',
                    'Implemented distributed locking and deduplication using Redis cache, eliminating duplicate debit charges during network retries.',
                    'Achieved 92% unit and integration test coverage using Testcontainers and Mockito in automated GitHub Actions CI.'
                ]
            },
            {
                title: 'Real-Time Collaborative Code Review Workspace',
                techStack: 'React, Node.js, WebSockets, PostgreSQL, Docker',
                link: 'https://github.com/aaravsharma/collab-review',
                liveLink: 'https://collab-review-live.vercel.app',
                dates: '2023 - 2024',
                bullets: [
                    'Built bi-directional operational transformation sync supporting 50+ concurrent developers with sub-30ms socket latency.',
                    'Designed multi-tenant RBAC permissions schema reducing query latency by 35% through composite B-Tree indexes.'
                ]
            }
        ],
        experience: [
            {
                company: 'Razorpay',
                role: 'Software Engineer Intern - Core Banking',
                dates: 'May 2024 - July 2024',
                location: 'Bengaluru, India',
                bullets: [
                    'Developed reconciliation microservice processing over 250,000 daily settlement transactions with zero record drift.',
                    'Optimized slow queries on high-volume PostgreSQL tables, reducing reporting batch job runtime from 45 mins to 11 mins.'
                ]
            }
        ],
        certifications: [
            { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2024', link: '' },
            { name: 'Oracle Certified Professional: Java SE 17 Developer', issuer: 'Oracle', date: '2023', link: '' }
        ],
        achievements: [
            'Global Rank 420 out of 24,000+ competitors in LeetCode Weekly Contest.',
            'Winner, Smart India Hackathon among 1,500+ engineering teams nationwide.'
        ]
    };
};

export const AICareerStudioPage = () => {
    const { profile, user } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('resume_builder'); // 'resume_builder' | 'cover_letter' | 'bullet_enhancer'
    const [backendOnline, setBackendOnline] = useState(null);
    const [knownCompanies, setKnownCompanies] = useState([]);

    // Unified Cover Letter & Outreach Form State
    const [clFullName, setClFullName] = useState(profile?.full_name || 'Aarav Sharma');
    const [clTargetRole, setClTargetRole] = useState(profile?.target_role || 'Java Backend Developer');
    const [clCompany, setClCompany] = useState('Razorpay');
    const [clPurpose, setClPurpose] = useState('Job Application'); // 'Job Application' | 'Referral Request' | 'Job Application Follow-up' | 'Coffee Chat / Career Advice'
    const [clRecipientRole, setClRecipientRole] = useState('Engineering Manager');
    const [clRecipientName, setClRecipientName] = useState('');
    const [clTone, setClTone] = useState('Confident & Technically Grounded');
    const [clSkills, setClSkills] = useState('Java 17, Spring Boot, PostgreSQL, Redis, Kafka, Docker, REST APIs');
    const [clProjects, setClProjects] = useState('Distributed Payment Microservice with Spring Boot and Redis caching, 85% unit test coverage');
    const [clLoading, setClLoading] = useState(false);
    const [clResult, setClResult] = useState(null);
    const [outputFormat, setOutputFormat] = useState('cover_letter'); // 'cover_letter' | 'inmail' | 'connection_note' | 'talking_points'
    const [copiedCl, setCopiedCl] = useState(false);

    // Overleaf-Style LaTeX Resume Builder State
    const [resumeData, setResumeData] = useState(() => getInitialResumeData(profile));
    const [isImportingProfile, setIsImportingProfile] = useState(false);
    const [mobileResumeView, setMobileResumeView] = useState('both'); // 'editor' | 'preview' | 'both'

    // Auto-persist resume modifications to localStorage
    useEffect(() => {
        if (resumeData) {
            try {
                localStorage.setItem('careeros_resume_data', JSON.stringify(resumeData));
            } catch (e) {
                // Ignore storage errors
            }
        }
    }, [resumeData]);

    // One-Click Sync from Career Profile into Resume
    const handleImportFromCareerProfile = async () => {
        setIsImportingProfile(true);
        try {
            const userId = user?.id || profile?.user_id;
            let currentProf = profile;
            let userSkills = [];
            let userProjects = [];

            if (userId) {
                const [freshProf, skills, projs] = await Promise.all([
                    profileService.getProfile(userId),
                    profileService.getUserSkills(userId),
                    projectService.getProjects(userId)
                ]);
                if (freshProf) currentProf = freshProf;
                if (skills) userSkills = skills;
                if (projs) userProjects = projs;
            }

            const skillNames = (userSkills || []).map(us => us.skill?.name || us.name || '').filter(Boolean);
            const formattedCategories = skillNames.length > 0
                ? categorizeSkillsList(skillNames)
                : (resumeData.skills?.categories || [
                    { name: 'Technical Skills', items: 'Python, JavaScript, React, Node.js' }
                ]);

            const formattedProjects = (userProjects && userProjects.length > 0)
                ? userProjects.map(p => {
                    const techStr = Array.isArray(p.technologies)
                        ? p.technologies.join(', ')
                        : (p.technologies || p.tech_stack || '');
                    const bullets = p.description
                        ? p.description.split('\n').map(b => b.trim()).filter(Boolean).map(b => b.replace(/^[•\-\*]\s*/, ''))
                        : ['Designed, engineered, and deployed scalable end-to-end features.'];
                    return {
                        title: p.name || p.title || 'Engineering Project',
                        techStack: techStr,
                        link: p.github_url || '',
                        liveLink: p.live_url || '',
                        dates: '2024',
                        bullets: bullets.length > 0 ? bullets : ['Designed, engineered, and deployed scalable end-to-end features.']
                    };
                })
                : resumeData.projects;

            const updated = {
                ...resumeData,
                personal: {
                    ...resumeData.personal,
                    fullName: currentProf?.full_name || resumeData.personal?.fullName || 'Candidate Name',
                    targetRole: currentProf?.target_role || resumeData.personal?.targetRole || 'Software Engineer',
                    email: currentProf?.email || user?.email || resumeData.personal?.email || '',
                    phone: currentProf?.phone || resumeData.personal?.phone || '+91 98765 43210',
                    location: currentProf?.location || resumeData.personal?.location || 'India',
                    linkedin: currentProf?.linkedin_url || resumeData.personal?.linkedin || '',
                    github: currentProf?.github_url || resumeData.personal?.github || '',
                    portfolio: currentProf?.portfolio_url || resumeData.personal?.portfolio || '',
                    summary: currentProf?.bio || resumeData.personal?.summary || ''
                },
                education: [
                    {
                        institution: currentProf?.college || resumeData.education?.[0]?.institution || 'University / College',
                        degree: currentProf?.degree || resumeData.education?.[0]?.degree || 'B.Tech in Computer Science',
                        field: 'Computer Science',
                        dates: currentProf?.graduation_year
                            ? `${Number(currentProf.graduation_year) - 4} - ${currentProf.graduation_year}`
                            : (resumeData.education?.[0]?.dates || '2021 - 2025'),
                        gpa: resumeData.education?.[0]?.gpa || '8.8 / 10',
                        details: resumeData.education?.[0]?.details || 'Core Subjects: Data Structures, Algorithms, Distributed Systems, DBMS'
                    }
                ],
                skills: {
                    categories: formattedCategories
                },
                projects: formattedProjects
            };

            setResumeData(updated);
            localStorage.setItem('careeros_resume_data', JSON.stringify(updated));
            if (showToast) showToast('✨ Successfully imported your Career Profile into the resume!', 'success');
        } catch (err) {
            console.error('Failed to sync career profile to resume:', err);
            if (showToast) showToast('Failed to sync details from Career Profile.', 'error');
        } finally {
            setIsImportingProfile(false);
        }
    };

    // Resume Formatting & Spacing tuning parameters
    const [resumeSettings, setResumeSettings] = useState({
        template: 'classic', // 'classic' (LaTeX serif) | 'modern' | 'minimal'
        fontSize: 10,
        lineSpacing: 1.35,
        sectionSpacing: 14,
        margins: 24,
        accentColor: '#1e3a8a'
    });

    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        try {
            const res = await downloadResumePdf(resumeData, 'careeros-resume-preview');
            if (showToast) {
                showToast(`Resume downloaded to Downloads as ${res.filename}!`, 'success');
            }
        } catch (err) {
            console.error('Failed to download resume PDF:', err);
            if (showToast) {
                showToast('Failed to generate PDF download. Please try again.', 'error');
            }
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    // Responsive Live Preview Auto-fit Scaling (WYSIWYG 1:1 with A4 PDF)
    const previewContainerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(600);
    const [previewZoom, setPreviewZoom] = useState('fit'); // 'fit' | 0.8 | 1.0

    useEffect(() => {
        if (!previewContainerRef.current) return;
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.contentRect.width > 0) {
                    setContainerWidth(entry.contentRect.width);
                }
            }
        });
        observer.observe(previewContainerRef.current);
        return () => observer.disconnect();
    }, [activeTab]);

    const currentScale = previewZoom === 'fit'
        ? Math.min(1, Math.max(0.45, (containerWidth - 32) / 794))
        : previewZoom;

    // Real-time live deterministic ATS audit for quick status badges
    const liveAtsAudit = useMemo(() => {
        return runLiveAtsCheck(resumeData, resumeData.personal?.targetRole || profile?.target_role || 'Java Backend Developer');
    }, [resumeData, profile?.target_role]);

    // Persist real-time live ATS score to sync with Dashboard
    useEffect(() => {
        if (typeof liveAtsAudit?.totalScore === 'number') {
            try {
                localStorage.setItem('careeros_live_ats_score', JSON.stringify({
                    score: liveAtsAudit.totalScore,
                    grade: liveAtsAudit.grade,
                    rating: liveAtsAudit.atsRating,
                    role: resumeData.personal?.targetRole || profile?.target_role,
                    updatedAt: new Date().toISOString()
                }));
            } catch (e) {
                // Ignore storage errors
            }
        }
    }, [liveAtsAudit?.totalScore, liveAtsAudit?.grade, liveAtsAudit?.atsRating, resumeData.personal?.targetRole, profile?.target_role]);

    useEffect(() => {
        aiFastApiService.checkHealth().then(res => setBackendOnline(res.isOnline));
        aiFastApiService.getCompaniesKnowledge().then(comps => {
            if (comps && comps.length > 0) {
                setKnownCompanies(comps);
            }
        });
    }, []);

    const handleGenerateCoverLetter = async (e) => {
        e.preventDefault();
        setClLoading(true);
        try {
            const res = await aiFastApiService.generateRagCompanyOutreach({
                full_name: clFullName,
                target_role: clTargetRole,
                company_name: clCompany,
                purpose: clPurpose,
                skills: clSkills.split(',').map(s => s.trim()).filter(Boolean),
                key_projects: clProjects,
                recipient_role: clRecipientRole,
                recipient_name: clRecipientName,
                tone: clTone
            });
            setClResult(res);
            showToast(`Generated application package for ${clCompany}!`, 'success');
        } catch {
            showToast('Failed to generate cover letter & outreach', 'error');
        } finally {
            setClLoading(false);
        }
    };

    const copyToClipboard = (text, onSuccess) => {
        navigator.clipboard.writeText(text);
        if (onSuccess) onSuccess();
        showToast('Copied to clipboard!', 'success');
    };

    return (
        <div className="page-container">
            {/* Page Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        AI Career Studio
                        {backendOnline && (
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    color: 'var(--text-muted)',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid var(--border-subtle)'
                                }}
                                title="FastAPI LLM Engine Connected"
                            >
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                                AI Engine Active
                            </span>
                        )}
                    </h1>
                    <p className="page-subtitle">
                        Build <strong>Overleaf-Grade LaTeX Resumes with Live Preview</strong> and generate <strong>Tailored Outreach</strong>.
                    </p>
                </div>
            </div>

            {/* Main Studio Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('resume_builder')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: 'var(--radius-md)',
                        border: activeTab === 'resume_builder' ? '1px solid var(--primary)' : '1px solid transparent',
                        backgroundColor: activeTab === 'resume_builder' ? 'var(--primary-light)' : 'transparent',
                        color: activeTab === 'resume_builder' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <FileText size={16} /> 📄 LaTeX Resume Studio
                </button>

                <button
                    onClick={() => setActiveTab('cover_letter')}
                    style={{
                        padding: '0.6rem 1.2rem',
                        borderRadius: 'var(--radius-md)',
                        border: activeTab === 'cover_letter' ? '1px solid var(--primary)' : '1px solid transparent',
                        backgroundColor: activeTab === 'cover_letter' ? 'var(--primary-light)' : 'transparent',
                        color: activeTab === 'cover_letter' ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: activeTab === 'cover_letter' ? 700 : 600,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Zap size={16} /> ⚡ Cover Letter & Recruiter Outreach Hub
                </button>
            </div>

            {/* ========================================================================= */}
            {/* TAB 0: OVERLEAF-STYLE LATEX RESUME BUILDER & LIVE PREVIEW */}
            {/* ========================================================================= */}
            {activeTab === 'resume_builder' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Live Real-Time ATS Score Checker & Diagnostic Suite */}
                    <LiveAtsChecker
                        resumeData={resumeData}
                        setResumeData={setResumeData}
                        targetRole={resumeData.personal?.targetRole || profile?.target_role || 'Java Backend Developer'}
                        onTargetRoleChange={(newRole) => {
                            setResumeData(prev => ({
                                ...prev,
                                personal: {
                                    ...prev.personal,
                                    targetRole: newRole
                                }
                            }));
                        }}
                        showToast={showToast}
                    />

                    {/* Mobile Screen View Switcher */}
                    <div className="resume-mobile-toggle">
                        <div style={{
                            display: 'inline-flex',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-full)',
                            padding: '3px',
                            border: '1px solid var(--border-color)',
                            gap: '2px'
                        }}>
                            <button
                                type="button"
                                onClick={() => setMobileResumeView('editor')}
                                style={{
                                    padding: '5px 14px',
                                    borderRadius: 'var(--radius-full)',
                                    border: 'none',
                                    backgroundColor: mobileResumeView === 'editor' ? 'var(--primary)' : 'transparent',
                                    color: mobileResumeView === 'editor' ? '#fff' : 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                Edit Form
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileResumeView('preview')}
                                style={{
                                    padding: '5px 14px',
                                    borderRadius: 'var(--radius-full)',
                                    border: 'none',
                                    backgroundColor: mobileResumeView === 'preview' ? 'var(--primary)' : 'transparent',
                                    color: mobileResumeView === 'preview' ? '#fff' : 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                Preview PDF
                            </button>
                            <button
                                type="button"
                                onClick={() => setMobileResumeView('both')}
                                style={{
                                    padding: '5px 14px',
                                    borderRadius: 'var(--radius-full)',
                                    border: 'none',
                                    backgroundColor: mobileResumeView === 'both' ? 'var(--primary)' : 'transparent',
                                    color: mobileResumeView === 'both' ? '#fff' : 'var(--text-muted)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                Stacked
                            </button>
                        </div>
                    </div>

                    <div className="resume-studio-grid">
                        {/* Left Pane: Interactive Structured Form with Add/Remove & Spacing */}
                        {(mobileResumeView === 'editor' || mobileResumeView === 'both') && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <ResumeBuilder
                                    initialProfile={profile}
                                    resumeData={resumeData}
                                    setResumeData={setResumeData}
                                    settings={resumeSettings}
                                    setSettings={setResumeSettings}
                                    onDownloadPdf={handleDownloadPdf}
                                    isDownloadingPdf={isDownloadingPdf}
                                    onImportFromProfile={handleImportFromCareerProfile}
                                    isImportingProfile={isImportingProfile}
                                    showToast={showToast}
                                />
                            </div>
                        )}

                        {/* Right Pane: Live Overleaf-Style LaTeX / PDF Preview (Sticky Hero Canvas) */}
                        {(mobileResumeView === 'preview' || mobileResumeView === 'both') && (
                            <div className="resume-preview-sticky" style={{
                                position: 'sticky',
                                top: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                            gap: '0.75rem',
                            height: 'calc(100vh - 2rem)',
                            maxHeight: 'calc(100vh - 2rem)',
                            overflowY: 'auto',
                            paddingRight: '4px'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.5rem 0.75rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <Badge variant="success">LIVE PDF PREVIEW</Badge>

                                    {/* Overleaf-style Zoom controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.25rem' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>ZOOM:</span>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewZoom('fit')}
                                            style={{
                                                padding: '2px 8px',
                                                fontSize: '0.72rem',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)',
                                                background: previewZoom === 'fit' ? 'var(--primary)' : 'var(--bg-tertiary)',
                                                color: previewZoom === 'fit' ? '#ffffff' : 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Fit ({Math.round(currentScale * 100)}%)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewZoom(0.8)}
                                            style={{
                                                padding: '2px 8px',
                                                fontSize: '0.72rem',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)',
                                                background: previewZoom === 0.8 ? 'var(--primary)' : 'var(--bg-tertiary)',
                                                color: previewZoom === 0.8 ? '#ffffff' : 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            80%
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewZoom(1.0)}
                                            style={{
                                                padding: '2px 8px',
                                                fontSize: '0.72rem',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)',
                                                background: previewZoom === 1.0 ? 'var(--primary)' : 'var(--bg-tertiary)',
                                                color: previewZoom === 1.0 ? '#ffffff' : 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            100%
                                        </button>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleDownloadPdf}
                                    disabled={isDownloadingPdf}
                                    leftIcon={isDownloadingPdf ? <LoadingSpinner size="xs" /> : <Download size={13} />}
                                >
                                    {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
                                </Button>
                            </div>

                            {/* White paper resume card with exact 1:1 A4 preview scaling */}
                            <div
                                ref={previewContainerRef}
                                style={{
                                    backgroundColor: '#090d16',
                                    padding: '1.25rem 0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)',
                                    overflowX: 'auto',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                            >
                                <div style={{
                                    width: `${794 * currentScale}px`,
                                    height: `${1123 * currentScale}px`,
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        transform: `scale(${currentScale})`,
                                        transformOrigin: 'top left',
                                        width: '794px'
                                    }}>
                                        <ResumePreview
                                            resumeData={resumeData}
                                            settings={resumeSettings}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

            {/* ========================================================================= */}
            {/* TAB 1: UNIFIED COVER LETTER & RECRUITER OUTREACH HUB */}
            {/* ========================================================================= */}
            {activeTab === 'cover_letter' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 440px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* Form Card */}
                    <Card title="Candidate & Outreach Parameters" subtitle="RAG retrieves the target company's real tech stack to ground your pitch.">
                        {/* Company Presets */}
                        <div style={{ marginBottom: '1rem' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                                Popular Tech Companies (Pre-Indexed Knowledge):
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {POPULAR_COMPANIES.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setClCompany(c)}
                                        style={{
                                            fontSize: '0.72rem',
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-full)',
                                            border: clCompany.toLowerCase() === c.toLowerCase() ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                            backgroundColor: clCompany.toLowerCase() === c.toLowerCase() ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                                            color: clCompany.toLowerCase() === c.toLowerCase() ? '#c084fc' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleGenerateCoverLetter} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-input" value={clFullName} onChange={e => setClFullName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="form-label">Target Role</label>
                                    <input type="text" className="form-input" value={clTargetRole} onChange={e => setClTargetRole(e.target.value)} required />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Target Company</label>
                                    <input type="text" className="form-input" value={clCompany} onChange={e => setClCompany(e.target.value)} placeholder="e.g. Razorpay / Swiggy / Google" required />
                                </div>
                                <div>
                                    <label className="form-label">Outreach Goal</label>
                                    <select className="form-input" value={clPurpose} onChange={e => setClPurpose(e.target.value)}>
                                        <option value="Job Application">Formal Job Application</option>
                                        <option value="Referral Request">Referral Request (Alumni/Peer)</option>
                                        <option value="Job Application Follow-up">Job Application Follow-Up</option>
                                        <option value="Coffee Chat / Career Advice">Virtual Coffee Chat / Advice</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label className="form-label">Recipient Role</label>
                                    <select className="form-input" value={clRecipientRole} onChange={e => setClRecipientRole(e.target.value)}>
                                        <option value="Engineering Manager">Engineering Manager / Lead</option>
                                        <option value="Technical Recruiter">Technical Recruiter</option>
                                        <option value="College Alumni / Software Engineer">College Alumni / Peer</option>
                                        <option value="Hiring Lead">Hiring Lead</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Recipient Name (Optional)</label>
                                    <input type="text" className="form-input" value={clRecipientName} onChange={e => setClRecipientName(e.target.value)} placeholder="e.g. Priya Verma" />
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Tone of Pitch</label>
                                <select className="form-input" value={clTone} onChange={e => setClTone(e.target.value)}>
                                    <option value="Confident & Technically Grounded">Confident & Technically Grounded (Recommended)</option>
                                    <option value="Impact-Driven & Metric-Focused">Impact-Driven & Metric-Focused</option>
                                    <option value="Warm & Conversational">Warm & Conversational</option>
                                    <option value="Direct & Minimalist">Direct & Minimalist</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Key Technical Skills (Comma separated)</label>
                                <input type="text" className="form-input" value={clSkills} onChange={e => setClSkills(e.target.value)} />
                            </div>

                            <div>
                                <label className="form-label">Your Experience, Projects & Achievements</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    value={clProjects}
                                    onChange={e => setClProjects(e.target.value)}
                                    placeholder="e.g. 2+ years building distributed payment microservices with Spring Boot, Redis caching, and PostgreSQL; 85% test coverage."
                                />
                            </div>

                            <Button type="submit" variant="primary" isLoading={clLoading} leftIcon={<Sparkles size={16} />} style={{ width: '100%', marginTop: '0.5rem' }}>
                                ⚡ Synthesize Cover Letter & Outreach Pitch
                            </Button>
                        </form>
                    </Card>

                    {/* Results Display */}
                    <div>
                        {clLoading ? (
                            <Card>
                                <LoadingSpinner message={`Retrieving ${clCompany} engineering intelligence & synthesizing outreach package...`} />
                            </Card>
                        ) : clResult ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Format Switcher & Output Card */}
                                <Card>
                                    {/* Subtabs for Outputs */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                onClick={() => setOutputFormat('cover_letter')}
                                                style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    backgroundColor: outputFormat === 'cover_letter' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: outputFormat === 'cover_letter' ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                📄 Full Cover Letter
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOutputFormat('inmail')}
                                                style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    backgroundColor: outputFormat === 'inmail' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: outputFormat === 'inmail' ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                💬 InMail / Cold Pitch
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOutputFormat('connection_note')}
                                                style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    backgroundColor: outputFormat === 'connection_note' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: outputFormat === 'connection_note' ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ⚡ LinkedIn Note (&lt;280 chars)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOutputFormat('talking_points')}
                                                style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none',
                                                    backgroundColor: outputFormat === 'talking_points' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                    color: outputFormat === 'talking_points' ? '#fff' : 'var(--text-secondary)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🎯 Talking Points
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => {
                                                    const textToCopy = outputFormat === 'cover_letter'
                                                        ? clResult.cover_letter
                                                        : outputFormat === 'inmail'
                                                        ? clResult.linkedin_inmail
                                                        : outputFormat === 'connection_note'
                                                        ? clResult.short_connection_note
                                                        : clResult.talking_points?.join('\n• ');
                                                    copyToClipboard(textToCopy, () => {
                                                        setCopiedCl(true);
                                                        setTimeout(() => setCopiedCl(false), 2000);
                                                    });
                                                }}
                                                leftIcon={copiedCl ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                            >
                                                {copiedCl ? 'Copied' : 'Copy'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const contentToExport = outputFormat === 'cover_letter'
                                                        ? clResult.cover_letter
                                                        : outputFormat === 'inmail'
                                                        ? `Subject: ${clResult.subject_line}\n\n${clResult.linkedin_inmail}${clResult.short_connection_note ? `\n\n---\nShort LinkedIn Note (<280 chars):\n${clResult.short_connection_note}` : ''}`
                                                        : outputFormat === 'connection_note'
                                                        ? `LinkedIn Connection Note:\n"${clResult.short_connection_note}"\n\nInMail Pitch:\n${clResult.linkedin_inmail}`
                                                        : `Strategic Interview Talking Points for ${clCompany}:\n\n${clResult.talking_points?.map((tp, idx) => `• ${tp}`).join('\n\n')}`;

                                                    downloadCoverLetterPdf(`Cover_Letter_${clCompany}_${clFullName.replace(/\s+/g, '_')}.pdf`, {
                                                        candidateName: clFullName,
                                                        targetRole: clTargetRole,
                                                        targetCompany: clCompany,
                                                        recipient: `${clRecipientRole}${clRecipientName ? ' (' + clRecipientName + ')' : ''}`,
                                                        subject: clResult.subject_line || `${clTargetRole} Application`,
                                                        content: contentToExport,
                                                        type: outputFormat === 'cover_letter' ? 'Cover Letter' : outputFormat === 'inmail' ? 'LinkedIn InMail Pitch' : outputFormat === 'connection_note' ? 'LinkedIn Connection Note' : 'Interview Talking Points'
                                                    });
                                                    showToast(`Downloaded Cover_Letter_${clCompany}.pdf`, 'success');
                                                }}
                                                leftIcon={<Download size={14} />}
                                            >
                                                PDF
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Subtab 1: Full Cover Letter */}
                                    {outputFormat === 'cover_letter' && (
                                        <div style={{
                                            padding: '1.25rem',
                                            backgroundColor: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)',
                                            whiteSpace: 'pre-line',
                                            lineHeight: 1.7,
                                            fontSize: '0.875rem',
                                            color: 'var(--text-primary)'
                                        }}>
                                            {clResult.cover_letter}
                                        </div>
                                    )}

                                    {/* Subtab 2: LinkedIn InMail / Pitch */}
                                    {outputFormat === 'inmail' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Subject Line: <strong style={{ color: 'var(--text-primary)' }}>{clResult.subject_line}</strong>
                                            </div>

                                            <div style={{
                                                padding: '1.25rem',
                                                backgroundColor: 'var(--bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                                whiteSpace: 'pre-line',
                                                lineHeight: 1.6,
                                                fontSize: '0.875rem',
                                                color: 'var(--text-primary)'
                                            }}>
                                                {clResult.linkedin_inmail}
                                            </div>
                                        </div>
                                    )}

                                    {/* Subtab 3: LinkedIn Connection Note (<280 chars) */}
                                    {outputFormat === 'connection_note' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    Quick LinkedIn DM / Connection Request Note:
                                                </span>
                                                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                                    {clResult.short_connection_note?.length || 0} / 280 chars
                                                </span>
                                            </div>

                                            <div style={{
                                                padding: '1.25rem',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                                fontSize: '0.9rem',
                                                lineHeight: 1.5,
                                                color: 'var(--text-primary)',
                                                fontStyle: 'italic'
                                            }}>
                                                "{clResult.short_connection_note}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Subtab 4: Talking Points */}
                                    {outputFormat === 'talking_points' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                Use these 3 talking points during introductory calls with {clCompany}'s team:
                                            </div>
                                            {clResult.talking_points?.map((tp, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                                    <BookmarkCheck size={16} style={{ color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                                        {tp}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </div>
                        ) : (
                            <Card style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                    <Database size={28} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    Ready for Company-Grounded Applications & Outreach
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 1.5rem', fontSize: '0.875rem' }}>
                                    Select your target company and outreach goal on the left. Our <strong>RAG Vector Pipeline</strong> retrieves actual engineering architecture and synthesizes a full Cover Letter, InMail pitch, Connection Note, and Talking Points in 1 click.
                                </p>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
