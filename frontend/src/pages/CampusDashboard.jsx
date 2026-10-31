import { isFounderUser, isCampusAdmin } from '../utils/founderAuth';
import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { campusService } from '../services/campusService';
import {
  GraduationCap, Users, Award, AlertTriangle, TrendingUp,
  Download, Filter, Search, CheckCircle2, ChevronRight, X,
  Building2, QrCode, Copy, Check, ExternalLink, Sparkles,
  BookOpen, BrainCircuit, BarChart3, ShieldCheck, Tag, RefreshCw
} from 'lucide-react';

export const CampusDashboard = () => {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const isFounder = isFounderUser(user, profile);
  const isAuthorized = isFounder || isCampusAdmin(user, profile);

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [skillsMatrix, setSkillsMatrix] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [drilldownData, setDrilldownData] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Screener Filters
  const [branchFilter, setBranchFilter] = useState('all');
  const [minCgpa, setMinCgpa] = useState(0);
  const [minAts, setMinAts] = useState(0);
  const [readinessFilter, setReadinessFilter] = useState('all');
  const [skillSearch, setSkillSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Tab: 'overview' | 'heatmap' | 'screener'
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewData, matrixData, studentsData] = await Promise.all([
        campusService.getOverview(),
        campusService.getSkillsMatrix(),
        campusService.getStudents({
          branch: branchFilter,
          min_cgpa: minCgpa > 0 ? minCgpa : undefined,
          min_ats: minAts > 0 ? minAts : undefined,
          readiness: readinessFilter !== 'all' ? readinessFilter : undefined,
          skill: skillSearch || undefined,
          search: searchQuery || undefined
        })
      ]);

      if (overviewData) setOverview(overviewData);
      if (matrixData?.curriculum_diagnostic) setSkillsMatrix(matrixData.curriculum_diagnostic);
      if (studentsData?.students) setStudents(studentsData.students);
    } catch (err) {
      console.error('Failed to load campus dashboard data:', err);
      addToast(err?.message || 'Failed to sync live campus metrics from backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthorized, branchFilter, minCgpa, minAts, readinessFilter, skillSearch, searchQuery]);

  if (!loading && !isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleOpenDrilldown = async (student) => {
    setSelectedStudent(student);
    setDrilldownLoading(true);
    try {
      const data = await campusService.getStudentDrilldown(student.id);
      setDrilldownData(data);
    } catch (err) {
      console.error('Failed to fetch student drilldown:', err);
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleToggleTag = async (tag) => {
    if (!selectedStudent) return;
    const exists = selectedStudent.tpo_tags?.includes(tag);
    const action = exists ? 'remove' : 'add';
    
    try {
      const res = await campusService.updateStudentTag(selectedStudent.id, tag, action);
      if (res?.tpo_tags) {
        setSelectedStudent(prev => ({ ...prev, tpo_tags: res.tpo_tags }));
        setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, tpo_tags: res.tpo_tags } : s));
        addToast(`Tag ${action === 'add' ? 'added' : 'removed'} successfully`, 'success');
      }
    } catch (err) {
      addToast('Failed to update tag', 'error');
    }
  };

  const institution = overview?.institution || {
    name: 'Apex Institute of Technology',
    invite_code: 'APEX-2026',
    batch_year: 2026,
    city: 'Bengaluru',
    state: 'Karnataka'
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(institution.invite_code);
    setCopiedCode(true);
    addToast('College Invite Code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyBatchUrl = () => {
    const url = `${window.location.origin}/join/${institution.invite_code.toLowerCase()}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    addToast('Direct Student Join URL copied!', 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleExportCsv = async () => {
    try {
      addToast('Generating verified student roster CSV...', 'info');
      await campusService.downloadStudentsCsv({
        branch: branchFilter,
        min_cgpa: minCgpa > 0 ? minCgpa : undefined,
        min_ats: minAts > 0 ? minAts : undefined,
        readiness: readinessFilter !== 'all' ? readinessFilter : undefined
      });
      addToast('Student roster exported successfully!', 'success');
    } catch (err) {
      addToast(err?.message || 'Failed to export CSV. Placement Officer authorization required.', 'error');
    }
  };

  const metrics = overview?.metrics;
  const totalStudents = metrics?.total_students ?? 10;
  const driveReadyCount = metrics?.readiness_distribution?.drive_ready ?? 6;
  const driveReadyPct = metrics?.readiness_distribution?.drive_ready_pct ?? 60;
  const needsPolishCount = metrics?.readiness_distribution?.needs_polish ?? 2;
  const needsPolishPct = metrics?.readiness_distribution?.needs_polish_pct ?? 20;
  const atRiskCount = metrics?.readiness_distribution?.at_risk ?? 2;
  const atRiskPct = metrics?.readiness_distribution?.at_risk_pct ?? 20;

  return (
    <div className="campus-dashboard-container" style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Top Banner Header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '1.25rem 2rem',
        marginBottom: '1.75rem',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-40%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <div style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                padding: '7px',
                borderRadius: '10px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={22} />
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#f8fafc' }}>
                {institution.name}
              </h1>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                BATCH OF {institution.batch_year || 2026}
              </span>
              {isFounder && (
                <span className="badge" style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.4)', fontSize: '0.75rem' }}>
                  👑 Founder Preview
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={15} /> Placement Officer Command Center & Campus Drive Screener
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
              <span>{institution.city}, {institution.state}</span>
            </p>
          </div>

          {/* Quick Actions in Right Corner */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {/* Onboard Batch Modal Button */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', padding: '0.5rem 0.95rem', height: '38px' }}
            >
              <QrCode size={15} /> Onboard Students
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '0.5rem'
        }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.5rem 1rem',
              color: activeTab === 'overview' ? '#818cf8' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'overview' ? '2px solid #818cf8' : '2px solid transparent',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BarChart3 size={16} /> 1. Batch Readiness
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.5rem 1rem',
              color: activeTab === 'heatmap' ? '#818cf8' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'heatmap' ? '2px solid #818cf8' : '2px solid transparent',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <BrainCircuit size={16} /> 2. Skill Gap Heatmap
          </button>
          <button
            onClick={() => setActiveTab('screener')}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '0.5rem 1rem',
              color: activeTab === 'screener' ? '#818cf8' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'screener' ? '2px solid #818cf8' : '2px solid transparent',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Filter size={16} /> 3. Drive Screener ({students.length})
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: BATCH READINESS OVERVIEW                                       */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div>
          {/* Rectangular KPI Cards Grid (3 Per Row, Identical Alignment) */}
          <div className="campus-kpi-grid">
            {/* Card 1: Total Enrolled Students */}
            <div
              className="card"
              style={{
                padding: '1.4rem 1.6rem',
                borderLeft: '4px solid #6366f1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '165px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onClick={() => { setReadinessFilter('all'); setActiveTab('screener'); }}
              title="Click to view all enrolled candidates in Screener"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: '1.25rem', display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Total Enrolled Batch
                      </span>
                    </div>
                    <div style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: '#f8fafc',
                      marginTop: '0.45rem',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px'
                    }}>
                      <span>{totalStudents}</span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        (100%)
                      </span>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    padding: '10px',
                    borderRadius: '12px',
                    color: '#818cf8',
                    flexShrink: 0
                  }}>
                    <Users size={22} />
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <Check size={14} style={{ color: '#818cf8' }} />
                <span>Apex Institute of Technology • Batch 2026</span>
              </div>
            </div>

            {/* Card 2: Drive-Ready Candidates */}
            <div
              className="card"
              style={{
                padding: '1.4rem 1.6rem',
                borderLeft: '4px solid #22c55e',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '165px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onClick={() => { setReadinessFilter('Drive-Ready'); setActiveTab('screener'); }}
              title="Click to view Drive-Ready candidates in Screener"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: '1.25rem', display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Drive-Ready Candidates
                      </span>
                    </div>
                    <div style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: '#4ade80',
                      marginTop: '0.45rem',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px'
                    }}>
                      <span>{driveReadyCount}</span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        ({driveReadyPct}%)
                      </span>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.15)',
                    padding: '10px',
                    borderRadius: '12px',
                    color: '#4ade80',
                    flexShrink: 0
                  }}>
                    <ShieldCheck size={22} />
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <TrendingUp size={14} style={{ color: '#4ade80' }} />
                <span>ATS ≥ 80 & Mock Interview ≥ 75%</span>
              </div>
            </div>

            {/* Card 3: In-Progress / Developing */}
            <div
              className="card"
              style={{
                padding: '1.4rem 1.6rem',
                borderLeft: '4px solid #eab308',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '165px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onClick={() => { setReadinessFilter('Needs Polish'); setActiveTab('screener'); }}
              title="Click to view Developing / Needs Polish candidates in Screener"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: '1.25rem', display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        In-Progress / Developing
                      </span>
                    </div>
                    <div style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: '#facc15',
                      marginTop: '0.45rem',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px'
                    }}>
                      <span>{needsPolishCount}</span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        ({needsPolishPct}%)
                      </span>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(234, 179, 8, 0.15)',
                    padding: '10px',
                    borderRadius: '12px',
                    color: '#facc15',
                    flexShrink: 0
                  }}>
                    <Sparkles size={22} />
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <Sparkles size={14} style={{ color: '#facc15' }} />
                <span>Moderate: ATS 60–79 or Mock 60–74%</span>
              </div>
            </div>

            {/* Card 4: Critical At-Risk */}
            <div
              className="card"
              style={{
                padding: '1.4rem 1.6rem',
                borderLeft: '4px solid #ef4444',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '165px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onClick={() => { setReadinessFilter('Critical At-Risk'); setActiveTab('screener'); }}
              title="Click to view Critical At-Risk candidates in Screener"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: '1.25rem', display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Critical At-Risk
                      </span>
                    </div>
                    <div style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: '#f87171',
                      marginTop: '0.45rem',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px'
                    }}>
                      <span>{atRiskCount}</span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        ({atRiskPct}%)
                      </span>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    padding: '10px',
                    borderRadius: '12px',
                    color: '#f87171',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={22} />
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: '#fca5a5',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <AlertTriangle size={14} style={{ color: '#f87171' }} />
                <span>Requires urgent counseling / workshop</span>
              </div>
            </div>

            {/* Card 5: Average Batch ATS Score (Separated Cell 1) */}
            <div
              className="card"
              style={{
                padding: '1.4rem 1.6rem',
                borderLeft: '4px solid #3b82f6',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '165px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onClick={() => setActiveTab('screener')}
              title="Click to view Candidate Screener"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: '1.25rem', display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Average Batch ATS Score
                      </span>
                    </div>
                    <div style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: '#f8fafc',
                      marginTop: '0.45rem',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px'
                    }}>
                      <span>{metrics?.avg_ats_score || '78.4'}</span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        / 100
                      </span>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    padding: '10px',
                    borderRadius: '12px',
                    color: '#60a5fa',
                    flexShrink: 0
                  }}>
                    <Award size={22} />
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <Award size={14} style={{ color: '#60a5fa' }} />
                <span>Aggregated across verified resumes</span>
              </div>
            </div>

            {/* Card 6: Mock Interview Proficiency (Separated Cell 2) */}
            <div
              className="card"
              style={{
                padding: '1.4rem 1.6rem',
                borderLeft: '4px solid #a855f7',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '165px',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
              onClick={() => setActiveTab('screener')}
              title="Click to view Candidate Screener"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: '1.25rem', display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        Mock Interview Proficiency
                      </span>
                    </div>
                    <div style={{
                      fontSize: '2.25rem',
                      fontWeight: 800,
                      color: '#f8fafc',
                      marginTop: '0.45rem',
                      lineHeight: '1',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '6px'
                    }}>
                      <span>{metrics?.avg_mock_score || '75.5'}</span>
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        %
                      </span>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(168, 85, 247, 0.15)',
                    padding: '10px',
                    borderRadius: '12px',
                    color: '#c084fc',
                    flexShrink: 0
                  }}>
                    <BrainCircuit size={22} />
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <BrainCircuit size={14} style={{ color: '#c084fc' }} />
                <span>Technical, STAR rubric & communication</span>
              </div>
            </div>
          </div>

          {/* Placement Pipeline Funnel */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} className="text-primary-accent" /> Campus Placement Pipeline Funnel
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                { label: '1. Registered Students', count: metrics?.funnel?.registered ?? totalStudents, color: '#6366f1' },
                { label: '2. Resumes Analyzed', count: metrics?.funnel?.resumes_analyzed ?? totalStudents, color: '#3b82f6' },
                { label: '3. Mock Completed', count: metrics?.funnel?.mock_completed ?? totalStudents, color: '#a855f7' },
                { label: '4. Shortlisted for Drives', count: metrics?.funnel?.shortlisted ?? 5, color: '#eab308' },
                { label: '5. Offers Placed', count: metrics?.funnel?.offers_secured ?? 1, color: '#22c55e' }
              ].map((stage, i) => {
                const pctValue = totalStudents > 0 ? Math.round(((stage.count || 0) / totalStudents) * 100) : 0;
                return (
                  <div key={i} style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    padding: '1.2rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {stage.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: stage.color }}>
                        {pctValue}%
                      </span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: stage.color }}>
                      {stage.count}
                    </div>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '2px',
                      marginTop: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ width: `${pctValue}%`, height: '100%', background: stage.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department Breakdown Bar */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={18} className="text-primary-accent" /> Branch-wise Performance Benchmarks
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.25rem' }}>
              {(metrics?.branch_breakdown || [
                { branch: 'CSE', students: 4, avg_ats: 87.5, avg_mock: 84.5 },
                { branch: 'IT', students: 2, avg_ats: 75.5, avg_mock: 71.5 },
                { branch: 'AI-DS', students: 2, avg_ats: 85.0, avg_mock: 82.0 },
                { branch: 'ECE', students: 2, avg_ats: 56.5, avg_mock: 55.0 }
              ]).map((b, idx) => (
                <div key={idx} style={{
                  padding: '1.25rem',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc' }}>{b.branch}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>{b.students} Enrolled</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Avg ATS Score:</span>
                    <strong style={{ color: b.avg_ats >= 80 ? '#4ade80' : b.avg_ats >= 65 ? '#facc15' : '#f87171' }}>
                      {b.avg_ats} / 100
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Avg Mock Score:</span>
                    <strong style={{ color: b.avg_mock >= 75 ? '#4ade80' : b.avg_mock >= 60 ? '#facc15' : '#f87171' }}>
                      {b.avg_mock}%
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: SKILL GAP HEATMAP (CURRICULUM DIAGNOSTIC)                       */}
      {/* ==================================================================== */}
      {activeTab === 'heatmap' && (
        <div>
          {/* Critical Curriculum Alert Card */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.12))',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '14px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ background: '#ef4444', color: '#fff', padding: '8px', borderRadius: '10px' }}>
              <AlertTriangle size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fecaca' }}>
                Curriculum Intervention Alert: Cloud & System Design Gap
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#fca5a5' }}>
                System Design and Containerization (Docker/AWS) proficiency is at only <strong>31% overall</strong> across all branches. 
                TPO action recommended: Schedule a 2-day boot camp before upcoming Tier-1 company drives.
              </p>
            </div>
            <button
              onClick={() => {
                setBranchFilter('all');
                setSkillSearch('Docker');
                setActiveTab('screener');
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
            >
              Filter Cloud Candidates
            </button>
          </div>

          {/* Matrix Table */}
          <div className="card" style={{ padding: '1.75rem', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Curriculum Competency Diagnostic Matrix
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Branch-wise technical readiness aggregated from student resume code extractions and AI mock assessments.
                </p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Skill Competency Domain</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Domain Area</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>CSE</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>IT</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>AI-DS</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>ECE</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'center' }}>Batch Avg</th>
                  <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>TPO Action Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {skillsMatrix.map((item, idx) => {
                  const getCellColor = (pct) => {
                    if (pct >= 75) return { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' };
                    if (pct >= 55) return { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)' };
                    return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
                  };

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                        {item.skill}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <span className="badge badge-neutral">{item.category}</span>
                      </td>
                      {['CSE', 'IT', 'AI-DS', 'ECE'].map((b) => {
                        const score = item.branches[b] || 0;
                        const style = getCellColor(score);
                        return (
                          <td key={b} style={{ padding: '1rem', textAlign: 'center' }}>
                            <span style={{
                              background: style.bg,
                              color: style.text,
                              border: `1px solid ${style.border}`,
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontWeight: 700,
                              fontSize: '0.85rem'
                            }}>
                              {score}%
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <strong style={{ fontSize: '0.95rem', color: item.overall >= 70 ? '#4ade80' : item.overall >= 50 ? '#facc15' : '#f87171' }}>
                          {item.overall}%
                        </strong>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '280px' }}>
                        {item.recommendation}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: DRIVE SCREENER & STUDENT ROSTER TABLE                          */}
      {/* ==================================================================== */}
      {activeTab === 'screener' && (
        <div>
          {/* Screener Controls Filter Bar */}
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={18} className="text-primary-accent" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  Visiting Company Drive Screener
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                  {students.length} Candidates Qualified
                </span>
                <button
                  onClick={handleExportCsv}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={14} /> Export Filtered List (CSV)
                </button>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
              gap: '1rem',
              alignItems: 'flex-end'
            }}>
              {/* Search by Name/Roll Number */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Search Student / Roll No
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', color: '#64748b', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="e.g. Aarav, AIT-22..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{
                      height: '42px',
                      paddingLeft: '38px',
                      paddingRight: '12px',
                      fontSize: '0.875rem',
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      width: '100%',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px', display: 'flex' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Department / Branch
                </label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="form-select"
                  style={{
                    height: '42px',
                    fontSize: '0.875rem',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    width: '100%',
                    padding: '0 12px',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <option value="all">All Departments</option>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="IT">Information Tech (IT)</option>
                  <option value="AI-DS">AI & Data Science (AI-DS)</option>
                  <option value="ECE">Electronics (ECE)</option>
                </select>
              </div>

              {/* Minimum CGPA */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Min CGPA: <strong style={{ color: '#818cf8' }}>{minCgpa > 0 ? `${minCgpa}+` : 'Any'}</strong>
                </label>
                <select
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(Number(e.target.value))}
                  className="form-select"
                  style={{
                    height: '42px',
                    fontSize: '0.875rem',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    width: '100%',
                    padding: '0 12px',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <option value={0}>No CGPA Cutoff</option>
                  <option value={7.0}>≥ 7.0 CGPA</option>
                  <option value={7.5}>≥ 7.5 CGPA</option>
                  <option value={8.0}>≥ 8.0 CGPA</option>
                  <option value={8.5}>≥ 8.5 CGPA (Tier-1)</option>
                </select>
              </div>

              {/* Minimum ATS Resume Score */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Min ATS Score: <strong style={{ color: '#818cf8' }}>{minAts > 0 ? `${minAts}+` : 'Any'}</strong>
                </label>
                <select
                  value={minAts}
                  onChange={(e) => setMinAts(Number(e.target.value))}
                  className="form-select"
                  style={{
                    height: '42px',
                    fontSize: '0.875rem',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    width: '100%',
                    padding: '0 12px',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <option value={0}>No ATS Cutoff</option>
                  <option value={70}>≥ 70 ATS Score</option>
                  <option value={80}>≥ 80 (Drive-Ready Only)</option>
                  <option value={85}>≥ 85 (Top ATS)</option>
                </select>
              </div>

              {/* Placement Readiness Tier Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Readiness: <strong style={{ color: readinessFilter === 'Drive-Ready' ? '#4ade80' : readinessFilter === 'Needs Polish' ? '#facc15' : readinessFilter === 'Critical At-Risk' ? '#f87171' : '#818cf8' }}>
                    {readinessFilter === 'all' ? 'All Tiers' : readinessFilter}
                  </strong>
                </label>
                <select
                  value={readinessFilter}
                  onChange={(e) => setReadinessFilter(e.target.value)}
                  className="form-select"
                  style={{
                    height: '42px',
                    fontSize: '0.875rem',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    width: '100%',
                    padding: '0 12px',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
                  }}
                >
                  <option value="all">All Tiers ({totalStudents})</option>
                  <option value="Drive-Ready">Drive-Ready ({driveReadyCount})</option>
                  <option value="Needs Polish">In-Progress / Developing ({needsPolishCount})</option>
                  <option value="Critical At-Risk">Critical At-Risk ({atRiskCount})</option>
                </select>
              </div>

              {/* Skill Keyword Screener */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Must Know Tech Skill
                </label>
                <input
                  type="text"
                  placeholder="e.g. Python, Docker, React"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="form-input"
                  style={{
                    height: '42px',
                    fontSize: '0.875rem',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    width: '100%',
                    padding: '0 12px',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Candidate Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Roll No / Branch</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>CGPA</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>ATS Score</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Mock Score</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Readiness Tier</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Top Skills</th>
                    <th style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No candidates match the specified screener cutoffs. Try relaxing the CGPA or ATS criteria.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const atsBadgeColor = student.ats_score >= 80 ? '#4ade80' : student.ats_score >= 65 ? '#facc15' : '#f87171';
                      const readinessColor = student.readiness_tier === 'Drive-Ready' ? 'badge-green' :
                                             student.readiness_tier === 'Needs Polish' ? 'badge-yellow' : 'badge-red';

                      return (
                        <tr
                          key={student.id}
                          style={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            transition: 'background 0.15s',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleOpenDrilldown(student)}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {/* Name & Target Role */}
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                              {student.full_name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {student.target_role}
                            </div>
                          </td>

                          {/* Roll No / Branch */}
                          <td style={{ padding: '1rem' }}>
                            <span className="badge badge-purple" style={{ fontSize: '0.75rem', marginRight: '6px' }}>
                              {student.branch}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {student.roll_number}
                            </span>
                          </td>

                          {/* CGPA */}
                          <td style={{ padding: '1rem' }}>
                            <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                              {Number(student.cgpa || 0).toFixed(2)}
                            </strong>
                          </td>

                          {/* ATS Score */}
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ fontSize: '0.95rem', color: atsBadgeColor }}>
                                {student.ats_score}
                              </strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/100</span>
                            </div>
                          </td>

                          {/* Mock Score */}
                          <td style={{ padding: '1rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: student.mock_score >= 75 ? '#4ade80' : '#facc15' }}>
                              {student.mock_score}%
                            </strong>
                          </td>

                          {/* Readiness Tier */}
                          <td style={{ padding: '1rem' }}>
                            <span className={`badge ${readinessColor}`} style={{ fontSize: '0.75rem' }}>
                              {student.readiness_tier}
                            </span>
                          </td>

                          {/* Top Skills */}
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '240px' }}>
                              {student.top_skills.slice(0, 3).map((sk, i) => (
                                <span key={i} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                                  {sk}
                                </span>
                              ))}
                              {student.top_skills.length > 3 && (
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                  +{student.top_skills.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action */}
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDrilldown(student);
                              }}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              Inspect <ChevronRight size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 360° STUDENT DRILLDOWN DRAWER MODAL                                   */}
      {/* ==================================================================== */}
      {selectedStudent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 50
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: '#0f172a',
            borderLeft: '1px solid rgba(99, 102, 241, 0.3)',
            height: '100%',
            overflowY: 'auto',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-purple" style={{ fontSize: '0.75rem', marginBottom: '6px' }}>
                  {selectedStudent.branch} • {selectedStudent.roll_number}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0', color: '#f8fafc' }}>
                  {selectedStudent.full_name}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  {selectedStudent.email} • CGPA: <strong>{selectedStudent.cgpa}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* TPO Placement Officer Tags */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1.5rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                <Tag size={12} style={{ display: 'inline', marginRight: '4px' }} /> TPO Officer Tags
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['Starred Candidate', 'Drive-Ready', 'Needs Remedial Workshop', 'Verified CGPA'].map((tag) => {
                  const isActive = selectedStudent.tpo_tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      style={{
                        background: isActive ? '#6366f1' : 'rgba(255,255,255,0.05)',
                        color: isActive ? '#fff' : 'var(--text-muted)',
                        border: `1px solid ${isActive ? '#818cf8' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: '20px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {isActive ? '✓ ' : '+ '} {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resume Analysis Audit Section */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={16} className="text-primary-accent" /> Resume ATS Breakdown
              </h4>
              <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.7)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target Role:</span>
                  <strong style={{ fontSize: '0.85rem', color: '#818cf8' }}>{selectedStudent.target_role}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ATS Score:</span>
                  <strong style={{ fontSize: '1.1rem', color: selectedStudent.ats_score >= 80 ? '#4ade80' : '#facc15' }}>
                    {selectedStudent.ats_score} / 100
                  </strong>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Detected Strong Keywords:
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {selectedStudent.top_skills.map((s, i) => (
                      <span key={i} className="badge badge-green" style={{ fontSize: '0.7rem' }}>{s}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#f87171', display: 'block', marginBottom: '4px' }}>
                    Critical Missing Keywords (Gaps):
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {selectedStudent.missing_skills.map((s, i) => (
                      <span key={i} className="badge badge-red" style={{ fontSize: '0.7rem' }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Mock Interview Rubric Audit */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BrainCircuit size={16} className="text-primary-accent" /> AI Mock Interview Evaluation
              </h4>
              <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.7)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Technical</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#818cf8', marginTop: '2px' }}>
                      {selectedStudent.mock_details?.technical}%
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STAR Structure</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#a855f7', marginTop: '2px' }}>
                      {selectedStudent.mock_details?.star_structure}%
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Communication</span>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4ade80', marginTop: '2px' }}>
                      {selectedStudent.mock_details?.communication}%
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                  <strong>Evaluator Note:</strong> {selectedStudent.mock_details?.feedback}
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
              <button
                onClick={() => setSelectedStudent(null)}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 5: BATCH ONBOARDING MODAL                                     */}
      {/* ==================================================================== */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 50
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2rem', background: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={22} className="text-primary-accent" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  Onboard Your Student Batch
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Project this invite code in your classroom or share the direct link with student coordinators. 
              Students who register with this code are automatically placed in your college placement roster.
            </p>

            {/* QR Code / Code Box */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: '2px dashed rgba(99, 102, 241, 0.4)',
              borderRadius: '14px',
              padding: '1.75rem',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Batch Registration Code
              </span>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                color: '#818cf8',
                fontFamily: 'monospace',
                letterSpacing: '0.1em',
                margin: '0.5rem 0'
              }}>
                {institution.invite_code}
              </div>
              <button
                onClick={copyInviteCode}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {copiedCode ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                {copiedCode ? 'Copied Code!' : 'Copy Code'}
              </button>
            </div>

            {/* Direct Join Link */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                Direct Join URL for WhatsApp / Email
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/join/${institution.invite_code.toLowerCase()}`}
                  className="form-input"
                  style={{ fontSize: '0.85rem', color: '#818cf8', background: 'rgba(15, 23, 42, 0.85)' }}
                />
                <button
                  onClick={copyBatchUrl}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  {copiedUrl ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default CampusDashboard;
