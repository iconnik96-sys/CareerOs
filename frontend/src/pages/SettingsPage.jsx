import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { User, Shield, Bell, Sliders, LogOut, Trash2, Sparkles, CheckCircle2, Database } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
export const SettingsPage = () => {
    const { user, profile, isSupabaseConnected, logout, deleteAccount, resetPassword } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [emailForReset, setEmailForReset] = useState(profile?.email || user?.email || '');
    const [resetting, setResetting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    // Notification toggles
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [interviewReminders, setInterviewReminders] = useState(true);
    const [weeklyDigest, setWeeklyDigest] = useState(false);
    const handleResetPassword = async () => {
        if (!emailForReset)
            return;
        setResetting(true);
        const { error } = await resetPassword(emailForReset);
        setResetting(false);
        if (error) {
            showToast(error, 'error');
        }
        else {
            showToast('Password reset link sent to your email', 'success');
        }
    };
    const handleLogout = async () => {
        await logout();
        showToast('Signed out of CareerOS', 'info');
        navigate('/');
    };
    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            await deleteAccount();
            setDeleteModalOpen(false);
            showToast('Your account and all associated data have been permanently deleted.', 'info', 'Account Deleted');
            navigate('/');
        } catch (err) {
            showToast(err?.message || 'Failed to delete account', 'error');
        } finally {
            setDeleting(false);
        }
    };
    const tabs = [
        { id: 'profile', label: 'Profile', icon: <User size={16}/> },
        { id: 'security', label: 'Account & Security', icon: <Shield size={16}/> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={16}/> },
        { id: 'preferences', label: 'System & Architecture', icon: <Sliders size={16}/> },
    ];
    return (<div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Configure your account credentials, notifications, and platform preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12" style={{ gap: '1.5rem' }}>
        {/* Settings Navigation Menu */}
        <div className="col-span-4">
          <Card style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {tabs.map(t => (<button key={t.id} onClick={() => setActiveTab(t.id)} className={`nav-item ${activeTab === t.id ? 'active' : ''}`} style={{ width: '100%', textAlign: 'left' }}>
                  {t.icon}
                  <span>{t.label}</span>
                </button>))}
            </div>

            <div style={{ margin: '1rem 0 0.5rem 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <button onClick={handleLogout} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--text-secondary)', padding: '0.625rem 0.85rem' }}>
                <LogOut size={16}/>
                <span>Sign Out</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Settings Panel Content */}
        <div className="col-span-8">
          {activeTab === 'profile' && (<Card title="Profile Information">
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <Input label="Full Name" value={profile?.full_name || user?.user_metadata?.full_name || 'Student User'} disabled/>
                <Input label="Account Email" value={profile?.email || user?.email || ''} disabled/>
                <Input label="Target Role" value={profile?.target_role || 'Java Backend Developer'} disabled/>
                <Input label="Location" value={profile?.location || 'Bangalore, India'} disabled/>
              </div>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-body text-xs">
                  To edit your full resume bio, skills, and projects portfolio, visit Career Profile.
                </span>
                <Button variant="secondary" size="sm" onClick={() => navigate('/profile')}>
                  Edit Career Profile
                </Button>
              </div>
            </Card>)}

          {activeTab === 'security' && (<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Card title="Authentication & Security">
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-success">
                      <CheckCircle2 size={12}/> Row Level Security Active
                    </span>
                  </div>
                  <p className="text-body text-xs">
                    CareerOS uses Supabase authentication and PostgreSQL RLS policies to guarantee that only you have access to your personal resumes, applications, and analyses.
                  </p>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Reset Password
                  </h4>
                  <p className="text-body text-xs" style={{ marginBottom: '1rem' }}>
                    Receive a secure recovery link via Supabase Auth.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Input value={emailForReset} onChange={e => setEmailForReset(e.target.value)} placeholder="student@university.edu" style={{ marginBottom: 0 }}/>
                    <Button variant="secondary" onClick={handleResetPassword} isLoading={resetting}>
                      Send Link
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Danger Zone: Delete Account */}
              <Card title="Danger Zone" icon={<Trash2 size={18} className="text-danger"/>}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--danger)' }}>
                      Delete Account
                    </h4>
                    <p className="text-body text-xs">
                      Permanently remove your career profile, applications, resumes, and stored analyses.
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setDeleteModalOpen(true)}>
                    Delete Account
                  </Button>
                </div>
              </Card>
            </div>)}

          {activeTab === 'notifications' && (<Card title="Notification Preferences">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      Application Status Alerts
                    </div>
                    <div className="text-body text-xs">Receive updates when companies change application or interview states.</div>
                  </div>
                  <input type="checkbox" checked={emailAlerts} onChange={e => setEmailAlerts(e.target.checked)} style={{ width: '18px', height: '18px' }}/>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      Interview Prep Reminders
                    </div>
                    <div className="text-body text-xs">Get daily technical question reminders calibrated for your target role.</div>
                  </div>
                  <input type="checkbox" checked={interviewReminders} onChange={e => setInterviewReminders(e.target.checked)} style={{ width: '18px', height: '18px' }}/>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      Weekly Roadmap Digest
                    </div>
                    <div className="text-body text-xs">Summary of completed skills and new matching job openings.</div>
                  </div>
                  <input type="checkbox" checked={weeklyDigest} onChange={e => setWeeklyDigest(e.target.checked)} style={{ width: '18px', height: '18px' }}/>
                </div>
              </div>
            </Card>)}

          {activeTab === 'preferences' && (<Card title="System & Integration Status">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Database size={18} className="text-primary-accent"/>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Supabase PostgreSQL & Auth
                      </h4>
                    </div>
                    <span className="badge badge-success">
                      {isSupabaseConnected ? 'Connected Live' : 'Active'}
                    </span>
                  </div>
                  <p className="text-body text-xs" style={{ marginBottom: '0.5rem' }}>
                    All user accounts, career roadmaps, job applications, and analyses are stored directly in Supabase with RLS.
                  </p>
                </div>

                <div style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(124, 58, 237, 0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(124, 58, 237, 0.25)'
            }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={18} className="text-primary-accent"/>
                      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        AI Backend (FastAPI + Groq LLM)
                      </h4>
                    </div>
                    <span className="badge badge-purple">
                      openai/gpt-oss-120b
                    </span>
                  </div>
                  <p className="text-body text-xs">
                    All evaluations, resume scoring, job gap analyses, STAR bullet enhancements, and interview grading are performed live via Groq API.
                  </p>
                </div>
              </div>
            </Card>)}

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Account Deletion">
        <p className="text-body text-sm" style={{ marginBottom: '1.5rem' }}>
          Are you sure you want to delete your CareerOS account? This will remove all your tracked applications, parsed resumes, and customized roadmap milestones.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteAccount} isLoading={deleting}>
            Permanently Delete
          </Button>
        </div>
      </Modal>
    </div>);
};
