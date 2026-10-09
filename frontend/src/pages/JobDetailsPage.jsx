import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { profileService } from '../services/profileService';
import { parseJobSkills, getRoleDisplayName } from '../utils/careerRoles';
import { Briefcase, MapPin, ExternalLink, Bookmark, BookmarkCheck, CheckCircle2, XCircle, ArrowLeft, DollarSign, Layers, Lightbulb, ArrowRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CircularProgress } from '../components/common/CircularProgress';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { sanitizeUrl } from '../utils/security';

export const JobDetailsPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [matchingData, setMatchingData] = useState({ score: 0, matching: [], missing: [], requiredSkills: [] });

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            setLoading(true);
            const data = await jobService.getJobById(id);
            if (data) {
                setJob(data);
                const savedIds = jobService.getSavedJobIds();
                setIsSaved(savedIds.includes(data.id));

                const userSkillsData = user?.id ? await profileService.getUserSkills(user.id) : [];
                const userSkillNames = userSkillsData.map(s => (typeof s === 'string' ? s : s.skill?.name || s.name || '')).filter(Boolean);

                const match = jobService.calculateSkillMatch(userSkillNames, data.skills, data);
                setMatchingData(match);
            }
            setLoading(false);
        };
        fetchDetails();
    }, [id, user?.id]);

    const handleToggleSave = () => {
        if (!job) return;
        const ok = jobService.toggleSaveJob(job.id);
        setIsSaved(ok);
        showToast(ok ? 'Saved to bookmarks' : 'Removed from bookmarks', ok ? 'success' : 'info');
    };

    const handleTrackApplication = async () => {
        if (!job || !user?.id) {
            showToast('Please sign in to track applications', 'warning');
            return;
        }
        await applicationService.addApplication(user.id, {
            job_id: job.id,
            company: job.company,
            role: job.title,
            location: job.location,
            status: 'SAVED',
            salary: job.salary_range,
            applied_at: new Date().toISOString(),
            notes: `Targeting ${job.company}. Match score: ${matchingData.score}%. Preparing skills: ${matchingData.missing.join(', ')}`
        });
        showToast(`Added ${job.title} at ${job.company} to Applications Kanban!`, 'success');
        navigate('/applications');
    };

    if (loading) {
        return (<div className="page-container">
        <LoadingSpinner message="Loading job specifications & skill analysis..."/>
      </div>);
    }

    if (!job) {
        return (<div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 className="text-h3">Job Listing Not Found</h2>
        <p className="text-body text-sm" style={{ margin: '0.5rem 0 1.5rem 0' }}>The job posting you are looking for may have expired.</p>
        <Link to="/jobs">
          <Button variant="primary">Return to Jobs</Button>
        </Link>
      </div>);
    }

    const jobSkillsList = matchingData.requiredSkills?.length > 0
        ? matchingData.requiredSkills
        : parseJobSkills(job);

    const roleName = getRoleDisplayName(job.role_id || job.title);

    // Dynamic preparation topics based on missing or required skills
    const prepTopics = matchingData.missing.length > 0
        ? matchingData.missing.slice(0, 2).map((sk, idx) => ({
            title: `${idx + 1}. ${sk} Core Foundations`,
            desc: `Master high-frequency interview concepts and hands-on implementation patterns for ${sk} asked by ${job.company}.`
        }))
        : jobSkillsList.slice(0, 2).map((sk, idx) => ({
            title: `${idx + 1}. ${sk} Deep-Dive & System Scenarios`,
            desc: `Review production best practices, concurrency, and architecture tradeoffs for ${sk}.`
        }));

    return (<div className="page-container">
      {/* Back Button */}
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          <ArrowLeft size={16}/> Back to Job Discovery
        </Link>
      </div>

      {/* Main Header Banner */}
      <Card style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className={`badge ${matchingData.score >= 70 ? 'badge-success' : matchingData.score >= 40 ? 'badge-warning' : 'badge-neutral'}`}>
                {matchingData.score}% Match
              </span>
              {job.is_remote && <span className="badge badge-primary">Remote</span>}
              <span className="badge badge-neutral">{roleName}</span>
              <span className="badge badge-neutral">{job.job_type || 'Full-time'}</span>
            </div>
            <h1 className="text-h2" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              {job.title}
            </h1>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              {job.company}
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={15}/> {job.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Briefcase size={15}/> {job.experience_min}–{job.experience_max} Years Experience
              </span>
              {job.salary_range && (<span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)' }}>
                  <DollarSign size={15}/> {job.salary_range}
                </span>)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={handleToggleSave} leftIcon={isSaved ? <BookmarkCheck size={16} className="text-primary"/> : <Bookmark size={16}/>}>
              {isSaved ? 'Saved' : 'Save Job'}
            </Button>
            <Button variant="secondary" onClick={handleTrackApplication} leftIcon={<Layers size={16}/>}>
              Track Application
            </Button>
            <a href={sanitizeUrl(job.source_url)} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" rightIcon={<ExternalLink size={15}/>}>
                Apply on Official Site
              </Button>
            </a>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-12" style={{ gap: '1.5rem' }}>
        {/* Left Column: Job Description & Required Skills */}
        <div className="col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Job Description */}
          <Card title="Job Description">
            <div style={{ whiteSpace: 'pre-line', fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {job.description}
            </div>
          </Card>

          {/* Required Skills & Technologies */}
          <Card title="Required Skills & Technologies">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {jobSkillsList.map(sk => (<span key={sk} className="badge badge-neutral" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8125rem' }}>
                  {sk}
                </span>))}
            </div>
          </Card>

          {/* Recommended Interview Preparation */}
          <Card title="Recommended Interview Preparation" icon={<Lightbulb size={18} className="text-primary-accent"/>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {prepTopics.map((topic, i) => (<div key={i} style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {topic.title}
                  </div>
                  <div className="text-body text-xs">
                    {topic.desc}
                  </div>
                </div>))}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/interview-prep">
                <Button variant="outline" size="sm" rightIcon={<ArrowRight size={14}/>}>
                  Practice {roleName} Interview Questions
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Match Analysis Breakdown */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Match Score Radial */}
          <Card style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <span style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', display: 'block' }}>
              Role Match Assessment
            </span>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CircularProgress percentage={matchingData.score} size={130} strokeWidth={10} label="Match"/>
            </div>
            <div className="text-body text-xs" style={{ maxWidth: '280px', margin: '0 auto' }}>
              {matchingData.score >= 70
                ? `Strong alignment with ${job.company}'s requirements for ${job.title}.`
                : `Bridge the missing skills below to increase your placement readiness for ${job.company}.`}
            </div>
          </Card>

          {/* Your Matching Skills */}
          <Card title={`Your Matching Skills (${matchingData.matching.length})`} icon={<CheckCircle2 size={18} className="text-success"/>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {matchingData.matching.length === 0 ? (
                <div className="text-xs text-muted" style={{ padding: '0.5rem 0' }}>
                  No matching skills found in your profile yet. Add your verified technical skills in your Profile to improve your match score.
                </div>
              ) : (
                matchingData.matching.map(sk => (<div key={sk} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    <CheckCircle2 size={16} className="text-success"/>
                    <span style={{ fontWeight: 600 }}>{sk}</span>
                  </div>))
              )}
            </div>
          </Card>

          {/* Missing Skills */}
          <Card title={`Missing Skills to Prepare (${matchingData.missing.length})`} icon={<XCircle size={18} className="text-danger"/>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {matchingData.missing.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
                  <CheckCircle2 size={16}/> All required skills for this job are covered!
                </div>
              ) : (
                matchingData.missing.map(sk => (<div key={sk} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--danger)', padding: '0.25rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <XCircle size={16} className="text-danger"/>
                      <span style={{ fontWeight: 600 }}>{sk}</span>
                    </div>
                    <Link to="/roadmap" className="text-xs text-primary-accent" style={{ fontWeight: 600 }}>
                      Learn in Roadmap →
                    </Link>
                  </div>))
              )}
            </div>
          </Card>

          {/* Why You're a Good Match & What to Improve */}
          <Card title="Candidate Preparation Summary">
            {matchingData.matching.length > 0 ? (
              <p className="text-body text-xs" style={{ lineHeight: 1.6 }}>
                Your verified background in <strong>{matchingData.matching.slice(0, 3).join(', ')}</strong> directly satisfies core job requirements for <strong>{job.company}</strong>.
              </p>
            ) : (
              <p className="text-body text-xs" style={{ lineHeight: 1.6 }}>
                Review the required technologies for <strong>{job.title}</strong> and add completed side projects or coursework to your profile.
              </p>
            )}

            {matchingData.missing.length > 0 && (<div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  What to prepare before interview:
                </div>
                <p className="text-body text-xs">
                  Prioritize mastering <strong>{matchingData.missing.slice(0, 3).join(', ')}</strong> to confidently pass technical screening rounds.
                </p>
              </div>)}
          </Card>
        </div>
      </div>
    </div>);
};
