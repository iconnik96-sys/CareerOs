import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { profileService } from '../services/profileService';
import { projectService } from '../services/projectService';
import { ROLE_SKILLS_MAP, DEFAULT_FALLBACK_SKILLS } from '../utils/careerRoles';
import { User, GraduationCap, Target, Wrench, FolderGit2, Plus, X, GitBranch, Globe, Trash2, Edit2, Save, Sparkles } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { sanitizeUrl } from '../utils/security';

// Master list of industry-standard technologies for instant suggestions
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

export const CareerProfilePage = () => {
    const { user, profile, refreshProfile } = useAuth();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [userSkills, setUserSkills] = useState([]);
    const [allDbSkills, setAllDbSkills] = useState([]);
    const [projects, setProjects] = useState([]);
    
    // Skill Autocomplete state
    const [newSkillName, setNewSkillName] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const skillInputWrapperRef = useRef(null);

    // Personal & Target State
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [degree, setDegree] = useState(profile?.degree || '');
    const [college, setCollege] = useState(profile?.college || '');
    const [graduationYear, setGraduationYear] = useState(profile?.graduation_year || 2026);
    const [targetRole, setTargetRole] = useState(profile?.target_role || '');
    const [location, setLocation] = useState(profile?.location || '');
    const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || 'Fresher / Student (0 years)');
    const [expectedSalary, setExpectedSalary] = useState(profile?.expected_salary || 1400000);
    const [bio, setBio] = useState(profile?.bio || '');

    // Project Modal State
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [editingProjectId, setEditingProjectId] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [projectDesc, setProjectDesc] = useState('');
    const [projectTech, setProjectTech] = useState('');
    const [projectGithub, setProjectGithub] = useState('');
    const [projectLive, setProjectLive] = useState('');

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setDegree(profile.degree || '');
            setCollege(profile.college || '');
            setGraduationYear(profile.graduation_year || 2026);
            setTargetRole(profile.target_role || '');
            setLocation(profile.location || '');
            setExperienceLevel(
                profile.experience_level === '0-2 years (Fresher)' || !profile.experience_level
                    ? 'Fresher / Student (0 years)'
                    : profile.experience_level
            );
            setExpectedSalary(profile.expected_salary || 1400000);
            setBio(profile.bio || '');
        }

        const loadSkillsAndProjects = async () => {
            if (!user?.id) return;
            const [skillsData, projsData, dbSkills] = await Promise.all([
                profileService.getUserSkills(user.id),
                projectService.getProjects(user.id),
                profileService.getAllSkills()
            ]);
            setUserSkills(skillsData || []);
            setProjects(projsData || []);
            setAllDbSkills(dbSkills?.map(s => s.name) || []);
        };
        loadSkillsAndProjects();
    }, [profile, user?.id]);

    // Close suggestions dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (skillInputWrapperRef.current && !skillInputWrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Combine database skills with master tech skills
    const combinedSkillPool = Array.from(new Set([...allDbSkills, ...MASTER_TECH_SKILLS]));

    // Compute live suggestions matching input query and excluding already added skills
    const existingSkillNames = new Set(
        userSkills.map(us => (us.skill?.name || '').toLowerCase().trim())
    );

    const query = newSkillName.trim().toLowerCase();
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

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!user?.id) return;
        setSaving(true);
        try {
            await profileService.updateProfile(user.id, {
                full_name: fullName,
                degree,
                college,
                graduation_year: Number(graduationYear),
                target_role: targetRole,
                location,
                experience_level: experienceLevel,
                expected_salary: Number(expectedSalary),
                bio
            });
            await refreshProfile();
            showToast('Career profile updated successfully!', 'success', 'Saved');
        } catch (err) {
            showToast(err?.message || 'Error updating profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleAddSkillName = async (skillNameToAdd) => {
        const trimmed = skillNameToAdd.trim();
        if (!trimmed || !user?.id) return;

        // Prevent duplicate addition
        if (existingSkillNames.has(trimmed.toLowerCase())) {
            showToast(`${trimmed} is already in your skills list`, 'info');
            setNewSkillName('');
            setShowSuggestions(false);
            return;
        }

        const added = await profileService.addSkillToUser(user.id, trimmed);
        if (added) {
            setUserSkills(prev => [...prev.filter(s => s.id !== added.id), added]);
            setNewSkillName('');
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
            showToast(`Added ${trimmed} to your skills! 🎉`, 'success');
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
            await handleAddSkillName(suggestions[selectedSuggestionIndex]);
        } else if (newSkillName.trim()) {
            await handleAddSkillName(newSkillName.trim());
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

    const handleRemoveSkill = async (skillId, skillName) => {
        if (!user?.id) return;
        await profileService.removeUserSkill(user.id, skillId);
        setUserSkills(prev => prev.filter(s => s.id !== skillId));
        showToast(`Removed ${skillName || 'skill'}`, 'info');
    };

    const openNewProjectModal = () => {
        setEditingProjectId(null);
        setProjectName('');
        setProjectDesc('');
        setProjectTech('');
        setProjectGithub('');
        setProjectLive('');
        setProjectModalOpen(true);
    };

    const openEditProjectModal = (proj) => {
        setEditingProjectId(proj.id);
        setProjectName(proj.name);
        setProjectDesc(proj.description || '');
        setProjectTech(proj.technologies?.join(', ') || '');
        setProjectGithub(proj.github_url || '');
        setProjectLive(proj.live_url || '');
        setProjectModalOpen(true);
    };

    const handleSaveProject = async (e) => {
        e.preventDefault();
        if (!user?.id) return;
        const techArray = projectTech.split(',').map(t => t.trim()).filter(Boolean);
        if (editingProjectId) {
            await projectService.updateProject(user.id, editingProjectId, {
                name: projectName,
                description: projectDesc,
                technologies: techArray,
                github_url: projectGithub,
                live_url: projectLive
            });
            setProjects(prev => prev.map(p => p.id === editingProjectId ? {
                ...p,
                name: projectName,
                description: projectDesc,
                technologies: techArray,
                github_url: projectGithub,
                live_url: projectLive
            } : p));
            showToast('Project updated', 'success');
        } else {
            const created = await projectService.addProject(user.id, {
                name: projectName,
                description: projectDesc,
                technologies: techArray,
                github_url: projectGithub,
                live_url: projectLive
            });
            if (created) {
                setProjects(prev => [created, ...prev]);
                showToast('Project added to portfolio', 'success');
            }
        }
        setProjectModalOpen(false);
    };

    const handleDeleteProject = async (projId) => {
        if (!user?.id) return;
        await projectService.deleteProject(user.id, projId);
        setProjects(prev => prev.filter(p => p.id !== projId));
        showToast('Project removed', 'info');
    };

    const isDropdownOpen = showSuggestions && suggestions.length > 0;

    return (<div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Career Profile</h1>
          <p className="page-subtitle">
            Manage your personal bio, target parameters, verified skills, and project portfolio.
          </p>
        </div>
        <Button variant="primary" onClick={handleSaveProfile} isLoading={saving} leftIcon={<Save size={16}/>}>
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-12">
        {/* Left Column: Personal, Education, Career Target */}
        <div className="col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Personal Information */}
          <Card title="Personal Information" icon={<User size={18} className="text-primary-accent"/>}>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Alex Rivera"/>
              <Input label="Email" value={profile?.email || user?.email || 'alex.rivera@university.edu'} disabled helperText="Synced with authentication"/>
              <Input label="Current Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Bangalore, Karnataka"/>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select className="form-select" value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                  <option value="Fresher / Student (0 years)">Fresher / Student (0 years)</option>
                  <option value="1 Year Experience">1 Year Experience</option>
                  <option value="2 Years Experience">2 Years Experience</option>
                  <option value="3-5 Years Experience (Mid-Level)">3-5 Years Experience (Mid-Level)</option>
                  <option value="5+ Years Experience (Senior)">5+ Years Experience (Senior)</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">Professional Summary / Bio</label>
              <textarea className="form-textarea" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Brief summary of your technical interests and career aspirations..."/>
            </div>
          </Card>

          {/* Education */}
          <Card title="Education" icon={<GraduationCap size={18} className="text-primary-accent"/>}>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Input label="Degree & Specialization" value={degree} onChange={e => setDegree(e.target.value)} placeholder="B.Tech in Computer Science & Engineering"/>
              </div>
              <Input label="College / Institute" value={college} onChange={e => setCollege(e.target.value)} placeholder="National Institute of Technology"/>
              <div className="form-group">
                <label className="form-label">Graduation Year</label>
                <select className="form-select" value={graduationYear} onChange={e => setGraduationYear(Number(e.target.value))}>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Career Target */}
          <Card title="Career Target" icon={<Target size={18} className="text-primary-accent"/>}>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <Input label="Target Role" value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="Java Backend Developer"/>
              <Input label="Target Annual CTC (INR)" type="number" value={expectedSalary} onChange={e => setExpectedSalary(Number(e.target.value))} placeholder="1400000" helperText={`₹${(expectedSalary / 100000).toFixed(1)} LPA`}/>
            </div>
          </Card>
        </div>

        {/* Right Column: Skills & Projects */}
        <div className="col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Skills Management with Autocomplete */}
          <Card 
            title="Skills" 
            icon={<Wrench size={18} className="text-primary-accent"/>}
            style={{ 
              position: 'relative', 
              zIndex: isDropdownOpen ? 60 : 10, 
              overflow: 'visible' 
            }}
          >
            <p className="text-body text-xs" style={{ marginBottom: '1rem' }}>
              Add technologies you are confident in discussing during technical interviews.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {userSkills.map(us => (<span key={us.id} className="skill-tag">
                  {us.skill?.name || 'Skill'}
                  <span className="skill-tag-remove" onClick={() => handleRemoveSkill(us.id, us.skill?.name)} title="Remove Skill">
                    <X size={14}/>
                  </span>
                </span>))}
              {userSkills.length === 0 && (
                <span className="text-xs text-muted">No skills added yet. Type below to add skills.</span>
              )}
            </div>

            {/* Interactive Skill Input with Live Suggestions Dropdown */}
            <div ref={skillInputWrapperRef} style={{ position: 'relative', zIndex: 100 }}>
              <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Input 
                    placeholder="Type a skill (e.g. Docker, Kafka, React...)" 
                    value={newSkillName} 
                    onChange={e => {
                        setNewSkillName(e.target.value);
                        setShowSuggestions(true);
                        setSelectedSuggestionIndex(-1);
                    }}
                    onFocus={() => {
                        if (newSkillName.trim().length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    onKeyDown={handleKeyDown}
                    style={{ marginBottom: 0 }}
                    autoComplete="off"
                  />
                </div>
                <Button type="submit" variant="secondary" leftIcon={<Plus size={16}/>}>
                  Add
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
                    maxHeight: '230px',
                    overflowY: 'auto',
                    padding: '0.35rem 0'
                }}>
                  <div style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)' }}>
                    Suggested Skills
                  </div>
                  {suggestions.map((skill, idx) => {
                      const isHighlighted = idx === selectedSuggestionIndex;
                      // Highlight matched query letters
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
                                  + Add
                              </span>
                          </div>
                      );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Projects Portfolio */}
          <Card 
            title="Projects" 
            icon={<FolderGit2 size={18} className="text-primary-accent"/>} 
            style={{ position: 'relative', zIndex: 1 }}
            action={<Button variant="secondary" size="sm" onClick={openNewProjectModal} leftIcon={<Plus size={14}/>}>
                Add Project
              </Button>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {projects.length === 0 ? (<div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No projects added yet. Add projects to boost resume score.
                </div>) : (projects.map(proj => (<div key={proj.id} style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)'
            }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {proj.name}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => openEditProjectModal(proj)} className="btn-ghost" style={{ padding: '4px', color: 'var(--text-muted)' }} title="Edit">
                          <Edit2 size={14}/>
                        </button>
                        <button onClick={() => handleDeleteProject(proj.id)} className="btn-ghost" style={{ padding: '4px', color: 'var(--danger)' }} title="Delete">
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>

                    <p className="text-body text-xs" style={{ marginBottom: '0.75rem' }}>
                      {proj.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      {proj.technologies?.map(t => (<span key={t} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                          {t}
                        </span>))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                      {proj.github_url && (<a href={sanitizeUrl(proj.github_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}>
                          <GitBranch size={13}/> Repository
                        </a>)}
                      {proj.live_url && (<a href={sanitizeUrl(proj.live_url)} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success)' }}>
                          <Globe size={13}/> Live Demo
                        </a>)}
                    </div>
                  </div>)))}
            </div>
          </Card>
        </div>
      </div>

      {/* Project Add/Edit Modal */}
      <Modal isOpen={projectModalOpen} onClose={() => setProjectModalOpen(false)} title={editingProjectId ? 'Edit Project' : 'Add Project'}>
        <form onSubmit={handleSaveProject}>
          <Input label="Project Name" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Distributed Caching Engine" required/>

          <div className="form-group">
            <label className="form-label">Description & Key Achievements</label>
            <textarea className="form-textarea" rows={3} value={projectDesc} onChange={e => setProjectDesc(e.target.value)} placeholder="Explain problem solved, architecture choices, and metrics achieved..." required/>
          </div>

          <Input label="Technologies (comma separated)" value={projectTech} onChange={e => setProjectTech(e.target.value)} placeholder="Java, Spring Boot, PostgreSQL, Docker, Redis"/>

          <Input label="GitHub Repository URL" value={projectGithub} onChange={e => setProjectGithub(e.target.value)} placeholder="https://github.com/username/project-repo"/>

          <Input label="Live Demo URL (Optional)" value={projectLive} onChange={e => setProjectLive(e.target.value)} placeholder="https://project-demo.up.railway.app"/>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="outline" onClick={() => setProjectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingProjectId ? 'Update Project' : 'Save Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
