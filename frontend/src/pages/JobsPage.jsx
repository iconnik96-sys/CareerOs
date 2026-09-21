import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/jobService';
import { getRoleSlug, getRoleDisplayName, TARGET_ROLES } from '../utils/careerRoles';
import { Briefcase, Search, MapPin, Bookmark, BookmarkCheck, ArrowRight, DollarSign, Filter } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../contexts/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const JobsPage = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const userTargetRole = profile?.target_role || 'All';

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(userTargetRole);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync selected role when user profile loads
  useEffect(() => {
    if (profile?.target_role) {
      setSelectedRole(profile.target_role);
    }
  }, [profile?.target_role]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const data = await jobService.getJobs({
        search,
        role: selectedRole === 'All' ? 'All' : selectedRole,
        remoteOnly
      });
      setJobs(data || []);
      setSavedIds(jobService.getSavedJobIds());
      setLoading(false);
    };
    fetchJobs();
  }, [search, selectedRole, remoteOnly]);

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

  const rolesFilterList = ['All', ...TARGET_ROLES];

  return (<div className="page-container">
    <div className="page-header">
      <div>
        <h1 className="page-title">Job Discovery</h1>
        <p className="page-subtitle">
          Curated opportunities filtered by target engineering track for freshers and early-career talent.
        </p>
      </div>
    </div>

    {/* Search & Filter Bar */}
    <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input placeholder="Search by role title, company, skills, or location..." value={search} onChange={e => setSearch(e.target.value)} leftIcon={<Search size={16} />} style={{ marginBottom: 0 }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
            Remote Only
          </label>
        </div>

        {/* Role Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
            <Filter size={14} /> Track:
          </span>
          {rolesFilterList.map(r => {
            const isSelected = selectedRole === r;
            return (<button key={r} onClick={() => setSelectedRole(r)} style={{
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
              backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-tertiary)',
              color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}>
              {r}
            </button>);
          })}
        </div>
      </div>
    </Card>

    {/* Jobs Grid */}
    {loading ? (<LoadingSpinner message="Querying role-matched jobs from database..." />) : jobs.length === 0 ? (<div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
      <Briefcase size={36} className="text-muted" style={{ margin: '0 auto 0.75rem auto' }} />
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>No matching jobs found</h3>
      <p className="text-body text-xs" style={{ marginTop: '4px' }}>Try switching to "All" or searching for a different keyword.</p>
    </div>) : (<div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
      {jobs.map(job => {
        const isSaved = savedIds.includes(job.id);
        const matchScore = job.match_score || 92;
        return (<div key={job.id} className="card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          position: 'relative'
        }}>
          <div>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="badge badge-success">
                    {matchScore}% Match
                  </span>
                  {job.is_remote && (<span className="badge badge-primary">Remote</span>)}
                  <span className="badge badge-neutral text-xs">
                    {getRoleDisplayName(job.role_id || job.title)}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {job.title}
                </h3>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {job.company}
                </div>
              </div>

              <button onClick={() => handleToggleSave(job.id, job.title)} className="btn-ghost" style={{ padding: '6px', color: isSaved ? 'var(--primary)' : 'var(--text-muted)' }} title={isSaved ? 'Remove from Saved' : 'Save Job'}>
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
              {job.salary_range && (<span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={14} /> {job.salary_range}
              </span>)}
            </div>

            {/* Skills Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
              {job.skills?.map(sk => (<span key={sk} className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                {sk}
              </span>))}
            </div>
          </div>

          {/* Card Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button onClick={() => handleToggleSave(job.id, job.title)} className="btn-ghost" style={{ fontSize: '0.8125rem', color: isSaved ? 'var(--primary)' : 'var(--text-muted)' }}>
              {isSaved ? 'Saved' : 'Save Job'}
            </button>

            <Link to={`/jobs/${job.id}`}>
              <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                View Details
              </Button>
            </Link>
          </div>
        </div>);
      })}
    </div>)}
  </div>);
};
