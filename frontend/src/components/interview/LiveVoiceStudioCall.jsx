import React from 'react';
import {
    Bot,
    User,
    Activity,
    Flame,
    RotateCcw,
    HelpCircle,
    SkipForward,
    ArrowRight,
    Mic,
    MicOff,
    Send,
    Volume2,
    PhoneOff
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const LiveVoiceStudioCall = ({
    isAiSpeaking,
    isAiThinking,
    isMicMuted,
    isListening,
    latestAiSpeech,
    currentQuestion,
    currentIdx,
    totalQuestions,
    candidateName,
    combinedCurrentTranscript,
    interimTranscript,
    candidateWordCount,
    liveSpeakingPace,
    liveDetectedKeywords,
    starAlignment,
    transcriptContainerRef,
    onRepeatQuestion,
    onRequestClarification,
    clarificationLoading,
    onSkipQuestion,
    onAdvanceQuestion,
    onToggleMic,
    onSubmitAnswer,
    onEndCall,
    evaluating
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, justifyContent: 'space-between', gap: '0.85rem' }}>
            {/* Main Stage Grid: Left Audio Visualizer & Cards + Right Live HUD */}
            <div className="voice-studio-grid">
                {/* Left Column: Visualizer & Conversation Stream */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    minHeight: 0,
                    overflowY: 'auto',
                    paddingRight: '0.25rem'
                }}>
                    {/* Visualizer Stage Container */}
                    <div style={{
                        background: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.15) 0%, rgba(15, 23, 42, 0.85) 70%)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '1.6rem 1.25rem 1.2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: isAiSpeaking ? '0 0 35px rgba(59, 130, 246, 0.25)' : (!isMicMuted && isListening ? '0 0 35px rgba(6, 182, 212, 0.2)' : 'none'),
                        flexShrink: 0
                    }}>
                        {/* Dynamic Acoustic Sound Bars */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            height: '75px',
                            width: '100%',
                            maxWidth: '480px',
                            margin: '0.25rem 0 0.85rem'
                        }}>
                            {Array.from({ length: 32 }).map((_, i) => {
                                const baseHeight = Math.sin((i / 32) * Math.PI) * 55;
                                const isCandidateTurnActive = !isAiSpeaking && !isAiThinking && !isMicMuted;
                                const activeMultiplier = isAiSpeaking ? 1.0 : (isCandidateTurnActive ? (isListening ? 0.85 : 0.6) : 0.25);
                                const animatedHeight = Math.max(8, baseHeight * activeMultiplier + (Math.sin(i * 1.5) * 10));
                                const barColor = isAiSpeaking
                                    ? 'linear-gradient(180deg, #3b82f6, #6366f1)'
                                    : (isCandidateTurnActive ? 'linear-gradient(180deg, #06b6d4, #10b981)' : 'rgba(255, 255, 255, 0.12)');
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            flex: 1,
                                            height: `${animatedHeight}px`,
                                            background: barColor,
                                            borderRadius: '999px',
                                            transition: 'height 0.15s ease, background 0.3s ease',
                                            opacity: isAiSpeaking || isCandidateTurnActive ? 0.95 : 0.4
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Status Indicator Pill */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.3rem 0.85rem',
                            borderRadius: 'var(--radius-full)',
                            background: isAiSpeaking ? 'rgba(59, 130, 246, 0.15)' : (!isMicMuted ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                            border: `1px solid ${isAiSpeaking ? 'rgba(59, 130, 246, 0.4)' : (!isMicMuted ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-color)')}`,
                            fontSize: '0.785rem',
                            fontWeight: 700,
                            color: isAiSpeaking ? '#60a5fa' : (!isMicMuted ? '#22d3ee' : 'var(--text-muted)')
                        }}>
                            <span style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: isAiSpeaking ? '#3b82f6' : (!isMicMuted ? '#06b6d4' : '#64748b'),
                                boxShadow: isAiSpeaking || !isMicMuted ? '0 0 10px currentColor' : 'none'
                            }} className={isAiSpeaking || !isMicMuted ? 'animate-pulse' : ''} />
                            <span>
                                {isAiSpeaking
                                    ? 'Sarah Chen (AI) is Speaking...'
                                    : isAiThinking
                                    ? 'Analyzing your response...'
                                    : isMicMuted
                                    ? 'Microphone Muted (Click Studio Mic to Speak)'
                                    : isListening
                                    ? 'Microphone Active — Listening to You'
                                    : 'Microphone Active — Speak Now'}
                            </span>
                        </div>
                    </div>

                    {/* AI Interviewer Question Card */}
                    <div style={{
                        background: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.15rem 1.25rem',
                        boxShadow: 'var(--shadow-md)',
                        position: 'relative',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(99, 102, 241, 0.3))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#60a5fa'
                                }}>
                                    <Bot size={15} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#f8fafc' }}>
                                    AI Interviewer (Sarah Chen)
                                </span>
                                <span className="badge badge-purple" style={{ fontSize: '0.6875rem' }}>
                                    Question {currentIdx + 1} of {totalQuestions}
                                </span>
                            </div>
                            <Badge variant="neutral" style={{ fontSize: '0.6875rem' }}>
                                {currentQuestion?.difficulty || 'Medium'}
                            </Badge>
                        </div>
                        <p style={{
                            margin: 0,
                            fontSize: '0.9375rem',
                            color: '#e2e8f0',
                            lineHeight: 1.55,
                            fontWeight: 500,
                            fontStyle: 'italic'
                        }}>
                            "{latestAiSpeech || currentQuestion?.question}"
                        </p>
                    </div>

                    {/* Candidate Live Streaming Transcript Card */}
                    <div
                        ref={transcriptContainerRef}
                        style={{
                            background: 'rgba(15, 23, 42, 0.65)',
                            border: `1px solid ${!isMicMuted && isListening && combinedCurrentTranscript ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-color)'}`,
                            borderRadius: 'var(--radius-lg)',
                            padding: '1.15rem 1.25rem',
                            flex: 1,
                            minHeight: '110px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: !isMicMuted && isListening && combinedCurrentTranscript ? '0 0 20px rgba(6, 182, 212, 0.15)' : 'none',
                            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-primary)'
                                }}>
                                    <User size={13} />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                                    {candidateName} (Candidate Audio)
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: !isMicMuted && isListening ? '#22d3ee' : 'var(--text-muted)' }}>
                                <Activity size={13} className={!isMicMuted && isListening ? 'animate-pulse' : ''} />
                                <span>{!isMicMuted && isListening ? 'Live Streaming' : 'Standby'}</span>
                            </div>
                        </div>

                        <div style={{
                            fontSize: '0.875rem',
                            color: combinedCurrentTranscript ? '#f1f5f9' : 'var(--text-muted)',
                            lineHeight: 1.5,
                            fontStyle: combinedCurrentTranscript ? 'normal' : 'italic'
                        }}>
                            {isAiSpeaking ? (
                                <span>Listening to Sarah Chen... your microphone will automatically engage as soon as she finishes.</span>
                            ) : combinedCurrentTranscript ? (
                                <span>
                                    {combinedCurrentTranscript}
                                    {interimTranscript && <span style={{ opacity: 0.7 }}> ({interimTranscript}...)</span>}
                                </span>
                            ) : (
                                <span>Speak your answer clearly at your natural pace... If paused, click <strong>"Studio Mic"</strong> to speak.</span>
                            )}
                        </div>

                        <div style={{
                            marginTop: '0.75rem',
                            paddingTop: '0.45rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)'
                        }}>
                            <span>Tip: When finished speaking, click <strong>"Done Speaking"</strong> below or pause for AI grading.</span>
                            <span>Words: <strong style={{ color: 'var(--text-primary)' }}>{candidateWordCount}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Assessment HUD */}
                <div style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <div>
                        {/* HUD Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Flame size={15} color="#f59e0b" />
                                <span>Live Assessment HUD</span>
                            </div>
                            <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>Real-Time</span>
                        </div>

                        {/* 1. Speaking Pace Meter */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem 0.85rem',
                            marginBottom: '0.75rem',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Speaking Pace</span>
                                <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>Optimal Range</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc' }}>{liveSpeakingPace}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WPM</span>
                            </div>
                            <div style={{
                                height: '4px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                borderRadius: '999px',
                                marginTop: '0.45rem',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${Math.min(100, Math.max(20, (liveSpeakingPace / 180) * 100))}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                                    borderRadius: '999px',
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                        </div>

                        {/* 2. Detected Technical Keywords */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem 0.85rem',
                            marginBottom: '0.75rem',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                                Technical Concepts Detected
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {liveDetectedKeywords.map((kw, ki) => (
                                    <span
                                        key={ki}
                                        style={{
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            background: 'rgba(59, 130, 246, 0.15)',
                                            color: '#93c5fd',
                                            border: '1px solid rgba(59, 130, 246, 0.35)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 3. STAR Clarity Gauge */}
                        <div style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem 0.85rem',
                            border: '1px solid var(--border-subtle)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>STAR Structure</span>
                                <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700 }}>
                                    {starAlignment === 4 ? 'Full STAR' : starAlignment >= 2 ? 'Strong Flow' : 'Starting Out'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {['S (Context)', 'T (Task)', 'A (Action)', 'R (Result)'].map((step, si) => {
                                    const isMet = si < starAlignment;
                                    return (
                                        <div
                                            key={si}
                                            style={{
                                                flex: 1,
                                                padding: '0.35rem 0.2rem',
                                                borderRadius: 'var(--radius-sm)',
                                                textAlign: 'center',
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                background: isMet ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                                color: isMet ? '#c7d2fe' : 'var(--text-muted)',
                                                border: `1px solid ${isMet ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`
                                            }}
                                        >
                                            {step.split(' ')[0]}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Quick Helper Actions in HUD */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onRepeatQuestion('BUTTON')}
                            leftIcon={<RotateCcw size={13} />}
                            style={{ width: '100%', fontSize: '0.785rem' }}
                        >
                            Repeat Question
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRequestClarification}
                            isLoading={clarificationLoading}
                            leftIcon={<HelpCircle size={13} />}
                            style={{ width: '100%', fontSize: '0.785rem' }}
                        >
                            Clarify Wording
                        </Button>
                    </div>
                </div>
            </div>

            {/* Studio Bottom Floating Call Control Bar */}
            <div style={{
                padding: '0.75rem 1.25rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
            }}>
                {/* Left Side: Navigation / Skip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSkipQuestion}
                        disabled={isAiThinking}
                        leftIcon={<SkipForward size={14} />}
                        style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger)', fontSize: '0.8125rem' }}
                        title="Skip current question (Awards strictly 0 marks)"
                    >
                        Skip (0 pts)
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onAdvanceQuestion}
                        disabled={isAiThinking}
                        rightIcon={<ArrowRight size={14} />}
                        style={{ fontSize: '0.8125rem' }}
                    >
                        Next
                    </Button>
                </div>

                {/* Center: Hero Studio Microphone & Done Speaking Submit */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <button
                        onClick={onToggleMic}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.55rem 1.15rem',
                            borderRadius: 'var(--radius-full)',
                            background: isMicMuted
                                ? 'var(--bg-secondary)'
                                : 'linear-gradient(135deg, #2563eb, #06b6d4)',
                            border: `1px solid ${isMicMuted ? 'var(--border-color)' : 'rgba(6, 182, 212, 0.5)'}`,
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            boxShadow: isMicMuted ? 'none' : '0 0 18px rgba(6, 182, 212, 0.35)',
                            transition: 'all 0.2s ease'
                        }}
                        title={isMicMuted ? "Click to unmute microphone" : "Click to mute microphone"}
                    >
                        {isMicMuted ? <MicOff size={16} /> : <Mic size={16} className="animate-pulse" />}
                        <span>{isMicMuted ? 'Muted' : 'Studio Mic'}</span>
                    </button>

                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onSubmitAnswer}
                        disabled={isAiSpeaking || isAiThinking || !combinedCurrentTranscript}
                        isLoading={isAiThinking}
                        leftIcon={<Send size={14} />}
                        style={{
                            backgroundColor: 'var(--success)',
                            borderColor: 'var(--success)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            padding: '0.55rem 1.15rem',
                            borderRadius: 'var(--radius-full)',
                            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        {isAiThinking ? 'Evaluating...' : 'Done Speaking'}
                    </Button>
                </div>

                {/* Right Side: Audio Input Device & Red End Call */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '0.35rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <Volume2 size={13} color="#60a5fa" />
                        <span>Mic: {!isMicMuted ? 'Active' : 'Muted'}</span>
                    </div>

                    <Button
                        variant="danger"
                        onClick={onEndCall}
                        isLoading={evaluating}
                        leftIcon={<PhoneOff size={15} />}
                        style={{ fontWeight: 800, padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}
                    >
                        End Call
                    </Button>
                </div>
            </div>
        </div>
    );
};
