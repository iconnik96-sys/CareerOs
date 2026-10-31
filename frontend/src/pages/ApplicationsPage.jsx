import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { applicationService } from '../services/applicationService';
import { Plus, DollarSign, Trash2, Edit2, Kanban, Table as TableIcon } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
const COLUMNS = [
  { id: 'SAVED', title: 'Saved', color: '#94a3b8' },
  { id: 'APPLIED', title: 'Applied', color: '#f59e0b' },
  { id: 'ASSESSMENT', title: 'Assessment', color: '#3b82f6' },
  { id: 'INTERVIEW', title: 'Interview', color: '#6366f1' },
  { id: 'OFFER', title: 'Offer Received', color: '#10b981' },
  { id: 'REJECTED', title: 'Archived / Rejected', color: '#ef4444' },
];
export const ApplicationsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('APPLIED');
  const [salary, setSalary] = useState('');
  const [notes, setNotes] = useState('');
  const loadApplications = async () => {
    if (!user?.id)
      return;
    setLoading(true);
    const data = await applicationService.getApplications(user.id);
    setApplications(data);
    setLoading(false);
  };
  useEffect(() => {
    loadApplications();
  }, [user?.id]);
  const openAddModal = (initialStatus = 'SAVED') => {
    setEditingAppId(null);
    setCompany('');
    setRole('Java Backend Developer');
    setLocation('Bangalore, India');
    setStatus(initialStatus);
    setSalary('₹14 LPA');
    setNotes('');
    setModalOpen(true);
  };
  const openEditModal = (app) => {
    setEditingAppId(app.id);
    setCompany(app.company);
    setRole(app.role);
    setLocation(app.location || '');
    setStatus(app.status);
    setSalary(app.salary || '');
    setNotes(app.notes || '');
    setModalOpen(true);
  };
  const handleSaveApplication = async (e) => {
    e.preventDefault();
    if (!user?.id)
      return;
    if (editingAppId) {
      const updated = await applicationService.updateApplication(user.id, editingAppId, {
        company,
        role,
        location,
        status,
        salary,
        notes
      });
      if (updated) {
        setApplications(prev => prev.map(a => a.id === editingAppId ? updated : a));
        showToast('Application updated successfully', 'success');
      }
    }
    else {
      const created = await applicationService.addApplication(user.id, {
        company,
        role,
        location,
        status,
        salary,
        notes,
        applied_at: new Date().toISOString()
      });
      if (created) {
        setApplications(prev => [created, ...prev]);
        showToast(`Added ${company} to ${status} applications`, 'success');
      }
    }
    setModalOpen(false);
  };
  const handleStatusChange = async (appId, newStatus) => {
    if (!user?.id)
      return;
    await applicationService.updateStatus(user.id, appId, newStatus);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    showToast(`Moved application to ${newStatus}`, 'info');
  };
  const handleDelete = async (appId, compName) => {
    if (!user?.id)
      return;
    await applicationService.deleteApplication(user.id, appId);
    setApplications(prev => prev.filter(a => a.id !== appId));
    showToast(`Removed application for ${compName}`, 'info');
  };
  const stats = applicationService.getStats(applications);
  const getStatusBadgeVariant = (s) => {
    switch (s) {
      case 'OFFER': return 'success';
      case 'INTERVIEW': return 'purple';
      case 'ASSESSMENT': return 'primary';
      case 'APPLIED': return 'warning';
      case 'REJECTED': return 'danger';
      default: return 'neutral';
    }
  };
  return (
    <>
      <PageHeader
        title="Jobs & Hiring Pipeline"
        subtitle="Manage and monitor your job hiring funnel across all application stages."
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Top Pipeline Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px', backgroundColor: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <Link to="/jobs" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Explore Matches
                </Button>
              </Link>
              <Link to="/applications" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="sm" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8125rem' }}>
                  Applications Pipeline ({applications.length})
                </Button>
              </Link>
            </div>

            {/* View Mode Switcher */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-card-subtle)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-color)' }}>
              <button onClick={() => setViewMode('table')} className={`btn-ghost btn-sm ${viewMode === 'table' ? 'active' : ''}`} style={{ backgroundColor: viewMode === 'table' ? 'var(--primary-subtle)' : 'transparent', color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)' }}>
                <TableIcon size={15} /> Table
              </button>
              <button onClick={() => setViewMode('kanban')} className={`btn-ghost btn-sm ${viewMode === 'kanban' ? 'active' : ''}`} style={{ backgroundColor: viewMode === 'kanban' ? 'var(--primary-subtle)' : 'transparent', color: viewMode === 'kanban' ? '#fff' : 'var(--text-secondary)' }}>
                <Kanban size={15} /> Kanban
              </button>
            </div>

            <Button variant="primary" size="sm" onClick={() => openAddModal('SAVED')} leftIcon={<Plus size={15} />}>
              Add Application
            </Button>
          </div>
        }
      />

      <div className="page-container">
        {/* Pipeline Quick Stats */}
    <div className="metrics-grid">
      <div className="metric-card">
        <span className="metric-label">Total Tracked</span>
        <span className="metric-value">{stats.total}</span>
        <span className="metric-sub">Applications saved</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">Active Pipeline</span>
        <span className="metric-value" style={{ color: 'var(--primary)' }}>{stats.activePipeline}</span>
        <span className="metric-sub">In progress</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">Interviews</span>
        <span className="metric-value" style={{ color: 'var(--accent-purple)' }}>{stats.interviews}</span>
        <span className="metric-sub">Rounds scheduled</span>
      </div>
      <div className="metric-card">
        <span className="metric-label">Offers Received</span>
        <span className="metric-value" style={{ color: 'var(--success)' }}>{stats.offers}</span>
        <span className="metric-sub">Offer letters</span>
      </div>
    </div>

    {loading ? (<LoadingSpinner message="Loading applications..." />) : viewMode === 'kanban' ? (
      /* Kanban Board View */
      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colApps = applications.filter(a => a.status === col.id);
          return (<div key={col.id} className="kanban-column">
            <div className="kanban-column-header">
              <div className="kanban-column-title">
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }} />
                {col.title}
              </div>
              <span className="kanban-column-count">{colApps.length}</span>
            </div>

            <div className="kanban-cards-container">
              {colApps.length === 0 ? (<div style={{ textAlign: 'center', padding: '2rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                No applications
              </div>) : (colApps.map(app => (<div key={app.id} className="kanban-card" onClick={() => openEditModal(app)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {app.company}
                  </h4>
                  <span className="text-xs text-muted" style={{ fontSize: '0.6875rem' }}>
                    {new Date(app.applied_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-body text-xs" style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  {app.role}
                </div>

                {app.salary && (<div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--success)', marginBottom: '0.4rem' }}>
                  <DollarSign size={12} /> {app.salary}
                </div>)}

                {app.notes && (<p style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-tertiary)',
                  padding: '0.4rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  lineHeight: 1.4,
                  marginBottom: '0.75rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {app.notes}
                </p>)}

                {/* Status Quick Mover */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }} onClick={e => e.stopPropagation()}>
                  <select className="form-select" value={app.status} onChange={e => handleStatusChange(app.id, e.target.value)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.6875rem', height: 'auto', width: 'auto' }}>
                    {COLUMNS.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
                  </select>

                  <button onClick={() => handleDelete(app.id, app.company)} className="btn-ghost" style={{ padding: '4px', color: 'var(--danger)' }} title="Delete">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>)))}

              <button onClick={() => openAddModal(col.id)} style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                marginTop: 'auto'
              }}>
                <Plus size={13} /> Add to {col.title}
              </button>
            </div>
          </div>);
        })}
      </div>) : (
      /* Table View */
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Location</th>
              <th>Status</th>
              <th>Applied Date</th>
              <th>Salary</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (<tr key={app.id}>
              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.company}</td>
              <td>{app.role}</td>
              <td style={{ color: 'var(--text-muted)' }}>{app.location || '—'}</td>
              <td>
                <Badge variant={getStatusBadgeVariant(app.status)}>
                  {app.status}
                </Badge>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>
                {new Date(app.applied_at).toLocaleDateString()}
              </td>
              <td style={{ color: 'var(--success)' }}>{app.salary || '—'}</td>
              <td style={{ textAlign: 'right' }}>
                <button onClick={() => openEditModal(app)} className="btn-ghost" style={{ padding: '4px', color: 'var(--text-muted)', marginRight: '4px' }}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(app.id, app.company)} className="btn-ghost" style={{ padding: '4px', color: 'var(--danger)' }}>
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>))}
          </tbody>
        </table>
      </div>)}

    {/* Add / Edit Application Modal */}
    <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingAppId ? 'Edit Application' : 'Add Application'}>
      <form onSubmit={handleSaveApplication}>
        <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
          <Input label="Company Name" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Razorpay" required />
          <Input label="Role / Title" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Junior Backend Developer" required />
        </div>

        <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
          <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bangalore / Remote" />
          <Input label="Compensation / CTC" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. ₹14 LPA" />
        </div>

        <div className="form-group">
          <label className="form-label">Current Pipeline Status</label>
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
            {COLUMNS.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Notes & Next Steps</label>
          <textarea className="form-textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Round 1 Technical scheduled with Senior Architect on Thursday..." />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editingAppId ? 'Update Application' : 'Save Application'}
          </Button>
        </div>
      </form>
    </Modal>
  </div>
  </>);
};
