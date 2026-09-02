import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { roadmapService } from '../services/roadmapService';
import { getRoleDisplayName } from '../utils/careerRoles';
import { Milestone, CheckCircle2, Clock, Circle, ChevronDown, ChevronUp, FolderGit2, Sparkles, RefreshCw, AlertCircle, RotateCcw, Calendar, Layers } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CircularProgress } from '../components/common/CircularProgress';
import confetti from 'canvas-confetti';

export const CareerRoadmapPage = () => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    
    // User accesses strictly their chosen target role
    const targetRole = profile?.target_role || 'Backend Developer';
    const roleDisplayName = getRoleDisplayName(targetRole);

    const [phases, setPhases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSkillId, setExpandedSkillId] = useState(null);

    const loadRoadmap = async () => {
        setLoading(true);
        setError(null);
        try {
            const roadmapData = await roadmapService.getRoadmap(user?.id, targetRole);
            setPhases(roadmapData);
            if (roadmapData.length > 0 && roadmapData[0].skills?.length > 0) {
                setExpandedSkillId(roadmapData[0].skills[0].id);
            }
        }
        catch (err) {
            console.error('Failed to load roadmap:', err);
            setError(err?.message || 'Failed to load roadmap from database.');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoadmap();
    }, [user?.id, targetRole]);

    const handleResetProgress = async () => {
        setResetting(true);
        try {
            const resetPhases = await roadmapService.resetRoadmapToDefault(user?.id, targetRole);
            setPhases(resetPhases);
            showToast(`Reset ${roleDisplayName} roadmap progress to database default`, 'info', 'Progress Reset');
        }
        catch (err) {
            console.error('Failed to reset roadmap progress:', err);
            showToast('Failed to reset roadmap progress', 'error');
        }
        finally {
            setResetting(false);
        }
    };

    const handleToggleSkill = async (phaseId, skillId, skillName) => {
        const updated = await roadmapService.toggleSkillStatus(user?.id, targetRole, phases, phaseId, skillId);
        setPhases(updated);
        const changedSkill = updated
            .flatMap(p => p.skills)
            .find(s => s.id === skillId);
        if (changedSkill?.status === 'COMPLETED') {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
            showToast(`Marked ${skillName} as Completed! 🎉`, 'success');
        }
        else if (changedSkill?.status === 'IN_PROGRESS') {
            showToast(`Marked ${skillName} as In Progress 🚀`, 'info');
        }
        else {
            showToast(`Reset ${skillName} status`, 'info');
        }
    };

    const progress = roadmapService.calculateRoadmapProgress(phases);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'COMPLETED':
                return <CheckCircle2 size={18} className="text-success"/>;
            case 'IN_PROGRESS':
                return <Clock size={18} className="text-warning"/>;
            default:
                return <Circle size={18} className="text-muted"/>;
        }
    };

    return (<div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-primary">
              <Sparkles size={12}/> Manual Database Curriculum
            </span>
          </div>
          <h1 className="page-title">{roleDisplayName} Roadmap</h1>
          <p className="page-subtitle">
            Structured, milestone-driven curriculum loaded directly from the database for your chosen career track.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={handleResetProgress} isLoading={resetting} leftIcon={<RotateCcw size={15}/>}>
            Reset Progress
          </Button>
          <Button variant="secondary" onClick={loadRoadmap} isLoading={loading} leftIcon={<RefreshCw size={15}/>}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (<div style={{ padding: '1rem 1.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
            <AlertCircle size={18}/>
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={loadRoadmap}>
            Retry
          </Button>
        </div>)}

      {loading ? (<Card style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ width: 40, height: 40, margin: '0 auto 1rem auto' }}/>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Loading Database Roadmap...
          </h3>
          <p className="text-body text-xs" style={{ marginTop: '4px' }}>
            Retrieving structured curriculum for {roleDisplayName}.
          </p>
        </Card>) : phases.length === 0 ? (<Card style={{ padding: '3rem', textAlign: 'center' }}>
          <Milestone size={40} className="text-muted" style={{ margin: '0 auto 1rem auto' }}/>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Roadmap Available for {roleDisplayName}
          </h3>
          <p className="text-body text-sm" style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem auto' }}>
            Run the SQL query in Supabase to insert your custom roadmap for this role.
          </p>
          <Button variant="primary" onClick={loadRoadmap} leftIcon={<RefreshCw size={16}/>}>
            Reload
          </Button>
        </Card>) : (<>
          {/* Top Progression Banner */}
          <Card style={{ marginBottom: '2rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <CircularProgress percentage={progress.percentage} size={110} strokeWidth={9} label="Complete"/>
                <div>
                  <span className="text-xs text-muted" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    {roleDisplayName} Progress
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {progress.completedSkills} of {progress.totalSkills} Milestones Completed
                  </h3>
                  <p className="text-body text-xs" style={{ marginTop: '4px' }}>
                    {progress.inProgressSkills} topics currently in active learning.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '90px', overflowY: 'auto' }}>
                {phases.map(p => (<div key={p.id} style={{ padding: '0.4rem 0.75rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <span className="text-xs text-muted" style={{ display: 'block' }}>Phase {p.phase_number}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.status === 'COMPLETED' ? 'var(--success)' : p.status === 'IN_PROGRESS' ? 'var(--warning)' : 'var(--text-secondary)' }}>
                      {p.title.split(' ').slice(0, 2).join(' ')} {p.status === 'COMPLETED' ? '✓' : ''}
                    </span>
                  </div>))}
              </div>
            </div>
          </Card>

          {/* Phases Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {phases.map((phase) => (<div key={phase.id}>
                {/* Phase Header Card */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: phase.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'var(--primary-light)',
                    color: phase.status === 'COMPLETED' ? 'var(--success)' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.875rem'
                }}>
                      {phase.phase_number}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Phase {phase.phase_number}: {phase.title}
                        </h3>
                        {phase.duration && (
                          <span className="badge badge-neutral text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Calendar size={11} /> {phase.duration}
                          </span>
                        )}
                        {phase.level && (
                          <span className="badge badge-primary text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Layers size={11} /> {phase.level}
                          </span>
                        )}
                      </div>
                      {phase.description && (
                        <p className="text-body text-xs" style={{ marginTop: '2px' }}>{phase.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`badge badge-${phase.status === 'COMPLETED' ? 'success' : phase.status === 'IN_PROGRESS' ? 'warning' : 'neutral'}`}>
                    {phase.status === 'COMPLETED' ? '✓ Phase Complete' : phase.status === 'IN_PROGRESS' ? '⚡ In Progress' : 'Not Started'}
                  </span>
                </div>

                {/* Skills Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {phase.skills.map((skill) => {
                    const isExpanded = expandedSkillId === skill.id;
                    return (<Card key={skill.id} style={{
                            padding: '1.25rem',
                            borderLeft: `4px solid ${skill.status === 'COMPLETED' ? 'var(--success)' : skill.status === 'IN_PROGRESS' ? 'var(--warning)' : 'var(--border-color)'}`
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSkill(phase.id, skill.id, skill.name);
                        }} className="btn-ghost" style={{ padding: '4px', borderRadius: '50%' }}>
                              {getStatusIcon(skill.status)}
                            </button>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{
                            fontWeight: 700,
                            fontSize: '0.975rem',
                            color: 'var(--text-primary)',
                            textDecoration: skill.status === 'COMPLETED' ? 'line-through' : 'none'
                        }}>
                                  {skill.name}
                                </span>
                                {skill.category && <span className="badge badge-neutral text-xs">{skill.category}</span>}
                                {skill.estimated_effort && <span className="text-xs text-muted">• {skill.estimated_effort}</span>}
                              </div>
                              {skill.why_learn && (
                                <p className="text-body text-xs" style={{ marginTop: '2px' }}>
                                  {skill.why_learn}
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Button size="sm" variant={skill.status === 'COMPLETED' ? 'outline' : skill.status === 'IN_PROGRESS' ? 'primary' : 'secondary'} onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSkill(phase.id, skill.id, skill.name);
                        }}>
                              {skill.status === 'COMPLETED' ? 'Mark Incomplete' : skill.status === 'IN_PROGRESS' ? 'Mark Completed' : 'Start Learning'}
                            </Button>
                            <button className="btn-ghost" style={{ padding: '6px' }}>
                              {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                            </button>
                          </div>
                        </div>

                        {/* Accordion Detail Breakdown */}
                        {isExpanded && (<div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: (skill.what_to_learn?.length > 0 && skill.suggested_project) ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
                            {skill.what_to_learn?.length > 0 && (
                              <div>
                                <h5 style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                  What to Master & Practice
                                </h5>
                                <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {skill.what_to_learn.map((item, idx) => (<li key={idx} className="text-body text-xs" style={{ color: 'var(--text-secondary)' }}>
                                      {item}
                                    </li>))}
                                </ul>
                              </div>
                            )}

                            {skill.suggested_project && (
                              <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                                  <FolderGit2 size={15}/> Hands-On Project / Milestone
                                </div>
                                <p className="text-body text-xs" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                                  {skill.suggested_project}
                                </p>
                              </div>
                            )}
                          </div>)}
                      </Card>);
                })}
                </div>
              </div>))}
          </div>
        </>)}
    </div>);
};
