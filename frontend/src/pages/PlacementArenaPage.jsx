import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Trophy, Flame, Clock, Users, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Sparkles, Award, Shield, Zap, RefreshCw, ChevronRight, BarChart3, Filter,
  Share2, Download, Play, Terminal, HelpCircle, Code, Eye, ExternalLink,
  Target, Layers, Cpu, Server, Check, AlertCircle, Building2, Database
} from 'lucide-react';
import { Button } from '../components/common/Button';

import { arenaService } from '../services/arenaService';

// =========================================================================
// COMPANY PLACEMENT CUTOFFS FOR DELTA ANALYSIS
// =========================================================================
const COMPANY_CUTOFFS = [
  { name: 'TCS Digital / Prime', cutoffScore: 70, baseTier: 'Core Enterprise', avgPackage: '₹7.0 – ₹9.0 LPA' },
  { name: 'Infosys DSE (Specialist)', cutoffScore: 75, baseTier: 'Specialist Programmer', avgPackage: '₹8.0 – ₹9.5 LPA' },
  { name: 'Cognizant GenC Next', cutoffScore: 68, baseTier: 'Core Enterprise', avgPackage: '₹6.5 – ₹7.5 LPA' },
  { name: 'Swiggy SDE-1', cutoffScore: 84, baseTier: 'High-Scale Consumer', avgPackage: '₹16.0 – ₹22.0 LPA' },
  { name: 'Razorpay Backend Engineer', cutoffScore: 88, baseTier: 'Fintech Infrastructure', avgPackage: '₹18.0 – ₹24.0 LPA' },
  { name: 'Amazon SDE-1', cutoffScore: 92, baseTier: 'Global Cloud / FAANG', avgPackage: '₹28.0 – ₹34.0 LPA' }
];

// =========================================================================
// TOP 10 ONLY LEADERBOARD (ANTI-SHAME PRIVACY GUARD)
// =========================================================================
const TOP_10_LEADERBOARD = [
  { rank: 1, name: 'Rohit Sharma', handle: '@rohit_cse99', college: 'IIT Varanasi', score: 294, time: '14m 20s', verdict: 'Strong Hire (Amazon / Razorpay)', badge: '🥇 Gold', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80' },
  { rank: 2, name: 'Priya Patel', handle: '@priya_tech', college: 'NIT Trichy', score: 288, time: '15m 12s', verdict: 'Strong Hire (Swiggy SDE-1)', badge: '🥈 Silver', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { rank: 3, name: 'Arjun Verma', handle: '@arjun_v', college: 'BITS Pilani', score: 278, time: '16m 04s', verdict: 'Hire (CRED Core)', badge: '🥉 Bronze', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
  { rank: 4, name: 'Sneha Reddy', handle: '@sneha_r', college: 'IIIT Hyderabad', score: 274, time: '16m 45s', verdict: 'Hire (Razorpay)', badge: 'Top 5%', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80' },
  { rank: 5, name: 'Ananya Sen', handle: '@ananya_s', college: 'Jadavpur Univ', score: 268, time: '17m 10s', verdict: 'Hire (TCS Prime / Infosys DSE)', badge: 'Top 5%', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { rank: 6, name: 'Karthik Raja', handle: '@karthik_r', college: 'PSG Tech Coimbatore', score: 262, time: '17m 50s', verdict: 'Hire (Swiggy)', badge: 'Top 10%', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80' },
  { rank: 7, name: 'Tanvi Joshi', handle: '@tanvi_j', college: 'COEP Pune', score: 256, time: '18m 15s', verdict: 'Hire (Cognizant Next)', badge: 'Top 10%', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' },
  { rank: 8, name: 'Deepak Nair', handle: '@deepak_n', college: 'CET Trivandrum', score: 250, time: '18m 42s', verdict: 'Hire (TCS Digital)', badge: 'Top 10%', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80' },
  { rank: 9, name: 'Meera Iyer', handle: '@meera_i', college: 'PES University Bangalore', score: 245, time: '19m 05s', verdict: 'Eligible (Capgemini)', badge: 'Top 10%', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { rank: 10, name: 'Rohan Deshmukh', handle: '@rohan_d', college: 'VJTI Mumbai', score: 240, time: '19m 30s', verdict: 'Eligible (Infosys)', badge: 'Top 10%', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' }
];

export const PlacementArenaPage = () => {
  const { user, profile } = useAuth();

  // Navigation tab: 'arena' | 'leaderboard' | 'certificate'
  const [activeTab, setActiveTab] = useState('arena');

  // Contest lifecycle: 'idle' | 'round1' | 'round2' | 'round3' | 'completed'
  const [contestStage, setContestStage] = useState('idle');

  // Dynamic Contest Data loaded strictly from Supabase (no fallback dummy questions)
  const [contestData, setContestData] = useState(null);
  const [isLoadingContest, setIsLoadingContest] = useState(true);
  const [contestError, setContestError] = useState(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);

  // Timers
  const [round1Timer, setRound1Timer] = useState(480); // 8 minutes (480s)
  const [round2Timer, setRound2Timer] = useState(420); // 7 minutes (420s)
  const [round3Timer, setRound3Timer] = useState(300); // 5 minutes (300s)
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Round 1 state
  const [round1QIndex, setRound1QIndex] = useState(0);
  const [round1Answers, setRound1Answers] = useState({});
  const [round1Revealed, setRound1Revealed] = useState(false);

  // Round 2 state
  const [selectedPatch, setSelectedPatch] = useState(null);
  const [round2Submitted, setRound2Submitted] = useState(false);

  // Round 3 state
  const [selectedArchDecision, setSelectedArchDecision] = useState(null);
  const [round3Submitted, setRound3Submitted] = useState(false);

  // Leaderboard filters
  const [leaderboardFilter, setLeaderboardFilter] = useState('top10');

  // Fetch active contest questions from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadContest() {
      setIsLoadingContest(true);
      setContestError(null);
      try {
        const data = await arenaService.getActiveContest('SPRINT-14');
        if (isMounted) {
          if (data?.error || (!data?.round1Questions?.length && !data?.round2Challenge && !data?.round3Challenge)) {
            setContestError(data?.error || 'No active questions found in Supabase.');
            setContestData(data);
          } else {
            setContestData(data);
            setContestError(null);
          }
        }
      } catch (err) {
        if (isMounted) setContestError(err.message || 'Error connecting to Supabase');
      } finally {
        if (isMounted) setIsLoadingContest(false);
      }
    }
    loadContest();
    return () => { isMounted = false; };
  }, []);

  // Quick references to active round data - strictly real questions from Supabase
  const round1Questions = contestData?.round1Questions || [];
  const round2Challenge = contestData?.round2Challenge || null;
  const round3Challenge = contestData?.round3Challenge || null;
  const currentR1Q = round1Questions[round1QIndex] || null;

  const hasRealQuestions = round1Questions.length > 0 || round2Challenge !== null || round3Challenge !== null;

  // Force-reload fresh questions from Supabase
  const handleReloadQuestions = async () => {
    try {
      const code = contestData?.contestCode || 'SPRINT-14';
      sessionStorage.removeItem(`careeros_arena_contest_${code}`);
      setIsLoadingContest(true);
      setContestError(null);
      const fresh = await arenaService.getActiveContest(code);
      if (fresh?.error || (!fresh?.round1Questions?.length && !fresh?.round2Challenge && !fresh?.round3Challenge)) {
        setContestError(fresh?.error || 'No active questions found in Supabase.');
        setContestData(fresh);
      } else {
        setContestData(fresh);
        setContestError(null);
      }
    } catch (err) {
      setContestError(err.message || 'Error refreshing from Supabase');
    } finally {
      setIsLoadingContest(false);
    }
  };

  // Master countdown ticker
  useEffect(() => {
    let interval = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        if (contestStage === 'round1') {
          setRound1Timer(prev => {
            if (prev <= 1) {
              setContestStage('round2');
              return 0;
            }
            return prev - 1;
          });
        } else if (contestStage === 'round2') {
          setRound2Timer(prev => {
            if (prev <= 1) {
              setContestStage('round3');
              return 0;
            }
            return prev - 1;
          });
        } else if (contestStage === 'round3') {
          setRound3Timer(prev => {
            if (prev <= 1) {
              setIsTimerActive(false);
              setContestStage('completed');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, contestStage]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start the 20-minute contest
  const handleStartContest = () => {
    setContestStage('round1');
    setRound1Timer(480);
    setRound2Timer(420);
    setRound3Timer(300);
    setRound1QIndex(0);
    setRound1Answers({});
    setRound1Revealed(false);
    setSelectedPatch(null);
    setRound2Submitted(false);
    setSelectedArchDecision(null);
    setRound3Submitted(false);
    setIsTimerActive(true);
  };

  // Round 1 Handlers
  const handleSelectR1Option = (qId, optionId) => {
    if (round1Revealed) return;
    setRound1Answers(prev => ({ ...prev, [qId]: optionId }));
  };

  const handleNextR1Question = () => {
    setRound1Revealed(false);
    if (round1QIndex < round1Questions.length - 1) {
      setRound1QIndex(prev => prev + 1);
    } else {
      // Move to Round 2
      setContestStage('round2');
    }
  };

  // Round 2 Handlers
  const handleConfirmRound2 = () => {
    setRound2Submitted(true);
  };

  const handleProceedToRound3 = () => {
    setContestStage('round3');
  };

  // Round 3 Handlers
  const handleConfirmRound3 = () => {
    setRound3Submitted(true);
  };

  // Final Score Calculations
  const calculateFinalResults = () => {
    const activeContestCode = contestData?.contestCode || 'SPRINT-14';
    const evaluated = arenaService.evaluateContestAnswers(activeContestCode, {
      round1Answers,
      selectedPatch,
      selectedArchDecision
    });

    let r1Correct = evaluated.r1Correct;
    let r1Score = evaluated.r1Score;
    let r2Score = evaluated.r2Score;
    let r3Score = evaluated.r3Score;
    let overallIndex = evaluated.overallIndex;

    // Resilient fallback if evaluation cache is missing
    if (r1Correct === undefined) {
      let correctCount = 0;
      round1Questions.forEach(q => {
        const selected = round1Answers[q.id];
        const correctOpt = q.options?.find(o => o.correct)?.id;
        if (selected && selected === correctOpt) correctCount++;
      });
      const totalR1 = Math.max(round1Questions.length, 1);
      r1Correct = correctCount;
      r1Score = round1Questions.length > 0 ? Math.round((r1Correct / totalR1) * 100) : 0;

      const r2CorrectId = round2Challenge?.patches?.find(p => p.correct)?.id;
      r2Score = r2CorrectId && selectedPatch === r2CorrectId ? 100 : (selectedPatch ? 20 : 0);

      const r3CorrectId = round3Challenge?.decisions?.find(d => d.correct)?.id;
      r3Score = r3CorrectId && selectedArchDecision === r3CorrectId ? 100 : (selectedArchDecision ? 25 : 0);

      overallIndex = Math.round((r1Score * 0.4) + (r2Score * 0.3) + (r3Score * 0.3));
    }

    // Safe timer bounds against NaN
    const r1Used = Math.max(0, 480 - (Number(round1Timer) || 0));
    const r2Used = Math.max(0, 420 - (Number(round2Timer) || 0));
    const r3Used = Math.max(0, 300 - (Number(round3Timer) || 0));
    const totalTimeUsed = r1Used + r2Used + r3Used;

    return {
      r1Correct,
      r1Score,
      r2Score,
      r3Score,
      overallIndex,
      totalTimeUsed,
      timeFormatted: `${Math.floor(totalTimeUsed / 60)}m ${totalTimeUsed % 60}s`
    };
  };

  const handleFinishContest = async () => {
    setIsTimerActive(false);
    setContestStage('completed');
    setIsSubmittingResult(true);
    try {
      const computed = calculateFinalResults();
      await arenaService.submitContestResult({
        user,
        profile,
        contestCode: contestData.contestCode || 'SPRINT-14',
        results: computed
      });
    } catch (err) {
      console.warn('Failed to submit contest results:', err);
    } finally {
      setIsSubmittingResult(false);
    }
  };

  const results = calculateFinalResults();

  return (
    <div className="placement-arena-page" style={{ padding: '1.5rem', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* ========================================================================= */}
      {/* TOP HEADER BANNER                                                         */}
      {/* ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        padding: '1.75rem 2rem',
        marginBottom: '1.75rem',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.65rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.35)',
              color: '#f472b6',
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}>
              <Trophy size={13} /> 20-Min Placement Arena
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#fbbf24',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              <Flame size={13} /> 4-Week Streak
            </span>

            <span style={{
              fontSize: '0.72rem',
              color: '#94a3b8',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px'
            }}>
              ⚡ 3 Rapid Rounds • Total 20 Mins
            </span>
          </div>

          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: '#f8fafc', letterSpacing: '-0.02em' }}>
            National Placement Arena ⚡
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '640px' }}>
            Standard 3-round campus test simulating <strong>TCS Digital, Infosys DSE, Swiggy & Razorpay</strong>. Evaluates Core CS, Bug Hunter, and High-Scale Architecture.
          </p>
        </div>

        {/* Live Personal Benchmark Card (Anti-Shame Private Metric) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '0.9rem 1.25rem'
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Your Placement Index
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8' }}>
              84.2 <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>
              Tier: Placement Silver ⚡
            </div>
          </div>

          <div style={{ width: '1px', height: '36px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          <div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Target Cutoff Delta
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f472b6' }}>
              +14 pts (TCS)
            </div>
            <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
              -3.8 pts (Razorpay)
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVIGATION TABS                                                           */}
      {/* ========================================================================= */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '1.75rem',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {[
          { id: 'arena', label: '⚡ 3-Round Placement Contest (20 Mins)', icon: <Play size={16} />, badge: contestStage !== 'idle' ? 'In Progress' : 'Ready' },
          { id: 'leaderboard', label: '🏆 National Top 10 Leaderboard', icon: <Trophy size={16} />, badge: 'Top 10 Only' },
          { id: 'certificate', label: '📜 Placement Competence Card', icon: <Award size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.65rem 1.15rem',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid #818cf8' : '2px solid transparent',
              color: activeTab === tab.id ? '#c7d2fe' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span style={{
                fontSize: '0.65rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                backgroundColor: activeTab === tab.id ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontWeight: 700
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 3-ROUND PLACEMENT ARENA CONTEST                                     */}
      {/* ========================================================================= */}
      {activeTab === 'arena' && (
        <div>
          {/* Loading State */}
          {isLoadingContest && (
            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '3px solid rgba(99, 102, 241, 0.2)',
                borderTopColor: '#6366f1',
                margin: '0 auto 1.5rem auto',
                animation: 'spin 1s linear infinite'
              }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.4rem' }}>
                Connecting to Supabase Dynamic Arena...
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Fetching real placement questions directly from your database
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* APOLOGY & NOTICE BOX: NO QUESTIONS OR SUPABASE CONNECTION ISSUE           */}
          {/* ========================================================================= */}
          {!isLoadingContest && (!hasRealQuestions || contestError) && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(24, 24, 27, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              maxWidth: '860px',
              margin: '0 auto',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Subtle decorative glow */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '240px',
                height: '100px',
                background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              {/* Apology Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
                marginBottom: '1.25rem',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)'
              }}>
                <AlertTriangle size={32} />
              </div>

              {/* Apology Heading */}
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
                We Sincerely Apologize
              </h2>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={13} />
                <span>Placement Questions Temporarily Unavailable in Database</span>
              </div>

              {/* Friendly Explanatory Message */}
              <p style={{
                color: '#cbd5e1',
                fontSize: '0.92rem',
                maxWidth: '620px',
                margin: '0 auto 1.75rem auto',
                lineHeight: 1.65
              }}>
                The Placement Arena only delivers <strong>real questions verified from live Supabase storage</strong> — all hardcoded fallback questions have been strictly removed to protect test integrity. Currently, there are either no questions in the database or the connection is awaiting initial setup.
              </p>

              {/* Diagnostic Notice */}
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem',
                maxWidth: '720px',
                margin: '0 auto 1.75rem auto',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    💡 Supabase Setup & Troubleshooting
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Contest: {contestData?.contestCode || 'SPRINT-14'}
                  </span>
                </div>

                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>
                  To populate the contest with real placement questions (Core CS, Payment Wallet Bug Patch, Swiggy Architecture), run the database migration:
                </p>

                <div style={{
                  backgroundColor: '#090d16',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  color: '#fbbf24',
                  marginBottom: '0.75rem',
                  overflowX: 'auto'
                }}>
                  supabase/migrations/20261028_placement_arena_tables.sql
                </div>

                <div style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                  <strong>Steps:</strong> Open your Supabase project &gt; SQL Editor &gt; Paste &amp; Run the file &gt; Questions appear here instantly without code redeployment.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleReloadQuestions}
                  disabled={isLoadingContest}
                  style={{
                    padding: '0.75rem 1.75rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  <RefreshCw size={15} className={isLoadingContest ? 'animate-spin' : ''} />
                  <span>Try Reconnecting to Supabase</span>
                </button>

                <Link
                  to="/dashboard"
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#e2e8f0',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>Back to Dashboard</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}

          {/* STAGE 0: CONTEST BRIEFING & START (Only when real questions exist) */}
          {!isLoadingContest && hasRealQuestions && contestStage === 'idle' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              borderRadius: '16px',
              padding: '2.5rem',
              maxWidth: '920px',
              margin: '0 auto',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  marginBottom: '1rem',
                  boxShadow: '0 0 24px rgba(99, 102, 241, 0.5)'
                }}>
                  <Zap size={30} />
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.4rem 0' }}>
                  20-Minute Campus Placement Sprint
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
                  Simulates the 3 actual evaluation stages used by top Indian engineering hiring drives. Complete all 3 rounds to unlock your <strong>Company Cutoff Delta</strong> and placement tier.
                </p>
              </div>

              {/* 3 Rounds Visual Architecture Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {/* Round 1 Card */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '12px',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                      Round 1 (8 Mins)
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>10 Questions</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                    Core CS & Speed Aptitude
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    OS Deadlocks, SQL B-Tree Indexes, Redis Primitives, TCP Handshake & Quant speed.
                  </p>
                </div>

                {/* Round 2 Card */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                  borderRadius: '12px',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f472b6', textTransform: 'uppercase' }}>
                      Round 2 (7 Mins)
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>1 Real Outage</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                    The Code Surgeon
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    Inspect a buggy payment wallet microservice. Diagnose the race condition and pick the production atomic patch.
                  </p>
                </div>

                {/* Round 3 Card */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: '12px',
                  padding: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase' }}>
                      Round 3 (5 Mins)
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>1 Scaling Dilemma</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                    System Architecture
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                    Swiggy IPL Final surge: 18,000 writes/sec. Choose the asynchronous Kafka + Redis architectural buffer.
                  </p>
                </div>
              </div>

              {/* Start Button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleStartContest}
                  style={{
                    padding: '0.85rem 2.75rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <Play size={18} />
                  <span>Begin 20-Min Placement Contest</span>
                </button>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
                  ⏱ 20 Minutes Total • Fully client-side • Zero server lag • Instant scoring
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 1: ROUND 1 (CORE CS & SPEED APTITUDE)                               */}
          {/* ========================================================================= */}
          {contestStage === 'round1' && currentR1Q && (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              {/* Header Ticker */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8' }}>
                    ROUND 1 OF 3: CORE CS & APTITUDE
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Question {round1QIndex + 1} of {round1Questions.length}
                  </span>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '4px', backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', fontWeight: 700 }}>
                    {currentR1Q.companyTag}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  color: round1Timer < 60 ? '#ef4444' : '#fbbf24',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <Clock size={15} />
                  <span>{formatTimer(round1Timer)}</span>
                </div>
              </div>

              {/* Question Card */}
              <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {currentR1Q.topic}
                </div>
                <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  {currentR1Q.question}
                </h3>

                {/* Options List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {currentR1Q.options.map(opt => {
                    const isSelected = round1Answers[currentR1Q.id] === opt.id;
                    const isRevealed = round1Revealed;
                    const isCorrect = opt.correct;

                    let bg = 'rgba(255, 255, 255, 0.03)';
                    let border = '1px solid rgba(255, 255, 255, 0.08)';
                    let color = '#e2e8f0';

                    if (isRevealed) {
                      if (isCorrect) {
                        bg = 'rgba(16, 185, 129, 0.15)';
                        border = '1px solid rgba(16, 185, 129, 0.5)';
                        color = '#34d399';
                      } else if (isSelected && !isCorrect) {
                        bg = 'rgba(239, 68, 68, 0.15)';
                        border = '1px solid rgba(239, 68, 68, 0.5)';
                        color = '#f87171';
                      }
                    } else if (isSelected) {
                      bg = 'rgba(99, 102, 241, 0.15)';
                      border = '1px solid rgba(99, 102, 241, 0.5)';
                      color = '#c7d2fe';
                    }

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectR1Option(currentR1Q.id, opt.id)}
                        style={{
                          padding: '0.9rem 1.15rem',
                          borderRadius: '10px',
                          backgroundColor: bg,
                          border: border,
                          color: color,
                          fontSize: '0.9rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: isRevealed ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontFamily: opt.text.startsWith('CREATE') || opt.text.startsWith('SET') ? 'monospace' : 'inherit' }}>
                          {opt.text}
                        </span>
                        {isRevealed && isCorrect && <CheckCircle2 size={17} color="#34d399" />}
                        {isRevealed && isSelected && !isCorrect && <XCircle size={17} color="#f87171" />}
                      </div>
                    );
                  })}
                </div>

                {/* Question Explanation Rationale */}
                {round1Revealed && (
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontSize: '0.85rem',
                    color: '#e0f2fe',
                    lineHeight: 1.5,
                    marginBottom: '1.5rem'
                  }}>
                    <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '0.25rem' }}>
                      💡 Engineering Rationale:
                    </strong>
                    {currentR1Q.explanation}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  {!round1Revealed ? (
                    <button
                      type="button"
                      disabled={!round1Answers[currentR1Q.id]}
                      onClick={() => setRound1Revealed(true)}
                      style={{
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        background: round1Answers[currentR1Q.id] ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
                        color: round1Answers[currentR1Q.id] ? '#fff' : '#64748b',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: round1Answers[currentR1Q.id] ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Lock Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextR1Question}
                      style={{
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span>{round1QIndex === round1Questions.length - 1 ? 'Proceed to Round 2 (Code Surgeon)' : 'Next Question'}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 2: ROUND 2 (CODE SURGEON - MICROSERVICE BUG PATCH)                  */}
          {/* ========================================================================= */}
          {contestStage === 'round2' && round2Challenge && (
            <div style={{ maxWidth: '940px', margin: '0 auto' }}>
              {/* Header Ticker */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f472b6' }}>
                    ROUND 2 OF 3: THE CODE SURGEON
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Spot & Patch the Race Condition
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  color: round2Timer < 60 ? '#ef4444' : '#fbbf24',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <Clock size={15} />
                  <span>{formatTimer(round2Timer)}</span>
                </div>
              </div>

              {/* Bug Snippet Card */}
              <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {round2Challenge.title}
                  </h3>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: 700 }}>
                    Simulated Financial Outage: ₹4.8 Lakhs
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {round2Challenge.scenario}
                </p>

                {/* Buggy Code Block */}
                <div style={{
                  backgroundColor: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: '#38bdf8',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                  marginBottom: '1.75rem',
                  whiteSpace: 'pre'
                }}>
                  {round2Challenge.codeSnippet}
                </div>

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
                  {round2Challenge.question}
                </h4>

                {/* Patch Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
                  {(round2Challenge.patches || []).map(patch => {
                    const isSelected = selectedPatch === patch.id;
                    const isRevealed = round2Submitted;
                    const isCorrect = patch.correct;

                    let bg = 'rgba(255, 255, 255, 0.03)';
                    let border = '1px solid rgba(255, 255, 255, 0.08)';

                    if (isRevealed) {
                      if (isCorrect) {
                        bg = 'rgba(16, 185, 129, 0.15)';
                        border = '1px solid rgba(16, 185, 129, 0.5)';
                      } else if (isSelected && !isCorrect) {
                        bg = 'rgba(239, 68, 68, 0.15)';
                        border = '1px solid rgba(239, 68, 68, 0.5)';
                      }
                    } else if (isSelected) {
                      bg = 'rgba(99, 102, 241, 0.15)';
                      border = '1px solid rgba(99, 102, 241, 0.5)';
                    }

                    return (
                      <div
                        key={patch.id}
                        onClick={() => !round2Submitted && setSelectedPatch(patch.id)}
                        style={{
                          padding: '1rem',
                          borderRadius: '10px',
                          backgroundColor: bg,
                          border: border,
                          cursor: isRevealed ? 'default' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <strong style={{ fontSize: '0.85rem', color: isSelected ? '#c7d2fe' : '#f8fafc' }}>
                            {patch.title}
                          </strong>
                          {isRevealed && isCorrect && <CheckCircle2 size={16} color="#34d399" />}
                          {isRevealed && isSelected && !isCorrect && <XCircle size={16} color="#f87171" />}
                        </div>
                        <pre style={{
                          margin: '0 0 0.4rem 0',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          color: '#e2e8f0',
                          fontFamily: 'monospace'
                        }}>
                          {patch.code}
                        </pre>
                        {isRevealed && (
                          <div style={{ fontSize: '0.75rem', color: isCorrect ? '#34d399' : '#94a3b8' }}>
                            {patch.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  {!round2Submitted ? (
                    <button
                      type="button"
                      disabled={!selectedPatch}
                      onClick={handleConfirmRound2}
                      style={{
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        background: selectedPatch ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
                        color: selectedPatch ? '#fff' : '#64748b',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: selectedPatch ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Confirm Code Patch
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProceedToRound3}
                      style={{
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span>Proceed to Round 3 (Architecture)</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 3: ROUND 3 (COMPANY ARCHITECTURAL DECISION)                         */}
          {/* ========================================================================= */}
          {contestStage === 'round3' && round3Challenge && (
            <div style={{ maxWidth: '940px', margin: '0 auto' }}>
              {/* Header Ticker */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '0.85rem 1.25rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c084fc' }}>
                    ROUND 3 OF 3: SYSTEM ARCHITECTURE
                  </span>
                  <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Final Scaling Trade-Off Decision
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  color: round3Timer < 60 ? '#ef4444' : '#fbbf24',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <Clock size={15} />
                  <span>{formatTimer(round3Timer)}</span>
                </div>
              </div>

              {/* Architecture Dilemma Card */}
              <div style={{
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {round3Challenge.title}
                  </h3>
                  <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 700 }}>
                    {round3Challenge.company}
                  </span>
                </div>

                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6 }}>
                    {round3Challenge.dilemma}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700 }}>
                    🎯 Goal: {round3Challenge.constraint}
                  </div>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
                  {round3Challenge.question}
                </h4>

                {/* Decision Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {(round3Challenge.decisions || []).map(dec => {
                    const isSelected = selectedArchDecision === dec.id;
                    const isRevealed = round3Submitted;
                    const isCorrect = dec.correct;

                    let bg = 'rgba(255, 255, 255, 0.03)';
                    let border = '1px solid rgba(255, 255, 255, 0.08)';

                    if (isRevealed) {
                      if (isCorrect) {
                        bg = 'rgba(16, 185, 129, 0.15)';
                        border = '1px solid rgba(16, 185, 129, 0.5)';
                      } else if (isSelected && !isCorrect) {
                        bg = 'rgba(239, 68, 68, 0.15)';
                        border = '1px solid rgba(239, 68, 68, 0.5)';
                      }
                    } else if (isSelected) {
                      bg = 'rgba(99, 102, 241, 0.15)';
                      border = '1px solid rgba(99, 102, 241, 0.5)';
                    }

                    return (
                      <div
                        key={dec.id}
                        onClick={() => !round3Submitted && setSelectedArchDecision(dec.id)}
                        style={{
                          padding: '1rem 1.25rem',
                          borderRadius: '10px',
                          backgroundColor: bg,
                          border: border,
                          cursor: isRevealed ? 'default' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <strong style={{ fontSize: '0.88rem', color: isSelected ? '#c7d2fe' : '#f8fafc' }}>
                            {dec.title}
                          </strong>
                          {isRevealed && isCorrect && <CheckCircle2 size={16} color="#34d399" />}
                          {isRevealed && isSelected && !isCorrect && <XCircle size={16} color="#f87171" />}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                          {dec.tradeoff}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Lesson on reveal */}
                {round3Submitted && (
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    fontSize: '0.85rem',
                    color: '#c7d2fe',
                    lineHeight: 1.5,
                    marginBottom: '1.5rem'
                  }}>
                    <strong style={{ color: '#818cf8', display: 'block', marginBottom: '0.25rem' }}>
                      💡 Staff Engineer Architectural Rule:
                    </strong>
                    {round3Challenge.engineeringLesson}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  {!round3Submitted ? (
                    <button
                      type="button"
                      disabled={!selectedArchDecision}
                      onClick={handleConfirmRound3}
                      style={{
                        padding: '0.65rem 1.5rem',
                        borderRadius: '8px',
                        background: selectedArchDecision ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255, 255, 255, 0.08)',
                        color: selectedArchDecision ? '#fff' : '#64748b',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: selectedArchDecision ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Lock Architectural Choice
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishContest}
                      style={{
                        padding: '0.65rem 1.75rem',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Trophy size={15} />
                      <span>Finish Contest & Generate Benchmark Report</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STAGE 4: CONTEST COMPLETED - REPORT & COMPANY CUTOFF DELTA RADAR           */}
          {/* ========================================================================= */}
          {contestStage === 'completed' && (
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
              {/* Master Summary Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.9) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                borderRadius: '16px',
                padding: '2rem 2.5rem',
                marginBottom: '1.75rem',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: results.overallIndex >= 75 ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'linear-gradient(135deg, #f59e0b, #ec4899)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    marginBottom: '0.85rem'
                  }}>
                    <Award size={32} />
                  </div>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.35rem 0' }}>
                    Sprint Complete: Placement Index {results.overallIndex} / 100
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    Total Time Used: <strong>{results.timeFormatted}</strong> • 3 Rounds Evaluated
                  </div>
                </div>

                {/* 3 Rounds Breakdown Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Round 1: Core CS (40%)
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
                      {results.r1Score} / 100 pts
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                      {results.r1Correct} of {round1Questions.length} Correct
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Round 2: Code Surgeon (30%)
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f472b6', marginTop: '0.2rem' }}>
                      {results.r2Score} / 100 pts
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                      {results.r2Score === 100 ? '✓ Atomic Patch Picked' : '⚠️ Non-Atomic Patch'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                      Round 3: Architecture (30%)
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c084fc', marginTop: '0.2rem' }}>
                      {results.r3Score} / 100 pts
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                      {results.r3Score === 100 ? '✓ Kafka Buffer Chosen' : '⚠️ High Latency Choice'}
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* COMPANY CUTOFF DELTA RADAR                                                 */}
                {/* ========================================================================= */}
                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Target size={18} color="#38bdf8" /> Company Placement Cutoff Radar
                      </h4>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                        Calculates exact eligibility thresholds against real campus recruitment cutoffs
                      </p>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.65rem', borderRadius: '999px' }}>
                      Benchmark: Batch 2026
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {COMPANY_CUTOFFS.map(comp => {
                      const delta = results.overallIndex - comp.cutoffScore;
                      const isEligible = delta >= 0;

                      return (
                        <div
                          key={comp.name}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.85rem 1rem',
                            borderRadius: '8px',
                            backgroundColor: isEligible ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            border: isEligible ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                              {comp.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Tier: {comp.baseTier} • CTC: {comp.avgPackage} • Cutoff: {comp.cutoffScore} pts
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.2rem 0.65rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              backgroundColor: isEligible ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                              color: isEligible ? '#34d399' : '#f87171'
                            }}>
                              {isEligible ? (
                                <>
                                  <Check size={12} /> Eligible (+{delta} pts)
                                </>
                              ) : (
                                <>
                                  <AlertCircle size={12} /> {Math.abs(delta)} pts away
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleStartContest}
                    style={{
                      padding: '0.7rem 1.5rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <RefreshCw size={14} /> Retake 20-Min Sprint
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('certificate')}
                    style={{
                      padding: '0.7rem 1.75rem',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem'
                    }}
                  >
                    <Award size={15} /> Claim Verified Placement Certificate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NATIONAL TOP 10 LEADERBOARD (ANTI-SHAME PRIVACY GUARD)              */}
      {/* ========================================================================= */}
      {activeTab === 'leaderboard' && (
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          {/* Anti-Shame Banner */}
          <div style={{
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Shield size={20} color="#38bdf8" />
            <div style={{ fontSize: '0.82rem', color: '#e0f2fe', lineHeight: 1.5 }}>
              <strong>Anti-Shame Privacy Guard:</strong> Only the verified <strong>Top 10 candidates</strong> are publicly celebrated on the national leaderboard. To prevent placement anxiety, all other students receive a <strong>private Placement Readiness Index</strong> with their personal company cutoff delta.
            </div>
          </div>

          {/* User's Private Position Status Banner */}
          <div style={{
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                You
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                  {profile?.full_name || 'Alex Rivera'} (Private Status)
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  College CSE Batch 2026 • Index: <strong>84.2/100</strong> (Tier: Placement Silver)
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                Eligible for TCS Digital & Infosys DSE
              </span>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                4 points to unlock Top 10 public recognition
              </div>
            </div>
          </div>

          {/* Top 10 Table */}
          <div style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Rank</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Top 10 Candidate</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>College</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Sprint Score</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Time</th>
                  <th style={{ padding: '0.9rem 1.25rem' }}>Placement Status</th>
                </tr>
              </thead>
              <tbody>
                {TOP_10_LEADERBOARD.map(item => (
                  <tr
                    key={item.rank}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: item.rank <= 3 ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: 800, color: item.rank <= 3 ? '#fbbf24' : '#94a3b8' }}>
                      #{item.rank} {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : ''}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <img
                          src={item.avatar}
                          alt={item.name}
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.handle}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', color: '#cbd5e1', fontSize: '0.82rem' }}>
                      {item.college}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                      {item.score} pts
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                      {item.time}
                    </td>
                    <td style={{ padding: '0.9rem 1.25rem' }}>
                      <span style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: item.verdict.includes('Strong Hire') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                        color: item.verdict.includes('Strong Hire') ? '#34d399' : '#818cf8',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {item.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PLACEMENT BENCHMARK CERTIFICATE                                     */}
      {/* ========================================================================= */}
      {activeTab === 'certificate' && (
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.18), rgba(15, 23, 42, 0.95))',
            border: '2px solid rgba(139, 92, 246, 0.45)',
            borderRadius: '20px',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.2)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.78rem',
              color: '#cbd5e1',
              fontWeight: 700,
              marginBottom: '1.25rem'
            }}>
              <Shield size={14} color="#38bdf8" /> Official CareerOS Placement Benchmark
            </div>

            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', margin: '0 0 0.4rem 0' }}>
              Certificate of Placement Competence
            </h2>
            <div style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '2rem' }}>
              Evaluated across 3 Speed Rounds (Core CS • Code Surgeon • Architecture)
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.5rem',
              maxWidth: '600px',
              margin: '0 auto 2rem auto',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Candidate:</span>
                <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{profile?.full_name || 'Alex Rivera'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Assessed Track:</span>
                <strong style={{ color: '#818cf8', fontSize: '0.9rem' }}>{profile?.target_role || 'Backend Developer'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>National Placement Index:</span>
                <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>84.2 / 100 (Tier: Placement Silver)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Company Readiness:</span>
                <strong style={{ color: '#38bdf8', fontSize: '0.9rem' }}>Eligible: TCS Digital, Infosys DSE, Cognizant</strong>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => alert('Certificate link copied! Attach to your resume or share on LinkedIn.')}
                style={{
                  padding: '0.75rem 1.75rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Share2 size={16} /> Share on LinkedIn
              </button>

              <button
                type="button"
                onClick={() => alert('Downloading verified PDF benchmark certificate...')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Download size={16} /> Download PDF Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlacementArenaPage;
