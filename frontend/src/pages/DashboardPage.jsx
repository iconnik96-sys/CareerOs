import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { applicationService } from '../services/applicationService';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { projectService } from '../services/projectService';
import { calculateCareerReadiness, getSkillGapsForRole, getRecommendedActionsForRole, getRoleDisplayName } from '../utils/careerRoles';
import { Sparkles, Layers, Users, Award, TrendingUp, ArrowRight, Briefcase, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '../components/common/Button';
import { CircularProgress } from '../components/common/CircularProgress';
import { ProgressBar } from '../components/common/ProgressBar';
import { Badge } from '../components/common/Badge';

export const DashboardPage = () => {
    const { user, profile } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [userSkills, setUserSkills] = useState([]);
    const [projects, setProjects] = useState([]);

    const targetRole = profile?.target_role || 'Backend Developer';
    const roleDisplayName = getRoleDisplayName(targetRole);
    const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Student';

    useEffect(() => {
        const loadDashboardData = async () => {
            const [fetchedJobs, fetchedApps, fetchedSkills, fetchedProjects] = await Promise.all([
                jobService.getJobs({ role: targetRole }),
                user?.id ? applicationService.getApplications(user.id) : Promise.resolve([]),
                user?.id ? profileService.getUserSkills(user.id) : Promise.resolve([]),
                user?.id ? projectService.getProjects(user.id) : Promise.resolve([])
            ]);
            setJobs((fetchedJobs || []).slice(0, 3));
            setApplications(fetchedApps || []);
            setUserSkills(fetchedSkills || []);
            setProjects(fetchedProjects || []);
        };
        loadDashboardData();
    }, [user?.id, targetRole]);

    const stats = applicationService.getStats(applications);

    // Calculate dynamic accurate career readiness
    const calculatedReadiness = calculateCareerReadiness(userSkills, targetRole, profile, {
        projectCount: projects.length,
        hasResume: Boolean(profile?.resume_url)
    });

    const readiness = (profile?.career_readiness && profile.career_readiness !== 75 && profile.career_readiness > 0)
        ? profile.career_readiness
        : calculatedReadiness;

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

    return (<div className="page-container">
      {/* Welcome Banner */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good morning, {firstName} 👋
          </h1>
          <p className="page-subtitle">
            Here's your career readiness and hiring pipeline for <strong style={{ color: 'var(--text-primary)' }}>{roleDisplayName}</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/job-analyzer">
            <Button variant="primary" leftIcon={<Sparkles size={16}/>}>
              Analyze Target Job
            </Button>
          </Link>
          <Link to="/applications">
            <Button variant="outline">
              Track Applications
            </Button>
          </Link>
        </div>
      </div>

      {/* Top Overview Grid */}
      <div className="grid grid-cols-12" style={{ marginBottom: '1.5rem' }}>
        {/* Career Readiness Gauge Card */}
        <div className="col-span-4 card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
          <span style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Career Readiness Index
          </span>
          <CircularProgress percentage={readiness} size={150} strokeWidth={12} label="Ready" subtitle="for Entry-Level"/>
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <span className={`badge ${cohort.badge}`} style={{ marginBottom: '0.5rem' }}>
              <cohort.Icon size={12}/> {cohort.label}
            </span>
            <p className="text-body text-xs" style={{ maxWidth: '240px' }}>
              Target Role: <strong>{roleDisplayName}</strong>
            </p>
          </div>
        </div>

        {/* 4 Pipeline Stat Cards */}
        <div className="col-span-8 grid grid-cols-2" style={{ gap: '1.25rem' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)' }}>
              <Layers size={24}/>
            </div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Applications</div>
              <span className="text-xs text-muted">Across target companies</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)' }}>
              <Users size={24}/>
            </div>
            <div>
              <div className="stat-value">{stats.interviews}</div>
              <div className="stat-label">Active Interviews</div>
              <span className="text-xs text-primary-accent">Upcoming placement rounds</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <Award size={24}/>
            </div>
            <div>
              <div className="stat-value">{stats.offers}</div>
              <div className="stat-label">Offers Received</div>
              <span className="text-xs text-success">Campus & Off-Campus</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <TrendingUp size={24}/>
            </div>
            <div>
              <div className="stat-value">{stats.responseRate}%</div>
              <div className="stat-label">Response Rate</div>
              <span className="text-xs text-muted">Industry benchmark: 8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Skill Gaps & Recommended Actions */}
      <div className="grid grid-cols-12" style={{ marginBottom: '1.5rem' }}>
        {/* Skill Gaps Breakdown */}
        <div className="col-span-6 card">
          <div className="card-header">
            <h3 className="card-title">
              <AlertCircle size={18} className="text-warning"/>
              Top Skill Gaps for {roleDisplayName}
            </h3>
            <Link to="/roadmap" className="text-sm text-primary-accent" style={{ fontWeight: 600 }}>
              View Roadmap →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {skillGaps.map(sg => (<div key={sg.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sg.name}</span>
                  <span style={{ fontWeight: 700, color: sg.color }}>{sg.gap}</span>
                </div>
                <ProgressBar value={sg.progress} color={sg.color} showValue={false} height={9}/>
              </div>))}
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="col-span-6 card">
          <div className="card-header">
            <h3 className="card-title">
              <CheckCircle2 size={18} className="text-primary-accent"/>
              Recommended Next Actions
            </h3>
            <span className="badge badge-primary">High Priority</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {recommendedActions.map((action, i) => (<Link key={i} to={action.link} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                transition: 'border-color var(--transition-fast)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem'
            }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {action.title}
                    </div>
                    <div className="text-body text-xs">{action.desc}</div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-muted"/>
              </Link>))}
          </div>
        </div>
      </div>

      {/* Third Row: Recommended Jobs & Recent Applications */}
      <div className="grid grid-cols-12">
        {/* Recommended Jobs */}
        <div className="col-span-6 card">
          <div className="card-header">
            <h3 className="card-title">
              <Briefcase size={18} className="text-primary-accent"/>
              Recommended {roleDisplayName} Jobs
            </h3>
            <Link to="/jobs" className="text-sm text-primary-accent" style={{ fontWeight: 600 }}>
              Browse All Jobs ({jobs.length}) →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {jobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No open jobs found for {roleDisplayName}. Check back soon!
                </div>
            ) : (
                jobs.map(job => (<div key={job.id} style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          {job.title}
                        </span>
                        <span className="badge badge-success">{job.match_score || 90}% Match</span>
                      </div>
                      <div className="text-body text-xs">
                        {job.company} • {job.location} • {job.salary_range}
                      </div>
                    </div>
                    <Link to={`/jobs/${job.id}`}>
                      <Button variant="secondary" size="sm">
                        View Job
                      </Button>
                    </Link>
                  </div>))
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="col-span-6 card">
          <div className="card-header">
            <h3 className="card-title">
              <Layers size={18} className="text-primary-accent"/>
              Recent Applications
            </h3>
            <Link to="/applications" className="text-sm text-primary-accent" style={{ fontWeight: 600 }}>
              Open Kanban Board →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {applications.slice(0, 4).map(app => (<div key={app.id} style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {app.company}
                  </div>
                  <div className="text-body text-xs">
                    {app.role} • {app.location}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12}/> {new Date(app.applied_at).toLocaleDateString()}
                  </span>
                  <Badge variant={getStatusBadgeVariant(app.status)}>
                    {app.status}
                  </Badge>
                </div>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
};
