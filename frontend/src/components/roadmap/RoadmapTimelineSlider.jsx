import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Circle, ChevronLeft, ChevronRight, Sparkles, 
  Terminal, Trophy, Play, BookOpen, Layers, Award, Zap, Code
} from 'lucide-react';
import confetti from 'canvas-confetti';

const INITIAL_MILESTONES = [
  {
    id: 'basics',
    stepNumber: '01',
    title: '1. Basics',
    subtitle: 'Foundational Knowledge',
    theme: 'linear-gradient(135deg, #6366f1, #3b82f6)',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    accentColor: '#818cf8',
    status: 'COMPLETED',
    tasks: [
      { id: 'b1', name: 'JavaScript Fundamentals & ES6+', done: true, time: '20m', type: 'code' },
      { id: 'b2', name: 'Git Version Control & Branching', done: true, time: '15m', type: 'tool' },
      { id: 'b3', name: 'Basic Terminal & Linux CLI', done: true, time: '15m', type: 'tool' },
      { id: 'b4', name: 'HTML5 Semantic & Modern CSS3', done: true, time: '25m', type: 'code' }
    ]
  },
  {
    id: 'core',
    stepNumber: '02',
    title: '2. Core Concepts',
    subtitle: 'Full Stack & APIs',
    theme: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    accentColor: '#38bdf8',
    status: 'ACTIVE',
    tasks: [
      { id: 'c1', name: 'React Component Design & Hooks', done: true, time: '35m', type: 'code' },
      { id: 'c2', name: 'TypeScript Strict Types & Generics', done: true, time: '30m', type: 'code' },
      { id: 'c3', name: 'RESTful API & Express Architecture', done: false, time: '40m', type: 'code', active: true },
      { id: 'c4', name: 'Python Scripts & Database Connectors', done: false, time: '30m', type: 'code' },
      { id: 'c5', name: 'Data Structures & Algorithms in Practice', done: false, time: '45m', type: 'algo' }
    ]
  },
  {
    id: 'advanced',
    stepNumber: '03',
    title: '3. Advanced Topics',
    subtitle: 'Production & Cloud Systems',
    theme: 'linear-gradient(135deg, #a855f7, #ec4899)',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    accentColor: '#c084fc',
    status: 'LOCKED',
    tasks: [
      { id: 'a1', name: 'WebAssembly (WASM) In-Browser Runtime', done: false, time: '30m', type: 'sim' },
      { id: 'a2', name: 'Advanced Cloud & Microservices', done: false, time: '50m', type: 'cloud' },
      { id: 'a3', name: 'AI Integration for Developers (FastAPI + LLM)', done: false, time: '40m', type: 'ai' },
      { id: 'a4', name: 'System Design & Distributed Caching', done: false, time: '45m', type: 'arch' }
    ]
  },
  {
    id: 'career',
    stepNumber: '04',
    title: '4. Placement Mastery',
    subtitle: 'ATS & Interview Readiness',
    theme: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    accentColor: '#fbbf24',
    status: 'IN_PROGRESS',
    tasks: [
      { id: 'p1', name: 'Resume ATS 85+ Keyword Optimization', done: true, time: '15m', type: 'ats' },
      { id: 'p2', name: 'Real-time AI Voice Mock Interview', done: false, time: '20m', type: 'voice' },
      { id: 'p3', name: 'Company-Specific Technical Script', done: false, time: '25m', type: 'prep' }
    ]
  }
];

export const RoadmapTimelineSlider = ({ roleName = 'Full Stack Developer' }) => {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState(INITIAL_MILESTONES);
  const [activeCardId, setActiveCardId] = useState('core');
  const sliderRef = React.useRef(null);

  // Calculate totals
  const allTasks = milestones.flatMap(m => m.tasks);
  const completedTasks = allTasks.filter(t => t.done).length;
  const totalTasks = allTasks.length;
  const overallPercentage = Math.round((completedTasks / totalTasks) * 100);

  const handleToggleTask = (milestoneId, taskId, e) => {
    e.stopPropagation();
    let wasJustCompleted = false;

    setMilestones(prev => {
      return prev.map(m => {
        if (m.id !== milestoneId) return m;
        const newTasks = m.tasks.map(t => {
          if (t.id === taskId) {
            const nextDone = !t.done;
            if (nextDone) wasJustCompleted = true;
            return { ...t, done: nextDone };
          }
          return t;
        });

        const allDone = newTasks.every(t => t.done);
        return {
          ...m,
          tasks: newTasks,
          status: allDone ? 'COMPLETED' : m.status === 'LOCKED' ? 'ACTIVE' : m.status
        };
      });
    });

    if (wasJustCompleted) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6366f1', '#06b6d4', '#ec4899', '#f59e0b', '#10b981']
      });
    }
  };

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 11, 17, 0.95) 100%)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      padding: '1.5rem',
      marginBottom: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient glow */}
      <div style={{
        position: 'absolute',
        top: '-40%',
        left: '20%',
        width: '500px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Top Header & Path Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.6875rem', padding: '0.15rem 0.5rem' }}>
                <Sparkles size={11} style={{ marginRight: '4px' }} /> Dynamic Progress Strip
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• {roleName} Path</span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '-0.02em' }}>
              My Interactive Learning Roadmap
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Path Progress:</span>
              <strong style={{ fontSize: '0.875rem', color: '#38bdf8' }}>{overallPercentage}%</strong>
            </div>

            {/* Slider Arrow Controls */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => scrollSlider('left')}
                className="btn-ghost"
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  cursor: 'pointer'
                }}
                title="Scroll Left"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollSlider('right')}
                className="btn-ghost"
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  cursor: 'pointer'
                }}
                title="Scroll Right"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Global Progress Bar with Glow Thumb */}
        <div style={{
          width: '100%',
          height: '7px',
          backgroundColor: 'rgba(255, 255, 255, 0.07)',
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${overallPercentage}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #06b6d4 50%, #10b981 100%)',
            borderRadius: '999px',
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 12px rgba(6, 182, 212, 0.6)'
          }} />
        </div>
      </div>

      {/* Horizontal Scrollable Strip (Netflix Carousel Style) */}
      <div
        ref={sliderRef}
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: '0.75rem',
          paddingTop: '0.25rem',
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {milestones.map((m) => {
          const completedCount = m.tasks.filter(t => t.done).length;
          const milestonePct = Math.round((completedCount / m.tasks.length) * 100);
          const isCardActive = activeCardId === m.id;
          const isDone = milestonePct === 100;

          return (
            <div
              key={m.id}
              onClick={() => setActiveCardId(m.id)}
              style={{
                flex: '0 0 320px',
                scrollSnapAlign: 'start',
                backgroundColor: isCardActive ? 'rgba(24, 33, 53, 0.95)' : 'rgba(15, 23, 42, 0.6)',
                border: isCardActive ? `2px solid ${m.accentColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                boxShadow: isCardActive ? `0 12px 28px ${m.glowColor}` : '0 4px 12px rgba(0,0,0,0.2)',
                transform: isCardActive ? 'translateY(-2px)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* Header Gradient Pill */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      background: m.theme,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#ffffff',
                      boxShadow: `0 2px 8px ${m.glowColor}`
                    }}>
                      {m.stepNumber}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                        {m.title}
                      </h4>
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{m.subtitle}</span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    backgroundColor: isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.07)',
                    color: isDone ? '#34d399' : '#cbd5e1',
                    border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {isDone ? '✓ 100%' : `${milestonePct}%`}
                  </span>
                </div>

                {/* Milestone mini progress bar */}
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: `${milestonePct}%`,
                    height: '100%',
                    background: m.theme,
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Mini Todo Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.1rem' }}>
                    Learning Path Checklist ({completedCount}/{m.tasks.length})
                  </div>

                  {m.tasks.map(task => (
                    <div
                      key={task.id}
                      onClick={(e) => handleToggleTask(m.id, task.id, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.55rem',
                        padding: '0.45rem 0.55rem',
                        borderRadius: '8px',
                        backgroundColor: task.done ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.03)',
                        border: task.done ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: task.done ? '#10b981' : '#64748b',
                          marginTop: '2px'
                        }}
                      >
                        {task.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color: task.done ? '#94a3b8' : '#f1f5f9',
                          textDecoration: task.done ? 'line-through' : 'none',
                          display: 'block',
                          lineHeight: 1.35
                        }}>
                          {task.name}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                        {task.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Footer */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  {isDone ? '🎉 Mastery Achieved' : `${m.tasks.length - completedCount} tasks remaining`}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/simulations');
                  }}
                  style={{
                    background: isDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    border: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                    color: isDone ? '#34d399' : '#818cf8',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Play size={11} /> {isDone ? 'Practice Lab' : 'Start Sprint'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
