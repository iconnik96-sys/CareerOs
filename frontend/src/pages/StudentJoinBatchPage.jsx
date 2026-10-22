import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { campusService } from '../services/campusService';
import { Building2, GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react';

export const StudentJoinBatchPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showToast } = useToast();

  const [inviteCode, setInviteCode] = useState(code ? code.toUpperCase() : '');
  const [branch, setBranch] = useState('CSE');
  const [rollNumber, setRollNumber] = useState('');
  const [cgpa, setCgpa] = useState('8.2');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinedInstitution, setJoinedInstitution] = useState(null);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      showToast('Please enter your college invite code', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await campusService.studentJoinByCode(inviteCode, {
        user_id: user?.id,
        branch,
        roll_number: rollNumber,
        cgpa: parseFloat(cgpa) || 8.0
      });

      setJoined(true);
      setJoinedInstitution(res);
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message || 'Invalid college invite code', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff',
            marginBottom: '0.75rem'
          }}>
            <GraduationCap size={26} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
            Join College Placement Batch
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Link your CareerOS profile with your college placement cell
          </p>
        </div>

        {joined ? (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <CheckCircle2 size={36} color="#4ade80" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ color: '#86efac', margin: '0 0 6px 0', fontSize: '1.15rem' }}>You're Enrolled!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Your profile is now linked to <strong>{joinedInstitution?.institution_name}</strong>. Your placement officer will now be able to consider you for visiting campus drives.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              Go to Student Dashboard <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleJoin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                College Invite Code
              </label>
              <input
                type="text"
                placeholder="e.g. APEX-2026"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="form-input"
                style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.08em', fontFamily: 'monospace', textTransform: 'uppercase' }}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                Department / Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.9rem' }}
              >
                <option value="CSE">Computer Science & Engineering (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="AI-DS">Artificial Intelligence & Data Science (AI-DS)</option>
                <option value="ECE">Electronics & Communication (ECE)</option>
                <option value="Mechanical">Mechanical Engineering</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                  College Roll Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. AIT-22-CS-042"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>
                  Current CGPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="8.50"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {submitting ? 'Linking...' : 'Enroll in Campus Batch'}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
export default StudentJoinBatchPage;
