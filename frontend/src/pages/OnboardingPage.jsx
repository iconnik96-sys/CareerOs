import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { profileService } from '../services/profileService';
import { resumeService } from '../services/resumeService';
import { aiFastApiService } from '../services/aiFastApiService';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Upload, FileText, Plus, Briefcase, MapPin, GraduationCap, Wrench, X } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { TARGET_ROLES, ROLE_SKILLS_MAP, DEFAULT_FALLBACK_SKILLS, calculateCareerReadiness } from '../utils/careerRoles';

// Master list of industry-standard technologies for instant autocomplete suggestions
const MASTER_TECH_SKILLS = Array.from(new Set([
    ...DEFAULT_FALLBACK_SKILLS,
    ...Object.values(ROLE_SKILLS_MAP).flat(),
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'SQL', 'HTML/CSS', 'Bash', 'R',
    'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Tailwind CSS', 'Redux', 'Zustand', 'HTML5', 'CSS3', 'Sass', 'Webpack', 'Vite', 'GraphQL',
    'Node.js', 'Express.js', 'Spring Boot', 'FastAPI', 'Django', 'Flask', 'NestJS', 'ASP.NET Core', 'Laravel', 'Ruby on Rails', 'REST APIs', 'gRPC', 'WebSockets', 'Microservices',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Cassandra', 'DynamoDB', 'Supabase', 'Firebase', 'Prisma', 'Hibernate', 'SQLAlchemy',
    'Docker', 'Kubernetes', 'AWS', 'Google Cloud (GCP)', 'Azure', 'CI/CD', 'GitHub Actions', 'Terraform', 'Linux', 'Nginx', 'Prometheus', 'Grafana', 'Ansible', 'ArgoCD',
    'Apache Kafka', 'RabbitMQ', 'Apache Spark', 'Airflow',
    'Wireshark', 'Nmap', 'Burp Suite', 'OWASP Top 10', 'SIEM & SOC', 'Network Security', 'Penetration Testing', 'Cryptography', 'Linux Security', 'Incident Response', 'Wazuh', 'Splunk',
    'Pandas', 'NumPy', 'Scikit-Learn', 'PyTorch', 'TensorFlow', 'Power BI', 'Tableau', 'Excel', 'Data Analysis', 'Deep Learning', 'Machine Learning', 'NLP', 'LLMs', 'LangChain', 'Computer Vision',
    'Git', 'GitHub', 'GitLab', 'Postman', 'JUnit', 'Mockito', 'Jest', 'Cypress', 'Playwright', 'Vitest', 'Jira', 'Agile / Scrum', 'System Design', 'Data Structures & Algorithms'
]));

export const OnboardingPage = () => {
    const [step, setStep] = useState(1);
    const { user, profile, refreshProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    // Form State - Clean initialization without inheriting previous account data
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || profile?.full_name || '');
    const [degree, setDegree] = useState(profile?.degree || '');
    const [college, setCollege] = useState(profile?.college || '');
    const [gradYear, setGradYear] = useState(profile?.graduation_year || 2026);
    const [targetRole, setTargetRole] = useState(profile?.target_role || '');
    const [location, setLocation] = useState(profile?.location || '');
    const [remotePref, setRemotePref] = useState(profile?.remote_preference || 'Hybrid');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [dbSkillsList, setDbSkillsList] = useState([]);
    const [customSkill, setCustomSkill] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const customSkillInputRef = useRef(null);

    const [resumeFile, setResumeFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loadingAiSkills, setLoadingAiSkills] = useState(false);

    // Ensure pristine clean form state when authenticated user changes or for fresh onboarding
    useEffect(() => {
        if (!profile?.onboarding_completed) {
            setFullName(user?.user_metadata?.full_name || profile?.full_name || '');
            setDegree(profile?.degree || '');
            setCollege(profile?.college || '');
            setGradYear(profile?.graduation_year || 2026);
            setTargetRole(profile?.target_role || '');
            setLocation(profile?.location || '');
            setRemotePref(profile?.remote_preference || 'Hybrid');
            setSelectedSkills([]);
            setResumeFile(null);
        }

        profileService.getAllSkills().then(skills => {
            if (skills && Array.isArray(skills)) {
                setDbSkillsList(skills.map(s => s.name));
            }
        }).catch(() => {});
    }, [user?.id, profile?.id]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customSkillInputRef.current && !customSkillInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Dynamically update available skills whenever targetRole changes
    useEffect(() => {
        const roleSkills = targetRole ? (ROLE_SKILLS_MAP[targetRole] || DEFAULT_FALLBACK_SKILLS) : DEFAULT_FALLBACK_SKILLS;
        const combined = Array.from(new Set([...roleSkills, ...selectedSkills]));
        setAvailableSkills(combined);
    }, [targetRole]);

    // Combine database skills with master skills
    const combinedSkillPool = Array.from(new Set([...dbSkillsList, ...MASTER_TECH_SKILLS]));

    // Compute live suggestions matching input query and excluding already selected skills
    const existingSkillNames = new Set(selectedSkills.map(s => s.toLowerCase().trim()));
    const query = customSkill.trim().toLowerCase();
    const suggestions = query.length > 0
        ? combinedSkillPool
            .filter(skill => {
                const lower = skill.toLowerCase();
                return lower.includes(query) && !existingSkillNames.has(lower);
            })
            .sort((a, b) => {
                const aLower = a.toLowerCase();
                const bLower = b.toLowerCase();
                const aStarts = aLower.startsWith(query);
                const bStarts = bLower.startsWith(query);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.localeCompare(b);
            })
            .slice(0, 8)
        : [];

    const handleFetchAiSkills = async () => {
        if (!targetRole) {
            showToast('Please select a target role in Step 2 first', 'warning');
            return;
        }
        setLoadingAiSkills(true);
        try {
            const aiSkills = await aiFastApiService.suggestRoleSkills(targetRole);
            if (aiSkills && aiSkills.length > 0) {
                setAvailableSkills(prev => Array.from(new Set([...prev, ...aiSkills])));
                showToast(`Generated ${aiSkills.length} AI skills for ${targetRole}!`, 'success');
            }
        }
        catch (err) {
            console.warn('AI skill suggestion error:', err);
            showToast('Could not fetch AI skills. Using role presets.', 'info');
        }
        finally {
            setLoadingAiSkills(false);
        }
    };

    const toggleSkill = (skill) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skill));
        }
        else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    const handleAddSkillName = (skillNameToAdd) => {
        const trimmed = skillNameToAdd.trim();
        if (!trimmed) return;

        if (!availableSkills.includes(trimmed)) {
            setAvailableSkills(prev => [...prev, trimmed]);
        }
        if (!selectedSkills.includes(trimmed)) {
            setSelectedSkills(prev => [...prev, trimmed]);
            showToast(`Added and selected "${trimmed}"`, 'success');
        }
        setCustomSkill('');
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
    };

    const handleAddCustomSkill = (e) => {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
            handleAddSkillName(suggestions[selectedSuggestionIndex]);
        } else if (customSkill.trim()) {
            handleAddSkillName(customSkill.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
        }
    };

    const handleRemoveSelectedSkill = (skill) => {
        setSelectedSkills(prev => prev.filter(s => s !== skill));
    };

    const handleNextStep = () => {
        if (step === 1) {
            if (!fullName.trim()) {
                showToast('Please enter your full name', 'warning');
                return;
            }
        }
        else if (step === 2) {
            if (!targetRole) {
                showToast('Please select your target role', 'warning');
                return;
            }
        }
        else if (step === 3) {
            if (!location.trim()) {
                showToast('Please enter your preferred location', 'warning');
                return;
            }
        }
        else if (step === 4) {
            if (selectedSkills.length === 0) {
                showToast('Please select at least one skill or add custom skills', 'warning');
                return;
            }
        }
        setStep(step + 1);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'application/pdf') {
                showToast('Please upload a PDF format resume', 'warning');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast('Resume size must be under 5 MB', 'warning');
                return;
            }
            setResumeFile(file);
            showToast(`Selected ${file.name}`, 'info');
        }
    };

    const handleFinish = async () => {
        if (!user?.id) {
            showToast('Please sign in or create an account to finish onboarding', 'warning');
            navigate('/register');
            return;
        }
        setUploading(true);
        const userId = user.id;
        try {
            const computedReadiness = calculateCareerReadiness(
                selectedSkills,
                targetRole,
                { full_name: fullName, degree, college, location, target_role: targetRole },
                { hasResume: Boolean(resumeFile) }
            );

            // 1. Update profile
            await profileService.updateProfile(userId, {
                full_name: fullName,
                degree,
                college,
                graduation_year: Number(gradYear),
                target_role: targetRole,
                location,
                remote_preference: remotePref,
                career_readiness: computedReadiness,
                onboarding_completed: true
            });

            // 2. Add skills
            for (const sk of selectedSkills) {
                await profileService.addSkillToUser(userId, sk);
            }

            // 3. Upload resume if selected
            if (resumeFile) {
                await resumeService.uploadResume(userId, resumeFile);
            }

            await refreshProfile();
            showToast('Career profile setup completed! Welcome to CareerOS.', 'success', 'Setup Complete');
            navigate('/dashboard');
        }
        catch (err) {
            showToast(err?.message || 'Error completing profile setup', 'error');
        }
        finally {
            setUploading(false);
        }
    };

    const isDropdownOpen = showSuggestions && suggestions.length > 0;

    return (<div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem'
        }}>
      {/* Top Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <div className="brand-logo-icon">
          <Sparkles size={20}/>
        </div>
        <span className="brand-name" style={{ fontSize: '1.35rem' }}>CareerOS</span>
      </div>

      <div className="card" style={{ maxWidth: '640px', width: '100%', padding: '2.25rem', overflow: 'visible', position: 'relative' }}>
        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          {[1, 2, 3, 4, 5].map(s => (<div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 5 ? 1 : 'none' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: step === s ? 'var(--primary)' : step > s ? 'var(--success)' : 'var(--bg-tertiary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8125rem',
                boxShadow: step === s ? '0 0 12px rgba(59, 130, 246, 0.5)' : undefined
            }}>
                {step > s ? <CheckCircle2 size={16}/> : s}
              </div>
              {s < 5 && (<div style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: step > s ? 'var(--success)' : 'var(--border-color)',
                    margin: '0 8px'
                }}/>)}
            </div>))}
        </div>

        {/* Step 1: Tell us about yourself */}
        {step === 1 && (<div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <GraduationCap className="text-primary-accent" size={22}/>
              <h2 className="text-h3">Tell us about yourself</h2>
            </div>
            <p className="text-body text-sm" style={{ marginBottom: '1.5rem' }}>
              Let's personalize your career benchmarks based on your educational background.
            </p>

            <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
              <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Alex Rivera" autoComplete="off" autoCorrect="off" autoCapitalize="words" spellCheck="false" required/>

              <Input label="Degree / Major" value={degree} onChange={e => setDegree(e.target.value)} placeholder="e.g. B.Tech Computer Science & Engineering" autoComplete="off" autoCorrect="off" spellCheck="false" required/>

              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <Input label="College / University" value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. National Institute of Technology" autoComplete="off" autoCorrect="off" spellCheck="false" required/>
                <div className="form-group">
                  <label className="form-label">Graduation Year</label>
                  <select className="form-select" value={gradYear} onChange={e => setGradYear(Number(e.target.value))} autoComplete="off">
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                  </select>
                </div>
              </div>
            </form>
          </div>)}

        {/* Step 2: What role are you targeting? */}
        {step === 2 && (<div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Briefcase className="text-primary-accent" size={22}/>
              <h2 className="text-h3">What role are you targeting?</h2>
            </div>
            <p className="text-body text-sm" style={{ marginBottom: '1.5rem' }}>
              CareerOS will build your skill-gap analysis and roadmap specifically for this role.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
              {TARGET_ROLES.map(role => {
                const isSelected = targetRole === role;
                return (<div key={role} onClick={() => setTargetRole(role)} style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {role}
                    </span>
                    {isSelected && <CheckCircle2 size={18} className="text-primary-accent"/>}
                  </div>);
            })}
            </div>
          </div>)}

        {/* Step 3: Where do you want to work? */}
        {step === 3 && (<div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <MapPin className="text-primary-accent" size={22}/>
              <h2 className="text-h3">Where do you want to work?</h2>
            </div>
            <p className="text-body text-sm" style={{ marginBottom: '1.5rem' }}>
              Set your target location and working mode preferences for placement matches.
            </p>

            <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleNextStep(); }}>
              <Input label="Preferred Locations" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Bangalore, Hyderabad, Pune, Mumbai, Remote" autoComplete="off" autoCorrect="off" spellCheck="false"/>
            </form>

            <div className="form-group" style={{ marginTop: '1.25rem' }}>
              <label className="form-label">Workplace Model Preference</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '0.4rem' }}>
                {['Hybrid', 'Remote', 'Onsite', 'Flexible'].map(mode => (<button key={mode} type="button" onClick={() => setRemotePref(mode)} style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${remotePref === mode ? 'var(--primary)' : 'var(--border-color)'}`,
                    backgroundColor: remotePref === mode ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                    color: remotePref === mode ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem'
                }}>
                    {mode}
                  </button>))}
              </div>
            </div>
          </div>)}

        {/* Step 4: What skills do you currently have? */}
        {step === 4 && (<div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench className="text-primary-accent" size={22}/>
                <h2 className="text-h3">What skills do you currently have?</h2>
              </div>
              {targetRole && (<Button type="button" variant="outline" size="sm" onClick={handleFetchAiSkills} isLoading={loadingAiSkills} leftIcon={<Sparkles size={14} className="text-primary-accent"/>}>
                  AI Suggest More Skills
                </Button>)}
            </div>
            <p className="text-body text-sm" style={{ marginBottom: '1.25rem' }}>
              {targetRole ? (<>Showing recommended technologies for <strong style={{ color: 'var(--primary)' }}>{targetRole}</strong>. Select the ones you've worked with or add custom skills.</>) : (<>Select all technologies you've worked with in college, side projects, or internships.</>)}
            </p>

            {/* Selected Skills Summary */}
            {selectedSkills.length > 0 && (<div style={{
                    marginBottom: '1.25rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: 'var(--radius-md)'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)' }}>
                    Your Selected Skills ({selectedSkills.length})
                  </span>
                  <button type="button" onClick={() => setSelectedSkills([])} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                    Clear all
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedSkills.map(sk => (<span key={sk} className="badge badge-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      {sk}
                      <X size={12} style={{ cursor: 'pointer' }} onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSelectedSkill(sk);
                    }}/>
                    </span>))}
                </div>
              </div>)}

            {/* Available Skills Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {availableSkills.map(sk => {
                const isSelected = selectedSkills.includes(sk);
                return (<button key={sk} type="button" onClick={() => toggleSkill(sk)} className={`skill-tag ${isSelected ? 'badge-primary' : ''}`} style={{
                        cursor: 'pointer',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        padding: '0.45rem 0.85rem'
                    }}>
                    {isSelected ? <CheckCircle2 size={14}/> : <Plus size={14}/>}
                    {sk}
                  </button>);
            })}
            </div>

            {/* Custom Skill Input Form with Autocomplete Dropdown */}
            <div ref={customSkillInputRef} style={{ position: 'relative', zIndex: 100 }}>
              <form onSubmit={handleAddCustomSkill} autoComplete="off" style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Input 
                    placeholder="Type any skill (e.g. Docker, Kafka, PyTorch, C++...)" 
                    value={customSkill} 
                    onChange={e => {
                        setCustomSkill(e.target.value);
                        setShowSuggestions(true);
                        setSelectedSuggestionIndex(-1);
                    }}
                    onFocus={() => {
                        if (customSkill.trim().length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    autoComplete="off" 
                    style={{ marginBottom: 0 }}
                  />
                </div>
                <Button type="submit" variant="secondary" leftIcon={<Plus size={16}/>}>
                  Add Skill
                </Button>
              </form>

              {/* Suggestions Floating Menu */}
              {isDropdownOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    right: 0,
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 20px 30px -5px rgba(0, 0, 0, 0.8), 0 10px 10px -5px rgba(0, 0, 0, 0.6)',
                    zIndex: 99999,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '0.35rem 0'
                }}>
                  <div style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)' }}>
                    Suggested Skills
                  </div>
                  {suggestions.map((skill, idx) => {
                      const isHighlighted = idx === selectedSuggestionIndex;
                      const matchIdx = skill.toLowerCase().indexOf(query);
                      let content = skill;
                      if (matchIdx >= 0) {
                          const before = skill.slice(0, matchIdx);
                          const match = skill.slice(matchIdx, matchIdx + query.length);
                          const after = skill.slice(matchIdx + query.length);
                          content = (
                              <span>
                                  {before}
                                  <strong style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{match}</strong>
                                  {after}
                              </span>
                          );
                      }

                      return (
                          <div
                              key={skill}
                              onClick={() => handleAddSkillName(skill)}
                              onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                              style={{
                                  padding: '0.55rem 0.85rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                  color: isHighlighted ? '#60a5fa' : 'var(--text-primary)',
                                  transition: 'background-color 0.1s ease'
                              }}
                          >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Sparkles size={13} style={{ color: isHighlighted ? '#60a5fa' : 'var(--text-muted)' }} />
                                  <span>{content}</span>
                              </div>
                              <span className="badge badge-neutral text-xs" style={{ fontSize: '0.6875rem', padding: '2px 6px' }}>
                                  + Select
                              </span>
                          </div>
                      );
                  })}
                </div>
              )}
            </div>
          </div>)}

        {/* Step 5: Upload your resume */}
        {step === 5 && (<div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FileText className="text-primary-accent" size={22}/>
              <h2 className="text-h3">Upload your resume</h2>
            </div>
            <p className="text-body text-sm" style={{ marginBottom: '1.5rem' }}>
              Upload your PDF resume to generate instant ATS keyword scores and project recommendations.
            </p>

            <label className="dropzone" style={{ display: 'block' }}>
              <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} style={{ display: 'none' }}/>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
            }}>
                  <Upload size={22}/>
                </div>
                {resumeFile ? (<div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                      {resumeFile.name}
                    </span>
                    <span className="text-xs text-success" style={{ marginTop: '2px', display: 'block' }}>
                      {(resumeFile.size / 1024).toFixed(1)} KB • PDF Ready for AI analysis
                    </span>
                  </div>) : (<div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                      Drag & drop your resume here, or <span style={{ color: 'var(--primary)' }}>browse</span>
                    </span>
                    <span className="text-xs text-muted" style={{ marginTop: '4px', display: 'block' }}>
                      PDF only • Maximum 5 MB
                    </span>
                  </div>)}
              </div>
            </label>

            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
            }}>
              <CheckCircle2 size={20} className="text-success"/>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  You're ready.
                </div>
                <div className="text-body text-xs">
                  Let's build your personalized career roadmap and dashboard.
                </div>
              </div>
            </div>
          </div>)}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', position: 'relative', zIndex: 1 }}>
          {step > 1 ? (<Button variant="ghost" onClick={() => setStep(step - 1)} leftIcon={<ArrowLeft size={16}/>}>
              Back
            </Button>) : (<div />)}

          {step < 5 ? (<Button variant="primary" onClick={handleNextStep} rightIcon={<ArrowRight size={16}/>}>
              Continue
            </Button>) : (<Button variant="primary" onClick={handleFinish} isLoading={uploading} rightIcon={<ArrowRight size={16}/>}>
              Go to Dashboard
            </Button>)}
        </div>
      </div>
    </div>);
};
