import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { aiFastApiService } from '../../services/aiFastApiService';
import { Sparkles, Send, X, Copy, Check } from 'lucide-react';
import { Button } from './Button';
export const AICopilotDrawer = ({ isOpen, onClose }) => {
    const { profile, user } = useAuth();
    const [messages, setMessages] = useState([
        {
            id: 'welcome-1',
            role: 'assistant',
            content: `👋 Hi ${profile?.full_name ? profile.full_name.split(' ')[0] : 'there'}! I'm your **CareerOS AI Copilot** powered by our FastAPI LLM engine.\n\nAsk me anything about tailoring resumes, mock behavioral answers, breaking into top tech companies, or negotiating entry-level offers!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputPrompt, setInputPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestedPrompts, setSuggestedPrompts] = useState([
        'How do I explain my final year project?',
        'What are the most in-demand backend skills in 2026?',
        'How to write quantifiable resume bullets?',
        'How to negotiate when I only have 1 offer?'
    ]);
    const [copiedId, setCopiedId] = useState(null);
    const messagesEndRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);
    const handleSend = async (customText) => {
        const textToSend = customText || inputPrompt.trim();
        if (!textToSend || loading)
            return;
        const userMsg = {
            id: 'msg-' + Date.now(),
            role: 'user',
            content: textToSend,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        setInputPrompt('');
        setLoading(true);
        try {
            const response = await aiFastApiService.chatCopilot({
                message: textToSend,
                history: messages.map(m => ({ role: m.role, content: m.content })),
                user_context: {
                    full_name: profile?.full_name || 'Alex Rivera',
                    target_role: profile?.target_role || 'Java Backend Developer',
                    degree: profile?.degree || 'B.S. Computer Science',
                    college: profile?.college || 'University',
                    graduation_year: profile?.graduation_year || 2026
                }
            });
            const assistantMsg = {
                id: 'msg-' + (Date.now() + 1),
                role: 'assistant',
                content: response.reply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, assistantMsg]);
            if (response.suggested_followups && response.suggested_followups.length > 0) {
                setSuggestedPrompts(response.suggested_followups);
            }
        }
        catch {
            const errorMsg = {
                id: 'msg-err-' + Date.now(),
                role: 'assistant',
                content: "I encountered a minor network issue reaching the AI backend. Please verify that the FastAPI server is running on `http://localhost:8000`.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        }
        finally {
            setLoading(false);
        }
    };
    const copyMessage = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };
    if (!isOpen)
        return null;
    return (<div style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '420px',
            maxWidth: 'calc(100vw - 2rem)',
            height: '600px',
            maxHeight: 'calc(100vh - 4rem)',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45), 0 0 20px rgba(124, 58, 237, 0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
        }}>
      {/* Header */}
      <div style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(30, 41, 59, 0.95))',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Sparkles size={18}/>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              CareerOS AI Copilot
              <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>FastAPI</span>
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Tailored for {profile?.target_role || 'Fresher Developers'}
            </div>
          </div>
        </div>

        <button onClick={onClose} className="btn-ghost" style={{ padding: '6px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)' }} title="Close Copilot">
          <X size={18}/>
        </button>
      </div>

      {/* Chat Messages */}
      <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
        }}>
        {messages.map(m => {
            const isUser = m.role === 'user';
            return (<div key={m.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    gap: '0.25rem'
                }}>
              <div style={{
                    maxWidth: '88%',
                    padding: '0.75rem 1rem',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '0.845rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-line',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    position: 'relative'
                }}>
                {m.content}

                {!isUser && (<div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => copyMessage(m.id, m.content)} style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.7rem'
                    }} title="Copy response">
                      {copiedId === m.id ? <Check size={12} className="text-success"/> : <Copy size={12}/>}
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>)}
              </div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', padding: '0 4px' }}>
                {m.timestamp}
              </span>
            </div>);
        })}

        {loading && (<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0.5rem' }}>
            <div className="loading-spinner" style={{ width: 14, height: 14 }}/>
            <span>FastAPI LLM is thinking...</span>
          </div>)}

        <div ref={messagesEndRef}/>
      </div>

      {/* Suggested Followup Chips */}
      {suggestedPrompts.length > 0 && !loading && (<div style={{
                padding: '0.5rem 0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-tertiary)',
                display: 'flex',
                gap: '0.35rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap'
            }}>
          {suggestedPrompts.slice(0, 3).map((prompt, pIdx) => (<button key={pIdx} onClick={() => handleSend(prompt)} style={{
                    padding: '0.3rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.725rem',
                    cursor: 'pointer',
                    flexShrink: 0
                }}>
              {prompt}
            </button>))}
        </div>)}

      {/* Input Form */}
      <form onSubmit={e => {
            e.preventDefault();
            handleSend();
        }} style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
        }}>
        <input type="text" className="form-input" value={inputPrompt} onChange={e => setInputPrompt(e.target.value)} placeholder="Ask CareerOS Copilot anything..." style={{ flex: 1, fontSize: '0.845rem' }} disabled={loading}/>
        <Button type="submit" variant="primary" size="sm" disabled={!inputPrompt.trim() || loading} leftIcon={<Send size={14}/>}>
          Send
        </Button>
      </form>
    </div>);
};
