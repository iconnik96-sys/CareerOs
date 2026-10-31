import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { applicationService } from '../services/applicationService';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { projectService } from '../services/projectService';
import { habitTrackerService } from '../services/habitTrackerService';
import { calculateCareerReadiness, calculateCareerReadinessBreakdown, getSkillGapsForRole, getRecommendedActionsForRole, getRoleDisplayName } from '../utils/careerRoles';
import { getActiveAtsScore } from '../utils/atsResumeChecker';
import { Layers, Users, Award, TrendingUp, ArrowRight, Briefcase, CheckCircle2, AlertCircle, Calendar, Sparkles, CheckCircle, Flame, Zap, Clock, Trophy, ChevronRight, ShieldCheck, Gift, Crown, Lock } from 'lucide-react';
import { CircularProgress } from '../components/common/CircularProgress';
import { ProgressBar } from '../components/common/ProgressBar';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { useSubscription } from '../contexts/SubscriptionContext';

export const DashboardPage = () => {
    const { user, profile } = useAuth();
    const {
        currentPlan,
        activePlanId,
        usage,
        totalVoiceInterviewsAllowed,
        setIsReferralModalOpen
    } = useSubscription();

    // Instant SWR cache to eliminate the 1-second flash when switching pages
    const getCached = (key, fallback) => {
        try {
            const raw = sessionStorage.getItem(`careeros_dash_${user?.id || 'anon'}_${key}`);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    };

    const setCached = (key, val) => {
        try {
            sessionStorage.setItem(`careeros_dash_${user?.id || 'anon'}_${key}`, JSON.stringify(val));
        } catch {}
    };

    const [jobs, setJobs] = useState(() => getCached('jobs', []));
    const [applications, setApplications] = useState(() => getCached('apps', []));
    const [userSkills, setUserSkills] = useState(() => getCached('skills', []));
    const [projects, setProjects] = useState(() => getCached('projects', []));
    const [dataReady, setDataReady] = useState(() => {
        return getCached('skills', null) !== null;
    });

    const targetRole = profile?.target_role || 'Backend Developer';
    const roleDisplayName = getRoleDisplayName(targetRole);
    const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

    useEffect(() => {
        let isMounted = true;
        const loadDashboardData = async () => {
            const [fetchedJobs, fetchedApps, fetchedSkills, fetchedProjects] = await Promise.all([
                jobService.getJobs({ role: targetRole }),
                user?.id ? applicationService.getApplications(user.id) : Promise.resolve([]),
                user?.id ? profileService.getUserSkills(user.id) : Promise.resolve([]),
                user?.id ? projectService.getProjects(user.id) : Promise.resolve([])
            ]);

            if (!isMounted) return;

            const topJobs = (fetchedJobs || []).slice(0, 3);
            const appsList = fetchedApps || [];
            const skillsList = fetchedSkills || [];
            const projsList = fetchedProjects || [];

            setJobs(topJobs);
            setApplications(appsList);
            setUserSkills(skillsList);
            setProjects(projsList);
            setDataReady(true);

            // Save to session cache so future page navigations load in 0ms
            setCached('jobs', topJobs);
            setCached('apps', appsList);
            setCached('skills', skillsList);
            setCached('projects', projsList);
        };
        loadDashboardData();
        return () => { isMounted = false; };
    }, [user?.id, targetRole]);

    const stats = applicationService.getStats(applications);

    // Compute live deterministic ATS resume score (81 for starter, or live user score)
    const activeAtsScore = getActiveAtsScore(roleDisplayName, profile);

    // Calculate dynamic accurate 5-pillar career readiness
    const readinessBreakdown = calculateCareerReadinessBreakdown(userSkills, targetRole, profile, {
        projectCount: projects.length,
        hasResume: Boolean(profile?.resume_url),
        atsScore: activeAtsScore
    });

    // Guard against computing with empty skills array on first cold visit
    const calculatedReadiness = (dataReady || userSkills.length > 0)
        ? readinessBreakdown.overallScore
        : (profile?.career_readiness || 0);
    const readiness = calculatedReadiness > 0 ? calculatedReadiness : (profile?.career_readiness || 0);

    // Persist dynamic readiness to profile table in Supabase so Founder Admin reflects it
    useEffect(() => {
        if (user?.id && dataReady && calculatedReadiness > 0 && profile && calculatedReadiness !== profile.career_readiness) {
            profileService.updateProfile(user.id, { career_readiness: calculatedReadiness });
        }
    }, [user?.id, dataReady, calculatedReadiness, profile?.career_readiness]);

    // Dynamic cohort classification
    const getCohortInfo = (score) => {
        if (score >= 80) return { label: 'Top 10% • Placement Ready', badge: 'badge-success', Icon: TrendingUp };
        if (score >= 60) return { label: 'Top 25% • Advancing Steady', badge: 'badge-purple', Icon: TrendingUp };
        if (score >= 40) return { label: 'Intermediate • Building Foundation', badge: 'badge-primary', Icon: TrendingUp };
        return { label: 'Early Stage • Skill Gap Focus', badge: 'badge-warning', Icon: AlertCircle };
    };
    const cohort = getCohortInfo(readiness);

    // Dynamic Skill Gaps for user's actual target role & skills
    const skillGaps = getSkillGapsForRole(targetRole, userSkills);

    // Dynamic Recommended Actions for user's actual target role
    const recommendedActions = getRecommendedActionsForRole(targetRole);

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'OFFER': return 'success';
            case 'INTERVIEW': return 'purple';
            case 'ASSESSMENT': return 'primary';
            case 'APPLIED': return 'warning';
            case 'REJECTED': return 'danger';
            default: return 'neutral';
        }
    };

    // Dynamic determination of Today's Priority Mission based on weakest pillar
    const getPriorityMission = () => {
        if (!readinessBreakdown?.pillars) {
            return {
                title: 'Complete Your Career Profile',
                desc: 'Add your target role, degree, and top 5 technical skills to unlock calibrated readiness scores.',
                actionText: 'Update Profile',
                link: '/profile',
                boost: '+10% Readiness',
                time: '5 mins',
                tag: 'Profile Setup'
            };
        }

        const lowestPillar = [...readinessBreakdown.pillars].sort((a, b) => a.percentage - b.percentage)[0];

        switch (lowestPillar?.id) {
            case 'skills': {
                const topSkillGapName = skillGaps[0]?.name || (typeof skillGaps[0] === 'string' ? skillGaps[0] : 'Core Technical Skills');
                return {
                    title: `Master ${topSkillGapName}`,
                    desc: `Bridge your top identified technical gap (${topSkillGapName}) for ${roleDisplayName} to unlock higher placement match scores.`,
                    actionText: 'Launch Simulation',
                    link: '/simulations',
                    boost: '+8% Readiness',
                    time: '20 mins',
                    tag: 'Skill Gap'
                };
            }
            case 'ats':
                return {
                    title: 'Optimize ATS Resume to 85+',
                    desc: 'Enhance your bullet points with the Google XYZ formula and keyword match against target job descriptions.',
                    actionText: 'Open AI Career Studio',
                    link: '/ai-studio',
                    boost: '+6% Readiness',
                    time: '15 mins',
                    tag: 'ATS Quality'
                };
            case 'interview':
                return {
                    title: 'Practice 1 AI Voice Mock Round',
                    desc: 'Complete an interactive voice interview drill with live 4-vector telemetry feedback on STAR structure and technical depth.',
                    actionText: 'Start Voice Interview',
                    link: '/interview-prep',
                    boost: '+7% Readiness',
                    time: '12 mins',
                    tag: 'Interview Prep'
                };
            case 'simulation':
                return {
                    title: 'Solve FinPulse Virtual Internship Ticket',
                    desc: 'Fix boundary validation and submit a Pull Request in the interactive developer simulation lab.',
                    actionText: 'Open Simulation Lab',
                    link: '/simulations',
                    boost: '+8% Readiness',
                    time: '25 mins',
                    tag: 'Workplace Sim'
                };
            default:
                return {
                    title: 'Apply to 3 Matched Positions',
                    desc: 'Submit tailored applications to companies with 85%+ alignment with your verified skill profile.',
                    actionText: 'Explore Jobs',
                    link: '/jobs',
                    boost: '+5% Readiness',
                    time: '10 mins',
                    tag: 'Hiring Pipeline'
                };
        }
    };

    const priorityMission = getPriorityMission();

    // Real dynamic placement habit & streak tracking
    const habitStatus = habitTrackerService.getWeeklyHabitStatus(user?.id, {
        applications,
        userSkills
    });
    const streakDays = habitStatus.streak;
    const weekDays = habitStatus.weekDays;

    return (<div className="page-container">
      {/* 1. Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc', margin: 0 }}>
            Good morning, {firstName} 👋
          </h1>
          <p className="page-subtitle" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0 0' }}>
            Here is your verified readiness and daily mission for <strong style={{ color: 'var(--text-primary)' }}>{roleDisplayName}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Peer Benchmark Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.45rem 0.95rem',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-full)'
          }}>
            <Trophy size={15} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Top 12% Peer Benchmark
            </span>
          </div>

          <Link to="/profile">
            <Button variant="ghost" size="sm" style={{ color: 'var(--text-secondary)' }}>
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>



      {/* TIER 1: Today's Priority Mission (Hero Banner) */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 1.75rem',
        marginBottom: '1.75rem',
        boxShadow: '0 8px 30px -6px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle Ambient Radial Glow */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '5%',
          width: '320px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
          filter: 'blur(40px)'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)'
            }}>
              <Zap size={16} />
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
              🎯 Your #1 Highest-Impact Move Today
            </span>
            <span className="badge badge-purple" style={{ fontSize: '0.6875rem', padding: '0.15rem 0.5rem' }}>
              {priorityMission.tag}
            </span>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px'
            }}>
              🧘 Ignore the noise • 1 step at a time
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Streak Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.3rem 0.75rem',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-full)'
            }}>
              <Flame size={15} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fde68a' }}>
                {streakDays}-Day Streak
              </span>
            </div>

            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Clock size={13} /> {priorityMission.time}
            </span>

            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--success)',
              padding: '0.2rem 0.55rem',
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              {priorityMission.boost}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ flex: '1 1 260px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.4rem 0', letterSpacing: '-0.01em' }}>
              {priorityMission.title}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {priorityMission.desc}
            </p>
          </div>

          <Link to={priorityMission.link} style={{ textDecoration: 'none' }}>
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight size={16} />}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                borderColor: 'transparent',
                color: '#fff',
                fontWeight: 700,
                padding: '0.65rem 1.4rem',
                fontSize: '0.9375rem',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.45)',
                whiteSpace: 'nowrap'
              }}
            >
              {priorityMission.actionText} →
            </Button>
          </Link>
        </div>
      </div>

      {/* TIER 2: Unified Career Readiness Hub (Unified Single Surface) */}
      <div className="card" style={{
        marginBottom: '1.75rem',
        padding: '1.75rem',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} className="text-primary-accent" />
              Career Readiness Hub
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Real-time calibration across technical skills, ATS resume verification, and simulated PRs.
            </p>
          </div>

          <span className={`badge ${cohort.badge}`} style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}>
            <cohort.Icon size={13} style={{ marginRight: '4px' }} />
            {cohort.label}
          </span>
        </div>

        <div className="dashboard-readiness-grid">
          {/* Left: Overall Circular Progress */}
          <div className="readiness-progress-col">
            <CircularProgress percentage={readiness} size={150} strokeWidth={12} label="Ready" subtitle={roleDisplayName} />
            <div style={{ marginTop: '0.85rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Target Role: </span>
              <strong style={{ color: '#fff', fontSize: '0.875rem' }}>{roleDisplayName}</strong>
            </div>
          </div>

          {/* Right: Clean Horizontal Readiness Pillars (No box-in-box nesting) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(readinessBreakdown?.pillars || []).map((pillar) => (
              <div key={pillar.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {pillar.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 700, color: pillar.color }}>
                      {pillar.score}/{pillar.maxScore} ({pillar.percentage}%)
                    </span>
                    <Link
                      to={pillar.actionLink}
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      {pillar.actionText} <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>

                <div style={{ width: '100%', height: '7px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pillar.percentage}%`, height: '100%', backgroundColor: pillar.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TIER 3: Balanced 2-Column Grid (Recommended Jobs & Applications Pipeline) */}
      <div className="grid grid-cols-12" style={{ gap: '1.5rem' }}>
        {/* Left Column: Recommended Jobs (6 cols) */}
        <div className="col-span-6 card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={17} className="text-primary-accent" />
                Recommended {roleDisplayName} Jobs
              </h3>
              <Link to="/jobs" className="text-sm text-primary-accent" style={{ fontWeight: 600, textDecoration: 'none' }}>
                Browse All ({jobs.length}) →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No open jobs found for {roleDisplayName}. Check back soon!
                </div>
              ) : (
                jobs.slice(0, 3).map(job => {
                  const userSkillNames = (userSkills || []).map(s => (typeof s === 'string' ? s : s.skill?.name || s.name || '')).filter(Boolean);
                  const match = jobService.calculateSkillMatch(userSkillNames, job.skills, job);
                  const matchScore = match.score;
                  const badgeClass = matchScore >= 70 ? 'badge-success' : matchScore >= 40 ? 'badge-primary' : 'badge-neutral';

                  return (
                    <div key={job.id} style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {job.title}
                          </span>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.6875rem', padding: '0.1rem 0.45rem' }}>
                            {matchScore}% Match
                          </span>
                        </div>
                        <div className="text-body text-xs" style={{ color: 'var(--text-muted)' }}>
                          {job.company} • {job.location} • {job.salary_range}
                        </div>
                      </div>

                      <Link to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" size="sm" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                          View
                        </Button>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Tailored to your skills profile</span>
            <Link to="/ai-studio" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Tailor Resume for Job →
            </Link>
          </div>
        </div>

        {/* Right Column: Active Applications & Placement Pipeline (6 cols) */}
        <div className="col-span-6 card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="card-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={17} className="text-primary-accent" />
                Active Pipeline & Applications
              </h3>
              <Link to="/applications" className="text-sm text-primary-accent" style={{ fontWeight: 600, textDecoration: 'none' }}>
                Open Kanban Board →
              </Link>
            </div>

            {/* Quick Metrics Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.total}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Applied</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.interviews}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Interviews</div>
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>{stats.offers}</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Offers</div>
              </div>
            </div>

            {/* Applications List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No active job applications yet. Track your first role in the Kanban board!
                </div>
              ) : (
                applications.slice(0, 3).map(app => (
                  <div key={app.id} style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        {app.company}
                      </div>
                      <div className="text-body text-xs" style={{ color: 'var(--text-muted)' }}>
                        {app.role}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                        <Calendar size={11} /> {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Interview rate: <strong style={{ color: 'var(--text-primary)' }}>{stats.responseRate}%</strong></span>
            <Link to="/interview-prep" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Prepare for Interviews →
            </Link>
          </div>
        </div>
      </div>
    </div>);
};
