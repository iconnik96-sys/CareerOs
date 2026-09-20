import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { analysisService } from '../services/analysisService';
import { resumeService } from '../services/resumeService';
import { extractSkillsFromText } from '../utils/skillExtractor';
import { Sparkles, CheckCircle2, AlertTriangle, FileText, RefreshCw, Award, Lightbulb, ArrowRight, Upload, Edit3, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CircularProgress } from '../components/common/CircularProgress';
import { ProgressBar } from '../components/common/ProgressBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
export const ResumeAnalysisPage = () => {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState('');
  const targetRoleName = profile?.target_role || 'Software Engineer';
  // Extract skills strictly and dynamically from the active resume text (Unconditional hook call)
  const detectedSkills = useMemo(() => {
    const textToScan = editedText || resume?.parsed_text || '';
    if (textToScan && textToScan.trim().length > 0) {
      const extracted = extractSkillsFromText(textToScan);
      if (extracted.length > 0)
        return extracted;
    }
    if (analysis?.detected_skills && analysis.detected_skills.length > 0) {
      return analysis.detected_skills;
    }
    return [];
  }, [resume?.parsed_text, editedText, analysis?.detected_skills]);
  const loadData = async () => {
    if (!user?.id)
      return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const [resData, anaData] = await Promise.all([
        resumeService.getResume(user.id),
        analysisService.getLatestResumeAnalysis(user.id)
      ]);
      setResume(resData);
      setEditedText(resData?.parsed_text || '');
      let currentAnalysis = anaData;
      // If we have a resume but no analysis record yet, generate it automatically
      if (!currentAnalysis && resData?.parsed_text && resData.parsed_text.trim().length > 10) {
        try {
          currentAnalysis = await analysisService.runResumeAnalysis(user.id, resData.id, resData.parsed_text, targetRoleName);
        }
        catch (autoErr) {
          console.warn('Auto initial analysis notice:', autoErr);
        }
      }
      if (currentAnalysis && resData?.parsed_text) {
        if (!currentAnalysis.detected_skills || currentAnalysis.detected_skills.length === 0) {
          currentAnalysis = {
            ...currentAnalysis,
            detected_skills: extractSkillsFromText(resData.parsed_text)
          };
        }
      }
      setAnalysis(currentAnalysis);
    }
    catch (err) {
      console.error('Failed to load resume analysis data:', err);
      setErrorMsg(err?.message || 'Failed to load resume analysis data.');
    }
    finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, [user?.id]);
  const handleRunAnalysis = async (customText) => {
    if (!resume && !customText) {
      showToast('Please upload a resume first', 'warning');
      return;
    }
    if (!user?.id)
      return;
    setAnalyzing(true);
    setErrorMsg(null);
    const role = profile?.target_role || 'Software Engineer';
    const textToAnalyze = customText || resume?.parsed_text || '';
    try {
      const result = await analysisService.runResumeAnalysis(user.id, resume?.id, textToAnalyze, role);
      setAnalysis(result);
      showToast('Resume analysis updated successfully via AI!', 'success');
    }
    catch (err) {
      console.error('Resume AI analysis failed:', err);
      const msg = err?.message || 'Analysis failed. Please verify that the AI backend is running.';
      setErrorMsg(msg);
      showToast(msg, 'error', 'Analysis Error');
    }
    finally {
      setAnalyzing(false);
    }
  };
  const handleSaveAndReanalyzeText = async () => {
    if (!editedText.trim()) {
      showToast('Resume text cannot be empty', 'warning');
      return;
    }
    if (!user?.id)
      return;
    if (resume) {
      await resumeService.updateResumeText(user.id, resume.id, editedText);
      setResume(prev => prev ? { ...prev, parsed_text: editedText } : null);
    }
    setIsEditingText(false);
    await handleRunAnalysis(editedText);
  };
  if (loading) {
    return (<div className="page-container">
      <LoadingSpinner message="Retrieving latest resume analysis..." />
    </div>);
  }
  if (!resume && !analysis) {
    return (<div className="page-container">
      <EmptyState icon={<FileText size={32} />} title="No Resume Found" description="Upload your resume to generate an instant AI evaluation and benchmark your technical skills." actionText="Upload Resume" actionIcon={<Upload size={16} />} onAction={() => navigate('/resume')} />
    </div>);
  }
  const score = analysis?.match_score || 78;
  return (<div className="page-container">
    <div className="page-header">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-purple">
            <Sparkles size={12} /> AI Evaluation
          </span>
          <span className="text-sm text-muted">
            Target Role: <strong>{profile?.target_role || 'Java Backend Developer'}</strong>
          </span>
        </div>
        <h1 className="page-title">Resume Analysis</h1>
        <p className="page-subtitle">
          Deep scan of ATS keywords, technical stack strength, and actionable bullet improvements.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={() => handleRunAnalysis()} isLoading={analyzing} leftIcon={<RefreshCw size={16} />}>
          Re-Analyze Resume
        </Button>
        <Link to="/job-analyzer">
          <Button variant="outline" rightIcon={<ArrowRight size={16} />}>
            Compare with Job Description
          </Button>
        </Link>
      </div>
    </div>

    {/* Extracted Resume Text Drawer */}
    {resume && (<Card style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowRawText(!showRawText)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={18} className="text-primary-accent" />
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Active Resume Source: {resume.file_name}
            </span>
            <span className="text-xs text-muted" style={{ marginLeft: '0.75rem' }}>
              ({(resume.parsed_text || '').split(/\s+/).filter(Boolean).length} words parsed)
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            setIsEditingText(!isEditingText);
            setShowRawText(true);
          }} leftIcon={<Edit3 size={13} />}>
            {isEditingText ? 'Done Editing' : 'Edit Text'}
          </Button>
          <button className="btn-ghost" style={{ padding: '4px', color: 'var(--text-muted)' }}>
            {showRawText ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {showRawText && (<div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', animation: 'fadeIn 0.2s ease' }}>
        {isEditingText ? (<div>
          <textarea className="form-textarea" rows={6} value={editedText} onChange={(e) => setEditedText(e.target.value)} style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="outline" size="sm" onClick={() => setIsEditingText(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveAndReanalyzeText} leftIcon={<Check size={14} />}>
              Save & Re-Score
            </Button>
          </div>
        </div>) : (<div style={{
          maxHeight: '180px',
          overflowY: 'auto',
          padding: '0.85rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.5,
          fontFamily: 'monospace'
        }}>
          {resume.parsed_text || 'No extracted text found.'}
        </div>)}
      </div>)}
    </Card>)}

    {analyzing ? (<Card>
      <LoadingSpinner size={36} message="Analyzing resume syntax, technical keywords, and project impact..." />
    </Card>) : (<div className="grid grid-cols-12" style={{ gap: '1.5rem' }}>
      {/* Left Column: Score Gauge & Skill Breakdown */}
      <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Score Card */}
        <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.25rem 1.5rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Overall Resume Score
          </span>
          <CircularProgress percentage={score} size={160} strokeWidth={12} label="Score" subtitle="/ 100" />
          <div style={{ marginTop: '1.5rem' }}>
            <span className={`badge ${score >= 80 ? 'badge-success' : score >= 65 ? 'badge-primary' : 'badge-warning'}`} style={{ marginBottom: '0.5rem' }}>
              <Award size={13} /> {score >= 80 ? 'Competitive for Placement Shortlists' : score >= 65 ? 'Solid Foundation — Address Gaps' : 'Needs Optimization'}
            </span>
            <p className="text-body text-xs" style={{ maxWidth: '280px', margin: '0 auto' }}>
              Addressing high-priority skill gaps below can boost your ATS match score to <strong>~90/100</strong>.
            </p>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card title="Category Breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {analysis?.skill_breakdown && analysis.skill_breakdown.length > 0 ? (analysis.skill_breakdown.map((cat, idx) => (<div key={idx}>
              <ProgressBar label={cat.category} value={cat.score} color={cat.score >= 80 ? '#10b981' : cat.score >= 60 ? '#3b82f6' : '#f59e0b'} />
            </div>))) : (<p className="text-xs text-muted">Click <strong>Re-Analyze Resume</strong> above to generate category scores.</p>)}
          </div>
        </Card>

        {/* Detected Skills */}
        <Card title="Detected Skills">
          <p className="text-body text-xs" style={{ marginBottom: '0.75rem' }}>
            Extracted directly from your uploaded resume projects and technical summary:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {detectedSkills.length > 0 ? (detectedSkills.map(sk => (<span key={sk} className="badge badge-neutral" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8125rem' }}>
              {sk}
            </span>))) : (<span className="text-xs text-muted">No specific technologies detected. Add technical keywords to your resume.</span>)}
          </div>
        </Card>
      </div>

      {/* Right Column: Strengths, Improvements, AI Suggestions */}
      <div className="col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Strengths */}
        <Card title="Key Strengths" icon={<CheckCircle2 size={18} className="text-success" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analysis?.strengths && analysis.strengths.length > 0 ? (analysis.strengths.map((str, idx) => (<div key={idx} style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <CheckCircle2 size={18} className="text-success" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {str}
              </span>
            </div>))) : (<p className="text-xs text-muted">Click <strong>Re-Analyze Resume</strong> to generate AI key strengths.</p>)}
          </div>
        </Card>

        {/* Improvements / Skill Gaps */}
        <Card title="Areas for Improvement" icon={<AlertTriangle size={18} className="text-warning" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {analysis?.missing_skills && analysis.missing_skills.length > 0 ? (analysis.missing_skills.map((imp, idx) => (<div key={idx} style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <AlertTriangle size={18} className="text-warning" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {imp}
              </span>
            </div>))) : (<p className="text-xs text-muted">No critical gaps identified yet. Click <strong>Re-Analyze Resume</strong> for an audit.</p>)}
          </div>
        </Card>

        {/* Actionable AI Suggestions */}
        <Card title="AI Recommendations" icon={<Lightbulb size={18} className="text-primary-accent" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {analysis?.recommendations && analysis.recommendations.length > 0 ? (analysis.recommendations.map((rec, idx) => (<div key={idx} style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {idx + 1}
              </div>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {rec}
              </span>
            </div>))) : (<p className="text-xs text-muted">Click <strong>Re-Analyze Resume</strong> to generate tailored action items.</p>)}
          </div>
        </Card>
      </div>
    </div>)}
  </div>);
};
