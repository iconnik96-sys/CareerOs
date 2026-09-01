import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { applicationService } from '../services/applicationService';
import { Plus, DollarSign, Trash2, Edit2, Kanban, Table as TableIcon } from 'lucide-react';
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
    const [viewMode, setViewMode] = useState('kanban');
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
    return (<div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Application Tracker</h1>
          <p className="page-subtitle">
            Manage and monitor your job hiring funnel across all application stages.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* View Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-color)' }}>
            <button onClick={() => setViewMode('kanban')} className={`btn-ghost btn-sm ${viewMode === 'kanban' ? 'active' : ''}`} style={{ backgroundColor: viewMode === 'kanban' ? 'var(--primary-light)' : 'transparent', color: viewMode === 'kanban' ? 'var(--primary)' : 'var(--text-secondary)' }}>
              <Kanban size={15}/> Kanban
            </button>
            <button onClick={() => setViewMode('table')} className={`btn-ghost btn-sm ${viewMode === 'table' ? 'active' : ''}`} style={{ backgroundColor: viewMode === 'table' ? 'var(--primary-light)' : 'transparent', color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-secondary)' }}>
              <TableIcon size={15}/> Table
            </button>
          </div>

          <Button variant="primary" onClick={() => openAddModal('SAVED')} leftIcon={<Plus size={16}/>}>
            Add Application
          </Button>
        </div>
      </div>

      {/* Pipeline Quick Stats */}
      <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div>
            <div className="text-xs text-muted">Total Tracked</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{stats.total}</div>
          </div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div>
            <div className="text-xs text-muted">Active in Pipeline</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{stats.activePipeline}</div>
          </div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div>
            <div className="text-xs text-muted">Interviews Scheduled</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{stats.interviews}</div>
          </div>
        </div>
        <div className="stat-card" style={{ padding: '1rem' }}>
          <div>
            <div className="text-xs text-muted">Offers Received</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>{stats.offers}</div>
          </div>
        </div>
      </div>

      {loading ? (<LoadingSpinner message="Loading applications..."/>) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="kanban-board">
          {COLUMNS.map(col => {
                const colApps = applications.filter(a => a.status === col.id);
                return (<div key={col.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }}/>
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
                            <DollarSign size={12}/> {app.salary}
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
                            <Trash2 size={13}/>
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
                    <Plus size={13}/> Add to {col.title}
                  </button>
                </div>
              </div>);
            })}
        </div>) : (
        /* Table View */
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Company</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Applied Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Salary</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (<tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{app.company}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{app.role}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{app.location || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge variant={getStatusBadgeVariant(app.status)}>
                        {app.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--success)' }}>{app.salary || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button onClick={() => openEditModal(app)} className="btn-ghost" style={{ padding: '4px', color: 'var(--text-muted)', marginRight: '4px' }}>
                        <Edit2 size={14}/>
                      </button>
                      <button onClick={() => handleDelete(app.id, app.company)} className="btn-ghost" style={{ padding: '4px', color: 'var(--danger)' }}>
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </Card>)}

      {/* Add / Edit Application Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingAppId ? 'Edit Application' : 'Add Application'}>
        <form onSubmit={handleSaveApplication}>
          <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
            <Input label="Company Name" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Razorpay" required/>
            <Input label="Role / Title" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Junior Backend Developer" required/>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
            <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bangalore / Remote"/>
            <Input label="Compensation / CTC" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. ₹14 LPA"/>
          </div>

          <div className="form-group">
            <label className="form-label">Current Pipeline Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              {COLUMNS.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Next Steps</label>
            <textarea className="form-textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Round 1 Technical scheduled with Senior Architect on Thursday..."/>
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
    </div>);
};
