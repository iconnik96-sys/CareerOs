import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  FileCheck, 
  Target, 
  Milestone, 
  Layers, 
  HelpCircle, 
  BarChart3, 
  CheckCircle2, 
  Cpu, 
  Zap, 
  Play, 
  Square, 
  Volume2, 
  Terminal, 
  ShieldCheck, 
  Check, 
  Flame, 
  Code2, 
  Award, 
  MessageSquareCode, 
  CheckCircle,
  XCircle,
  CreditCard
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { CosmicParallaxBg } from '../components/ui/parallax-cosmic-background';

export const LandingPage = () => {
  // Playground State
  const [activeTab, setActiveTab] = useState('star'); // 'star' | 'voice' | 'outage'
  
  // STAR Polisher Demo State
  const sampleBullets = [
    {
      raw: "Worked on a student portal using React and Node.js with database.",
      role: "Full Stack Engineer",
      polished: "Architected high-throughput campus portal with React & Node.js, slashing SQL query latency by 42% via Redis caching for 1,200+ daily active students.",
      oldScore: 38,
      newScore: 94,
      keywords: ["Redis Caching", "Latency Optimization", "React", "Node.js Microservices"]
    },
    {
      raw: "Created a machine learning model to predict customer churn in Python.",
      role: "AI / Data Science",
      polished: "Engineered XGBoost churn prediction pipeline in Python, achieving 89.4% ROC-AUC and reducing false-positive alerts by 31% on 50,000+ customer records.",
      oldScore: 42,
      newScore: 96,
      keywords: ["XGBoost", "ROC-AUC Calibration", "Pipeline Optimization", "Python"]
    },
    {
      raw: "Helped team build backend API endpoints in Spring Boot for payments.",
      role: "Java Backend Engineer",
      polished: "Designed idempotent payment webhook handlers in Spring Boot with distributed Redis locking, maintaining 99.98% consistency under 4,500 peak RPM.",
      oldScore: 35,
      newScore: 95,
      keywords: ["Spring Boot", "Idempotency", "Distributed Locks", "High Concurrency"]
    }
  ];
  const [selectedBulletIndex, setSelectedBulletIndex] = useState(0);
  const [isPolishing, setIsPolishing] = useState(false);
  const [showPolished, setShowPolished] = useState(true);

  const handlePolishTrigger = (index) => {
    setSelectedBulletIndex(index);
    setIsPolishing(true);
    setShowPolished(false);
    setTimeout(() => {
      setIsPolishing(false);
      setShowPolished(true);
    }, 450);
  };

  // Voice Interview Demo State
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(65);

  useEffect(() => {
    let interval;
    if (isPlayingVoice) {
      interval = setInterval(() => {
        setVoiceProgress((prev) => (prev >= 100 ? 0 : prev + 5));
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlayingVoice]);

  // Outage Sandbox Demo State
  const [testRunStatus, setTestRunStatus] = useState('idle'); // 'idle' | 'running' | 'passed'
  const handleRunTests = () => {
    setTestRunStatus('running');
    setTimeout(() => {
      setTestRunStatus('passed');
    }, 700);
  };

  // Pricing Toggle
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'quarterly'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Landing Navigation Header */}
      <header style={{
        padding: 'clamp(0.75rem, 2vw, 1.15rem) clamp(1rem, 3vw, 2rem)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(9, 13, 22, 0.9)',
        backdropFilter: 'blur(16px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="brand-logo-icon" style={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span className="brand-name" style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>CareerOS</span>
          <span className="hide-on-mobile" style={{
            fontSize: '0.68rem',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#818cf8',
            padding: '0.15rem 0.5rem',
            borderRadius: '999px',
            fontWeight: 700,
            marginLeft: '0.25rem'
          }}>
            AI ENGINE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.5vw, 1.25rem)' }}>
          <Link to="/pricing" className="hide-on-mobile" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
            Pricing
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm" style={{ padding: '0.4rem 0.65rem' }}>Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm" style={{ boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)', padding: '0.4rem 0.75rem' }}>
              <span className="hide-on-mobile">Start Free Today</span>
              <span className="show-on-mobile">Join Free</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section with Cosmic Parallax Starfield */}
      <div style={{ position: 'relative', overflow: 'hidden', width: '100%', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.85
        }}>
          <CosmicParallaxBg loop={true} />
        </div>

        <section style={{
          position: 'relative',
          zIndex: 1,
          padding: 'clamp(2.5rem, 6vw, 4.5rem) clamp(1rem, 3vw, 1.5rem) 3.5rem',
          maxWidth: '1150px',
          margin: '0 auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Purple Cow Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            color: '#c084fc',
            fontSize: '0.82rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '1.5rem',
            boxShadow: '0 0 24px rgba(168, 85, 247, 0.2)'
          }}>
            <Flame size={15} color="#ec4899" />
            THE UNFAIR ADVANTAGE FOR CAMPUS PLACEMENTS
          </div>

          {/* Hard-Hitting Hero Headline */}
          <h1 className="text-h1" style={{ fontSize: 'clamp(1.85rem, 5vw, 3.8rem)', maxWidth: '980px', marginBottom: '1.25rem', lineHeight: 1.15, fontWeight: 900 }}>
            Don’t practice on real interviews. <br />
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa 20%, #a855f7 60%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Debug production outages & drill AI voice rounds first.
            </span>
          </h1>

          <p style={{ fontSize: '1.18rem', color: 'var(--text-secondary)', maxWidth: '740px', lineHeight: 1.6, marginBottom: '2.25rem' }}>
            The only engineering launchpad featuring <strong>hands-on microservice incident simulations</strong>, 
            <strong> real-time voice technical mock interviews</strong>, and <strong>Google XYZ recruiter-grade resume polishing</strong>. 
            All for less than the cost of a single pizza (₹149).
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3.5rem' }}>
            <Link to="/register">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18}/>} style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                border: 'none',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)',
                fontWeight: 800,
                padding: '0.85rem 1.8rem'
              }}>
                Start Practicing Free
              </Button>
            </Link>
            <a href="#playground">
              <Button variant="secondary" size="lg" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                Try Live Playground ↓
              </Button>
            </a>
          </div>

          {/* PURPLE COW HOOK: Interactive Hero Playground */}
          <div id="playground" style={{
            width: '100%',
            maxWidth: '1040px',
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: '1.5px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.7), 0 0 50px -10px rgba(99, 102, 241, 0.25)',
            textAlign: 'left',
            overflow: 'hidden'
          }}>
            {/* Playground Header / Navigation Tabs */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.85rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ef4444' }}/>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#f59e0b' }}/>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#10b981' }}/>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, marginLeft: '0.5rem', fontFamily: 'monospace' }}>
                  interactive-preview.careeros.app
                </span>
              </div>

              {/* Tab Selector Buttons */}
              <div style={{
                display: 'inline-flex',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '10px',
                padding: '3px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto',
                maxWidth: '100%',
                WebkitOverflowScrolling: 'touch'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('star')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'star' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: activeTab === 'star' ? '#fff' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  <Sparkles size={14} />
                  <span>1. STAR Bullet Polisher</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('voice')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'voice' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: activeTab === 'voice' ? '#fff' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  <Volume2 size={14} />
                  <span>2. AI Voice Mock Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('outage')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: activeTab === 'outage' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                    color: activeTab === 'outage' ? '#fff' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  <Terminal size={14} />
                  <span>3. Outage Lab Sandbox</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: STAR Bullet Polisher */}
            {activeTab === 'star' && (
              <div style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={18} color="#a855f7" /> Test the Google XYZ Resume Engine
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      See how CareerOS converts weak student bullets into metric-driven, ATS-ranking accomplishments in 1 second.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {sampleBullets.map((b, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePolishTrigger(idx)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          border: selectedBulletIndex === idx ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: selectedBulletIndex === idx ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                          color: selectedBulletIndex === idx ? '#c7d2fe' : '#94a3b8',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {b.role}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
                  {/* Before Box */}
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        ❌ Standard Student Resume Bullet
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>
                        ATS Score: {sampleBullets[selectedBulletIndex].oldScore}/100
                      </span>
                    </div>
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '8px',
                      color: '#cbd5e1',
                      fontSize: '0.92rem',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                      flex: 1
                    }}>
                      "{sampleBullets[selectedBulletIndex].raw}"
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#94a3b8' }}>
                      ⚠️ No quantifiable metrics • Missing system architecture • Low ATS ranking
                    </div>
                  </div>

                  {/* After Box */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1.5px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <CheckCircle2 size={14} /> CareerOS Google XYZ Enhanced
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.2)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        ATS Score: {sampleBullets[selectedBulletIndex].newScore}/100 (+56% Uplift)
                      </span>
                    </div>

                    <div style={{
                      padding: '1rem',
                      background: 'rgba(0, 0, 0, 0.45)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      lineHeight: 1.55,
                      flex: 1,
                      borderLeft: '3px solid #10b981'
                    }}>
                      {isPolishing ? (
                        <span style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Sparkles size={16} className="animate-spin" /> Rewriting using Google XYZ STAR syntax...
                        </span>
                      ) : (
                        sampleBullets[selectedBulletIndex].polished
                      )}
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {sampleBullets[selectedBulletIndex].keywords.map((kw, i) => (
                        <span key={i} style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem 1.25rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Want this for your entire resume? <strong>15 ATS Scans & Polishers included in Student Premium.</strong>
                  </span>
                  <Link to="/register">
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14}/>}>
                      Polish My Resume Free
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: AI Voice Mock Interview */}
            {activeTab === 'voice' && (
              <div style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Volume2 size={18} color="#6366f1" /> Live AI Voice Mock Interview Simulator
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Practice technical rounds by voice. Speak naturally into your mic and receive instant 4-vector grading.
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '999px',
                    fontWeight: 700
                  }}>
                    🎙️ Web Audio Speech Engine Active
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
                  {/* Interview Audio Player Box */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '14px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: isPlayingVoice ? '#ef4444' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                          border: 'none',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 0 16px rgba(99, 102, 241, 0.4)'
                        }}
                      >
                        {isPlayingVoice ? <Square size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                      </button>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>
                          {isPlayingVoice ? "Playing Interview Audio..." : "Click to Preview Voice Question"}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Topic: Distributed Cache Invalidation & Race Conditions
                        </div>
                      </div>
                    </div>

                    {/* Animated Soundwave Visualizer */}
                    <div style={{
                      height: '42px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '0 1rem',
                      marginBottom: '1rem',
                      overflow: 'hidden'
                    }}>
                      {[14, 28, 38, 20, 10, 32, 24, 40, 18, 30, 12, 34, 22, 16, 28, 36, 12, 26, 32, 18].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            width: '4px',
                            height: isPlayingVoice ? `${Math.max(6, (h * ((voiceProgress + i * 5) % 100)) / 70)}px` : '8px',
                            background: isPlayingVoice ? 'linear-gradient(180deg, #818cf8, #c084fc)' : '#475569',
                            borderRadius: '2px',
                            transition: 'height 0.15s ease'
                          }}
                        />
                      ))}
                    </div>

                    {/* Transcript Simulation */}
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px' }}>
                      <strong style={{ color: '#818cf8' }}>AI Recruiter:</strong> "When a high-concurrency flash sale occurs, how do you prevent cache stampede on Redis without overwhelming your primary PostgreSQL database?"
                    </div>
                  </div>

                  {/* 4-Vector Scorecard */}
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>4-Vector Interview Rubric</span>
                      <span style={{ color: '#4ade80' }}>Overall: 91% (Pass)</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '2px' }}>
                          <span>Technical Accuracy (Distributed Locks)</span>
                          <span style={{ fontWeight: 700, color: '#818cf8' }}>94%</span>
                        </div>
                        <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '94%', height: '100%', background: '#6366f1' }}/>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '2px' }}>
                          <span>STAR Structure & Clarity</span>
                          <span style={{ fontWeight: 700, color: '#818cf8' }}>88%</span>
                        </div>
                        <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '88%', height: '100%', background: '#6366f1' }}/>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '2px' }}>
                          <span>Pacing & Speech Confidence</span>
                          <span style={{ fontWeight: 700, color: '#818cf8' }}>92%</span>
                        </div>
                        <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '92%', height: '100%', background: '#10b981' }}/>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '2px' }}>
                          <span>Filler Word Detection ("uh/like")</span>
                          <span style={{ fontWeight: 700, color: '#4ade80' }}>0 Detected</span>
                        </div>
                        <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '100%', height: '100%', background: '#10b981' }}/>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: '#4ade80', fontWeight: 600 }}>
                      ✓ High Offer Probability: Clear mental model of Mutex Locking + Stale-While-Revalidate.
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem 1.25rem', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Drill 5 full voice technical sessions each month on Premium.
                  </span>
                  <Link to="/register">
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14}/>}>
                      Try Free Voice Session
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: Outage Sandbox */}
            {activeTab === 'outage' && (
              <div style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Terminal size={18} color="#ec4899" /> Scenario FIN-BEG-1: Stripe Payment Timeout Outage
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                      Debug live code in a guided browser IDE. Guided by Marcus, your Socratic AI Senior Staff Engineer.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunTests}
                    style={{
                      background: testRunStatus === 'passed' ? '#10b981' : 'linear-gradient(135deg, #ec4899, #a855f7)',
                      border: 'none',
                      color: '#fff',
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)'
                    }}
                  >
                    {testRunStatus === 'running' ? 'Running Automated Test Suite...' : testRunStatus === 'passed' ? '✓ All 8 Tests Passed' : '▶ Execute Test Suite'}
                  </button>
                </div>

                <div style={{
                  background: '#0a0f1d',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: 'Consolas, monospace',
                  fontSize: '0.82rem',
                  overflow: 'hidden'
                }}>
                  <div style={{ background: '#111827', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', gap: '1rem' }}>
                    <span>webhook_handler.py (Microservice)</span>
                    <span style={{ whiteSpace: 'nowrap' }}>Status: {testRunStatus === 'passed' ? '🟢 Fixed (p99 < 12ms)' : '🔴 Production Incident Active'}</span>
                  </div>
                  <div style={{ padding: '1rem', lineHeight: 1.6, color: '#e2e8f0', overflowX: 'auto', wordBreak: 'break-word' }}>
                    <div style={{ color: '#64748b' }}># Buggy: Synchronous database lock inside webhook handler causes 504 timeouts under load</div>
                    <div><span style={{ color: '#f43f5e' }}>-</span> <span style={{ color: '#fca5a5' }}>db.orders.update_one(order_id, lock=True)  # Blocking database thread</span></div>
                    <div><span style={{ color: '#10b981' }}>+</span> <span style={{ color: '#86efac' }}>redis_queue.publish("events:payment_confirmed", payload)  # Async non-blocking</span></div>
                    <div style={{ marginTop: '0.75rem', color: '#94a3b8' }}>
                      Marcus (AI Mentor): <em>"Notice how moving to an event-driven queue lets the webhook immediately return 200 OK to Stripe in 8ms while the worker handles the database asynchronously."</em>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    🏅 Add this incident verification directly to your resume under <em>"Real-World Production Projects"</em>.
                  </div>
                  <Link to="/register">
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14}/>}>
                      Unlock All 9 Simulations
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* THE PURPLE COW CONTRAST: Old College Way vs CareerOS */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#818cf8',
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '0.3rem 0.8rem',
            borderRadius: '999px',
            border: '1px solid rgba(99, 102, 241, 0.25)'
          }}>
            THE REALITY CHECK
          </span>
          <h2 className="text-h2" style={{ fontSize: '2.4rem', marginTop: '0.75rem' }}>
            Why 85% of Engineering Students Get Rejected
          </h2>
          <p className="text-body" style={{ marginTop: '0.5rem', maxWidth: '650px', margin: '0.5rem auto 0' }}>
            College teaches outdated theory. Companies test for high-concurrency instincts and real communication.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
          {/* Old Way */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.04)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <XCircle size={24} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>
                The Traditional Broken Way
              </h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <li style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ color: '#ef4444' }}>✕</span>
                <span><strong>Blind LeetCode Grinding:</strong> Memorizing 300 binary tree algorithms without ever touching real microservices or Docker.</span>
              </li>
              <li style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ color: '#ef4444' }}>✕</span>
                <span><strong>Copy-Pasted To-Do App Resumes:</strong> Listing basic college clone projects that ATS filters instantly trash.</span>
              </li>
              <li style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ color: '#ef4444' }}>✕</span>
                <span><strong>Freezing in Voice Rounds:</strong> Never practicing spoken answers, stuttering through basic technical explanations under pressure.</span>
              </li>
              <li style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ color: '#ef4444' }}>✕</span>
                <span><strong>200+ Silent Rejections:</strong> Sending random cold emails and receiving zero recruiter callbacks.</span>
              </li>
            </ul>
          </div>

          {/* CareerOS Way */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.06) 100%)',
            border: '2px solid #6366f1',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 10px 40px rgba(99, 102, 241, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <CheckCircle size={24} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                The CareerOS Purple Cow Edge
              </h3>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', color: '#f8fafc' }}>
              <li style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <span><strong>Live Outage Debugging:</strong> Fix real Kafka lags, Redis cache stamps, and SQL deadlocks. Stand out 10x over LeetCode clones.</span>
              </li>
              <li style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <span><strong>Google XYZ STAR Resume:</strong> Every single project is transformed into measurable business impact with ATS keywords.</span>
              </li>
              <li style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <span><strong>Real-Time AI Voice Rounds:</strong> Drill technical voice mocks until articulating complex trade-offs feels second nature.</span>
              </li>
              <li style={{ display: 'flex', gap: '0.6rem' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <span><strong>Campus Placement Pass:</strong> Complete preparation system targeting 12+ LPA engineering roles.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* PRODUCTION BATTLEGROUND SHOWCASE */}
      <section style={{
        padding: '5rem 1.5rem',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#c084fc',
              background: 'rgba(168, 85, 247, 0.1)',
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid rgba(168, 85, 247, 0.25)'
            }}>
              PRODUCTION SIMULATION BATTLEGROUND
            </span>
            <h2 className="text-h2" style={{ fontSize: '2.4rem', marginTop: '0.75rem' }}>
              Top Companies Don't Hire LeetCode Clones. <br />They Hire Engineers Who Fix Outages.
            </h2>
            <p className="text-body" style={{ marginTop: '0.5rem', maxWidth: '700px', margin: '0.5rem auto 0' }}>
              Work on realistic microservices modeled after high-scale systems at Amazon, Swiggy, and Stripe.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
            {/* Incident 1 */}
            <div className="card" style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                  TASK FIN-BEG-1
                </span>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>Free in Starter</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Stripe Payment Webhook Timeout
              </h3>
              <p className="text-body text-sm" style={{ marginBottom: '1rem' }}>
                Synchronous database operations choke your server during high-volume webhook delivery. Refactor to an asynchronous event pipeline.
              </p>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem' }}>
                Skills: <strong>Redis Queue, Asynchronous Python, Webhooks</strong>
              </div>
            </div>

            {/* Incident 2 */}
            <div className="card" style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1.5px solid rgba(99, 102, 241, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.72rem', background: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                  TASK ECOM-INT-2
                </span>
                <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 800 }}>Student Premium</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Flash Sale Redis Cache Stampede
              </h3>
              <p className="text-body text-sm" style={{ marginBottom: '1rem' }}>
                50,000 shoppers hit a newly expired key simultaneously, collapsing your primary Postgres instance. Implement Mutex Locking & TTL Jitter.
              </p>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem' }}>
                Skills: <strong>Cache Stampede, Distributed Mutex, Jittered TTL</strong>
              </div>
            </div>

            {/* Incident 3 */}
            <div className="card" style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.25)', color: '#c084fc', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                  TASK CLOUD-PRO-3
                </span>
                <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 800 }}>Placement Pro</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
                Kafka Consumer Group Partition Lag
              </h3>
              <p className="text-body text-sm" style={{ marginBottom: '1rem' }}>
                Poison pill payload crashes consumers in partition 4, triggering endless rebalance storms. Construct a Dead-Letter-Queue (DLQ) circuit breaker.
              </p>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem' }}>
                Skills: <strong>Kafka Partitions, DLQ, Circuit Breakers</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IMPULSE BUY PRICING STRIP (The Pizza Comparison) */}
      <section style={{ padding: '5.5rem 1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.9rem',
            borderRadius: '999px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#818cf8',
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '1rem'
          }}>
            <Sparkles size={14} /> NO EXPENSIVE COACHING NEEDED
          </div>
          <h2 className="text-h2" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
            Invest in Your Placement for Less Than a Pizza
          </h2>
          <p className="text-body" style={{ marginTop: '0.5rem', maxWidth: '650px', margin: '0.5rem auto 1.5rem' }}>
            No subscriptions traps. No auto-renewal surprises. Pay securely with any Indian UPI app or card.
          </p>

          {/* Value Comparison Bar */}
          <div style={{
            maxWidth: '750px',
            margin: '0 auto 2.5rem',
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div style={{ padding: '1rem', borderRight: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>🍕 1 Medium Pizza + Coke</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', margin: '4px 0' }}>₹450</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Gone in 20 minutes</div>
              </div>
              <div style={{ padding: '1rem', borderRight: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📚 1 Aptitude Prep Book</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', margin: '4px 0' }}>₹550</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Collects dust on desk</div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.15)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 700 }}>⚡ CareerOS Placement Pass</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#34d399', margin: '4px 0' }}>₹149 / mo</div>
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>Mock rounds & dream offer</div>
              </div>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '999px',
            padding: '4px'
          }}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '0.5rem 1.4rem',
                borderRadius: '999px',
                background: billingCycle === 'monthly' ? '#6366f1' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('quarterly')}
              style={{
                padding: '0.5rem 1.4rem',
                borderRadius: '999px',
                background: billingCycle === 'quarterly' ? '#6366f1' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>3-Month Placement Pass</span>
              <span style={{
                background: '#22c55e',
                color: '#000',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.15rem 0.45rem',
                borderRadius: '999px'
              }}>
                SAVE 25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.75rem', alignItems: 'stretch' }}>
          
          {/* Card 1: Free */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '2rem 1.75rem',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Free Starter
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>₹0</span>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>/ forever</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.5rem', minHeight: '36px' }}>
              Test drive the platform and experience your first AI simulation.
            </p>
            <Link to="/register">
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: '1.75rem'
                }}
              >
                Create Free Account
              </button>
            </Link>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem' }}>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#22c55e" /> 1 Beginner Outage Task (FIN-BEG-1)</li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#22c55e" /> 1 AI Voice Mock Interview</li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#22c55e" /> 1 ATS Resume Scan</li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#22c55e" /> Curated Technical Skill Guides</li>
            </ul>
          </div>

          {/* Card 2: Student Premium */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)',
            border: '2px solid #6366f1',
            borderRadius: '18px',
            padding: '2rem 1.75rem',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(99, 102, 241, 0.25)'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.25rem 0.85rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}>
              ⚡ MOST POPULAR FOR FRESHERS
            </div>

            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Student Premium
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>
                ₹{billingCycle === 'quarterly' ? '349' : '149'}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                / {billingCycle === 'quarterly' ? '3 months' : 'month'}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '1.5rem', minHeight: '36px' }}>
              Master real microservices and drill technical voice rounds with Google XYZ bullets.
            </p>
            <Link to="/pricing">
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                  marginBottom: '1.75rem'
                }}
              >
                <span>Get Instant Access</span>
                <ArrowRight size={16} />
              </button>
            </Link>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem' }}>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#6366f1" /> <strong>6 Microservice Outage Simulations</strong></li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#6366f1" /> <strong>5 AI Voice Mock Interviews / month</strong></li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#6366f1" /> <strong>15 ATS Scans & Google XYZ STAR rewrites</strong></li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#6366f1" /> <strong>Auto-Apply Code Fix</strong> in Guided Browser IDE</li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#6366f1" /> Skill-Gap Analysis & Application Kanban Tracker</li>
            </ul>
          </div>

          {/* Card 3: Placement Pro */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            borderRadius: '18px',
            padding: '2rem 1.75rem',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              👑 Placement Pro
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>
                ₹{billingCycle === 'quarterly' ? '699' : '299'}
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                / {billingCycle === 'quarterly' ? '3 months' : 'month'}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '1.5rem', minHeight: '36px' }}>
              Complete placement season toolkit: Pro outages and Socratic AI mentor.
            </p>
            <Link to="/pricing">
              <button
                type="button"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
                  marginBottom: '1.75rem'
                }}
              >
                <span>Get Placement Pro</span>
                <ArrowRight size={16} />
              </button>
            </Link>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.84rem' }}>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#c084fc" /> <strong>All 9 Simulations (Includes 🔴 Pro Outages)</strong></li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#c084fc" /> <strong>12 AI Voice Mock Interviews / month</strong></li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#c084fc" /> <strong>40 ATS Scans</strong> + Tailored Cover Letters</li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#c084fc" /> <strong>Marcus Socratic Senior AI Mentor</strong></li>
              <li style={{ display: 'flex', gap: '0.5rem' }}><Check size={16} color="#c084fc" /> Campus Placement Shareable Readiness Certificate</li>
            </ul>
          </div>
        </div>

        {/* UPI & Payment Trust Badges */}
        <div style={{
          marginTop: '2.5rem',
          padding: '1.25rem 2rem',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={20} color="#22c55e" />
            <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
              Zero Risk • Instant Activation • All Indian Payment Options Supported:
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>Google Pay</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>PhonePe</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>Paytm UPI</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>CRED UPI</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0' }}>Debit/Credit Card</span>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section style={{
        padding: '6rem 1.5rem',
        maxWidth: '850px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="text-h2" style={{ fontSize: '2.6rem', marginBottom: '1rem', fontWeight: 900 }}>
            Stop guessing what recruiters want. <br />
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Start building verified engineering proof today.
            </span>
          </h2>
          <p className="text-body" style={{ fontSize: '1.1rem', marginBottom: '2.25rem', maxWidth: '650px', margin: '0 auto 2.25rem' }}>
            Join forward-thinking college freshers who practice real microservice debugging and speak with confidence in their final technical interviews.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <Button variant="primary" size="lg" style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)',
                fontWeight: 800,
                padding: '0.9rem 2rem'
              }}>
                Create Free Account
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="secondary" size="lg" style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.15)' }}>
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        padding: '2rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="brand-logo-icon" style={{ width: 26, height: 26, background: '#6366f1', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1rem' }}>CareerOS</span>
          <span className="text-xs text-muted" style={{ marginLeft: '0.5rem' }}>
            © 2026 CareerOS AI Platform. Built for college engineers & freshers.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          <Link to="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link>
          <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>Register</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
