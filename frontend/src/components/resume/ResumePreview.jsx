import React from 'react';

export const ResumePreview = React.forwardRef(({
    resumeData,
    settings = {
        template: 'classic', // 'classic' | 'modern' | 'minimal' | 'academic'
        fontSize: 10,
        lineSpacing: 1.35,
        sectionSpacing: 14,
        margins: 24,
        accentColor: '#1e3a8a'
    }
}, ref) => {
    const {
        personal = {},
        education = [],
        skills = { categories: [] },
        experience = [],
        projects = [],
        certifications = [],
        achievements = [],
        customSections = []
    } = resumeData || {};

    const {
        template = 'classic',
        fontSize = 10,
        lineSpacing = 1.35,
        sectionSpacing = 14,
        margins = 24,
        accentColor = '#1e3a8a'
    } = settings;

    // LaTeX style fonts: Computer Modern Roman / Georgia / Times New Roman serif look
    const fontFamily = template === 'modern'
        ? '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        : template === 'minimal'
            ? '"Inter", -apple-system, sans-serif'
            : '"Computer Modern Roman", "Latin Modern Roman", "Times New Roman", Times, "TeX Gyre Termes", serif';

    const headerStyle = {
        fontSize: `${fontSize * 1.8}pt`,
        fontWeight: template === 'classic' ? '700' : '800',
        color: template === 'modern' ? accentColor : '#111827',
        textTransform: template === 'classic' ? 'uppercase' : 'none',
        letterSpacing: template === 'classic' ? '1.5px' : '-0.2px',
        textAlign: template === 'modern' ? 'left' : 'center',
        margin: 0,
        lineHeight: 1.15
    };

    const sectionTitleStyle = {
        fontSize: `${fontSize * 1.15}pt`,
        fontWeight: '700',
        color: template === 'modern' ? accentColor : '#0f172a',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        borderBottom: template === 'minimal' ? '1px solid #cbd5e1' : `1px solid ${template === 'modern' ? accentColor : '#1e293b'}`,
        paddingBottom: '2px',
        marginBottom: `${sectionSpacing * 0.45}px`,
        marginTop: `${sectionSpacing}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
    };

    const subItemTitleStyle = {
        fontSize: `${fontSize * 1.02}pt`,
        fontWeight: '700',
        color: '#111827'
    };

    const subItemSubtitleStyle = {
        fontSize: `${fontSize * 0.95}pt`,
        fontStyle: template === 'classic' ? 'italic' : 'normal',
        color: '#374151'
    };

    const dateStyle = {
        fontSize: `${fontSize * 0.9}pt`,
        fontWeight: '500',
        color: '#4b5563',
        textAlign: 'right',
        whiteSpace: 'nowrap'
    };

    return (
        <div
            ref={ref}
            id="careeros-resume-preview"
            className="resume-preview-sheet"
            style={{
                width: '794px',
                minWidth: '794px',
                maxWidth: '794px',
                minHeight: '1123px',
                backgroundColor: '#ffffff',
                color: '#111827',
                fontFamily: fontFamily,
                fontSize: `${fontSize}pt`,
                lineHeight: lineSpacing,
                padding: `${margins}px`,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25), 0 8px 10px -6px rgba(0,0,0,0.2)',
                borderRadius: '4px',
                position: 'relative',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                margin: '0 auto'
            }}
        >
            {/* ============================================================== */}
            {/* HEADER / PERSONAL INFO */}
            {/* ============================================================== */}
            <div style={{ textAlign: template === 'modern' ? 'left' : 'center', marginBottom: `${sectionSpacing * 0.65}px` }}>
                <h1 style={headerStyle}>{personal.fullName || 'Candidate Name'}</h1>
                
                {personal.targetRole && (
                    <div style={{
                        fontSize: `${fontSize * 1.1}pt`,
                        fontWeight: '600',
                        color: template === 'modern' ? '#4b5563' : accentColor,
                        marginTop: '4px'
                    }}>
                        {personal.targetRole}
                    </div>
                )}

                {/* Clean Contact Bar without stray leading pipes */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: template === 'modern' ? 'flex-start' : 'center',
                    gap: '3px',
                    fontSize: `${fontSize * 0.9}pt`,
                    color: '#374151',
                    marginTop: '6px'
                }}>
                    {/* Primary Contact: Phone | Email | Location */}
                    {(() => {
                        const primaries = [
                            personal.phone && <span key="ph">{personal.phone}</span>,
                            personal.email && (
                                <a key="em" href={`mailto:${personal.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    {personal.email}
                                </a>
                            ),
                            personal.location && <span key="loc">{personal.location}</span>
                        ].filter(Boolean);

                        return primaries.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: template === 'modern' ? 'flex-start' : 'center', alignItems: 'center', gap: '8px' }}>
                                {primaries.map((node, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span style={{ color: '#9ca3af' }}>|</span>}
                                        {node}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : null;
                    })()}

                    {/* Links & Profiles: LinkedIn | GitHub | Portfolio */}
                    {(() => {
                        const links = [
                            personal.linkedin && (
                                <a key="li" href={personal.linkedin.startsWith('http') ? personal.linkedin : `https://${personal.linkedin}`} target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                                    {personal.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'linkedin.com/in/')}
                                </a>
                            ),
                            personal.github && (
                                <a key="gh" href={personal.github.startsWith('http') ? personal.github : `https://${personal.github}`} target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                                    {personal.github.replace(/^https?:\/\/(www\.)?github\.com\//, 'github.com/')}
                                </a>
                            ),
                            personal.portfolio && (
                                <a key="po" href={personal.portfolio.startsWith('http') ? personal.portfolio : `https://${personal.portfolio}`} target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>
                                    {personal.portfolio.replace(/^https?:\/\//, '')}
                                </a>
                            )
                        ].filter(Boolean);

                        return links.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: template === 'modern' ? 'flex-start' : 'center', alignItems: 'center', gap: '8px' }}>
                                {links.map((node, i) => (
                                    <React.Fragment key={i}>
                                        {i > 0 && <span style={{ color: '#9ca3af' }}>|</span>}
                                        {node}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : null;
                    })()}
                </div>
            </div>

            {/* Summary / Objective (if provided) */}
            {personal.summary && (
                <div style={{ marginBottom: `${sectionSpacing * 0.65}px` }}>
                    <div style={sectionTitleStyle}>Professional Summary</div>
                    <p style={{ margin: 0, textAlign: 'justify', color: '#1f2937' }}>
                        {personal.summary}
                    </p>
                </div>
            )}

            {/* ============================================================== */}
            {/* EDUCATION */}
            {/* ============================================================== */}
            {education && education.length > 0 && (
                <div>
                    <div style={sectionTitleStyle}>Education</div>
                    {education.map((edu, idx) => (
                        <div key={idx} style={{ marginBottom: `${sectionSpacing * 0.5}px` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={subItemTitleStyle}>{edu.institution || 'University / Institution'}</span>
                                <span style={dateStyle}>{edu.location || edu.dates || ''}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={subItemSubtitleStyle}>
                                    {edu.degree || 'Degree Program'} {edu.field ? `in ${edu.field}` : ''}
                                    {edu.gpa ? ` | CGPA/Score: ${edu.gpa}` : ''}
                                </span>
                                <span style={dateStyle}>{edu.dates || ''}</span>
                            </div>
                            {edu.details && (
                                <div style={{ fontSize: `${fontSize * 0.92}pt`, color: '#374151', marginTop: '2px' }}>
                                    {edu.details}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ============================================================== */}
            {/* TECHNICAL SKILLS */}
            {/* ============================================================== */}
            {skills?.categories && skills.categories.length > 0 && (
                <div>
                    <div style={sectionTitleStyle}>Technical Skills</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {skills.categories.map((cat, idx) => (
                            <div key={idx} style={{ fontSize: `${fontSize * 0.95}pt` }}>
                                <strong style={{ color: '#0f172a' }}>{cat.name}: </strong>
                                <span style={{ color: '#1f2937' }}>
                                    {Array.isArray(cat.items) ? cat.items.join(', ') : cat.items}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* WORK EXPERIENCE */}
            {/* ============================================================== */}
            {experience && experience.length > 0 && (
                <div>
                    <div style={sectionTitleStyle}>Experience</div>
                    {experience.map((exp, idx) => (
                        <div key={idx} style={{ marginBottom: `${sectionSpacing * 0.6}px` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={subItemTitleStyle}>
                                    {exp.role || 'Job Title'}
                                    {exp.company ? ` | ${exp.company}` : ''}
                                </span>
                                <span style={dateStyle}>{exp.dates || ''}</span>
                            </div>
                            {exp.location && (
                                <div style={{ fontSize: `${fontSize * 0.88}pt`, fontStyle: 'italic', color: '#4b5563', marginBottom: '2px' }}>
                                    {exp.location}
                                </div>
                            )}
                            {exp.bullets && exp.bullets.length > 0 && (
                                <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                                    {exp.bullets.filter(b => b && b.trim()).map((b, bIdx) => (
                                        <li key={bIdx} style={{ marginBottom: '2px', textAlign: 'justify', color: '#1f2937' }}>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ============================================================== */}
            {/* PROJECTS */}
            {/* ============================================================== */}
            {projects && projects.length > 0 && (
                <div>
                    <div style={sectionTitleStyle}>Key Projects</div>
                    {projects.map((proj, idx) => (
                        <div key={idx} style={{ marginBottom: `${sectionSpacing * 0.6}px` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={subItemTitleStyle}>
                                    {proj.title || 'Project Name'}
                                    {proj.techStack ? (
                                        <span style={{ fontWeight: 'normal', color: '#374151', fontStyle: 'italic', fontSize: `${fontSize * 0.95}pt` }}>
                                            {' '}| {proj.techStack}
                                        </span>
                                    ) : ''}
                                </span>
                                <span style={dateStyle}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        {proj.link && (
                                            <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
                                                [Code]
                                            </a>
                                        )}
                                        {proj.liveLink && (
                                            <a href={proj.liveLink.startsWith('http') ? proj.liveLink : `https://${proj.liveLink}`} target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>
                                                [Live Demo]
                                            </a>
                                        )}
                                        {proj.dates && (
                                            <span style={{ color: '#4b5563' }}>
                                                {(proj.link || proj.liveLink) ? `| ${proj.dates}` : proj.dates}
                                            </span>
                                        )}
                                    </span>
                                </span>
                            </div>
                            {proj.bullets && proj.bullets.length > 0 && (
                                <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                                    {proj.bullets.filter(b => b && b.trim()).map((b, bIdx) => (
                                        <li key={bIdx} style={{ marginBottom: '2px', textAlign: 'justify', color: '#1f2937' }}>
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ============================================================== */}
            {/* CERTIFICATIONS & LICENSES */}
            {/* ============================================================== */}
            {certifications && certifications.length > 0 && (
                <div>
                    <div style={sectionTitleStyle}>Certifications</div>
                    <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                        {certifications.map((cert, idx) => (
                            <li key={idx} style={{ marginBottom: '2px', color: '#1f2937' }}>
                                <strong>{cert.name}</strong>
                                {cert.issuer ? ` -- ${cert.issuer}` : ''}
                                {cert.date ? ` (${cert.date})` : ''}
                                {cert.link && (
                                    <span> [<a href={cert.link.startsWith('http') ? cert.link : `https://${cert.link}`} target="_blank" rel="noreferrer" style={{ color: accentColor, textDecoration: 'none' }}>Credential</a>]</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ============================================================== */}
            {/* HONORS & ACHIEVEMENTS */}
            {/* ============================================================== */}
            {achievements && achievements.length > 0 && (
                <div>
                    <div style={sectionTitleStyle}>Honors & Achievements</div>
                    <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                        {achievements.filter(a => a && a.trim()).map((ach, idx) => (
                            <li key={idx} style={{ marginBottom: '2px', color: '#1f2937' }}>
                                {ach}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ============================================================== */}
            {/* DYNAMIC CUSTOM SECTIONS */}
            {/* ============================================================== */}
            {customSections && customSections.map((cs, cIdx) => (
                <div key={cIdx}>
                    <div style={sectionTitleStyle}>{cs.title || 'Additional Section'}</div>
                    {cs.items && cs.items.length > 0 ? (
                        <ul style={{ margin: '3px 0 0 16px', padding: 0 }}>
                            {cs.items.map((it, itIdx) => (
                                <li key={itIdx} style={{ marginBottom: '2px', color: '#1f2937' }}>
                                    {it}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ margin: 0, color: '#1f2937' }}>{cs.content}</p>
                    )}
                </div>
            ))}
        </div>
    );
});

ResumePreview.displayName = 'ResumePreview';
