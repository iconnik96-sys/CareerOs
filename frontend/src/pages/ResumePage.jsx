import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { resumeService } from '../services/resumeService';
import { analysisService } from '../services/analysisService';
import { extractSkillsFromText } from '../utils/skillExtractor';
import { FileText, Upload, Sparkles, Trash2, RefreshCw, CheckCircle2, Calendar, HardDrive, Edit3, Check } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
export const ResumePage = () => {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [resume, setResume] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isEditingText, setIsEditingText] = useState(false);
    const [textInput, setTextInput] = useState('');
    useEffect(() => {
        const fetchResume = async () => {
            if (!user?.id)
                return;
            setLoading(true);
            const data = await resumeService.getResume(user.id);
            setResume(data);
            setTextInput(data?.parsed_text || '');
            setLoading(false);
        };
        fetchResume();
    }, [user?.id]);
    const handleFileUpload = async (file) => {
        if (!user?.id) {
            showToast('Please sign in to upload your resume', 'warning');
            return;
        }
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isText = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt') || file.name.toLowerCase().endsWith('.md');
        if (!isPdf && !isText) {
            showToast('Please upload a PDF or TXT resume file', 'warning');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('File size exceeds the 5 MB limit', 'warning');
            return;
        }
        setUploading(true);
        try {
            const uploaded = await resumeService.uploadResume(user.id, file);
            if (uploaded) {
                setResume(uploaded);
                setTextInput(uploaded.parsed_text || '');
                // Automatically trigger a fresh analysis run for the uploaded resume
                const role = profile?.target_role || 'Java Backend Developer';
                analysisService.runResumeAnalysis(user.id, uploaded.id, uploaded.parsed_text, role).catch((err) => {
                    console.warn('Auto analysis background warning:', err);
                });
                showToast('Resume parsed and stored successfully!', 'success', 'Uploaded');
            }
            else {
                showToast('Failed to upload resume', 'error');
            }
        }
        catch (err) {
            showToast(err?.message || 'Failed to upload resume', 'error');
        }
        finally {
            setUploading(false);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };
    const handleSavePastedText = async () => {
        if (!user?.id)
            return;
        if (!textInput.trim()) {
            showToast('Please enter your resume text', 'warning');
            return;
        }
        const pastedFile = new File([textInput], 'Pasted_Resume.txt', { type: 'text/plain' });
        setUploading(true);
        try {
            const uploaded = await resumeService.uploadResume(user.id, pastedFile);
            if (uploaded) {
                setResume(uploaded);
                const role = profile?.target_role || 'Java Backend Developer';
                await analysisService.runResumeAnalysis(user.id, uploaded.id, textInput, role);
                showToast('Resume text saved & analyzed!', 'success');
                setIsEditingText(false);
            }
        }
        catch (err) {
            showToast(err?.message || 'Failed to save resume text', 'error');
        }
        finally {
            setUploading(false);
        }
    };
    const handleDelete = async () => {
        if (!resume || !user?.id)
            return;
        const ok = await resumeService.deleteResume(user.id, resume.id, resume.file_path);
        if (ok) {
            setResume(null);
            setTextInput('');
            showToast('Resume deleted', 'info');
        }
    };
    return (<div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Resume Management</h1>
          <p className="page-subtitle">
            Upload your technical resume to parse skills, evaluate ATS keyword density, and unlock AI gap analysis.
          </p>
        </div>
        {resume && (<Link to="/resume-analysis">
            <Button variant="primary" leftIcon={<Sparkles size={16}/>}>
              Analyze Resume
            </Button>
          </Link>)}
      </div>

      {loading ? (<LoadingSpinner message="Loading resume records..."/>) : (<div className="grid grid-cols-12" style={{ gap: '1.5rem' }}>
          {/* Active Resume Card */}
          <div className="col-span-6">
            <Card title="Your Resume" icon={<FileText size={18} className="text-primary-accent"/>}>
              {resume ? (<div>
                  <div style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1.25rem'
                }}>
                    <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                      <FileText size={24}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                        {resume.file_name}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12}/> {new Date(resume.created_at).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <HardDrive size={12}/> {(resume.file_size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Parsed Text Preview Box */}
                  <div style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '1rem',
                    maxHeight: '130px',
                    overflowY: 'auto',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap'
                }}>
                    {resume.parsed_text ? (resume.parsed_text.slice(0, 400) + (resume.parsed_text.length > 400 ? '...' : '')) : ('Parsed content preview will appear here.')}
                  </div>

                  {/* Extracted Skills Chips */}
                  {resume.parsed_text && (<div style={{ marginBottom: '1.25rem' }}>
                      <span className="text-xs text-muted" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                        Detected Technical Skills:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {extractSkillsFromText(resume.parsed_text).length > 0 ? (extractSkillsFromText(resume.parsed_text).map(sk => (<span key={sk} className="badge badge-neutral" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                              {sk}
                            </span>))) : (<span className="text-xs text-muted">No specific tech keywords recognized in text preview.</span>)}
                      </div>
                    </div>)}

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Link to="/resume-analysis" style={{ flex: 1 }}>
                      <Button variant="primary" style={{ width: '100%' }} leftIcon={<Sparkles size={16}/>}>
                        Analyze Resume
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={() => document.getElementById('replace-file-input')?.click()} leftIcon={<RefreshCw size={14}/>}>
                      Replace
                    </Button>
                    <input id="replace-file-input" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" style={{ display: 'none' }} onChange={e => e.target.files && handleFileUpload(e.target.files[0])}/>
                    <Button variant="danger" onClick={handleDelete} leftIcon={<Trash2 size={14}/>}>
                      Delete
                    </Button>
                  </div>
                </div>) : (<div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    margin: '0 auto 1rem auto'
                }}>
                    <FileText size={24}/>
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    No Resume Uploaded
                  </h4>
                  <p className="text-body text-xs" style={{ maxWidth: '300px', margin: '0 auto' }}>
                    Upload your resume to calculate keyword alignment and compare against job postings.
                  </p>
                </div>)}
            </Card>
          </div>

          {/* Upload Drop Area & Direct Text Input */}
          <div className="col-span-6">
            <Card title={isEditingText ? "Paste Resume Text" : "Upload New Resume"} icon={<Upload size={18} className="text-primary-accent"/>} action={<Button variant="ghost" size="sm" onClick={() => setIsEditingText(!isEditingText)} leftIcon={<Edit3 size={13}/>}>
                  {isEditingText ? "Upload File" : "Paste Text"}
                </Button>}>
              {isEditingText ? (<div>
                  <textarea className="form-textarea" rows={8} placeholder="Paste the full text of your resume here (skills, education, project descriptions, achievements)..." value={textInput} onChange={(e) => setTextInput(e.target.value)} style={{ fontSize: '0.85rem' }}/>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Button variant="outline" onClick={() => setIsEditingText(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSavePastedText} isLoading={uploading} leftIcon={<Check size={14}/>}>
                      Save & Analyze Text
                    </Button>
                  </div>
                </div>) : (<div className={`dropzone ${isDragOver ? 'active' : ''}`} onDragOver={e => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop} onClick={() => document.getElementById('resume-file-input')?.click()}>
                  <input id="resume-file-input" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" style={{ display: 'none' }} onChange={e => e.target.files && handleFileUpload(e.target.files[0])}/>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                }}>
                      <Upload size={24}/>
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block', fontSize: '0.9375rem' }}>
                        Drag & drop your resume here, or <span style={{ color: 'var(--primary)' }}>browse files</span>
                      </span>
                      <span className="text-xs text-muted" style={{ marginTop: '4px', display: 'block' }}>
                        PDF or TXT • Maximum 5 MB
                      </span>
                    </div>
                    {uploading && <LoadingSpinner message="Uploading and parsing file text..."/>}
                  </div>
                </div>)}

              {resume && !isEditingText && (<div style={{
                    marginTop: '1.25rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                }}>
                  <CheckCircle2 size={16} className="text-success"/>
                  <span className="text-sm text-success" style={{ fontWeight: 600 }}>
                    Resume parsed and ready for deep evaluation.
                  </span>
                </div>)}
            </Card>
          </div>
        </div>)}
    </div>);
};
