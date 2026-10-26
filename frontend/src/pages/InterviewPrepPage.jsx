import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { interviewService } from '../services/interviewService';
import { aiFastApiService } from '../services/aiFastApiService';
import { profileService } from '../services/profileService';
import { getRoleSlug, getRoleDisplayName, ROLE_TOPICS_MAP, calculateCareerReadiness } from '../utils/careerRoles';
import {
  Sparkles, CheckCircle2, Eye, EyeOff, Lightbulb, Check, RefreshCw, Send,
  HelpCircle, Plus, Mic, Play, Radio, Filter, SlidersHorizontal, Keyboard,
  X, ChevronDown, ChevronUp, ArrowRight, BookOpen, Cpu, Code, MessageSquare,
  Headphones, CheckCircle, FileText, ChevronLeft, ChevronRight, Download,
  Award, Activity, ListChecks, Target, RotateCcw, AlertTriangle, Flame,
  Gift, Lock
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { LiveInterviewModal, INTERVIEW_MODES } from '../components/interview/LiveInterviewModal';
import { useSubscription } from '../contexts/SubscriptionContext';
import { downloadInterviewReportPdf } from '../utils/interviewPdfExport';
import { InconvenienceNotice } from '../components/common/InconvenienceNotice';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const QUESTION_COUNTS = [5, 10, 15, 20];

export const InterviewPrepPage = () => {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const {
    currentPlan,
    usage,
    totalVoiceInterviewsAllowed,
    checkFeatureAccess,
    triggerUpgradeModal,
    recordUsage,
    setIsReferralModalOpen
  } = useSubscription();

  const targetRole = profile?.target_role || 'Backend Developer';
  const roleSlug = getRoleSlug(targetRole);
  const roleDisplayName = getRoleDisplayName(roleSlug);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');
  const urlTrack = searchParams.get('track');

  // Interview Navigation Mode: 'voice' | 'text'
  const [interviewMode, setInterviewMode] = useState(urlMode === 'text' ? 'text' : 'voice');
  const [selectedTrack, setSelectedTrack] = useState(urlTrack && INTERVIEW_MODES.some(m => m.id === urlTrack) ? urlTrack : 'TECHNICAL');
  const [filterOpen, setFilterOpen] = useState(false);

  const [role, setRole] = useState(targetRole);
  const [difficulty, setDifficulty] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [revealedIds, setRevealedIds] = useState([]);
  const [masteredIds, setMasteredIds] = useState([]);
  const [liveModalOpen, setLiveModalOpen] = useState(false);

  const handleOpenVoiceModal = (trackId = null) => {
    const access = checkFeatureAccess('voice_interview');
    if (!access.allowed) {
      triggerUpgradeModal(access);
      return;
    }
    if (trackId) {
      setSelectedTrack(trackId);
    }
    recordUsage('voice_interview');
    setLiveModalOpen(true);
  };

  // Sequential Interactive Technical Assessment State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testEvaluation, setTestEvaluation] = useState(null);
  const [testEvaluationError, setTestEvaluationError] = useState(null);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [showConceptHook, setShowConceptHook] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reviewTab, setReviewTab] = useState('overview'); // 'overview' | 'breakdown' | 'tips'

  // Sync mode and track with URL search params when changed externally (e.g. Sidebar dropdown)
  useEffect(() => {
    if (urlMode === 'voice' || urlMode === 'text') {
      setInterviewMode(urlMode);
    }
    if (urlTrack && INTERVIEW_MODES.some(m => m.id === urlTrack)) {
      setSelectedTrack(urlTrack);
    }
  }, [urlMode, urlTrack]);

  const handleSelectMode = (newMode) => {
    setInterviewMode(newMode);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('mode', newMode);
      return next;
    });
  };

  const handleSelectTrack = (trackId) => {
    setSelectedTrack(trackId);
    setSelectedTopic('All');
    setCurrentQIndex(0);
    setTestSubmitted(false);
    setTestEvaluation(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('track', trackId);
      return next;
    });
  };

  // Dynamic track topics based on active track
  const getTrackTopics = () => {
    if (selectedTrack === 'DSA_CODING') {
      return ['All', 'Arrays & HashMaps', 'Two Pointers & Sliding Window', 'Trees & Graphs', 'Dynamic Programming', 'Recursion & Backtracking'];
    }
    if (selectedTrack === 'BEHAVIORAL') {
      return ['All', 'Conflict Resolution', 'Team Collaboration', 'Overcoming Failure', 'Leadership & Ownership', 'Handling Deadlines'];
    }
    if (selectedTrack === 'SYSTEM_DESIGN') {
      return ['All', 'URL Shortener', 'Distributed Rate Limiter', 'Notification System', 'Real-Time Chat Engine', 'E-Commerce Cart'];
    }
    return ROLE_TOPICS_MAP[roleSlug] || ['All', 'Fundamentals', 'Architecture', 'Security', 'Testing'];
  };
  const topics = getTrackTopics();

  // Keep role in sync with authenticated user's profile role
  useEffect(() => {
    if (profile?.target_role) {
      setRole(profile.target_role);
      setSelectedTopic('All');
    }
  }, [profile?.target_role]);

  // AI Practice & Live Answer Evaluation State
  const [activePracticeId, setActivePracticeId] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [evaluatingId, setEvaluatingId] = useState(null);
  const [evaluations, setEvaluations] = useState({});

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await interviewService.getQuestions({
        role: role || targetRole,
        track: selectedTrack,
        difficulty,
        topic: selectedTopic,
        count: questionCount
      });
      const qList = Array.isArray(data) ? data : data?.questions || [];
      setQuestions(qList);
      setCurrentQIndex(prev => Math.min(prev, Math.max(0, qList.length - 1)));
    }
    catch (err) {
      console.error('Failed to fetch interview questions:', err);
      const msg = err?.message || 'Failed to fetch interview questions.';
      setError(msg);
      showToast(msg, 'error', 'Interview Questions Notice');
    }
    finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedTopic('All');
    setDifficulty('All');
    setQuestionCount(10);
    setCurrentQIndex(0);
    fetchQuestions();
  };

  const handleLoadMoreQuestions = async () => {
    setLoadingMore(true);
    try {
      const moreQuestions = await interviewService.generateMoreQuestions({
        role: role || targetRole,
        track: selectedTrack,
        difficulty,
        topic: selectedTopic,
        count: 5
      });
      if (moreQuestions && moreQuestions.length > 0) {
        setQuestions(prev => {
          const existingIds = new Set(prev.map(q => q.id));
          const newUnique = moreQuestions.filter(q => !existingIds.has(q.id));
          return [...prev, ...newUnique];
        });
        showToast(`Added ${moreQuestions.length} new practice questions! 🚀`, 'success');
      } else {
        showToast('No additional questions generated. Try adjusting filters.', 'info');
      }
    } catch (err) {
      console.error('Failed to generate more questions:', err);
      showToast('Failed to generate more questions. Please try again.', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [role, difficulty, selectedTopic, targetRole, questionCount, selectedTrack]);

  const toggleReveal = (qId) => {
    setRevealedIds(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]);
  };

  const togglePractice = (qId) => {
    setActivePracticeId(prev => prev === qId ? null : qId);
  };

  const toggleMastered = (qId) => {
    const isMastered = masteredIds.includes(qId);
    const updated = isMastered ? masteredIds.filter(id => id !== qId) : [...masteredIds, qId];
    setMasteredIds(updated);
    showToast(isMastered ? 'Marked for review' : 'Mastered! Practice score updated', isMastered ? 'info' : 'success');
  };

  const handleEvaluateAnswer = async (q) => {
    const answerText = userAnswers[q.id]?.trim();
    if (!answerText) {
      showToast('Please type your draft answer before evaluating.', 'warning');
      return;
    }
    setEvaluatingId(q.id);
    try {
      const result = await aiFastApiService.evaluateInterviewAnswer({
        question: q.question,
        candidate_answer: answerText,
        topic: q.topic,
        difficulty: q.difficulty,
        target_role: roleDisplayName
      });
      setEvaluations(prev => ({ ...prev, [q.id]: result }));
      showToast(`Evaluation complete: Score ${result.overall_score}/100 (${result.grade})`, 'success');
    }
    catch {
      showToast('Evaluation failed. Please try again.', 'error');
    }
    finally {
      setEvaluatingId(null);
    }
  };

  // Submit complete assessment for Senior Staff & Recruiter Honest Review
  const handleSubmitTest = async () => {
    const answeredItems = questions.filter(q => Boolean(userAnswers[q.id]?.trim()));
    if (answeredItems.length === 0) {
      showToast('Please write an answer for at least one question before submitting your assessment.', 'warning');
      return;
    }

    setSubmittingTest(true);
    setTestEvaluationError(null);
    const questionsPayload = questions.map((q, idx) => {
      const rawAns = userAnswers[q.id]?.trim() || '';
      return {
        id: String(q.id || `q_${idx + 1}`),
        question: q.question,
        candidate_answer: rawAns,
        status: rawAns ? 'ANSWERED' : 'SKIPPED',
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'Medium'
      };
    });

    try {
      const evalResult = await aiFastApiService.evaluateInterviewSession({
        target_role: roleDisplayName,
        interview_mode: selectedTrack || 'TECHNICAL',
        difficulty: difficulty === 'All' ? 'Medium' : difficulty,
        questions: questionsPayload
      });

      setTestEvaluation(evalResult);
      setTestSubmitted(true);
      showToast(`Assessment submitted! Score: ${evalResult.overall_score}/100 (${evalResult.grade})`, 'success');

      // Persist interview evaluation locally and update Career Readiness in Supabase
      try {
        localStorage.setItem('careeros_latest_interview_eval', JSON.stringify({
          overall_score: evalResult.overall_score,
          grade: evalResult.grade,
          date: new Date().toISOString()
        }));
        const uid = profile?.user_id;
        if (uid) {
          const newScore = calculateCareerReadiness([], targetRole, profile, {
            interviewScore: evalResult.overall_score,
            hasResume: Boolean(profile?.resume_url)
          });
          profileService.updateProfile(uid, { career_readiness: newScore });
        }
      } catch (syncErr) {
        console.warn('Could not auto-sync readiness score to Supabase:', syncErr);
      }
    } catch (err) {
      console.error('Final evaluation error:', err);
      setTestEvaluation(null);
      setTestSubmitted(false);
      setTestEvaluationError(err.message || 'AI assessment evaluation service is currently unavailable. No simulated score was generated.');
      showToast('AI assessment evaluation failed. Unverified fallback scores have been disabled.', 'error');
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!testEvaluation) return;
    setDownloadingPdf(true);
    try {
      await downloadInterviewReportPdf({
        evaluation: testEvaluation,
        targetRole: roleDisplayName,
        modeTitle: 'Written Technical & STAR Assessment',
        difficulty: difficulty,
        candidateName: profile?.full_name || 'Candidate',
        questions: questions,
        questionAttempts: testEvaluation.per_question_results || []
      });
      showToast('PDF Scorecard report downloaded successfully! 📄', 'success');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to export PDF report. Please try again.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleRetakeTest = () => {
    setTestSubmitted(false);
    setTestEvaluation(null);
    setCurrentQIndex(0);
    setUserAnswers({});
    showToast('Reset assessment. Ready for a fresh round!', 'info');
  };

  const getDifficultyBadgeVariant = (diff) => {
    switch (diff) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'danger';
      default: return 'neutral';
    }
  };

  return (<div className="page-container">
    <div className="page-header">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span className="badge badge-purple">
            <Sparkles size={12} /> Role-Calibrated Interview Preparation
          </span>
        </div>
        <h1 className="page-title">{roleDisplayName} Technical Interview Prep</h1>
        <p className="page-subtitle">
          Curated questions stored in the database for {roleDisplayName} candidates with real-time STAR AI answer evaluation.
        </p>
      </div>
    </div>

    {/* Primary Interview Mode Selection Options */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1rem',
      marginBottom: '1.75rem'
    }}>
      {/* Option 1: Live AI Voice Interview */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSelectMode('voice')}
        style={{
          cursor: 'pointer',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${interviewMode === 'voice' ? 'var(--primary)' : 'var(--border-color)'}`,
          backgroundColor: interviewMode === 'voice' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
          boxShadow: interviewMode === 'voice' ? '0 8px 24px -4px rgba(99, 102, 241, 0.25)' : 'none',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: interviewMode === 'voice' ? 'var(--primary)' : 'var(--bg-tertiary)',
            color: interviewMode === 'voice' ? '#fff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: interviewMode === 'voice' ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none',
            flexShrink: 0
          }}>
            <Mic size={24} className={interviewMode === 'voice' ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Live AI Voice Interview
              </h3>
              <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
                Live Audio
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Real-time spoken simulation with zero-latency AI examiner & verbal turn-taking.
            </p>
          </div>
        </div>
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: `2px solid ${interviewMode === 'voice' ? 'var(--primary)' : 'var(--border-color)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: interviewMode === 'voice' ? 'var(--primary)' : 'transparent',
          flexShrink: 0
        }}>
          {interviewMode === 'voice' && <Check size={13} color="#fff" strokeWidth={3} />}
        </div>
      </div>

      {/* Option 2: Typing or Text Interview */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => handleSelectMode('text')}
        style={{
          cursor: 'pointer',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${interviewMode === 'text' ? 'var(--primary)' : 'var(--border-color)'}`,
          backgroundColor: interviewMode === 'text' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
          boxShadow: interviewMode === 'text' ? '0 8px 24px -4px rgba(99, 102, 241, 0.25)' : 'none',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: interviewMode === 'text' ? 'var(--primary)' : 'var(--bg-tertiary)',
            color: interviewMode === 'text' ? '#fff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: interviewMode === 'text' ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none',
            flexShrink: 0
          }}>
            <Keyboard size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Typing & Text Interview
              </h3>
              <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                Self-Paced
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Curated role question bank with written response drafting & instant STAR AI evaluation.
            </p>
          </div>
        </div>
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: `2px solid ${interviewMode === 'text' ? 'var(--primary)' : 'var(--border-color)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: interviewMode === 'text' ? 'var(--primary)' : 'transparent',
          flexShrink: 0
        }}>
          {interviewMode === 'text' && <Check size={13} color="#fff" strokeWidth={3} />}
        </div>
      </div>
    </div>

    {/* Live Interview Arena Modal (always accessible) */}
    <LiveInterviewModal
      isOpen={liveModalOpen}
      onClose={() => setLiveModalOpen(false)}
      defaultRole={roleDisplayName}
      initialQuestions={questions}
    />

    {/* VIEW 1: LIVE AI VOICE INTERVIEW */}
    {interviewMode === 'voice' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Hero: AI Live Interactive Voice Mock Interview Arena */}
        <Card style={{
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(168, 85, 247, 0.09) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 30px -4px rgba(99, 102, 241, 0.18)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ maxWidth: '640px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span className="badge badge-purple" style={{ backgroundColor: 'var(--primary)', color: '#fff', fontWeight: 700 }}>
                  <Radio size={12} className="animate-pulse" /> ZERO-LATENCY INTERVIEW ARENA
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.725rem' }}>
                  Natural Voice Controls
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🎙️ Voice Sessions: {(usage?.voice_interviews_count || 0)} / {totalVoiceInterviewsAllowed} Used
                </span>
                <button
                  type="button"
                  onClick={() => setIsReferralModalOpen(true)}
                  style={{
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.35)',
                    color: '#c084fc',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Gift size={12} /> +2 Free Sessions with Referral
                </button>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0 0.5rem 0' }}>
                Practice Live Voice Interview with AI
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                Experience real-time verbal turn-taking across 4 tailored formats (Technical, DSA, Behavioral STAR, System Design). Includes natural conversational controls—say <em>"Could you repeat that?"</em> or click repeat anytime at zero token cost!
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => handleOpenVoiceModal()}
              leftIcon={<Mic size={20} />}
              style={{
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 800,
                boxShadow: '0 4px 18px rgba(99, 102, 241, 0.45)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              Launch AI Mock Interview
            </Button>
          </div>
        </Card>

        {/* 4 Formats Grid */}
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Available Voice Interview Tracks
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
              Practice simulated spoken rounds tailored for <strong>{roleDisplayName}</strong>.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem'
          }}>
            {INTERVIEW_MODES.map(mode => (
              <Card key={mode.id} style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {mode.icon}
                    </div>
                    <Badge variant={mode.id === 'TECHNICAL' ? 'primary' : 'neutral'}>
                      {mode.badge}
                    </Badge>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {mode.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 0.75rem 0' }}>
                    {mode.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {mode.topics?.slice(0, 3).map((top, tIdx) => (
                      <span key={tIdx} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }}>
                        {top}
                      </span>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenVoiceModal(mode.id)}
                  rightIcon={<ArrowRight size={14} />}
                  style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }}
                >
                  Start {mode.title.split('&')[0].trim()} Round
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* VIEW 2: TYPING & TEXT INTERVIEW */}
    {interviewMode === 'text' && (
      <div>
        {/* Interview Tracks Selector for Typing & Text Interview */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={16} className="text-primary-accent" />
              <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Interview Tracks
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
                {INTERVIEW_MODES.find(m => m.id === selectedTrack)?.title || 'Technical & Core CS'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Select a track to calibrate questions & assessment rubrics
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.85rem' }}>
            {INTERVIEW_MODES.map(track => {
              const isSelected = selectedTrack === track.id;
              return (
                <div
                  key={track.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectTrack(track.id)}
                  style={{
                    cursor: 'pointer',
                    padding: '1rem 1.15rem',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.09)' : 'var(--bg-secondary)',
                    boxShadow: isSelected ? '0 4px 18px rgba(99, 102, 241, 0.22)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {track.icon}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className={`badge ${isSelected ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                          {track.badge}
                        </span>
                        {isSelected && (
                          <CheckCircle2 size={15} className="text-primary" />
                        )}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', margin: '0 0 0.35rem 0' }}>
                      {track.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {track.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    {track.topics?.slice(0, 2).map((top, tIdx) => (
                      <span key={tIdx} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                        {top}
                      </span>
                    ))}
                    {(track.topics?.length || 0) > 2 && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', padding: '0.1rem 0.2rem' }}>
                        +{track.topics.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Consolidated Single Filter Button & Toolbar */}
        <Card style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Left: Summary & Active Filter Tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                  Curated Question Bank
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                  {questions.length} Questions
                </span>
              </div>

              {/* Active filter badges */}
              {(selectedTopic !== 'All' || difficulty !== 'All' || questionCount !== 10) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {selectedTopic !== 'All' && (
                    <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      Topic: {selectedTopic}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => setSelectedTopic('All')} />
                    </span>
                  )}
                  {difficulty !== 'All' && (
                    <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      {difficulty}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => setDifficulty('All')} />
                    </span>
                  )}
                  {questionCount !== 10 && (
                    <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      {questionCount} Qs
                      <X size={12} style={{ cursor: 'pointer' }} onClick={() => setQuestionCount(10)} />
                    </span>
                  )}
                  <button
                    onClick={() => { setSelectedTopic('All'); setDifficulty('All'); setQuestionCount(10); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: '0 4px' }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Right: The Single "Filter" Button + Refresh Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Button
                variant={filterOpen ? 'primary' : (selectedTopic !== 'All' || difficulty !== 'All' || questionCount !== 10) ? 'primary' : 'secondary'}
                onClick={() => setFilterOpen(!filterOpen)}
                leftIcon={<Filter size={15} />}
                rightIcon={filterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                style={{ fontWeight: 600, fontSize: '0.85rem' }}
              >
                Filter
                {(selectedTopic !== 'All' || difficulty !== 'All' || questionCount !== 10) && (
                  <span style={{
                    marginLeft: '6px',
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '1px 6px',
                    fontSize: '0.7rem',
                    fontWeight: 800
                  }}>
                    {(selectedTopic !== 'All' ? 1 : 0) + (difficulty !== 'All' ? 1 : 0) + (questionCount !== 10 ? 1 : 0)}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={fetchQuestions}
                isLoading={loading}
                leftIcon={<RefreshCw size={14} />}
                style={{ fontSize: '0.85rem' }}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Collapsible Filter Panel */}
          {filterOpen && (
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {/* Filter by Topic */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Filter by Topic
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.85rem', width: '100%', padding: '0.45rem 0.75rem' }}
                  >
                    {topics.map(t => (
                      <option key={t} value={t}>{t === 'All' ? 'All Topics' : t}</option>
                    ))}
                  </select>
                </div>

                {/* Filter by Difficulty */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Difficulty
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {DIFFICULTIES.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDifficulty(d)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${difficulty === d ? 'var(--primary)' : 'var(--border-color)'}`,
                          backgroundColor: difficulty === d ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                          color: difficulty === d ? 'var(--primary)' : 'var(--text-secondary)',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Questions Batch Size */}
                <div>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>
                    Batch Size
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {QUESTION_COUNTS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setQuestionCount(c)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${questionCount === c ? 'var(--primary)' : 'var(--border-color)'}`,
                          backgroundColor: questionCount === c ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                          color: questionCount === c ? 'var(--primary)' : 'var(--text-secondary)',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {c} Qs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.5rem' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setFilterOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Assessment Evaluation Error Notice */}
        {testEvaluationError && (
          <InconvenienceNotice
            title="AI Assessment Evaluation Unavailable"
            message="We are sorry for the inconvenience. Our AI evaluation service could not grade your assessment. To protect scoring integrity and prevent misleading feedback, mock and simulated scores have been disabled."
            details={testEvaluationError}
            onRetry={handleSubmitTest}
            retryText="Retry Submitting Assessment"
          />
        )}

        {/* Questions Test Assessment or Review */}
        {testSubmitted && testEvaluation ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.25s ease' }}>
            {/* Executive Hero Banner */}
            <Card style={{
              padding: '1.75rem',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: 'var(--radius-xl)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: '1 1 360px' }}>
                  {/* Circular Glowing Score Gauge */}
                  <div style={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-secondary)',
                    border: `4px solid ${(testEvaluation.overall_score ?? 0) >= 80 ? 'var(--success)' : (testEvaluation.overall_score ?? 0) >= 65 ? 'var(--warning)' : 'var(--danger)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 24px ${(testEvaluation.overall_score ?? 0) >= 80 ? 'rgba(16, 185, 129, 0.3)' : (testEvaluation.overall_score ?? 0) >= 65 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                      {testEvaluation.overall_score ?? 0}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      out of 100
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                        Technical Assessment Scorecard
                      </h3>
                      <span className={`badge ${(testEvaluation.overall_score ?? 0) >= 80 ? 'badge-success' : (testEvaluation.overall_score ?? 0) >= 65 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.8rem', fontWeight: 800 }}>
                        {testEvaluation.grade || ((testEvaluation.overall_score ?? 0) >= 80 ? 'Strong Hire' : 'Needs Practice')}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>
                      {testEvaluation.summary_verdict}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        📝 Questions Attempted: <strong style={{ color: 'var(--text-primary)' }}>{testEvaluation.answered_count ?? 0}</strong> / {testEvaluation.total_questions ?? questions.length}
                      </span>
                      {(testEvaluation.skipped_count ?? 0) > 0 && (
                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: 'var(--danger)', fontWeight: 700 }}>
                          ⚠️ Skipped: {testEvaluation.skipped_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                    isLoading={downloadingPdf}
                    leftIcon={<Download size={16} />}
                    style={{ fontWeight: 700 }}
                  >
                    Download Report (PDF)
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleRetakeTest}
                    leftIcon={<RotateCcw size={16} />}
                    style={{ fontWeight: 700 }}
                  >
                    Start New Assessment
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tab Nav for Scorecard */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setReviewTab('overview')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: reviewTab === 'overview' ? 'var(--primary-light)' : 'transparent',
                  color: reviewTab === 'overview' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Activity size={15} /> 4 Vector Competency Matrix
              </button>

              <button
                type="button"
                onClick={() => setReviewTab('breakdown')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: reviewTab === 'breakdown' ? 'var(--primary-light)' : 'transparent',
                  color: reviewTab === 'breakdown' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ListChecks size={15} /> Question Breakdown ({testEvaluation.per_question_results?.length ?? questions.length})
              </button>

              <button
                type="button"
                onClick={() => setReviewTab('tips')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: reviewTab === 'tips' ? 'var(--primary-light)' : 'transparent',
                  color: reviewTab === 'tips' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Target size={15} /> Recruiter Strengths & Red Flags
              </button>
            </div>

            {/* Tab 1: 4 Vector Dimensions */}
            {reviewTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {(testEvaluation.dimension_scores || []).map((dim, idx) => (
                  <Card key={idx} style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{dim.name}</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: dim.score >= 80 ? 'var(--success)' : dim.score >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                        {dim.score}/100
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-tertiary)', marginBottom: '0.75rem', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, Math.max(0, dim.score))}%`, height: '100%', backgroundColor: dim.score >= 80 ? 'var(--success)' : dim.score >= 60 ? 'var(--warning)' : 'var(--danger)' }} />
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      {dim.feedback}
                    </p>
                  </Card>
                ))}
              </div>
            )}

            {/* Tab 2: Question Breakdown */}
            {reviewTab === 'breakdown' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(testEvaluation.per_question_results || []).map((res, idx) => (
                  <Card key={idx} style={{ padding: '1.25rem', borderLeft: `4px solid ${res.score >= 80 ? 'var(--success)' : res.score >= 60 ? 'var(--warning)' : 'var(--danger)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-neutral">Question #{idx + 1}</span>
                        <span className={`badge ${res.score >= 80 ? 'badge-success' : res.score >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                          Score: {res.score}/100 ({res.grade || 'Graded'})
                        </span>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0 0.75rem 0' }}>
                      {res.question_text || questions[idx]?.question}
                    </h4>

                    {/* Candidate Answer Box */}
                    <div style={{ marginBottom: '0.75rem', padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Your Answer:
                      </div>
                      <p style={{ fontSize: '0.85rem', color: res.candidate_answer && !res.candidate_answer.includes('Skipped') ? 'var(--text-primary)' : 'var(--danger)', margin: 0, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                        {res.candidate_answer || '(Skipped - No answer provided)'}
                      </p>
                    </div>

                    {/* Senior Dev Critique */}
                    <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Senior Staff Engineer Feedback:
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                        {res.feedback}
                      </p>
                    </div>

                    {/* Ideal Answer Concept */}
                    {(res.ideal_answer_concept || questions[idx]?.sample_answer) && (
                      <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                          Model Structured Concept:
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                          {res.ideal_answer_concept || questions[idx]?.sample_answer}
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Tab 3: Recruiter Strengths & Red Flags */}
            {reviewTab === 'tips' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {/* Strengths */}
                <Card style={{ padding: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    <CheckCircle size={18} /> What Impressed the Senior Panel
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {(testEvaluation.strengths || ['Good technical fundamentals demonstrated']).map((str, sIdx) => (
                      <li key={sIdx}>{str}</li>
                    ))}
                  </ul>
                </Card>

                {/* Missing Points / Gaps */}
                <Card style={{ padding: '1.25rem', border: '1px solid rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    <AlertTriangle size={18} /> Critical Gaps & Red Flags to Polish
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {(testEvaluation.missing_points || ['Ensure to outline trade-offs and edge cases explicitly']).map((mis, mIdx) => (
                      <li key={mIdx}>{mis}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div>
            {loading ? (
              <LoadingSpinner message={`Loading curated ${roleDisplayName} interview questions...`} />
            ) : questions.length === 0 ? (
              error ? (
                <InconvenienceNotice
                  title="Interview Questions Unavailable"
                  message="We are sorry for the inconvenience. Questions could not be retrieved from the database or generated by the AI service. We have disabled unverified fallback questions so your practice remains genuine."
                  details={error}
                  onRetry={fetchQuestions}
                  retryText="Retry Loading Questions"
                />
              ) : (
                <Card style={{ padding: '3rem', textAlign: 'center' }}>
                  <HelpCircle size={36} className="text-muted" style={{ margin: '0 auto 1rem auto' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    No Questions Found
                  </h3>
                  <p className="text-body text-xs" style={{ margin: '0.5rem auto 1.5rem auto', maxWidth: '380px' }}>
                    No questions found for the selected topic filter. Try selecting "All" topics.
                  </p>
                  <Button variant="primary" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                </Card>
              )
            ) : (() => {
              const safeIdx = Math.min(Math.max(0, currentQIndex), Math.max(0, questions.length - 1));
              const currentQ = questions[safeIdx] || questions[0];
              const isMastered = masteredIds.includes(currentQ.id);
              const currentAns = userAnswers[currentQ.id] || '';
              const wordCount = currentAns.trim() ? currentAns.trim().split(/\s+/).length : 0;
              const answeredTotal = questions.filter(q => Boolean(userAnswers[q.id]?.trim())).length;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* 1. Progress Bar & Stepper */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    padding: '0.85rem 1.25rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Question {safeIdx + 1} of {questions.length}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ({answeredTotal} of {questions.length} answered)
                      </span>
                    </div>

                    {/* Quick Question Jump Stepper */}
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {questions.map((q, idx) => {
                        const hasAnswer = Boolean(userAnswers[q.id]?.trim());
                        const isCurrent = idx === safeIdx;
                        return (
                          <button
                            key={q.id || idx}
                            type="button"
                            onClick={() => setCurrentQIndex(idx)}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: 'var(--radius-md)',
                              border: isCurrent ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                              backgroundColor: isCurrent ? 'var(--primary)' : hasAnswer ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-tertiary)',
                              color: isCurrent ? '#fff' : hasAnswer ? 'var(--success)' : 'var(--text-secondary)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Question #${idx + 1}${hasAnswer ? ' (Answered)' : ' (Unanswered)'}`}
                          >
                            {hasAnswer && !isCurrent ? '✓' : idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Top Small Horizontal Box: The Question */}
                  <Card style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-purple" style={{ fontWeight: 800 }}>
                          Question #{safeIdx + 1}
                        </span>
                        <Badge variant={getDifficultyBadgeVariant(currentQ.difficulty)}>
                          {currentQ.difficulty}
                        </Badge>
                        <span className="badge badge-neutral">
                          {currentQ.topic}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConceptHook(!showConceptHook)}
                          leftIcon={<Lightbulb size={14} className={showConceptHook ? 'text-warning' : ''} />}
                          style={{ fontSize: '0.8rem', color: showConceptHook ? 'var(--warning)' : 'var(--text-secondary)' }}
                        >
                          {showConceptHook ? 'Hide Concept Key' : '💡 View Concept Key'}
                        </Button>
                        <Button
                          variant={isMastered ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => toggleMastered(currentQ.id)}
                          leftIcon={isMastered ? <CheckCircle2 size={14} className="text-success" /> : <Check size={14} />}
                          style={{ fontSize: '0.8rem' }}
                        >
                          {isMastered ? 'Mastered' : 'Mark Mastered'}
                        </Button>
                      </div>
                    </div>

                    {/* The Question Text */}
                    <h3 style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.55,
                      margin: 0
                    }}>
                      {currentQ.question}
                    </h3>

                    {/* Collapsible Key Takeaway / Concept Box */}
                    {showConceptHook && (
                      <div style={{
                        marginTop: '0.85rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                            Key Concept Hook:
                          </span>
                        </div>
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                          {currentQ.answer_key}
                        </p>
                      </div>
                    )}
                  </Card>

                  {/* 3. Big Box Under It: The Candidate's Answer */}
                  <Card style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Your Written Answer & Explanation
                        </span>
                        <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                          Articulate architecture, mechanisms, code approach, and trade-offs clearly for a Senior Developer.
                        </p>
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                        {wordCount} words
                      </span>
                    </div>

                    <textarea
                      className="form-input"
                      rows={9}
                      value={userAnswers[currentQ.id] || ''}
                      onChange={e => setUserAnswers({ ...userAnswers, [currentQ.id]: e.target.value })}
                      placeholder="Explain your technical solution here. Structure with: 1) Core mechanism, 2) Architecture / Implementation, 3) Edge cases & failure handling, 4) Trade-offs..."
                      style={{
                        width: '100%',
                        minHeight: '200px',
                        fontFamily: 'inherit',
                        fontSize: '0.925rem',
                        lineHeight: 1.6,
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)'
                      }}
                    />
                  </Card>

                  {/* 4. Navigation & Action Bar: Previous, Next, Submit */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    padding: '0.75rem 0'
                  }}>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                      disabled={safeIdx === 0}
                      leftIcon={<ChevronLeft size={16} />}
                      style={{ fontWeight: 600 }}
                    >
                      Previous Question
                    </Button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {safeIdx < questions.length - 1 ? (
                        <Button
                          variant="outline"
                          onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                          rightIcon={<ChevronRight size={16} />}
                          style={{ fontWeight: 600 }}
                        >
                          Next Question
                        </Button>
                      ) : null}

                      <Button
                        variant="primary"
                        onClick={handleSubmitTest}
                        isLoading={submittingTest}
                        leftIcon={<Send size={15} />}
                        style={{
                          padding: '0.65rem 1.5rem',
                          fontWeight: 800,
                          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                        }}
                      >
                        Submit Assessment
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    )}
  </div>);
};

