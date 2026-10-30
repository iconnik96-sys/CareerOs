/**
 * CareerOS — Natural Conversation Controls & Intent Detection Utility
 * Provides client-side, zero-cost, low-latency intent classification for:
 * - Repeat Question Requests ("Pardon?", "Could you repeat that?", "Say that again", etc.)
 * - Clarification Requests ("Can you clarify what you mean?", "Explain the question")
 * - Hint Requests ("Can I get a hint?")
 * - Answer Completion Signals ("That is all", "I am done")
 */

// Common repeat intent patterns across English & Hinglish
const REPEAT_PATTERNS = [
    // Standard polite requests
    /\b(pardon(\s+me)?|sorry|excuse\s+me)\b/i,
    /\b(could\s+you|can\s+you|please|kindly|would\s+you)?\s*(repeat|replay|reiterate|re-ask)\b/i,
    /\b(repeat(\s+the)?\s+question|say(\s+the)?\s+question\s+again|ask(\s+the)?\s+question\s+again)\b/i,
    /\b(say|tell)\s+(that|it)\s+again\b/i,
    /\b(come\s+again|once\s+more|one\s+more\s+time)\b/i,
    
    // Auditory issues
    /\b(i\s+didn'?t\s+hear(\s+you)?|i\s+couldn'?t\s+hear(\s+you)?|can'?t\s+hear(\s+you)?)\b/i,
    /\b(i\s+didn'?t\s+catch\s+(that|the\s+question)|missed\s+that|didn'?t\s+catch\s+that)\b/i,
    /\b(you\s+broke\s+up|audio\s+cut\s+out|voice\s+lagged)\b/i,
    
    // Hinglish / Multilingual common expressions
    /\b(phir\s+se\s+bolo|dobara\s+(batao|bolo|kaho)|repeat\s+(kardo|karo)|samajh\s+nahi\s+aaya)\b/i,
    /\b(kya\s+bola\s+aapne|ek\s+aur\s+baar\s+bolo)\b/i
];

// Clarification patterns (asking to explain wording without revealing answers)
const CLARIFY_PATTERNS = [
    /\b(can\s+you\s+explain\s+the\s+question|clarify\s+the\s+question|explain\s+what\s+you\s+mean)\b/i,
    /\b(what\s+do\s+you\s+mean\s+by|could\s+you\s+clarify|need\s+clarification)\b/i,
    /\b(i\s+didn'?t\s+understand(\s+the\s+question)?|i\s+don'?t\s+understand(\s+the\s+question)?)\b/i
];

// Hint patterns
const HINT_PATTERNS = [
    /\b(can\s+i\s+get\s+a\s+hint|give\s+me\s+a\s+hint|need\s+a\s+hint|any\s+hint|clue)\b/i,
    /\b(give\s+me\s+a\s+clue|help\s+me\s+with\s+a\s+hint|could\s+you\s+give\s+a\s+hint)\b/i,
    /\b(kuch\s+hint\s+milega|koi\s+hint\s+hai)\b/i
];

// Answer completion phrases
const COMPLETION_PATTERNS = [
    /\b(that'?s\s+(all|my\s+answer|it)|i\s+am\s+done|i'?m\s+done|finished|that\s+concludes\s+my\s+answer)\b/i,
    /\b(submit\s+my\s+answer|ready\s+for\s+the\s+next\s+question)\b/i
];

/**
 * Checks if the spoken/typed text matches repeat-question intent.
 * Includes state-based disambiguation for short words like "What?" vs long technical answers.
 */
export function detectRepeatIntent(text, state = {}) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    if (clean.length === 0) return false;

    // Disambiguate short utterances like "What?" or "Huh?"
    // Only treat as repeat if the user hasn't already formulated a long technical answer (e.g. < 6 words)
    const wordCount = clean.split(/\s+/).length;
    if (wordCount <= 3 && /^(what|huh|sorry|pardon|repeat)\??$/i.test(clean)) {
        return true;
    }

    // If text is very long (e.g., > 25 words) and contains technical terms, it is an actual answer, not a repeat
    if (wordCount > 25 && !/\b(repeat|say that again)\b/i.test(clean)) {
        return false;
    }

    // Test regex patterns
    return REPEAT_PATTERNS.some(pattern => pattern.test(clean));
}

/**
 * Checks if the spoken/typed text is asking for clarification of the question.
 */
export function detectClarificationIntent(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    return CLARIFY_PATTERNS.some(pattern => pattern.test(clean));
}

/**
 * Checks if the candidate is explicitly asking for a hint.
 */
export function detectHintIntent(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    return HINT_PATTERNS.some(pattern => pattern.test(clean));
}

/**
 * Checks if candidate is indicating they are done answering.
 */
export function detectCompletionIntent(text) {
    if (!text || typeof text !== 'string') return false;
    const clean = text.trim();
    return COMPLETION_PATTERNS.some(pattern => pattern.test(clean));
}

/**
 * Speech synthesis helper with cancellation, voice listing, garbage collection protection, and custom voice/speed controls
 */
let activeUtterance = null;
let activeCompletionPoller = null;
let activeStartupWatchdog = null;
let activeSafetyTimer = null;

export const speechController = {
    isSupported() {
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
    },

    getVoices() {
        if (!this.isSupported()) return [];
        return window.speechSynthesis.getVoices();
    },

    cancel() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (activeCompletionPoller) clearInterval(activeCompletionPoller);
            if (activeStartupWatchdog) clearTimeout(activeStartupWatchdog);
            if (activeSafetyTimer) clearTimeout(activeSafetyTimer);
            activeCompletionPoller = null;
            activeStartupWatchdog = null;
            activeSafetyTimer = null;
            window.speechSynthesis.cancel();
            activeUtterance = null;
            if (window.__careeros_utterance) {
                window.__careeros_utterance = null;
            }
        }
    },

    speak(text, { onStart, onEnd, onError, rate = 1.0, pitch = 1.0, voiceURI = null } = {}) {
        if (!this.isSupported()) {
            if (onError) onError(new Error('SpeechSynthesis not supported'));
            return null;
        }

        // Cancel previous speech to prevent overlapping audio
        this.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        activeUtterance = utterance;
        if (typeof window !== 'undefined') {
            window.__careeros_utterance = utterance; // Root in window global to prevent Chromium GC dropping onend
        }
        utterance.rate = rate;
        utterance.pitch = pitch;

        const voices = window.speechSynthesis.getVoices();
        
        let selectedVoice = null;
        if (voiceURI) {
            selectedVoice = voices.find(v => v.voiceURI === voiceURI || v.name === voiceURI);
        }

        if (!selectedVoice) {
            // Default to high-quality natural English voice if available
            selectedVoice = voices.find(v => 
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('English') || v.name.includes('Samantha') || v.name.includes('David') || v.name.includes('Zira')) && v.lang.startsWith('en')
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        let completed = false;
        let hasStarted = false;

        const handleComplete = () => {
            if (completed) return;
            completed = true;
            if (activeCompletionPoller) clearInterval(activeCompletionPoller);
            if (activeStartupWatchdog) clearTimeout(activeStartupWatchdog);
            if (activeSafetyTimer) clearTimeout(activeSafetyTimer);
            activeCompletionPoller = null;
            activeStartupWatchdog = null;
            activeSafetyTimer = null;
            activeUtterance = null;
            if (typeof window !== 'undefined' && window.__careeros_utterance === utterance) {
                window.__careeros_utterance = null;
            }
            if (onEnd) onEnd();
        };

        const handleError = (e) => {
            if (completed) return;
            completed = true;
            if (activeCompletionPoller) clearInterval(activeCompletionPoller);
            if (activeStartupWatchdog) clearTimeout(activeStartupWatchdog);
            if (activeSafetyTimer) clearTimeout(activeSafetyTimer);
            activeCompletionPoller = null;
            activeStartupWatchdog = null;
            activeSafetyTimer = null;
            activeUtterance = null;
            if (typeof window !== 'undefined' && window.__careeros_utterance === utterance) {
                window.__careeros_utterance = null;
            }
            if (onError) onError(e);
            else if (onEnd) onEnd();
        };

        utterance.onstart = (e) => {
            hasStarted = true;
            if (onStart) onStart(e);
        };
        utterance.onend = handleComplete;
        utterance.onerror = handleError;

        // Active Completion Poller:
        // Chromium on Windows often fails to fire onend if audio routes through SAPI or after pauses.
        // Polling every 150ms detects the exact millisecond when speech audio finishes.
        activeCompletionPoller = setInterval(() => {
            if (completed) {
                clearInterval(activeCompletionPoller);
                return;
            }
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                if (hasStarted && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
                    clearInterval(activeCompletionPoller);
                    handleComplete();
                }
            }
        }, 150);

        // Startup Watchdog: If browser audio policy blocked speech synthesis or no voice initialized,
        // bypass TTS after 1.2s so the user's turn can proceed without hanging.
        activeStartupWatchdog = setTimeout(() => {
            if (!hasStarted && !completed) {
                if (typeof window !== 'undefined' && window.speechSynthesis && !window.speechSynthesis.speaking) {
                    console.warn('[CareerOS Speech] TTS startup watchdog triggered; unlocking mic turn.');
                    handleComplete();
                }
            }
        }, 1200);

        // Calibrated Safety Duration: Standard pace is ~2.4 words per second.
        const words = (text || '').split(/\s+/).length;
        const estimatedDurationMs = Math.max(3500, Math.round(((words / (2.2 * rate)) * 1000) + 3000));
        activeSafetyTimer = setTimeout(() => {
            if (!completed) {
                console.warn('[CareerOS Speech] Utterance safety duration reached. Completing turn.');
                handleComplete();
            }
        }, estimatedDurationMs);

        // Resume engine if Chrome suspended audio context
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }

        window.speechSynthesis.speak(utterance);
        return utterance;
    }
};
