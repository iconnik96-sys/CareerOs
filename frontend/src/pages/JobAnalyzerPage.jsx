import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { analysisService } from '../services/analysisService';
import { applicationService } from '../services/applicationService';
import { profileService } from '../services/profileService';
import { resumeService } from '../services/resumeService';
import { Sparkles, CheckCircle2, XCircle, BarChart3, Lightbulb, Zap, BookmarkPlus, FileText } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { CircularProgress } from '../components/common/CircularProgress';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
export const JobAnalyzerPage = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [jobTitle, setJobTitle] = useState('Junior Java Backend Engineer');
    const [company, setCompany] = useState('Razorpay');
    const [location, setLocation] = useState('Bangalore, Karnataka');
    const [jobDescription, setJobDescription] = useState(`We are looking for enthusiastic freshers or early-career Java developers to join our Core Payments Infrastructure team.

Responsibilities:
- Build high-throughput microservices using Java 17, Spring Boot, and PostgreSQL.
- Implement Redis caching layers and Kafka event queues for transactions.
- Containerize services with Docker and deploy to AWS infrastructure.
- Write unit tests using JUnit and Mockito.

Requirements:
- Strong Java, OOP, Data Structures, and SQL background.
- Hands-on experience with Spring Boot REST APIs.
- Understanding of Docker, Redis, Kafka, and AWS cloud is highly preferred.`);
    const [analyzing, setAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [result, setResult] = useState(null);
    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!jobDescription.trim()) {
            showToast('Please enter a job description to analyze', 'warning');
            return;
        }
        if (!user?.id) {
            showToast('Please sign in to analyze job descriptions', 'warning');
            return;
        }
        setAnalyzing(true);
        setErrorMsg(null);
        try {
            const [userSkillsData, resumeData] = await Promise.all([
                profileService.getUserSkills(user.id),
                resumeService.getResume(user.id)
            ]);
            const userSkillNames = userSkillsData.map(s => s.skill?.name || '').filter(Boolean);
            const analysisResult = await analysisService.analyzeJobDescription(userSkillNames, jobTitle, company, jobDescription, resumeData?.parsed_text || '', jobTitle);
            setResult(analysisResult);
            showToast(`Calculated ${analysisResult.match_score}% match score!`, 'success');
        }
        catch (err) {
            console.error('Job match analysis failed:', err);
            const msg = err?.message || 'Failed to analyze job description. Please ensure the AI backend is running and GROQ_API_KEY is set.';
            setErrorMsg(msg);
            showToast(msg, 'error', 'Analysis Error');
        }
        finally {
            setAnalyzing(false);
        }
    };
    const handleTrackAsApplication = async () => {
        if (!user?.id)
            return;
        await applicationService.addApplication(user.id, {
            company,
            role: jobTitle,
            location,
            status: 'SAVED',
            applied_at: new Date().toISOString(),
            notes: `Analyzed with CareerOS. Match score: ${result?.match_score || 78}%. Missing skills: ${result?.missing_skills?.join(', ')}`
        });
        showToast('Saved to Applications Kanban board!', 'success');
        navigate('/applications');
    };
    const samplePresets = [
        {
            title: 'Swiggy - Backend SWE',
            role: 'Graduate Software Engineer (Backend)',
            company: 'Swiggy',
            desc: 'Looking for freshers skilled in Java, Spring Boot, Redis caching, Kafka message broker, and AWS cloud deployment for our delivery logistics team.'
        },
        {
            title: 'Postman - Python/FastAPI',
            role: 'Junior Backend Developer',
            company: 'Postman',
            desc: 'Seeking engineers with Python, FastAPI, PostgreSQL, Docker, and REST APIs to help scale developer testing platforms.'
        }
    ];
    return (<div className="page-container">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-purple">
              <Sparkles size={12}/> AI Skill-Gap Engine
            </span>
          </div>
          <h1 className="page-title">Job Analyzer</h1>
          <p className="page-subtitle">
            Paste a job description and CareerOS will compare it against your profile and resume.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12" style={{ gap: '1.5rem' }}>
        {/* Left Column: Job Description Input Form */}
        <div className="col-span-6">
          <Card title="Job Description Input" icon={<FileText size={18} className="text-primary-accent"/>}>
            {/* Presets */}
            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="text-xs text-muted" style={{ fontWeight: 600 }}>Try Sample JD:</span>
              {samplePresets.map(preset => (<button key={preset.title} type="button" onClick={() => {
                setJobTitle(preset.role);
                setCompany(preset.company);
                setJobDescription(preset.desc);
            }} className="badge badge-neutral" style={{ cursor: 'pointer' }}>
                  <Zap size={11} className="text-warning"/> {preset.title}
                </button>))}
            </div>

            <form onSubmit={handleAnalyze}>
              <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
                <Input label="Job Title" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Java Backend Developer" required/>
                <Input label="Company Name" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Razorpay" required/>
              </div>

              <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bangalore / Remote"/>

              <div className="form-group">
                <label className="form-label">Job Description (JD)</label>
                <textarea className="form-textarea" rows={8} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the full job description and requirements here..." required/>
              </div>

              <Button type="submit" variant="primary" isLoading={analyzing} style={{ width: '100%', marginTop: '0.5rem' }} leftIcon={<Sparkles size={16}/>}>
                Analyze Job
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: AI Analysis Results */}
        <div className="col-span-6">
          {!result && !analyzing ? (<Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                margin: '0 auto 1.25rem auto'
            }}>
                <Sparkles size={28}/>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Ready to Analyze
              </h3>
              <p className="text-body text-sm" style={{ maxWidth: '340px', margin: '0 auto 1.5rem auto' }}>
                Click <strong>Analyze Job</strong> to calculate matching skills, discover critical missing technologies, and generate a customized preparation plan.
              </p>
            </Card>) : analyzing ? (<Card style={{ padding: '3.5rem 1.5rem' }}>
              <div className="loading-spinner" style={{ width: 36, height: 36, margin: '0 auto 1rem auto', display: 'block' }}/>
              <div style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
                Comparing requirements with your profile...
              </div>
              <p className="text-body text-xs" style={{ textAlign: 'center', marginTop: '4px' }}>
                Evaluating stack overlap, database requirements, and infrastructure expectations.
              </p>
            </Card>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Match Score & Action Header */}
              <Card>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <CircularProgress percentage={result.match_score} size={110} strokeWidth={9} label="Match"/>
                    <div>
                      <span className="text-xs text-muted" style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                        Your Match Result
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {result.match_score}% Match Score
                      </h3>
                      <span className="badge badge-success" style={{ marginTop: '4px' }}>
                        Strong Baseline for {company}
                      </span>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={handleTrackAsApplication} leftIcon={<BookmarkPlus size={16}/>}>
                    Track Application
                  </Button>
                </div>
              </Card>

              {/* Skills You Have vs Missing Skills */}
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                {/* Matching Skills */}
                <Card title="Skills You Have" icon={<CheckCircle2 size={16} className="text-success"/>}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {result.matching_skills?.map((sk) => (<div key={sk} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        <CheckCircle2 size={15} className="text-success"/>
                        <span style={{ fontWeight: 600 }}>{sk}</span>
                      </div>))}
                  </div>
                </Card>

                {/* Missing Skills */}
                <Card title="Missing Skills" icon={<XCircle size={16} className="text-danger"/>}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {result.missing_skills?.length === 0 ? (<span className="text-xs text-success">All detected skills match!</span>) : (result.missing_skills?.map((sk) => (<div key={sk} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--danger)' }}>
                          <XCircle size={15} className="text-danger"/>
                          <span style={{ fontWeight: 600 }}>{sk}</span>
                        </div>)))}
                  </div>
                </Card>
              </div>

              {/* Skill Breakdown Chart */}
              <Card title="Skill Breakdown (Recharts)" icon={<BarChart3 size={18} className="text-primary-accent"/>}>
                <div style={{ height: 160, width: '100%', marginTop: '0.5rem' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.skill_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 11 }}/>
                      <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }}/>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={(val) => [`${val}%`, 'Proficiency']}/>
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {result.skill_breakdown?.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#3b82f6' : '#f59e0b'}/>))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Recommendations */}
              <Card title="Recommendations" icon={<Lightbulb size={18} className="text-primary-accent"/>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {result.recommendations?.map((rec, idx) => (<div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{idx + 1}.</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{rec}</span>
                    </div>))}
                </div>

                {/* Estimated Improvement Note */}
                <div style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
            }}>
                  <div>
                    <div className="text-xs text-muted" style={{ fontWeight: 600 }}>ESTIMATED IMPROVEMENT</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                      Current readiness: <strong>{result.current_readiness}%</strong> → After addressing major gaps: <strong style={{ color: 'var(--success)' }}>~{result.estimated_readiness_after_gap}%</strong>
                    </div>
                  </div>
                  <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>
                    * Clearly labeled as an estimate
                  </span>
                </div>
              </Card>
            </div>)}
        </div>
      </div>
    </div>);
};
