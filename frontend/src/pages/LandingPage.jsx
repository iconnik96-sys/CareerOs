import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, FileCheck, Target, Milestone, Layers, HelpCircle, BarChart3, CheckCircle2, TrendingUp, Cpu } from 'lucide-react';
import { Button } from '../components/common/Button';
export const LandingPage = () => {
  const steps = [
    { num: '01', title: 'Create your profile', desc: 'Specify your degree, graduation year, target role, and preferred working locations.' },
    { num: '02', title: 'Upload your resume', desc: 'Upload your latest PDF resume to extract projects, education, and current skill set.' },
    { num: '03', title: 'Choose your target role', desc: 'Select from high-demand roles like Java Backend, Full Stack, Data Analyst, or AI/ML.' },
    { num: '04', title: 'Analyze your skill gaps', desc: 'Compare your resume directly with real job descriptions and pinpoint missing skills.' },
    { num: '05', title: 'Follow your roadmap', desc: 'Get practical, phased learning milestones with suggested projects to build.' },
    { num: '06', title: 'Track your applications', desc: 'Manage your entire hiring pipeline with an interactive Kanban board and status insights.' },
  ];
  const features = [
    {
      icon: <FileCheck size={24} className="text-primary-accent" />,
      title: 'AI Resume Analysis',
      desc: 'Instant scoring across technical stack, project impact, and ATS keywords with actionable improvement suggestions.'
    },
    {
      icon: <Target size={24} className="text-primary-accent" />,
      title: 'Job Skill Matching',
      desc: 'Paste any job description to calculate exact match percentages and identify critical missing technologies.'
    },
    {
      icon: <Milestone size={24} className="text-primary-accent" />,
      title: 'Personalized Career Roadmap',
      desc: 'Structured multi-phase milestones explaining why to learn a skill, what to master, and project ideas.'
    },
    {
      icon: <Layers size={24} className="text-primary-accent" />,
      title: 'Job Application Tracker',
      desc: 'Kanban board for tracking applications across Saved, Applied, Assessment, Interview, and Offer stages.'
    },
    {
      icon: <HelpCircle size={24} className="text-primary-accent" />,
      title: 'Interview Preparation',
      desc: 'Role-specific and difficulty-calibrated technical interview questions with structured answer frameworks.'
    },
    {
      icon: <BarChart3 size={24} className="text-primary-accent" />,
      title: 'Career Analytics',
      desc: 'Dynamic career readiness scoring, response rate metrics, and estimated skill uplift tracking.'
    }
  ];
  return (<div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
    {/* Fullscreen Video Hero Section */}
    <div className="cinematic-hero-root">
      {/* Fullscreen Looping Video Background */}
      <video
        className="cinematic-hero-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
          type="video/mp4"
        />
      </video>

      {/* Glassmorphic Navigation Bar */}
      <div className="cinematic-nav-wrapper">
        <nav className="cinematic-nav-container">
          <Link to="/" className="cinematic-logo" style={{ fontFamily: "'Instrument Serif', serif" }}>
            CareerOS<sup className="cinematic-logo-sup">®</sup>
          </Link>

          <div className="cinematic-nav-links">
            <a href="#" className="cinematic-nav-link active">Home</a>
            <a href="#how-it-works" className="cinematic-nav-link">How It Works</a>
            <a href="#features" className="cinematic-nav-link">Features</a>
            <Link to="/roadmap" className="cinematic-nav-link">Roadmap</Link>
          </div>

          <div className="cinematic-nav-actions">
            <Link to="/login" className="cinematic-nav-login-btn">
              Sign In
            </Link>
            <Link to="/register" className="cinematic-nav-cta-btn">
              <span className="cinematic-nav-cta-desktop">Get Started Free</span>
              <span className="cinematic-nav-cta-mobile">Get Started</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Cinematic Hero Content */}
      <section className="cinematic-hero-body">
        <div className="cinematic-badge animate-fade-rise">
          <Cpu size={14} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          <span>BUILT FOR COLLEGE STUDENTS & FRESHERS</span>
        </div>

        <h1
          className="cinematic-heading animate-fade-rise"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Build the career <em className="not-italic text-muted-foreground">you're aiming for.</em>
        </h1>

        <p className="cinematic-subtext animate-fade-rise-delay">
          CareerOS helps students and freshers turn their current skills into a personalized path toward their target career. Know what skills you're missing, build the right projects, and prepare for top placements.
        </p>

        <Link
          to="/register"
          className="cinematic-cta-button animate-fade-rise-delay-2"
        >
          Get Started Free
        </Link>
      </section>
    </div>

    {/* Hero Interactive Preview Card Section */}
    <section className="preview-mockup-section">
      <div className="preview-mockup-card">
        <div className="preview-mockup-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
            </div>
            <span className="preview-mockup-url">career-dashboard.careeros.app</span>
          </div>
          <span className="badge badge-success preview-mockup-badge">
            <CheckCircle2 size={12} style={{ flexShrink: 0 }} /> Target Role: Java Backend Developer
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span className="text-sm text-muted">Career Readiness</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>78%</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} className="text-success" /> +14% this month
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span className="text-sm text-muted">Active Roadmaps</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>Java + Spring</div>
            <div className="progress-bar-container" style={{ marginTop: '8px' }}>
              <div className="progress-bar-fill" style={{ width: '65%' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span className="text-sm text-muted">Applications Tracked</span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>12</div>
            <span className="text-xs text-muted" style={{ marginTop: '4px', display: 'block' }}>3 Interviews • 1 Offer</span>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span className="text-sm text-muted">Top Missing Skills</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              <span className="badge badge-warning">AWS</span>
              <span className="badge badge-warning">Kafka</span>
              <span className="badge badge-warning">Redis</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section id="how-it-works" style={{ padding: '5rem 1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>WORKFLOW</span>
        <h2 className="text-h2">How CareerOS Works</h2>
        <p className="text-body" style={{ marginTop: '0.5rem' }}>A structured, 6-step cycle built specifically for college students transitioning into engineering roles.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
        {steps.map(s => (<div key={s.num} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <span style={{
            position: 'absolute',
            top: '1rem',
            right: '1.25rem',
            fontSize: '2rem',
            fontWeight: 900,
            color: 'rgba(255, 255, 255, 0.05)',
            fontFamily: 'monospace'
          }}>
            {s.num}
          </span>
          <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            STEP {s.num}
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {s.title}
          </h3>
          <p className="text-body text-sm">{s.desc}</p>
        </div>))}
      </div>
    </section>

    {/* Features Grid */}
    <section id="features" style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>FEATURES</span>
          <h2 className="text-h2">Everything You Need To Land Your Dream Job</h2>
          <p className="text-body" style={{ marginTop: '0.5rem' }}>Powerful tools replacing chaotic spreadsheets, disconnected tutorials, and blind applications.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
          {features.map((f, i) => (<div key={i} className="card">
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {f.title}
            </h3>
            <p className="text-body text-sm">{f.desc}</p>
          </div>))}
        </div>
      </div>
    </section>

    {/* Final CTA */}
    <section className="landing-final-cta-section">
      <h2 className="landing-final-cta-heading">
        Stop guessing what to learn. <br />
        <span style={{ color: 'var(--primary)' }}>Start building the career you want.</span>
      </h2>
      <p className="text-body" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', marginBottom: '2rem' }}>
        Join thousands of college students and freshers advancing their careers with structured roadmaps, intelligent gap analysis, and real-time application tracking.
      </p>
      <div className="landing-cta-buttons">
        <Link to="/register" className="landing-cta-link">
          <Button variant="primary" size="lg" style={{ width: '100%' }}>Create Free Account</Button>
        </Link>
        <Link to="/login" className="landing-cta-link">
          <Button variant="outline" size="lg" style={{ width: '100%' }}>Sign In</Button>
        </Link>
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
        <div className="brand-logo-icon" style={{ width: 26, height: 26 }}>
          <Sparkles size={14} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>CareerOS</span>
        <span className="text-xs text-muted">© 2026 CareerOS Platform. Built for students & freshers.</span>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        <Link to="/login" style={{ color: 'inherit' }}>Sign In</Link>
        <Link to="/register" style={{ color: 'inherit' }}>Register</Link>
      </div>
    </footer>
  </div>);
};
