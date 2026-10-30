import { getPrimaryFounderEmail } from '../utils/founderAuth';
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { aiFastApiService } from '../services/aiFastApiService';
import { supabase } from '../lib/supabase';
import { calculateCareerReadiness, getRoleDisplayName } from '../utils/careerRoles';
import { campusService } from '../services/campusService';
import {
  ShieldAlert, Activity, DollarSign, Cpu, Users, RefreshCw,
  TrendingUp, AlertTriangle, Layers, ArrowUpRight, Zap, CheckCircle2,
  Sliders, Database, Server, SlidersHorizontal, Search, UserCheck,
  GraduationCap, Briefcase, Mail, Calendar, Key, Building2, QrCode,
  Copy, Check, ExternalLink, UserPlus, Trash2
} from 'lucide-react';

const FOUNDER_EMAIL = getPrimaryFounderEmail();

export const FounderAdminPage = () => {
  const { user, profile } = useAuth();
  const { addToast } = useToast();

  const isFounder = user?.email?.toLowerCase().trim() === FOUNDER_EMAIL || profile?.email?.toLowerCase().trim() === FOUNDER_EMAIL;

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [switchingModel, setSwitchingModel] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');

  // Live Users Directory State (100% Real Database Only)
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [showRlsHelp, setShowRlsHelp] = useState(false);

  // Interactive Unit Economics Simulator State
  const [freeUsers, setFreeUsers] = useState(250);
  const [proUsers, setProUsers] = useState(75);
  const [ultUsers, setUltUsers] = useState(25);

  // Campus & TPO Provisioning State (Method C)
  const [collegesList, setCollegesList] = useState([]);
  const [activeInvites, setActiveInvites] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [collegeName, setCollegeName] = useState('');
  const [collegeDomain, setCollegeDomain] = useState('');
  const [tpoName, setTpoName] = useState('');
  const [tpoEmail, setTpoEmail] = useState('');
  const [collegeCity, setCollegeCity] = useState('Bengaluru');
  const [collegeTier, setCollegeTier] = useState('Tier-1');
  const [batchYear, setBatchYear] = useState(2026);
  const [provisioning, setProvisioning] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const fetchColleges = async () => {
    try {
      setLoadingColleges(true);
      const res = await campusService.adminListColleges();
      if (res?.colleges) setCollegesList(res.colleges);
      if (res?.active_invites) setActiveInvites(res.active_invites);
    } catch (err) {
      console.warn('Failed to fetch colleges:', err);
    } finally {
      setLoadingColleges(false);
    }
  };

  const handleProvisionCollege = async (e) => {
    e.preventDefault();
    if (!collegeName.trim() || !tpoEmail.trim()) {
      addToast('Please enter College Name and TPO Email', 'warning');
      return;
    }
    setProvisioning(true);
    try {
      const res = await campusService.adminInviteTpo({
        college_name: collegeName,
        domain: collegeDomain || undefined,
        tpo_name: tpoName || 'Director of Placements',
        tpo_email: tpoEmail,
        city: collegeCity,
        tier: collegeTier,
        batch_year: parseInt(batchYear) || 2026,
        admin_requester_email: user?.email
      });
      setGeneratedInvite(res);
      addToast(`College provisioned! Invite token generated.`, 'success');
      fetchColleges();
    } catch (err) {
      addToast(err.message || 'Provisioning failed', 'error');
    } finally {
      setProvisioning(false);
    }
  };

  const handleRevokeInvite = async (token) => {
    try {
      await campusService.adminRevokeInvite(token);
      addToast('Invite token revoked', 'info');
      fetchColleges();
    } catch (err) {
      addToast(err.message || 'Failed to revoke invite', 'error');
    }
  };

  const fetchUsersFromDb = async () => {
    try {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch profiles from Supabase:', error);
        setUsersList([]);
        setShowRlsHelp(true);
      } else if (Array.isArray(data)) {
        // Pure real database rows with dynamic fallback calculation
        const realUsers = data.map((p, idx) => {
          const isCurrentUser = p.user_id === user?.id || (user?.email && p.email?.toLowerCase() === user.email.toLowerCase());
          let readiness = Number(p.career_readiness) || 0;

          // If score is 0, provide smart calculation or fallback
          if (readiness === 0) {
            if (isCurrentUser) {
              readiness = (profile?.career_readiness && profile.career_readiness > 0)
                ? profile.career_readiness
                : calculateCareerReadiness([], p.target_role || profile?.target_role || 'Software Engineer', profile || p, { hasResume: Boolean(p.resume_url || profile?.resume_url) }) || 82;
            } else if (p.onboarding_completed) {
              readiness = calculateCareerReadiness([], p.target_role || 'Software Engineer', p, { hasResume: Boolean(p.resume_url) });
            }
          }

          return {
            id: p.id || p.user_id || `user-${idx}`,
            full_name: p.full_name?.trim() || (isCurrentUser ? user?.user_metadata?.full_name || 'Nikhil (Founder)' : 'Registered User'),
            email: p.email || (isCurrentUser ? user?.email : `ID: ${p.user_id?.slice(0, 8)}...`),
            college: p.college?.trim() || 'Not specified',
            degree: p.degree?.trim() || 'Engineering / Degree',
            target_role: p.target_role?.trim() || 'Software Engineer',
            career_readiness: readiness,
            plan: p.plan || (isCurrentUser ? 'Founder (All Features)' : 'Free Tier'),
            onboarding_completed: Boolean(p.onboarding_completed || isCurrentUser),
            created_at: p.created_at || new Date().toISOString()
          };
        });

        setUsersList(realUsers);
        // Only show RLS policy helper if query is restricted or no external users found
        setShowRlsHelp(realUsers.length <= 1);
      }
    } catch (err) {
      console.error('Error fetching real users from database:', err);
      setUsersList([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMetrics = async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const data = await aiFastApiService.getAdminMetrics(user?.email);
      setMetrics(data);
      if (data?.current_model) {
        setSelectedModel(data.current_model);
      }
      if (showToast) {
        addToast('Live metrics refreshed from AI microservice', 'success');
      }
    } catch (err) {
      console.error('Failed to fetch founder metrics:', err);
      if (showToast) {
        addToast('Failed to load metrics. Ensure FastAPI backend is running.', 'error');
      }
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFounder) {
      fetchMetrics();
      fetchUsersFromDb();
      fetchColleges();
      const interval = setInterval(() => {
        fetchMetrics(false);
      }, 15000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [isFounder]);

  const handleModelSwitch = async (modelName) => {
    try {
      setSwitchingModel(true);
      const res = await aiFastApiService.switchAdminModel(modelName, user?.email);
      setSelectedModel(res.active_model);
      addToast(`Switched active LLM to: ${res.active_model}`, 'success');
      fetchMetrics(false);
    } catch (err) {
      addToast(err?.message || 'Failed to switch model', 'error');
    } finally {
      setSwitchingModel(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all token usage counters?')) return;
    try {
      await aiFastApiService.resetAdminMetrics(user?.email);
      addToast('Usage metrics have been reset', 'info');
      fetchMetrics(false);
    } catch (err) {
      addToast('Failed to reset metrics', 'error');
    }
  };

  if (!loading && !isFounder) {
    return <Navigate to="/dashboard" replace />;
  }

  // Filter users by search
  const filteredUsers = usersList.filter(u => {
    const matchesSearch =
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.target_role || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.college || '').toLowerCase().includes(userSearch.toLowerCase());

    if (userFilter === 'onboarded') return matchesSearch && u.onboarding_completed;
    if (userFilter === 'paid') return matchesSearch && u.plan !== 'Free (₹0)';
    return matchesSearch;
  });

  // Simulator Calculations
  const revPro = proUsers * 149;
  const revUlt = ultUsers * 249;
  const totalRevenue = revPro + revUlt;

  // Est AI cost per user: Pro ~ ₹10.50, Ultimate ~ ₹32.00, Free ~ ₹0.30
  const aiCostPro = proUsers * 10.5;
  const aiCostUlt = ultUsers * 32.0;
  const aiCostFree = freeUsers * 0.3;
  const totalAiCost = aiCostPro + aiCostUlt + aiCostFree;

  // Razorpay Gateway Fee: 2% + 18% GST on fee = 2.36%
  const gatewayFees = totalRevenue * 0.0236;
  const netProfit = totalRevenue - totalAiCost - gatewayFees;
  const marginPct = totalRevenue > 0
    ? ((netProfit / totalRevenue) * 100).toFixed(1)
    : (totalAiCost > 0 ? '-100.0' : '0.0');

  return (
    <div className="founder-admin-page" style={{ padding: '2rem', maxWidth: '1440px', margin: '0 auto', color: 'var(--text-primary)' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1.5rem 2rem',
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.9), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
          }}>
            <ShieldAlert size={28} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Founder Command Center
              </h1>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.4)'
              }}>
                FOUNDER: {user?.email || FOUNDER_EMAIL}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Real-time Users Directory, Token Burn Meter, Cost in INR & Live Margin Optimization
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => {
              fetchMetrics(true);
              fetchUsersFromDb();
            }}
            disabled={isRefreshing || loadingUsers}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh All'}
          </button>
          <button
            onClick={handleReset}
            className="btn"
            style={{
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            Reset Tokens
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards (Now Including TOTAL USERS) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* TOTAL REGISTERED USERS */}
        <div style={{
          padding: '1.5rem',
          background: 'var(--card-bg, #1e1e2d)',
          borderRadius: '14px',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#a78bfa', fontWeight: 700 }}>Total App Users</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {usersList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <UserCheck size={14} />
            {usersList.filter(u => u.onboarding_completed).length} completed onboarding
          </div>
        </div>

        {/* Total Tokens Burned */}
        <div style={{
          padding: '1.5rem',
          background: 'var(--card-bg, #1e1e2d)',
          borderRadius: '14px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Tokens Burned</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
              <Cpu size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {metrics?.usage?.total_tokens?.toLocaleString() || '0'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Prompt: {metrics?.usage?.total_prompt_tokens?.toLocaleString() || 0} | Output: {metrics?.usage?.total_completion_tokens?.toLocaleString() || 0}
          </div>
        </div>

        {/* Total AI Cost (INR) */}
        <div style={{
          padding: '1.5rem',
          background: 'var(--card-bg, #1e1e2d)',
          borderRadius: '14px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Live AI API Bill</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>
            ₹{metrics?.usage?.total_cost_inr?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {metrics?.rate_info 
              ? `Rate: ₹${metrics.rate_info.input} in / ₹${metrics.rate_info.output} out per 1M tokens`
              : 'Dynamic multi-model billing'}
          </div>
        </div>

        {/* Active Model & Provider */}
        <div style={{
          padding: '1.5rem',
          background: 'var(--card-bg, #1e1e2d)',
          borderRadius: '14px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active AI Engine</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Zap size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {metrics?.current_model || 'llama-3.3-70b-versatile'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#a78bfa', fontWeight: 600 }}>{metrics?.current_provider || 'AI'}:</span>
            {metrics?.ai_configured || metrics?.groq_configured ? '🟢 Connected' : '🔴 Key Missing'}
          </div>
        </div>

        {/* Requests & Reliability */}
        <div style={{
          padding: '1.5rem',
          background: 'var(--card-bg, #1e1e2d)',
          borderRadius: '14px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>API Calls</span>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {metrics?.usage?.total_requests || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
            Success Rate: {metrics?.usage?.total_requests > 0 ? (((metrics?.usage?.successful_requests || 0) / metrics?.usage?.total_requests) * 100).toFixed(1) : 100}%
          </div>
        </div>
      </div>

      {/* RLS Informational Banner (If database RLS policy is restricting multi-user queries) */}
      {showRlsHelp && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <Key size={22} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '0.875rem' }}>
            <div style={{ fontWeight: 700, color: '#60a5fa', marginBottom: '0.25rem' }}>
              Founder Database Visibility Notice (Supabase Row-Level Security)
            </div>
            <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Supabase enforces Row-Level Security (RLS) on the <code>profiles</code> table, which by default only permits each user to read their own row.
              To allow your founder email (<code>nikhil@gmail.com</code>) to view all registered students across the entire database, run this 1-line query in your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Supabase SQL Editor</a>:
            </div>
            <pre style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              color: '#34d399',
              fontSize: '0.8rem',
              overflowX: 'auto',
              marginTop: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {`CREATE POLICY "Founder can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.jwt() ->> 'email' = 'nikhil@gmail.com');`}
            </pre>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CAMPUS & TPO PROVISIONING (METHOD C: ENTERPRISE B2B SALES)            */}
      {/* ==================================================================== */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.25)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ padding: '6px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '8px', color: '#818cf8' }}>
                <Building2 size={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Campus & TPO Provisioning (Method C: Enterprise B2B)
              </h3>
              <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                HIGH LEVERAGE
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Provision new institutional partnerships, invite College Placement Officers (TPOs) with secure single-use tokens, and track multi-tenant batches.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href="/campus"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              <ExternalLink size={15} /> Preview TPO Portal
            </a>
            <button
              onClick={() => setShowProvisionModal(prev => !prev)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <UserPlus size={15} />
              {showProvisionModal ? 'Hide Form' : 'Provision College & Invite TPO'}
            </button>
          </div>
        </div>

        {/* Provision Form */}
        {showProvisionModal && (
          <form
            onSubmit={handleProvisionCollege}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#818cf8' }}>
              Create Institution & Generate Single-Use TPO Invite Token
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>College / University Name *</label>
                <input
                  type="text"
                  placeholder="e.g. BITS Pilani Goa"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  required
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Official College Domain</label>
                <input
                  type="text"
                  placeholder="e.g. bits-goa.ac.in"
                  value={collegeDomain}
                  onChange={(e) => setCollegeDomain(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>TPO Officer Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. H. Sharma"
                  value={tpoName}
                  onChange={(e) => setTpoName(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>TPO Official Email *</label>
                <input
                  type="email"
                  placeholder="tpo@bits-goa.ac.in"
                  value={tpoEmail}
                  onChange={(e) => setTpoEmail(e.target.value)}
                  required
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>City & State</label>
                <input
                  type="text"
                  placeholder="Goa"
                  value={collegeCity}
                  onChange={(e) => setCollegeCity(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Graduation Batch Year</label>
                <input
                  type="number"
                  placeholder="2026"
                  value={batchYear}
                  onChange={(e) => setBatchYear(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={provisioning}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {provisioning ? 'Provisioning...' : 'Provision & Generate Invite Link'}
              </button>
            </div>
          </form>
        )}

        {/* Generated Invite Box */}
        {generatedInvite && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ color: '#4ade80', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> College Provisioned: {generatedInvite.institution?.name}
              </strong>
              <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                Invite Code: {generatedInvite.institution?.invite_code}
              </span>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0.75rem 0' }}>
              Send this secure 1-time activation link to <strong>{generatedInvite.institution?.contact_email}</strong>:
            </p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${generatedInvite.invite_link}`}
                className="input"
                style={{ fontSize: '0.85rem', color: '#6ee7b7', fontFamily: 'monospace' }}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${generatedInvite.invite_link}`);
                  setCopiedToken(true);
                  addToast('Copied single-use TPO activation link!', 'success');
                  setTimeout(() => setCopiedToken(false), 2000);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copiedToken ? <Check size={14} /> : <Copy size={14} />}
                {copiedToken ? 'Copied Link' : 'Copy Link'}
              </button>
            </div>
          </div>
        )}

        {/* Active Provisioned Colleges & Invites Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Institution Name</th>
                <th style={{ padding: '0.75rem' }}>Student Invite Code</th>
                <th style={{ padding: '0.75rem' }}>TPO Officer</th>
                <th style={{ padding: '0.75rem' }}>Official Email</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collegesList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No institutions provisioned yet. Click "Provision College & Invite TPO" above to onboard your first campus!
                  </td>
                </tr>
              ) : (
                collegesList.map((col) => {
                  const matchingInvite = activeInvites.find(inv => inv.institution_id === col.id) || col.invites?.[0];
                  const isAccepted = matchingInvite?.status === 'accepted';
                  const isRevoked = matchingInvite?.status === 'revoked';

                  return (
                    <tr key={col.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                        {col.name}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          {col.city}, {col.state} • Batch {col.batch_year || 2026}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="badge badge-purple" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {col.invite_code}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1' }}>
                        {col.contact_name || matchingInvite?.full_name || 'TPO Director'}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                        {col.contact_email || matchingInvite?.email}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isAccepted ? 'rgba(34, 197, 94, 0.2)' : isRevoked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                          color: isAccepted ? '#4ade80' : isRevoked ? '#f87171' : '#facc15'
                        }}>
                          {isAccepted ? 'Active & Claimed' : isRevoked ? 'Revoked' : 'Pending Activation'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {matchingInvite?.token && !isAccepted && !isRevoked && (
                            <button
                              onClick={() => {
                                const link = `${window.location.origin}/campus/accept-invite?token=${matchingInvite.token}`;
                                navigator.clipboard.writeText(link);
                                addToast('Copied TPO Activation Link', 'success');
                              }}
                              className="btn btn-secondary"
                              title="Copy activation link"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <Copy size={13} /> Link
                            </button>
                          )}
                          <a
                            href="/campus"
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            title="Inspect campus dashboard"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                          >
                            <ExternalLink size={13} /> View
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTERED USERS DIRECTORY (NEW SECTION) */}
      <div style={{
        background: 'var(--card-bg, #1e1e2d)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        borderRadius: '16px',
        padding: '1.75rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={22} color="#8b5cf6" />
              Registered Students & User Directory ({usersList.length})
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Live overview of all registered accounts, college degrees, career roles, and onboarding status.
            </p>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="text"
                placeholder="Search by name, email, college..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  fontSize: '0.8125rem'
                }}
              />
            </div>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.8125rem'
              }}
            >
              <option value="all" style={{ background: '#1e1e2d' }}>All Users</option>
              <option value="onboarded" style={{ background: '#1e1e2d' }}>Onboarded Only</option>
              <option value="paid" style={{ background: '#1e1e2d' }}>Paid Plans</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>User / Email</th>
                <th style={{ padding: '0.75rem 1rem' }}>Target Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>College & Degree</th>
                <th style={{ padding: '0.75rem 1rem' }}>Readiness Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>Assigned Plan</th>
                <th style={{ padding: '0.75rem 1rem' }}>Onboarding</th>
                <th style={{ padding: '0.75rem 1rem' }}>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading user directory from Supabase...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {/* User / Email */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{u.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} /> {u.email}
                      </div>
                    </td>

                    {/* Target Role */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#a78bfa',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {getRoleDisplayName(u.target_role) || u.target_role || 'Software Engineer'}
                      </span>
                    </td>

                    {/* College & Degree */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.8125rem' }}>{u.college || 'College Campus'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.degree || 'Engineering'}</div>
                    </td>

                    {/* Readiness */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          fontWeight: 700,
                          color: u.career_readiness > 75 ? '#10b981' : u.career_readiness > 50 ? '#f59e0b' : u.career_readiness > 0 ? '#38bdf8' : '#94a3b8'
                        }}>
                          {u.career_readiness}%
                        </div>
                        <div style={{ width: '60px', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${u.career_readiness}%`,
                            height: '100%',
                            background: u.career_readiness > 75 ? '#10b981' : u.career_readiness > 50 ? '#f59e0b' : u.career_readiness > 0 ? '#38bdf8' : '#64748b'
                          }} />
                        </div>
                      </div>
                      {!u.onboarding_completed && u.career_readiness === 0 && (
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '3px' }}>
                          Pending Onboarding
                        </div>
                      )}
                    </td>

                    {/* Plan */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: u.plan.includes('249') ? 'rgba(245, 158, 11, 0.2)' : u.plan.includes('149') ? 'rgba(139, 92, 246, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                        color: u.plan.includes('249') ? '#f59e0b' : u.plan.includes('149') ? '#a78bfa' : '#94a3b8',
                        border: u.plan.includes('249') ? '1px solid rgba(245, 158, 11, 0.3)' : u.plan.includes('149') ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(148, 163, 184, 0.2)'
                      }}>
                        {u.plan}
                      </span>
                    </td>

                    {/* Onboarding */}
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        background: u.onboarding_completed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: u.onboarding_completed ? '#10b981' : '#ef4444'
                      }}>
                        {u.onboarding_completed ? 'Completed' : 'Pending'}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Optimizer Control Box */}
      <div style={{
        background: 'var(--card-bg, #1e1e2d)',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        borderRadius: '14px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={20} color="#8b5cf6" />
              Live AI Model Switcher (Cost & Latency Control)
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Switch between High-Bar 70B (Deep evaluation) and Ultra-Cheap 8B Instant (90% cheaper, instant generation)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => handleModelSwitch('llama-3.1-8b-instant')}
              disabled={switchingModel || selectedModel === 'llama-3.1-8b-instant'}
              className="btn"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                background: selectedModel === 'llama-3.1-8b-instant' ? '#10b981' : 'rgba(16, 185, 129, 0.15)',
                color: selectedModel === 'llama-3.1-8b-instant' ? '#fff' : '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              ⚡ Fast & Cheap (Llama 3.1 8B)
            </button>
            <button
              onClick={() => handleModelSwitch('llama-3.3-70b-versatile')}
              disabled={switchingModel || selectedModel === 'llama-3.3-70b-versatile'}
              className="btn"
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                background: selectedModel === 'llama-3.3-70b-versatile' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.15)',
                color: selectedModel === 'llama-3.3-70b-versatile' ? '#fff' : '#8b5cf6',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}
            >
              👑 High Intelligence (Llama 3.3 70B)
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Plan Margin Simulator & Feature Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Interactive Margin & Revenue Simulator */}
        <div style={{
          background: 'var(--card-bg, #1e1e2d)',
          borderRadius: '14px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={20} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
              Founder Unit Margin Simulator
            </h3>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Simulate your monthly subscriber count to calculate actual net take-home profit after Groq LLM and payment gateway costs.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Free Users Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 600 }}>Free Users (₹0)</span>
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>{freeUsers} users</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="25"
                value={freeUsers}
                onChange={(e) => setFreeUsers(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#94a3b8' }}
              />
            </div>

            {/* Pro Plan Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 600, color: '#8b5cf6' }}>Pro Users (₹149/mo)</span>
                <span style={{ color: '#8b5cf6', fontWeight: 700 }}>{proUsers} users (₹{revPro.toLocaleString()})</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="10"
                value={proUsers}
                onChange={(e) => setProUsers(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#8b5cf6' }}
              />
            </div>

            {/* Ultimate Plan Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>Ultimate Users (₹249/mo)</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>{ultUsers} users (₹{revUlt.toLocaleString()})</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={ultUsers}
                onChange={(e) => setUltUsers(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross Revenue</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>₹{totalRevenue.toLocaleString()}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total AI Token Bill</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>-₹{totalAiCost.toFixed(0)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gateway Fees (2.36%)</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#94a3b8' }}>
                  {gatewayFees > 0 ? `-₹${gatewayFees.toFixed(0)}` : '₹0'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: netProfit >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>Gross Profit Margin</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>{marginPct}%</div>
              </div>
            </div>

            <div style={{
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: netProfit >= 0 ? '#fff' : '#f87171' }}>
                {netProfit >= 0 ? 'Net Monthly Profit in Pocket:' : 'Net Monthly Cash Burn / Deficit:'}
              </span>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                {netProfit < 0 ? `-₹${Math.abs(netProfit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : `₹${netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Breakdown */}
        <div style={{
          background: 'var(--card-bg, #1e1e2d)',
          borderRadius: '14px',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Layers size={20} color="#8b5cf6" />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
              Token Consumption by Feature
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.keys(metrics?.feature_breakdown || {}).length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No feature calls recorded yet in this session.
              </div>
            ) : (
              Object.entries(metrics.feature_breakdown).map(([feat, data]) => {
                const totalTokens = metrics.usage?.total_tokens || 1;
                const pct = Math.min(100, Math.round((data.tokens / totalTokens) * 100));
                return (
                  <div key={feat} style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {feat.replace(/_/g, ' ')}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {data.tokens.toLocaleString()} tokens (₹{data.cost_inr.toFixed(2)})
                      </span>
                    </div>
                    <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #ec4899)' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Live Request Stream Log */}
      <div style={{
        background: 'var(--card-bg, #1e1e2d)',
        borderRadius: '14px',
        border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={20} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
              Live LLM Request Stream (Audit Log)
            </h3>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing last 30 requests
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem' }}>Feature</th>
                <th style={{ padding: '0.75rem' }}>Model</th>
                <th style={{ padding: '0.75rem' }}>Prompt Tokens</th>
                <th style={{ padding: '0.75rem' }}>Completion</th>
                <th style={{ padding: '0.75rem' }}>Total Tokens</th>
                <th style={{ padding: '0.75rem' }}>Cost (INR)</th>
                <th style={{ padding: '0.75rem' }}>Latency</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {!metrics?.recent_logs || metrics.recent_logs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent requests logged yet. As users generate interview questions, analyze resumes, or chat with copilot, requests appear here in real-time.
                  </td>
                </tr>
              ) : (
                metrics.recent_logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{log.timestamp}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{log.feature}</td>
                    <td style={{ padding: '0.75rem', color: '#8b5cf6' }}>{log.model}</td>
                    <td style={{ padding: '0.75rem' }}>{log.prompt_tokens.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>{log.completion_tokens.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{log.total_tokens.toLocaleString()}</td>
                    <td style={{ padding: '0.75rem', color: '#ef4444' }}>₹{log.cost_inr.toFixed(4)}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{log.latency_ms}ms</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        background: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: log.status === 'SUCCESS' ? '#10b981' : '#ef4444'
                      }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FounderAdminPage;
