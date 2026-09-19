import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, FileCheck, Target, Milestone, Layers, HelpCircle, BarChart3, CheckCircle2, TrendingUp, Cpu } from 'lucide-react';
import { Button } from '../components/common/Button';
import { CosmicParallaxBg } from '../components/ui/parallax-cosmic-background';
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
            icon: <FileCheck size={24} className="text-primary-accent"/>,
            title: 'AI Resume Analysis',
            desc: 'Instant scoring across technical stack, project impact, and ATS keywords with actionable improvement suggestions.'
        },
        {
            icon: <Target size={24} className="text-primary-accent"/>,
            title: 'Job Skill Matching',
            desc: 'Paste any job description to calculate exact match percentages and identify critical missing technologies.'
        },
        {
            icon: <Milestone size={24} className="text-primary-accent"/>,
            title: 'Personalized Career Roadmap',
            desc: 'Structured multi-phase milestones explaining why to learn a skill, what to master, and project ideas.'
        },
        {
            icon: <Layers size={24} className="text-primary-accent"/>,
            title: 'Job Application Tracker',
            desc: 'Kanban board for tracking applications across Saved, Applied, Assessment, Interview, and Offer stages.'
        },
        {
            icon: <HelpCircle size={24} className="text-primary-accent"/>,
            title: 'Interview Preparation',
            desc: 'Role-specific and difficulty-calibrated technical interview questions with structured answer frameworks.'
        },
        {
            icon: <BarChart3 size={24} className="text-primary-accent"/>,
            title: 'Career Analytics',
            desc: 'Dynamic career readiness scoring, response rate metrics, and estimated skill uplift tracking.'
        }
    ];
    return (<div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Landing Navigation Header */}
      <header style={{
            padding: '1.25rem 2rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: 'rgba(9, 13, 22, 0.85)',
            backdropFilter: 'blur(12px)',
            zIndex: 50
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="brand-logo-icon">
            <Sparkles size={20}/>
          </div>
          <span className="brand-name" style={{ fontSize: '1.4rem' }}>CareerOS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary">Get Started Free</Button>
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
              padding: '5rem 1.5rem 4rem 1.5rem',
              maxWidth: '1100px',
              margin: '0 auto',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
          }}>
          <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: 'var(--primary)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1.5rem'
          }}>
            <Cpu size={15}/> BUILT FOR COLLEGE STUDENTS & FRESHERS
          </div>

          <h1 className="text-h1" style={{ fontSize: '3.25rem', maxWidth: '850px', marginBottom: '1.25rem' }}>
            Build the career <br />
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1, #10b981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
          }}>
              you're aiming for.
            </span>
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.6, marginBottom: '2.5rem' }}>
            CareerOS helps students and freshers turn their current skills into a personalized path toward their target career. Know what skills you're missing, build the right projects, and prepare for top placements.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/register">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18}/>}>
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Sign In to Your Workspace
              </Button>
            </Link>
          </div>


          {/* Hero Interactive Preview Card */}
          <div style={{
              marginTop: '4rem',
              width: '100%',
              maxWidth: '960px',
              background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px -10px rgba(59, 130, 246, 0.2)',
              textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}/>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}/>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}/>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>career-dashboard.careeros.app</span>
              </div>
              <span className="badge badge-success">
                <CheckCircle2 size={12}/> Target Role: Java Backend Developer
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span className="text-sm text-muted">Career Readiness</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>78%</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={14} className="text-success"/> +14% this month
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span className="text-sm text-muted">Active Roadmaps</span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>Java + Spring</div>
                <div className="progress-bar-container" style={{ marginTop: '8px' }}>
                  <div className="progress-bar-fill" style={{ width: '65%' }}/>
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
      </div>

      {/* How It Works */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>WORKFLOW</span>
          <h2 className="text-h2">How CareerOS Works</h2>
          <p className="text-body" style={{ marginTop: '0.5rem' }}>A structured, 6-step cycle built specifically for college students transitioning into engineering roles.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
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
      <section style={{ padding: '5rem 1.5rem', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>FEATURES</span>
            <h2 className="text-h2">Everything You Need To Land Your Dream Job</h2>
            <p className="text-body" style={{ marginTop: '0.5rem' }}>Powerful tools replacing chaotic spreadsheets, disconnected tutorials, and blind applications.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
      <section style={{ padding: '6rem 1.5rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 className="text-h2" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Stop guessing what to learn. <br />
          <span style={{ color: 'var(--primary)' }}>Start building the career you want.</span>
        </h2>
        <p className="text-body" style={{ fontSize: '1.05rem', marginBottom: '2rem' }}>
          Join thousands of college students and freshers advancing their careers with structured roadmaps, intelligent gap analysis, and real-time application tracking.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register">
            <Button variant="primary" size="lg">Create Free Account</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">Sign In</Button>
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
            <Sparkles size={14}/>
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
