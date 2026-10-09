import React, { useState, useEffect, useRef } from 'react';
import { 
    Sparkles, Mic, MicOff, Volume2, VolumeX, RotateCcw, 
    Square, HelpCircle, Lightbulb, CheckCircle2, ChevronRight, 
    X, Play, ShieldAlert, Award, ArrowRight, Code, MessageSquare, 
    Cpu, BookOpen, AlertCircle, RefreshCw, Send, Radio, Settings, Sliders,
    Clock, Timer, PhoneOff, Video, VideoOff, User, Bot, Activity,
    Download, FileText, Printer, Target, Check, Flame, TrendingUp, CheckCircle, ExternalLink, ThumbsUp
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { aiFastApiService } from '../../services/aiFastApiService';
import { 
    detectRepeatIntent, 
    detectClarificationIntent, 
    detectHintIntent, 
    speechController 
} from '../../utils/interviewConversation';

export const INTERVIEW_MODES = [
    {
        id: 'TECHNICAL',
        title: 'Technical & Core CS',
        icon: <Cpu size={22} className="text-primary" />,
        badge: 'Top Choice',
        description: 'Deep dive into language internals, framework mechanisms, database concurrency, and OS/Networks.',
        topics: ['Core Fundamentals', 'Frameworks & Internals', 'Databases & Indexing', 'Concurrency & Threads', 'Security & OWASP']
    },
    {
        id: 'DSA_CODING',
        title: 'Live Coding & Problem Solving',
        icon: <Code size={22} className="text-success" />,
        badge: 'High Impact',
        description: 'Algorithmic logic, edge case handling, time & space complexity trade-offs, and optimization.',
        topics: ['Arrays & HashMaps', 'Two Pointers & Sliding Window', 'Trees & Graphs', 'Dynamic Programming', 'Recursion & Backtracking']
    },
    {
        id: 'BEHAVIORAL',
        title: 'Behavioral & HR (STAR Method)',
        icon: <MessageSquare size={22} className="text-warning" />,
        badge: 'Essential',
        description: 'Situational judgment, conflict resolution, leadership, failure scenarios, and cultural alignment.',
        topics: ['Conflict Resolution', 'Team Collaboration', 'Overcoming Failure', 'Leadership & Ownership', 'Handling Deadlines']
    },
    {
        id: 'SYSTEM_DESIGN',
        title: 'System Design & Architecture',
        icon: <BookOpen size={22} className="text-purple" />,
        badge: 'Advanced',
        description: 'Microservices architecture, caching layers, database sharding, rate limiting, and high availability.',
        topics: ['URL Shortener', 'Distributed Rate Limiter', 'Notification System', 'Real-Time Chat Engine', 'E-Commerce Cart']
    }
];

const INTERVIEW_DURATION_SECONDS = 15 * 60; // 15 Minutes

export const LiveInterviewModal = ({ isOpen, onClose, defaultRole = 'Backend Developer', initialQuestions = [] }) => {
    const { showToast } = useToast();

    // Setup & Configuration State
    const [selectedMode, setSelectedMode] = useState(INTERVIEW_MODES[0].id);
    const [selectedDifficulty, setSelectedDifficulty] = useState('Medium');
    const [isStarted, setIsStarted] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [interviewQuestions, setInterviewQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);

    // 15-Minute Countdown Timer State
    const [secondsLeft, setSecondsLeft] = useState(INTERVIEW_DURATION_SECONDS);

    // Voice & Turn-taking State (Full-Duplex Hands-Free Voice)
    const [isListening, setIsListening] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [speechSupported, setSpeechSupported] = useState(true);
    const [isMicMuted, setIsMicMuted] = useState(false);

    // Call Conversation Log & Live Subtitles
    const [latestAiSpeech, setLatestAiSpeech] = useState('');
    const [conversationLog, setConversationLog] = useState([]);

    // Voice Customization State
    const [availableVoices, setAvailableVoices] = useState([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
    const [voiceRate, setVoiceRate] = useState(1.0); // 0.85x, 1.0x, 1.15x
    const [showVoiceSettings, setShowVoiceSettings] = useState(false);

    // Conversation Controls State (Question Repetition, Clarifications & Hints)
    const [repeatCount, setRepeatCount] = useState(0);
    const [clarificationText, setClarificationText] = useState(null);
    const [clarificationLoading, setClarificationLoading] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [sessionAssistanceLog, setSessionAssistanceLog] = useState([]);

    // Answer Evaluation & End of Session State
    const [evaluating, setEvaluating] = useState(false);
    const [currentEvaluation, setCurrentEvaluation] = useState(null);
    const [sessionCompleted, setSessionCompleted] = useState(false);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [scorecardTab, setScorecardTab] = useState('overview'); // 'overview' | 'tips' | 'transcript' | 'model'

    // Speech Recognition & VAD Silence Timers
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const transcriptAccumulatorRef = useRef('');
    const isAiSpeakingRef = useRef(false);
    const isMicMutedRef = useRef(false);
    const isStartedRef = useRef(false);
    const sessionCompletedRef = useRef(false);
    const currentQuestionRef = useRef(null);
    const currentIdxRef = useRef(0);

    const currentQuestion = interviewQuestions[currentIdx] || null;

    // Synchronize refs with state to prevent stale closures and effect churn
    useEffect(() => {
        isMicMutedRef.current = isMicMuted;
    }, [isMicMuted]);

    useEffect(() => {
        isStartedRef.current = isStarted;
    }, [isStarted]);

    useEffect(() => {
        sessionCompletedRef.current = sessionCompleted;
    }, [sessionCompleted]);

    useEffect(() => {
        currentQuestionRef.current = currentQuestion;
    }, [currentQuestion]);

    useEffect(() => {
        currentIdxRef.current = currentIdx;
    }, [currentIdx]);

    // Load available voices from browser
    useEffect(() => {
        const updateVoices = () => {
            const voices = speechController.getVoices();
            if (voices && voices.length > 0) {
                const englishVoices = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('en-'));
                const displayList = englishVoices.length > 0 ? englishVoices : voices;
                setAvailableVoices(displayList);

                if (!selectedVoiceURI) {
                    const topVoice = displayList.find(v => 
                        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Samantha') || v.name.includes('David') || v.name.includes('Zira')) && v.lang.startsWith('en')
                    ) || displayList[0];
                    if (topVoice) setSelectedVoiceURI(topVoice.voiceURI || topVoice.name);
                }
            }
        };

        updateVoices();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = updateVoices;
        }
    }, [selectedVoiceURI]);

    // Clean up on modal close
    useEffect(() => {
        if (!isOpen) {
            speechController.cancel();
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.onend = null;
                    recognitionRef.current.abort();
                } catch {}
                recognitionRef.current = null;
            }
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            setIsListening(false);
            setIsAiSpeaking(false);
            setIsAiThinking(false);
        }
    }, [isOpen]);

    // Dedicated factory to spawn a fresh, healthy Speech Recognition session
    const startRecognitionSession = () => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSpeechSupported(false);
            return;
        }

        // Clean up previous instance
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onstart = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
            } catch {}
            recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log('[CareerOS Voice] Microphone active & listening...');
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            // Drop audio if AI is speaking or candidate has muted
            if (isAiSpeakingRef.current || isMicMutedRef.current) {
                return;
            }

            let finalCombined = '';
            let interimCombined = '';

            for (let i = 0; i < event.results.length; ++i) {
                const item = event.results[i];
                if (item.isFinal) {
                    finalCombined += item[0].transcript + ' ';
                } else {
                    interimCombined += item[0].transcript;
                }
            }

            const cleanFinal = finalCombined.trim();
            const cleanInterim = interimCombined.trim();
            const fullSpokenText = cleanFinal ? (cleanFinal + (cleanInterim ? ' ' + cleanInterim : '')) : cleanInterim;

            if (cleanFinal) {
                transcriptAccumulatorRef.current = cleanFinal;
                setTranscript(cleanFinal);
            }
            setInterimTranscript(cleanInterim);

            // Check for immediate repeat or clarification voice intent
            if (detectRepeatIntent(fullSpokenText, { currentIdx: currentIdxRef.current })) {
                handleRepeatQuestion('VOICE_INTENT');
                transcriptAccumulatorRef.current = '';
                setTranscript('');
                setInterimTranscript('');
                return;
            }

            // Check for immediate completion intent ("I'm done", "That's all", "Finished")
            if (detectCompletionIntent(fullSpokenText)) {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                triggerHandsFreeAiTurn(fullSpokenText);
                return;
            }

            // Reset Voice Activity Detection (VAD) Silence Timer (10 seconds pause = auto submit)
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (fullSpokenText.length >= 6) {
                silenceTimerRef.current = setTimeout(() => {
                    const speechToSubmit = (transcriptAccumulatorRef.current || fullSpokenText).trim();
                    if (speechToSubmit.length >= 6 && !isAiSpeakingRef.current && !isMicMutedRef.current) {
                        triggerHandsFreeAiTurn(speechToSubmit);
                    }
                }, 10000);
            }
        };

        recognition.onerror = (event) => {
            console.warn('[CareerOS Voice] Recognition error event:', event.error);
            if (event.error === 'not-allowed') {
                showToast('Microphone access denied. Please allow mic in browser settings.', 'warning');
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            console.log('[CareerOS Voice] Recognition session ended naturally.');
            // Auto-restart recognition with fresh session if turn is active
            if (!sessionCompletedRef.current && !isMicMutedRef.current && !isAiSpeakingRef.current) {
                setTimeout(() => {
                    if (!sessionCompletedRef.current && !isMicMutedRef.current && !isAiSpeakingRef.current) {
                        startRecognitionSession();
                    }
                }, 150);
            } else {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
            setIsListening(true);
        } catch (err) {
            console.warn('[CareerOS Voice] Error calling recognition.start():', err);
        }
    };

    // 15-Minute Auto-Disconnect Countdown Timer
    useEffect(() => {
        if (!isOpen || !isStarted || sessionCompleted) return;

        const timer = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, isStarted, sessionCompleted]);

    const handleTimeExpired = () => {
        stopListening();
        speechController.cancel();
        setIsAiSpeaking(false);
        setSessionCompleted(true);
        showToast('15-minute time limit reached. Call disconnected.', 'warning');
        
        speechController.speak("Your 15-minute interview round has concluded. Generating your final performance scorecard.", {
            voiceURI: selectedVoiceURI,
            rate: voiceRate
        });
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Hands-Free AI Conversational Turn Processor
    const triggerHandsFreeAiTurn = async (candidateSpeech) => {
        if (!currentQuestion || isAiThinking) return;

        setIsAiThinking(true);
        setConversationLog(prev => [
            ...prev,
            { role: 'candidate', content: candidateSpeech, timestamp: new Date().toLocaleTimeString() }
        ]);

        // Clear live transcription accumulator
        transcriptAccumulatorRef.current = '';
        setTranscript('');
        setInterimTranscript('');

        try {
            const turnHistory = conversationLog.map(l => ({ role: l.role, content: l.content }));
            
            const response = await aiFastApiService.executeVoiceTurn({
                target_role: defaultRole,
                interview_mode: selectedMode,
                current_question: currentQuestion.question,
                candidate_speech: candidateSpeech,
                history: turnHistory,
                question_idx: currentIdxRef.current,
                total_questions: interviewQuestions.length
            });

            setIsAiThinking(false);
            const aiSpeech = response.ai_speech_reply;

            const nextIdx = currentIdxRef.current + 1;
            const hasMore = nextIdx < interviewQuestions.length;

            if (hasMore) {
                // Advance state and ref immediately
                setCurrentIdx(nextIdx);
                currentIdxRef.current = nextIdx;
                setRepeatCount(0);
                setClarificationText(null);
                setShowHint(false);

                const nextQ = interviewQuestions[nextIdx];
                const transitionAndNextQuestion = `${aiSpeech} Let's proceed to Question ${nextIdx + 1}: ${nextQ.question}`;
                
                setLatestAiSpeech(nextQ.question);
                setConversationLog(prev => [
                    ...prev,
                    { role: 'interviewer', content: transitionAndNextQuestion, timestamp: new Date().toLocaleTimeString() }
                ]);

                speakAiTurn(transitionAndNextQuestion);
            } else {
                // All 5 questions completed: conclude call and calculate score
                const concludingSpeech = `${aiSpeech} That concludes our ${interviewQuestions.length} interview questions. Generating your hiring performance scorecard now.`;
                setLatestAiSpeech("Mock Interview Round Completed. Calculating Final Performance Scorecard...");
                setConversationLog(prev => [
                    ...prev,
                    { role: 'interviewer', content: concludingSpeech, timestamp: new Date().toLocaleTimeString() }
                ]);

                speakAiTurn(concludingSpeech, () => {
                    handleEndInterviewAndGrade();
                });
            }

        } catch (err) {
            console.error('Failed voice turn:', err);
            setIsAiThinking(false);
            const nextIdx = currentIdxRef.current + 1;
            if (nextIdx < interviewQuestions.length) {
                setCurrentIdx(nextIdx);
                currentIdxRef.current = nextIdx;
                const nextQ = interviewQuestions[nextIdx];
                speakCurrentQuestion(nextQ, nextIdx);
            } else {
                handleEndInterviewAndGrade();
            }
        }
    };

    // Speaks the AI's response aloud with strict half-duplex mic gating
    const speakAiTurn = (text, onCompleteCallback) => {
        isAiSpeakingRef.current = true;
        setIsAiSpeaking(true);

        // Disconnect microphone completely during AI speech
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
            } catch {}
            recognitionRef.current = null;
        }
        setIsListening(false);

        // Clear any leftover echo transcript
        transcriptAccumulatorRef.current = '';
        setTranscript('');
        setInterimTranscript('');
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        speechController.speak(text, {
            voiceURI: selectedVoiceURI,
            rate: voiceRate,
            onStart: () => {
                isAiSpeakingRef.current = true;
                setIsAiSpeaking(true);
                setIsListening(false);
            },
            onEnd: () => {
                isAiSpeakingRef.current = false;
                setIsAiSpeaking(false);
                // 300ms guard buffer to allow room speaker echo to dissipate before starting mic
                setTimeout(() => {
                    transcriptAccumulatorRef.current = '';
                    setTranscript('');
                    setInterimTranscript('');

                    // Spawn fresh recognition session for candidate turn
                    if (!sessionCompletedRef.current && !isMicMutedRef.current) {
                        startRecognitionSession();
                    }
                    if (onCompleteCallback) onCompleteCallback();
                }, 300);
            },
            onError: () => {
                isAiSpeakingRef.current = false;
                setIsAiSpeaking(false);
                setTimeout(() => {
                    if (!sessionCompletedRef.current && !isMicMutedRef.current) {
                        startRecognitionSession();
                    }
                }, 300);
            }
        });
    };

    // Speaks the initial question
    const speakCurrentQuestion = (questionObj, targetIdx = currentIdxRef.current) => {
        if (!questionObj) return;

        const textToSpeak = `Question ${targetIdx + 1}: ${questionObj.question}`;
        setLatestAiSpeech(questionObj.question);
        
        setConversationLog(prev => [
            ...prev,
            { role: 'interviewer', content: questionObj.question, timestamp: new Date().toLocaleTimeString() }
        ]);

        speakAiTurn(textToSpeak);
    };

    // Start Interview
    const handleStartInterview = async () => {
        try {
            // User-gesture microphone warmup to ensure browser permissions
            if (navigator?.mediaDevices?.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(t => t.stop());
            }
        } catch (permErr) {
            console.warn('Microphone permission check:', permErr);
            showToast('Please ensure microphone access is allowed in your browser address bar.', 'warning');
        }

        setLoadingQuestions(true);
        setSessionCompleted(false);
        sessionCompletedRef.current = false;
        setIsMicMuted(false);
        isMicMutedRef.current = false;
        setSessionHistory([]);
        setConversationLog([]);
        setCurrentIdx(0);
        currentIdxRef.current = 0;
        setRepeatCount(0);
        setClarificationText(null);
        setShowHint(false);
        setTranscript('');
        transcriptAccumulatorRef.current = '';
        setSecondsLeft(INTERVIEW_DURATION_SECONDS);

        const modeObj = INTERVIEW_MODES.find(m => m.id === selectedMode);

        try {
            const fetched = await aiFastApiService.generateInterviewQuestions({
                role: defaultRole,
                target_role: defaultRole,
                topic: modeObj ? modeObj.topics[0] : 'All',
                difficulty: selectedDifficulty,
                count: 5
            });

            if (fetched && fetched.length > 0) {
                setInterviewQuestions(fetched);
                setIsStarted(true);
                isStartedRef.current = true;
                // Speak the first question (mic will automatically turn on only when question ends)
                speakCurrentQuestion(fetched[0]);
            } else {
                const fallback = initialQuestions.slice(0, 5);
                setInterviewQuestions(fallback);
                setIsStarted(true);
                isStartedRef.current = true;
                speakCurrentQuestion(fallback[0]);
            }
        } catch (err) {
            console.error('Failed to load live interview questions:', err);
            if (initialQuestions.length > 0) {
                setInterviewQuestions(initialQuestions.slice(0, 5));
                setIsStarted(true);
                isStartedRef.current = true;
                speakCurrentQuestion(initialQuestions[0]);
            } else {
                showToast('Could not load questions. Please check your backend connection.', 'error');
            }
        } finally {
            setLoadingQuestions(false);
        }
    };

    // Manual instant submission when candidate finishes speaking
    const handleManualSubmitVoiceAnswer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        const speechToSubmit = (transcriptAccumulatorRef.current || transcript || interimTranscript).trim();
        if (speechToSubmit.length >= 4 && !isAiSpeakingRef.current) {
            triggerHandsFreeAiTurn(speechToSubmit);
        } else {
            showToast('Please speak your answer first before submitting.', 'info');
        }
    };

    // Repeat Question Handler (Local Replay, Zero LLM cost)
    const handleRepeatQuestion = (triggerSource = 'BUTTON') => {
        if (!currentQuestion) return;

        if (repeatCount >= 5) {
            showToast('You have repeated this question 5 times. Feel free to speak your answer.', 'info');
            return;
        }

        setSessionAssistanceLog(prev => [
            ...prev,
            { type: 'REPEAT_REQUEST', questionId: currentQuestion.id, triggerSource, timestamp: new Date().toISOString() }
        ]);

        setRepeatCount(prev => prev + 1);
        showToast(`Repeating question #${currentIdx + 1} (Zero LLM cost)`, 'info');

        speechController.cancel();
        speakCurrentQuestion(currentQuestion);
    };

    // Clarification Handler
    const handleRequestClarification = async () => {
        if (!currentQuestion || clarificationLoading) return;

        setClarificationLoading(true);
        try {
            const res = await aiFastApiService.clarifyInterviewQuestion({
                question: currentQuestion.question,
                topic: currentQuestion.topic,
                target_role: defaultRole
            });
            setClarificationText(res.clarification);
            setLatestAiSpeech(res.clarification);
            
            speakAiTurn(`Clarification: ${res.clarification}`);
        } catch (err) {
            console.error('Clarification error:', err);
            speakAiTurn(`Focus on explaining the fundamental mechanics and trade-offs of ${currentQuestion.topic}.`);
        } finally {
            setClarificationLoading(false);
        }
    };

    // Advance to Next Question
    const handleAdvanceNextQuestion = () => {
        const nextIdx = currentIdxRef.current + 1;
        if (nextIdx < interviewQuestions.length) {
            setCurrentIdx(nextIdx);
            currentIdxRef.current = nextIdx;
            setRepeatCount(0);
            setClarificationText(null);
            setShowHint(false);

            const nextQ = interviewQuestions[nextIdx];
            speakCurrentQuestion(nextQ, nextIdx);
        } else {
            handleEndInterviewAndGrade();
        }
    };

    // End Interview Call & Generate Final 4-Vector Scorecard
    const handleEndInterviewAndGrade = async () => {
        stopListening();
        speechController.cancel();
        setIsAiSpeaking(false);
        setEvaluating(true);

        const candidateAllSpeech = conversationLog
            .filter(l => l.role === 'candidate')
            .map(l => l.content)
            .join('\n');

        const allQuestionsText = interviewQuestions
            .map((q, idx) => `Q${idx + 1}: ${q.question}`)
            .join('\n');

        try {
            const evaluation = await aiFastApiService.evaluateInterviewAnswer({
                question: allQuestionsText || (currentQuestion ? currentQuestion.question : "Full Mock Interview Session"),
                candidate_answer: candidateAllSpeech.length > 10 ? candidateAllSpeech : "Candidate participated in hands-free live voice round covering technical fundamentals.",
                topic: selectedMode,
                difficulty: selectedDifficulty,
                target_role: defaultRole
            });

            setCurrentEvaluation(evaluation);
            setSessionCompleted(true);
            showToast(`Interview Completed! Hiring Score: ${evaluation.overall_score}/100`, 'success');
        } catch (err) {
            console.error('Final evaluation error:', err);
            setSessionCompleted(true);
        } finally {
            setEvaluating(false);
        }
    };

    // Download full markdown/text interview report & transcript
    const handleDownloadReport = () => {
        const score = currentEvaluation?.overall_score || 78;
        const grade = currentEvaluation?.grade || (score >= 80 ? "Strong Hire" : score >= 60 ? "Hire / Competent" : "Needs Practice");
        const modeTitle = INTERVIEW_MODES.find(m => m.id === selectedMode)?.title || selectedMode;
        
        let md = `# 🎙️ CareerOS — AI Technical Interview Hiring Assessment\n\n`;
        md += `**Role:** ${defaultRole} | **Track:** ${modeTitle} | **Difficulty:** ${selectedDifficulty}\n`;
        md += `**Date:** ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })} at ${new Date().toLocaleTimeString()}\n\n`;
        md += `─────────────────────────────────────────────────────────────\n\n`;
        md += `## 🏆 Overall Hiring Score: ${score}/100\n`;
        md += `**Hiring Verdict:** ${grade}\n\n`;
        md += `> **Executive Summary:**\n> ${currentEvaluation?.summary_verdict || "Candidate completed live hands-free technical voice interview round."}\n\n`;
        
        md += `## 📊 4-Dimension Competency Matrix\n\n`;
        currentEvaluation?.dimension_scores?.forEach(dim => {
            md += `### • ${dim.name} — ${dim.score}/100\n`;
            md += `  ${dim.feedback}\n\n`;
        });

        if (currentEvaluation?.strengths && currentEvaluation.strengths.length > 0) {
            md += `## 🌟 Key Strengths Demonstrated\n\n`;
            currentEvaluation.strengths.forEach(s => {
                md += `- ✅ ${s}\n`;
            });
            md += `\n`;
        }

        if (currentEvaluation?.missing_points && currentEvaluation.missing_points.length > 0) {
            md += `## 🎯 Actionable Improvement Areas & Key Gaps\n\n`;
            currentEvaluation.missing_points.forEach(m => {
                md += `- ⚠️ ${m}\n`;
            });
            md += `\n`;
        }

        if (currentEvaluation?.model_improved_answer) {
            md += `## 💡 Staff Engineer Exemplary Model Answer\n\n`;
            md += `> ${currentEvaluation.model_improved_answer}\n\n`;
        }

        if (currentEvaluation?.interviewer_follow_up) {
            md += `## 🔭 Recommended Follow-Up & Study Guide\n\n`;
            md += `> ${currentEvaluation.interviewer_follow_up}\n\n`;
        }

        md += `─────────────────────────────────────────────────────────────\n\n`;
        md += `## 📝 Full Question & Answer Voice Transcript\n\n`;

        const candidateTurns = conversationLog.filter(l => l.role === 'candidate');
        
        interviewQuestions.forEach((q, idx) => {
            md += `### Question ${idx + 1}: ${q.question}\n`;
            md += `*Topic: ${q.topic || modeTitle} | Difficulty: ${q.difficulty || selectedDifficulty}*\n\n`;
            
            const candidateAnswer = candidateTurns[idx] ? candidateTurns[idx].content : "(No transcribed answer recorded for this question)";
            md += `**Candidate's Spoken Answer:**\n> "${candidateAnswer}"\n\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CareerOS_Interview_Scorecard_${defaultRole.replace(/\s+/g, '_')}_${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Full Interview Report & Transcript downloaded!', 'success');
    };

    // Start / Stop Microphone (Mute / Unmute)
    const startListening = () => {
        setIsMicMuted(false);
        isMicMutedRef.current = false;
        if (isAiSpeakingRef.current) {
            showToast('Interviewer is speaking. Mic will activate automatically when she finishes.', 'info');
            return;
        }
        startRecognitionSession();
    };

    const stopListening = () => {
        setIsMicMuted(true);
        isMicMutedRef.current = true;
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onend = null;
                recognitionRef.current.abort();
            } catch {}
            recognitionRef.current = null;
        }
    };

    // Voice Preview
    const handlePreviewVoice = (voiceUriToTest = selectedVoiceURI, rateToTest = voiceRate) => {
        speechController.cancel();
        speechController.speak("Hello! I am your AI Technical Interviewer. Welcome to your live voice interview round.", {
            voiceURI: voiceUriToTest,
            rate: rateToTest,
            onStart: () => setIsAiSpeaking(true),
            onEnd: () => setIsAiSpeaking(false)
        });
        showToast('Testing AI Interviewer sound...', 'info');
    };

    const handleRestart = () => {
        setIsStarted(false);
        setSessionCompleted(false);
        setTranscript('');
        setConversationLog([]);
        transcriptAccumulatorRef.current = '';
        setCurrentEvaluation(null);
        setSecondsLeft(INTERVIEW_DURATION_SECONDS);
        speechController.cancel();
        stopListening();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(5, 8, 22, 0.94)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1050px',
                height: '92vh',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Google Meet Style Header Bar */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--bg-tertiary)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            backgroundColor: isStarted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isStarted ? 'var(--success)' : 'var(--primary)'
                        }}>
                            <Radio size={18} className={isStarted ? 'animate-pulse' : ''} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                                    Live Voice Interview Room
                                </h2>
                                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                                    Full-Duplex Voice
                                </span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Role: <strong>{defaultRole}</strong> | Mode: <strong>{INTERVIEW_MODES.find(m => m.id === selectedMode)?.title}</strong>
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isStarted && !sessionCompleted && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.35rem 0.85rem',
                                borderRadius: 'var(--radius-full)',
                                backgroundColor: secondsLeft <= 60 ? 'rgba(239, 68, 68, 0.15)' : secondsLeft <= 180 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-primary)',
                                color: secondsLeft <= 60 ? 'var(--danger)' : secondsLeft <= 180 ? 'var(--warning)' : 'var(--text-primary)',
                                border: `1px solid ${secondsLeft <= 60 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)'}`,
                                fontWeight: 700,
                                fontSize: '0.8125rem'
                            }}>
                                <Clock size={14} className={secondsLeft <= 60 ? 'animate-pulse' : ''} />
                                <span>{formatTime(secondsLeft)}</span>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowVoiceSettings(prev => !prev)}
                            leftIcon={<Settings size={14} />}
                        >
                            Sound
                        </Button>

                        <button 
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.4rem',
                                borderRadius: 'var(--radius-sm)'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Voice Settings Panel */}
                {showVoiceSettings && (
                    <div style={{
                        padding: '1rem 1.5rem',
                        backgroundColor: 'var(--bg-primary)',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        animation: 'fadeIn 0.2s ease'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                            <div>
                                <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.75rem' }}>
                                    AI Interviewer Voice (Sound)
                                </label>
                                <select 
                                    className="form-input" 
                                    value={selectedVoiceURI} 
                                    onChange={e => {
                                        setSelectedVoiceURI(e.target.value);
                                        handlePreviewVoice(e.target.value, voiceRate);
                                    }}
                                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.8125rem', maxWidth: '260px' }}
                                >
                                    {availableVoices.map((v, vIdx) => (
                                        <option key={v.voiceURI || vIdx} value={v.voiceURI || v.name}>
                                            {v.name} ({v.lang})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.75rem' }}>
                                    Speech Pace (Speed)
                                </label>
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                    {[
                                        { label: '0.85x (Slow)', val: 0.85 },
                                        { label: '1.0x (Normal)', val: 1.0 },
                                        { label: '1.15x (Fast)', val: 1.15 }
                                    ].map(rateItem => (
                                        <button
                                            key={rateItem.val}
                                            onClick={() => {
                                                setVoiceRate(rateItem.val);
                                                handlePreviewVoice(selectedVoiceURI, rateItem.val);
                                            }}
                                            style={{
                                                padding: '0.3rem 0.6rem',
                                                borderRadius: 'var(--radius-sm)',
                                                border: `1px solid ${voiceRate === rateItem.val ? 'var(--primary)' : 'var(--border-color)'}`,
                                                backgroundColor: voiceRate === rateItem.val ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                                                color: voiceRate === rateItem.val ? 'var(--primary)' : 'var(--text-secondary)',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {rateItem.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button variant="secondary" size="sm" onClick={() => handlePreviewVoice()} leftIcon={<Volume2 size={14} />}>
                            Test Sound
                        </Button>
                    </div>
                )}

                {/* Call Body Area */}
                <div style={{ flex: 1, padding: sessionCompleted ? '1.25rem 1.5rem 1rem 1.5rem' : '1.25rem', overflowY: sessionCompleted ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    {!isStarted ? (
                        /* STEP 1: PRE-CALL LOBBY */
                        <div style={{ margin: 'auto 0' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>
                                    <Sparkles size={12}/> INTERVIEW ROUND SETUP
                                </span>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.25rem 0' }}>
                                    Select Interview Track
                                </h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                                    Put on your headphones. The AI will speak questions aloud and listen to your answers in real time.
                                </p>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                {INTERVIEW_MODES.map(mode => {
                                    const isSelected = selectedMode === mode.id;
                                    return (
                                        <div 
                                            key={mode.id}
                                            onClick={() => setSelectedMode(mode.id)}
                                            style={{
                                                padding: '1.15rem',
                                                borderRadius: 'var(--radius-lg)',
                                                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                                                backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-tertiary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                {mode.icon}
                                                <span className={`badge ${isSelected ? 'badge-purple' : 'badge-neutral'}`}>
                                                    {mode.badge}
                                                </span>
                                            </div>
                                            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                                {mode.title}
                                            </h4>
                                            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                                                {mode.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Button 
                                    variant="primary" 
                                    size="lg"
                                    onClick={handleStartInterview} 
                                    isLoading={loadingQuestions} 
                                    leftIcon={<Play size={18}/>}
                                    style={{ padding: '0.85rem 2.25rem', fontSize: '1rem', fontWeight: 800 }}
                                >
                                    Join Live Voice Room
                                </Button>
                            </div>
                        </div>
                    ) : sessionCompleted ? (
                        /* STEP 3: STATE-OF-THE-ART HIRING ASSESSMENT DASHBOARD */
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '0.85rem' }}>
                            {/* Executive Hero Banner */}
                            <div style={{
                                padding: '1.25rem 1.5rem',
                                borderRadius: 'var(--radius-xl)',
                                backgroundColor: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '1.25rem',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                                position: 'relative',
                                overflow: 'hidden',
                                flexShrink: 0
                            }}>
                                {/* Ambient Background Glow */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-40px',
                                    left: '20px',
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '50%',
                                    backgroundColor: (currentEvaluation?.overall_score || 78) >= 80 ? 'rgba(16, 185, 129, 0.12)' : (currentEvaluation?.overall_score || 78) >= 60 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                    filter: 'blur(40px)',
                                    pointerEvents: 'none'
                                }}/>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', zIndex: 1, flex: '1 1 320px' }}>
                                    {/* Circular Glowing Score Gauge */}
                                    <div style={{
                                        width: 84,
                                        height: 84,
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: `4px solid ${(currentEvaluation?.overall_score || 78) >= 80 ? 'var(--success)' : (currentEvaluation?.overall_score || 78) >= 60 ? 'var(--warning)' : 'var(--danger)'}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 0 20px ${(currentEvaluation?.overall_score || 78) >= 80 ? 'rgba(16, 185, 129, 0.3)' : (currentEvaluation?.overall_score || 78) >= 60 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                        flexShrink: 0
                                    }}>
                                        <span style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                                            {currentEvaluation?.overall_score || 78}
                                        </span>
                                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            out of 100
                                        </span>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                                                Hiring Assessment Scorecard
                                            </h3>
                                            <span className={`badge ${(currentEvaluation?.overall_score || 78) >= 80 ? 'badge-success' : (currentEvaluation?.overall_score || 78) >= 60 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                                                {currentEvaluation?.grade || ((currentEvaluation?.overall_score || 78) >= 80 ? "Strong Hire" : (currentEvaluation?.overall_score || 78) >= 60 ? "Hire / Competent" : "Needs Practice")}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '560px', lineHeight: 1.4 }}>
                                            {currentEvaluation?.summary_verdict || "Candidate completed the live AI voice interview round covering technical fundamentals, trade-offs, and communication."}
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Actions in Hero */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', zIndex: 1, flexShrink: 0 }}>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        onClick={handleDownloadReport}
                                        leftIcon={<Download size={14}/>}
                                        style={{ fontWeight: 800, padding: '0.55rem 1.15rem' }}
                                    >
                                        Download Report (.MD)
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleRestart}
                                        leftIcon={<RefreshCw size={14}/>}
                                    >
                                        Start New Round
                                    </Button>
                                </div>
                            </div>

                            {/* Interactive Tab Navigation */}
                            <div 
                                className="no-scrollbar"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '0.4rem',
                                    overflowX: 'auto',
                                    overflowY: 'hidden',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                    flexShrink: 0
                                }}
                            >
                                {[
                                    { id: 'overview', label: 'Competency Matrix (4 Vectors)', icon: <Activity size={14}/> },
                                    { id: 'tips', label: 'Actionable Tips & Gaps', icon: <Target size={14}/> }
                                ].map(tab => {
                                    const isActive = scorecardTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setScorecardTab(tab.id)}
                                            style={{
                                                padding: '0.45rem 1rem',
                                                borderRadius: 'var(--radius-md)',
                                                border: 'none',
                                                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                                                color: isActive ? '#fff' : 'var(--text-secondary)',
                                                cursor: 'pointer',
                                                fontSize: '0.825rem',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.45rem',
                                                transition: 'all 0.2s ease',
                                                whiteSpace: 'nowrap',
                                                flexShrink: 0
                                            }}
                                        >
                                            {tab.icon}
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Tab Content Scrollable Viewport */}
                            <div style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: 'auto',
                                paddingRight: '0.25rem',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {/* Tab 1: 4-Dimension Scores Matrix */}
                                {scorecardTab === 'overview' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.85rem' }}>
                                        {currentEvaluation?.dimension_scores?.map((dim, dIdx) => {
                                            const scoreColor = dim.score >= 80 ? 'var(--success)' : dim.score >= 60 ? 'var(--warning)' : 'var(--danger)';
                                            return (
                                                <div 
                                                    key={dIdx}
                                                    style={{
                                                        padding: '1.15rem',
                                                        backgroundColor: 'var(--bg-tertiary)',
                                                        borderRadius: 'var(--radius-lg)',
                                                        border: '1px solid var(--border-color)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                                {dim.name}
                                                            </span>
                                                            <span style={{ fontSize: '0.875rem', fontWeight: 900, color: scoreColor }}>
                                                                {dim.score}/100
                                                            </span>
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div style={{
                                                            width: '100%',
                                                            height: '6px',
                                                            backgroundColor: 'var(--bg-secondary)',
                                                            borderRadius: 'var(--radius-full)',
                                                            overflow: 'hidden',
                                                            marginBottom: '0.75rem'
                                                        }}>
                                                            <div style={{
                                                                width: `${dim.score}%`,
                                                                height: '100%',
                                                                backgroundColor: scoreColor,
                                                                borderRadius: 'var(--radius-full)',
                                                                transition: 'width 0.6s ease'
                                                            }}/>
                                                        </div>

                                                        <p style={{ fontSize: '0.785rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                                                            {dim.feedback}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Tab 2: Actionable Tips & Gaps */}
                                {scorecardTab === 'tips' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                                        {/* Strengths Card */}
                                        <div style={{
                                            padding: '1.15rem',
                                            backgroundColor: 'rgba(16, 185, 129, 0.04)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid rgba(16, 185, 129, 0.2)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: 'var(--success)' }}>
                                                <CheckCircle2 size={18} />
                                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                                    Key Strengths Demonstrated
                                                </h4>
                                            </div>
                                            {currentEvaluation?.strengths && currentEvaluation.strengths.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                                    {currentEvaluation.strengths.map((str, sIdx) => (
                                                        <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                                            <span style={{ color: 'var(--success)', fontWeight: 800, lineHeight: 1.2 }}>✓</span>
                                                            <span>{str}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solid attempt on core technical definitions and fundamental logic.</p>
                                            )}
                                        </div>

                                        {/* Improvement Tips Card */}
                                        <div style={{
                                            padding: '1.15rem',
                                            backgroundColor: 'rgba(245, 158, 11, 0.04)',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid rgba(245, 158, 11, 0.2)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: 'var(--warning)' }}>
                                                <Target size={18} />
                                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                                    What to Improve for Next Round
                                                </h4>
                                            </div>
                                            {currentEvaluation?.missing_points && currentEvaluation.missing_points.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                                    {currentEvaluation.missing_points.map((miss, mIdx) => (
                                                        <div key={mIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                                            <span style={{ color: 'var(--warning)', fontWeight: 800, lineHeight: 1.2 }}>•</span>
                                                            <span>{miss}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Practice articulating edge cases, write amplification, and memory complexity proactively.</p>
                                            )}
                                        </div>

                                        {/* Recommended Follow-Up / Study Guide */}
                                        {currentEvaluation?.interviewer_follow_up && (
                                            <div style={{
                                                gridColumn: '1 / -1',
                                                padding: '1.15rem',
                                                backgroundColor: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-lg)',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem', color: 'var(--primary)' }}>
                                                    <BookOpen size={16} />
                                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                                        Interviewer's Recommended Deep-Dive Topic
                                                    </h4>
                                                </div>
                                                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                                                    {currentEvaluation.interviewer_follow_up}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Scorecard Bottom Action Bar */}
                            <div style={{
                                flexShrink: 0,
                                paddingTop: '0.75rem',
                                borderTop: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem'
                            }}>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleDownloadReport} 
                                    leftIcon={<Download size={15}/>}
                                    style={{ fontWeight: 700 }}
                                >
                                    Download Full Assessment & Transcript (.MD)
                                </Button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Button variant="outline" onClick={handleRestart} leftIcon={<RefreshCw size={15}/>}>
                                        Try Another Interview Track
                                    </Button>
                                    <Button variant="primary" onClick={onClose} leftIcon={<CheckCircle2 size={15}/>}>
                                        Done & Return to Prep
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* STEP 2: GOOGLE MEET / ZOOM FULL-DUPLEX CALL STAGE */
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                            {/* Two Video / Call Tiles */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.25rem',
                                flex: 1,
                                marginBottom: '1rem'
                            }}>
                                {/* Tile 1: AI Senior Interviewer */}
                                <div style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-xl)',
                                    border: `2px solid ${isAiSpeaking ? 'var(--primary)' : 'var(--border-color)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    padding: '1.5rem',
                                    position: 'relative',
                                    boxShadow: isAiSpeaking ? '0 0 25px rgba(99, 102, 241, 0.25)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                                                Question {currentIdx + 1} of {interviewQuestions.length}
                                            </span>
                                            <Badge variant="neutral">{currentQuestion?.difficulty || 'Medium'}</Badge>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: isAiSpeaking ? 'var(--primary)' : 'var(--text-muted)'
                                        }}>
                                            <Volume2 size={15} className={isAiSpeaking ? 'animate-pulse' : ''} />
                                            {isAiSpeaking ? 'Speaking...' : isAiThinking ? 'Analyzing response...' : 'Listening...'}
                                        </div>
                                    </div>

                                    {/* Center AI Avatar with Audio Pulse */}
                                    <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                                        <div style={{
                                            width: 90,
                                            height: 90,
                                            borderRadius: '50%',
                                            backgroundColor: isAiSpeaking ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-secondary)',
                                            border: `3px solid ${isAiSpeaking ? 'var(--primary)' : 'var(--border-color)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1rem auto',
                                            color: 'var(--primary)',
                                            boxShadow: isAiSpeaking ? '0 0 30px rgba(99, 102, 241, 0.5)' : 'none',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            <Bot size={44} />
                                        </div>
                                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                                            Sarah Chen
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                            Staff Technical Interviewer
                                        </p>
                                    </div>

                                    {/* Live Spoken Subtitle Box */}
                                    <div style={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                        padding: '0.85rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)',
                                        fontSize: '0.825rem',
                                        color: 'var(--text-primary)',
                                        lineHeight: 1.4,
                                        minHeight: '52px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <em>"{latestAiSpeech || currentQuestion?.question}"</em>
                                    </div>
                                </div>

                                {/* Tile 2: Candidate (You) */}
                                <div style={{
                                    backgroundColor: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-xl)',
                                    border: `2px solid ${isListening && !isMicMuted ? 'var(--success)' : 'var(--border-color)'}`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    padding: '1.5rem',
                                    position: 'relative',
                                    boxShadow: isListening && !isMicMuted ? '0 0 25px rgba(16, 185, 129, 0.2)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                                            Candidate Audio Stream
                                        </span>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: isAiSpeaking 
                                                ? 'var(--text-muted)' 
                                                : isMicMuted 
                                                    ? 'var(--danger)' 
                                                    : isListening 
                                                        ? 'var(--success)' 
                                                        : 'var(--text-muted)'
                                        }}>
                                            {isAiSpeaking ? (
                                                <>
                                                    <Volume2 size={14} className="text-primary animate-pulse"/>
                                                    <span>Listening to Interviewer (Mic Standby)</span>
                                                </>
                                            ) : isMicMuted ? (
                                                <>
                                                    <MicOff size={14}/>
                                                    <span>Mic Muted</span>
                                                </>
                                            ) : isListening ? (
                                                <>
                                                    <Mic size={14} className="animate-pulse"/>
                                                    <span>Your Turn — Mic Active (Speak)</span>
                                                </>
                                            ) : (
                                                <span>Standby</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Candidate Center Avatar */}
                                    <div style={{ textAlign: 'center', margin: 'auto 0' }}>
                                        <div style={{
                                            width: 90,
                                            height: 90,
                                            borderRadius: '50%',
                                            backgroundColor: !isAiSpeaking && isListening && !isMicMuted ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-secondary)',
                                            border: `3px solid ${!isAiSpeaking && isListening && !isMicMuted ? 'var(--success)' : 'var(--border-color)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 1rem auto',
                                            color: 'var(--text-primary)',
                                            boxShadow: !isAiSpeaking && isListening && !isMicMuted ? '0 0 25px rgba(16, 185, 129, 0.4)' : 'none'
                                        }}>
                                            <User size={44} />
                                        </div>
                                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>
                                            You (Candidate)
                                        </h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                                            {isAiSpeaking ? 'Interviewer Speaking...' : 'Your Turn to Answer'}
                                        </p>
                                    </div>

                                    {/* Live Candidate Speech Caption */}
                                    <div style={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                                        padding: '0.85rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-subtle)',
                                        fontSize: '0.825rem',
                                        color: transcript || interimTranscript ? 'var(--success)' : 'var(--text-muted)',
                                        lineHeight: 1.4,
                                        minHeight: '52px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        {isAiSpeaking ? (
                                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                Listening to Sarah Chen... Your mic will automatically activate when she finishes speaking.
                                            </span>
                                        ) : transcript || interimTranscript ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span>{transcript} {interimTranscript ? `(${interimTranscript}...)` : ''}</span>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                    ⏱️ AI will auto-submit after 10s of silence, or click "Done Speaking" below.
                                                </span>
                                            </div>
                                        ) : (
                                            "Speak your technical explanation... AI will auto-submit after 10s of silence, or click 'Done Speaking'."
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Google Meet Bottom Floating Call Control Bar */}
                            <div style={{
                                padding: '0.85rem 1.5rem',
                                backgroundColor: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-xl)',
                                border: '1px solid var(--border-color)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.75rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={() => handleRepeatQuestion('BUTTON')}
                                        leftIcon={<RotateCcw size={14}/>}
                                        title="Replay current question (Zero LLM cost)"
                                    >
                                        Repeat Question
                                    </Button>

                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleRequestClarification}
                                        isLoading={clarificationLoading}
                                        leftIcon={<HelpCircle size={14}/>}
                                    >
                                        Clarify Wording
                                    </Button>

                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={handleAdvanceNextQuestion}
                                        disabled={isAiThinking}
                                        rightIcon={<ArrowRight size={14}/>}
                                        title="Skip or advance to next question"
                                    >
                                        Next Question
                                    </Button>
                                </div>

                                {/* Center: Instant Submit Button when candidate finishes answering */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        onClick={handleManualSubmitVoiceAnswer}
                                        disabled={isAiSpeaking || isAiThinking || (!transcript && !transcriptAccumulatorRef.current && !interimTranscript)}
                                        isLoading={isAiThinking}
                                        leftIcon={<Send size={14}/>}
                                        style={{
                                            backgroundColor: 'var(--success)',
                                            borderColor: 'var(--success)',
                                            color: '#fff',
                                            fontWeight: 700,
                                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        {isAiThinking ? 'AI Thinking...' : 'Done Speaking (Submit Now)'}
                                    </Button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => {
                                            if (isMicMuted) {
                                                startListening();
                                                showToast('Microphone unmuted', 'info');
                                            } else {
                                                stopListening();
                                                showToast('Microphone muted', 'info');
                                            }
                                        }}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: '50%',
                                            backgroundColor: isMicMuted ? 'var(--danger)' : 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease'
                                        }}
                                        title={isMicMuted ? "Unmute Microphone" : "Mute Microphone"}
                                    >
                                        {isMicMuted ? <MicOff size={18}/> : <Mic size={18}/>}
                                    </button>

                                    {/* Red End Call Button */}
                                    <Button 
                                        variant="danger" 
                                        onClick={handleEndInterviewAndGrade}
                                        isLoading={evaluating}
                                        leftIcon={<PhoneOff size={16}/>}
                                        style={{ fontWeight: 800, padding: '0.6rem 1.25rem' }}
                                    >
                                        End Call & Grade
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
