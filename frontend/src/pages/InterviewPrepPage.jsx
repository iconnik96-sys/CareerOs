import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { interviewService } from '../services/interviewService';
import { aiFastApiService } from '../services/aiFastApiService';
import { getRoleSlug, getRoleDisplayName, ROLE_TOPICS_MAP } from '../utils/careerRoles';
import { Sparkles, CheckCircle2, Eye, EyeOff, Lightbulb, Check, RefreshCw, Send, HelpCircle, Plus } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const QUESTION_COUNTS = [5, 10, 15, 20];

export const InterviewPrepPage = () => {
    const { profile } = useAuth();
    const { showToast } = useToast();

    const targetRole = profile?.target_role || 'Backend Developer';
    const roleSlug = getRoleSlug(targetRole);
    const roleDisplayName = getRoleDisplayName(roleSlug);

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

    // Dynamic role topics
    const topics = ROLE_TOPICS_MAP[roleSlug] || ['All', 'Fundamentals', 'Architecture', 'Security', 'Testing'];

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
                difficulty,
                topic: selectedTopic,
                count: questionCount
            });
            setQuestions(data || []);
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

    const handleLoadMoreQuestions = async () => {
        setLoadingMore(true);
        try {
            const moreQuestions = await interviewService.generateMoreQuestions({
                role: role || targetRole,
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
    }, [role, difficulty, selectedTopic, targetRole, questionCount]);

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
              <Sparkles size={12}/> Role-Calibrated Interview Preparation
            </span>
          </div>
          <h1 className="page-title">{roleDisplayName} Technical Interview Prep</h1>
          <p className="page-subtitle">
            Curated questions stored in the database for {roleDisplayName} candidates with real-time STAR AI answer evaluation.
          </p>
        </div>
      </div>

      {/* Filter & Generator Bar */}
      <Card style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Topic Filter */}
            <div>
              <label className="form-label" style={{ marginBottom: '4px' }}>Filter by Topic</label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {topics.map(t => (<button key={t} onClick={() => setSelectedTopic(t)} style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${selectedTopic === t ? 'var(--primary)' : 'var(--border-color)'}`,
                backgroundColor: selectedTopic === t ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                color: selectedTopic === t ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
            }}>
                    {t}
                  </button>))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="form-label" style={{ marginBottom: '4px' }}>Difficulty</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {DIFFICULTIES.map(d => (<button key={d} onClick={() => setDifficulty(d)} style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${difficulty === d ? 'var(--primary)' : 'var(--border-color)'}`,
                backgroundColor: difficulty === d ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                color: difficulty === d ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
            }}>
                    {d}
                  </button>))}
              </div>
            </div>

            {/* Questions Batch Count */}
            <div>
              <label className="form-label" style={{ marginBottom: '4px' }}>Questions</label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {QUESTION_COUNTS.map(c => (<button key={c} onClick={() => setQuestionCount(c)} style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${questionCount === c ? 'var(--primary)' : 'var(--border-color)'}`,
                backgroundColor: questionCount === c ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                color: questionCount === c ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8125rem',
                cursor: 'pointer'
            }}>
                    {c} Qs
                  </button>))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button variant="secondary" onClick={fetchQuestions} isLoading={loading} leftIcon={<RefreshCw size={15}/>}>
              Refresh Questions
            </Button>
          </div>
        </div>
      </Card>

      {/* Questions List */}
      {loading ? (<LoadingSpinner message={`Loading curated ${roleDisplayName} interview questions...`}/>) : questions.length === 0 ? (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <HelpCircle size={36} className="text-muted" style={{ margin: '0 auto 1rem auto' }}/>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              No Questions Found
            </h3>
            <p className="text-body text-xs" style={{ margin: '0.5rem auto 1.5rem auto', maxWidth: '380px' }}>
              No questions found for the selected topic filter. Try selecting "All" topics.
            </p>
            <Button variant="primary" onClick={() => { setSelectedTopic('All'); setDifficulty('All'); }}>
              Reset Filters
            </Button>
          </Card>
      ) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {questions.map((q, idx) => {
                const isRevealed = revealedIds.includes(q.id);
                const isMastered = masteredIds.includes(q.id);
                const isPracticing = activePracticeId === q.id;
                const evalResult = evaluations[q.id];
                const isEvaluating = evaluatingId === q.id;
                return (<div key={q.id} className="card" style={{
                        borderColor: isMastered ? 'rgba(16, 185, 129, 0.3)' : undefined,
                        backgroundColor: isMastered ? 'rgba(16, 185, 129, 0.03)' : undefined
                    }}>
                {/* Header with Topic, Difficulty & Master Checkbox */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className="badge badge-neutral">Question #{idx + 1}</span>
                    <Badge variant={getDifficultyBadgeVariant(q.difficulty)}>
                      {q.difficulty}
                    </Badge>
                    <span className="badge badge-purple">{q.topic}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant={isPracticing ? 'primary' : 'outline'} size="sm" onClick={() => togglePractice(q.id)} leftIcon={<Sparkles size={14}/>}>
                      {isPracticing ? 'Close AI Practice' : 'Practice with AI'}
                    </Button>

                    <Button variant={isMastered ? 'secondary' : 'outline'} size="sm" onClick={() => toggleMastered(q.id)} leftIcon={isMastered ? <CheckCircle2 size={14} className="text-success"/> : <Check size={14}/>}>
                      {isMastered ? 'Mastered' : 'Mark Mastered'}
                    </Button>
                  </div>
                </div>

                {/* The Question */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  {q.question}
                </h3>

                {/* Key Answer Concept Hook */}
                <div style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        marginBottom: '1rem'
                    }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.04em' }}>
                    KEY TAKEAWAY:
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {q.answer_key}
                  </span>
                </div>

                {/* ========================================================================= */}
                {/* AI PRACTICE & LIVE EVALUATION DRAWER */}
                {/* ========================================================================= */}
                {isPracticing && (<div style={{
                            margin: '1rem 0',
                            padding: '1.25rem',
                            backgroundColor: 'var(--bg-tertiary)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--primary-light)',
                            animation: 'fadeIn 0.2s ease'
                        }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem' }}>
                      <Sparkles size={16}/> AI LIVE ANSWER GRADER (FAANG-Caliber Rubric)
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Type how you would articulate your answer in a real interview for <strong>{roleDisplayName}</strong>. The AI will grade your technical accuracy, STAR structure, depth, and communication.
                    </p>

                    <textarea className="form-input" rows={4} value={userAnswers[q.id] || ''} onChange={e => setUserAnswers({ ...userAnswers, [q.id]: e.target.value })} placeholder="Type your technical answer here explaining architecture, mechanisms, and trade-offs..." style={{ marginBottom: '0.75rem', fontFamily: 'inherit' }}/>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <Button variant="primary" size="sm" isLoading={isEvaluating} onClick={() => handleEvaluateAnswer(q)} leftIcon={<Send size={14}/>}>
                        Evaluate Answer with AI
                      </Button>
                    </div>

                    {/* AI Evaluation Report */}
                    {evalResult && (<div style={{
                                marginTop: '1.25rem',
                                padding: '1.25rem',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)'
                            }}>
                        {/* Overall Score Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: 46,
                                height: 46,
                                borderRadius: '50%',
                                backgroundColor: evalResult.overall_score >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                color: evalResult.overall_score >= 80 ? 'var(--success)' : 'var(--warning)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                fontWeight: 800,
                                fontSize: '1.1rem'
                            }}>
                              {evalResult.overall_score}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                  Interviewer Verdict:
                                </span>
                                <Badge variant={evalResult.overall_score >= 80 ? 'success' : 'warning'}>
                                  {evalResult.grade}
                                </Badge>
                              </div>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                                {evalResult.summary_verdict}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 4 Dimension Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                          {evalResult.dimension_scores?.map((dim, dIdx) => (<div key={dIdx} style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{dim.name}</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: dim.score >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                                  {dim.score}/100
                                </span>
                              </div>
                              <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0 }}>
                                {dim.feedback}
                              </p>
                            </div>))}
                        </div>

                        {/* Strengths & Missing Points */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.4rem' }}>
                              ✅ What You Nailed:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                              {evalResult.strengths?.map((str, sIdx) => <li key={sIdx}>{str}</li>)}
                            </ul>
                          </div>

                          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.4rem' }}>
                              ⚠️ Missing Points / Edge Cases:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                              {evalResult.missing_points?.map((mis, mIdx) => <li key={mIdx}>{mis}</li>)}
                            </ul>
                          </div>
                        </div>

                        {/* Likely Follow-up Question */}
                        {evalResult.interviewer_follow_up && (<div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                            🎯 <strong>Likely Follow-up Question:</strong> <em>"{evalResult.interviewer_follow_up}"</em>
                          </div>)}
                      </div>)}
                  </div>)}

                {/* Reveal Sample Answer Button */}
                <div>
                  <Button variant="ghost" size="sm" onClick={() => toggleReveal(q.id)} leftIcon={isRevealed ? <EyeOff size={15}/> : <Eye size={15}/>} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    {isRevealed ? 'Hide Sample Answer & Tips' : 'Reveal Model Answer & Tips'}
                  </Button>
                </div>

                {/* Expandable Explanation */}
                {isRevealed && (<div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', animation: 'fadeIn 0.2s ease' }}>
                    {/* Key Interview Tips */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        <Lightbulb size={14}/> WHAT INTERVIEWERS LOOK FOR
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {(q.tips || []).map((tip, tIdx) => (<div key={tIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--warning)', fontWeight: 700 }}>•</span>
                            <span>{tip}</span>
                          </div>))}
                      </div>
                    </div>

                    {/* Detailed Sample Answer */}
                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        MODEL STRUCTURED RESPONSE:
                      </div>
                      <p style={{ whiteSpace: 'pre-line', fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.6, fontFamily: 'sans-serif' }}>
                        {q.sample_answer}
                      </p>
                    </div>
                  </div>)}
              </div>);
            })}

            {/* Load More Questions Card */}
            <Card style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-tertiary)', border: '1px dashed var(--primary-light)', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Ready for More Practice?
                  </h4>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Generate 5 additional technical and scenario questions for <strong>{roleDisplayName}</strong>.
                  </p>
                </div>
                <Button variant="primary" onClick={handleLoadMoreQuestions} isLoading={loadingMore} leftIcon={<Sparkles size={16} />}>
                  {loadingMore ? 'Generating Extra Questions...' : 'Generate 5 More Practice Questions'}
                </Button>
              </div>
            </Card>
        </div>)}
    </div>);
};
