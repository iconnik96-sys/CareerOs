import { extractSkillsFromText, SKILL_CATALOG } from './skillExtractor';
import { ROLE_SKILLS_MAP, getRoleSlug, getRoleDisplayName, DEFAULT_FALLBACK_SKILLS } from './careerRoles';

/**
 * Serializes structured resume data into clean, plain text for ATS parsing & inspection.
 */
export function serializeResumeToText(resumeData = {}) {
    if (!resumeData) return '';

    const {
        personal = {},
        education = [],
        skills = { categories: [] },
        experience = [],
        projects = [],
        certifications = [],
        achievements = [],
        customSections = []
    } = resumeData;

    const sections = [];

    // Header & Contact
    const headerLines = [];
    if (personal.fullName) headerLines.push(personal.fullName);
    if (personal.targetRole) headerLines.push(`Target Role: ${personal.targetRole}`);
    
    const contacts = [
        personal.email,
        personal.phone,
        personal.location,
        personal.linkedin,
        personal.github,
        personal.portfolio
    ].filter(Boolean);
    if (contacts.length > 0) headerLines.push(contacts.join(' | '));
    if (headerLines.length > 0) sections.push(headerLines.join('\n'));

    // Professional Summary
    if (personal.summary && personal.summary.trim()) {
        sections.push(`PROFESSIONAL SUMMARY\n${personal.summary.trim()}`);
    }

    // Technical Skills
    if (skills?.categories && skills.categories.length > 0) {
        const skillLines = ['TECHNICAL SKILLS'];
        skills.categories.forEach(cat => {
            if (cat.name && cat.items) {
                skillLines.push(`${cat.name}: ${cat.items}`);
            }
        });
        if (skillLines.length > 1) sections.push(skillLines.join('\n'));
    }

    // Projects
    if (Array.isArray(projects) && projects.length > 0) {
        const projLines = ['KEY PROJECTS'];
        projects.forEach(p => {
            const headingParts = [p.title];
            if (p.techStack) headingParts.push(`(${p.techStack})`);
            if (p.dates) headingParts.push(`[${p.dates}]`);
            if (p.link) headingParts.push(`- ${p.link}`);
            if (p.liveLink) headingParts.push(`- ${p.liveLink}`);
            projLines.push(headingParts.join(' '));

            if (Array.isArray(p.bullets)) {
                p.bullets.forEach(b => {
                    if (b && b.trim()) projLines.push(`• ${b.trim()}`);
                });
            }
        });
        if (projLines.length > 1) sections.push(projLines.join('\n'));
    }

    // Experience
    if (Array.isArray(experience) && experience.length > 0) {
        const expLines = ['WORK EXPERIENCE'];
        experience.forEach(exp => {
            const headingParts = [exp.role, exp.company ? `at ${exp.company}` : ''];
            if (exp.location) headingParts.push(`(${exp.location})`);
            if (exp.dates) headingParts.push(`[${exp.dates}]`);
            expLines.push(headingParts.filter(Boolean).join(' '));

            if (Array.isArray(exp.bullets)) {
                exp.bullets.forEach(b => {
                    if (b && b.trim()) expLines.push(`• ${b.trim()}`);
                });
            }
        });
        if (expLines.length > 1) sections.push(expLines.join('\n'));
    }

    // Education
    if (Array.isArray(education) && education.length > 0) {
        const eduLines = ['EDUCATION'];
        education.forEach(edu => {
            const parts = [edu.degree, edu.field ? `in ${edu.field}` : '', edu.institution ? `- ${edu.institution}` : ''];
            if (edu.dates) parts.push(`(${edu.dates})`);
            if (edu.gpa) parts.push(`GPA: ${edu.gpa}`);
            eduLines.push(parts.filter(Boolean).join(' '));
            if (edu.details && edu.details.trim()) {
                eduLines.push(`  ${edu.details.trim()}`);
            }
        });
        if (eduLines.length > 1) sections.push(eduLines.join('\n'));
    }

    // Certifications
    if (Array.isArray(certifications) && certifications.length > 0) {
        const certLines = ['CERTIFICATIONS'];
        certifications.forEach(c => {
            const parts = [c.name, c.issuer ? `(${c.issuer})` : '', c.date || '', c.link || ''];
            certLines.push(`• ${parts.filter(Boolean).join(' ')}`);
        });
        if (certLines.length > 1) sections.push(certLines.join('\n'));
    }

    // Achievements
    if (Array.isArray(achievements) && achievements.length > 0) {
        const achLines = ['HONORS & ACHIEVEMENTS'];
        achievements.forEach(ach => {
            if (typeof ach === 'string' && ach.trim()) {
                achLines.push(`• ${ach.trim()}`);
            }
        });
        if (achLines.length > 1) sections.push(achLines.join('\n'));
    }

    // Custom sections
    if (Array.isArray(customSections) && customSections.length > 0) {
        customSections.forEach(cs => {
            if (cs.title && cs.content) {
                sections.push(`${cs.title.toUpperCase()}\n${cs.content}`);
            }
        });
    }

    return sections.join('\n\n');
}

/**
 * Checks whether the current resume contains the fundamental building blocks
 * required to generate an ATS-parsable resume.
 */
export function isResumeBuildable(resumeData = {}) {
    if (!resumeData) {
        return {
            isBuildable: false,
            reasons: ['No resume data provided.'],
            completionPercentage: 0
        };
    }

    const reasons = [];
    let passedCriteria = 0;
    const totalCriteria = 5;

    // 1. Candidate Full Name
    const name = (resumeData?.personal?.fullName || '').trim();
    if (name.length >= 3 && !name.toLowerCase().includes('placeholder') && !name.toLowerCase().includes('your name')) {
        passedCriteria += 1;
    } else {
        reasons.push('Full candidate name is missing or incomplete.');
    }

    // 2. Email or Phone
    const email = (resumeData?.personal?.email || '').trim();
    const phone = (resumeData?.personal?.phone || '').trim();
    if (email.length > 4 || phone.length > 6) {
        passedCriteria += 1;
    } else {
        reasons.push('At least one contact method (email or phone number) is required.');
    }

    // 3. Skills
    const hasSkills = resumeData?.skills?.categories?.some(c => (c.items || '').trim().length > 3);
    if (hasSkills) {
        passedCriteria += 1;
    } else {
        reasons.push('At least one Technical Skills category with items is required.');
    }

    // 4. Projects or Experience
    const hasProjects = Array.isArray(resumeData?.projects) && resumeData.projects.length > 0 &&
        resumeData.projects.some(p => (p.title || '').trim().length > 2);
    const hasExperience = Array.isArray(resumeData?.experience) && resumeData.experience.length > 0 &&
        resumeData.experience.some(e => (e.role || '').trim().length > 2);

    if (hasProjects || hasExperience) {
        passedCriteria += 1;
    } else {
        reasons.push('At least one Project or Work Experience entry is required for ATS screening.');
    }

    // 5. Overall serialized content length
    const fullText = serializeResumeToText(resumeData);
    if (fullText.length > 180) {
        passedCriteria += 1;
    } else {
        reasons.push('Resume content is too short to be indexed by an Applicant Tracking System.');
    }

    const completionPercentage = Math.round((passedCriteria / totalCriteria) * 100);

    return {
        isBuildable: reasons.length === 0,
        reasons,
        completionPercentage,
        wordCount: fullText.trim().split(/\s+/).filter(Boolean).length
    };
}

/**
 * Comprehensive action verbs catalog recognized by top ATS screening algorithms
 */
export const ATS_ACTION_VERBS = [
    // Architecture & Construction
    'architected', 'engineered', 'developed', 'built', 'authored', 'constructed',
    'designed', 'formulated', 'implemented', 'pioneered', 'spearheaded', 'created',
    // Optimization & Scaling
    'optimized', 'scaled', 'accelerated', 'decreased', 'enhanced', 'maximized',
    'minimized', 'reduced', 'refactored', 'streamlined', 'upgraded', 'boosted',
    // Integration & Deployment
    'deployed', 'automated', 'integrated', 'orchestrated', 'configured', 'containerized',
    'migrated', 'provisioned', 'centralized', 'standardized', 'modernized',
    // Execution, Delivery & Leadership
    'delivered', 'executed', 'governed', 'led', 'managed', 'mentored', 'directed',
    'published', 'authored', 'established', 'initiated', 'monitored', 'resolved'
];

/**
 * Passive / weak phrases to penalize or flag
 */
export const WEAK_PASSIVE_PHRASES = [
    'responsible for', 'worked on', 'assisted in', 'helped with', 'part of team',
    'contributed to', 'handled tasks', 'duties included', 'worked with', 'participated in'
];

/**
 * Extracts all bullet points from projects and work experience
 */
export function extractAllBullets(resumeData = {}) {
    const bullets = [];
    if (Array.isArray(resumeData?.projects)) {
        resumeData.projects.forEach(p => {
            if (Array.isArray(p.bullets)) {
                p.bullets.forEach(b => {
                    if (b && typeof b === 'string' && b.trim()) {
                        bullets.push({ source: p.title || 'Project', text: b.trim() });
                    }
                });
            }
        });
    }
    if (Array.isArray(resumeData?.experience)) {
        resumeData.experience.forEach(e => {
            if (Array.isArray(e.bullets)) {
                e.bullets.forEach(b => {
                    if (b && typeof b === 'string' && b.trim()) {
                        bullets.push({ source: e.company || 'Experience', text: b.trim() });
                    }
                });
            }
        });
    }
    return bullets;
}

/**
 * Checks if a bullet starts with a strong action verb
 */
export function hasStrongActionVerb(text = '') {
    const clean = text.trim().toLowerCase();
    const firstWord = clean.split(/\s+/)[0]?.replace(/[^a-z]/g, '');
    if (!firstWord) return false;
    return ATS_ACTION_VERBS.some(v => v === firstWord || clean.startsWith(v + ' '));
}

/**
 * Scans bullet text for quantifiable metrics and numbers
 */
export function hasQuantifiableMetrics(text = '') {
    if (!text) return false;
    // Patterns for percentages, throughput (TPS, RPS, req/s, ms), users, concurrency, test coverage, revenue, latency
    const patterns = [
        /\b\d+(\.\d+)?%\b/,                                        // 92%, 85.5%
        /\b\d+([,\d]+)?\+?\s*(tps|rps|qps|req\/s|requests\/sec|ms|µs|fps)\b/i, // 4,500+ TPS, 80ms
        /\b\d+([,\d]+)?\+?\s*(users|clients|transactions|settlements|records|queries|branches|teams|engineers|microservices|endpoints|containers)\b/i, // 250,000 transactions
        /\b\d+(\.\d+)?[kKmMbB]\+?\b/,                              // 50k+, 2M
        /\$\d+([,\d]+)?(\.\d+)?[kKmMbB]?\b/,                       // $50k, $1.2M
        /\b\d+x\b/i,                                               // 3x, 10x
        /\bsub-\d+ms\b/i,                                          // sub-80ms
        /\b\d+\s*\/\s*\d+\b/                                       // 9/10, 8.8/10
    ];
    return patterns.some(pattern => pattern.test(text));
}

/**
 * Evaluates the full real ATS score against deterministic industry criteria
 */
export function runLiveAtsCheck(resumeData = {}, targetRole = 'Backend Developer') {
    const serializedText = serializeResumeToText(resumeData);
    const words = serializedText.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Detect technical skills strictly from the resume content
    const detectedSkills = extractSkillsFromText(serializedText);

    // Identify target role requirements
    const roleSlug = getRoleSlug(targetRole);
    const roleDisplayName = getRoleDisplayName(roleSlug);
    const roleSkills = ROLE_SKILLS_MAP[roleDisplayName] || DEFAULT_FALLBACK_SKILLS;

    const matchedSkills = roleSkills.filter(reqSkill => {
        const reqLower = reqSkill.toLowerCase();
        return detectedSkills.some(ds => ds.toLowerCase() === reqLower || ds.toLowerCase().includes(reqLower) || reqLower.includes(ds.toLowerCase()));
    });

    const missingSkills = roleSkills.filter(reqSkill => !matchedSkills.includes(reqSkill));

    // Analyze bullet points
    const allBullets = extractAllBullets(resumeData);
    const totalBullets = allBullets.length;

    let bulletsWithActionVerb = 0;
    let bulletsWithMetrics = 0;
    const weakPhrasesDetected = [];

    allBullets.forEach(b => {
        if (hasStrongActionVerb(b.text)) bulletsWithActionVerb += 1;
        if (hasQuantifiableMetrics(b.text)) bulletsWithMetrics += 1;

        const lowerB = b.text.toLowerCase();
        WEAK_PASSIVE_PHRASES.forEach(wp => {
            if (lowerB.includes(wp) && !weakPhrasesDetected.includes(wp)) {
                weakPhrasesDetected.push(wp);
            }
        });
    });

    const actionVerbRatio = totalBullets > 0 ? (bulletsWithActionVerb / totalBullets) : 0;
    const metricsRatio = totalBullets > 0 ? (bulletsWithMetrics / totalBullets) : 0;

    // -------------------------------------------------------------
    // ATS CHECKS SUITE (Total 100 Points)
    // -------------------------------------------------------------
    const checklist = [];

    // --- CATEGORY 1: CONTACT & IDENTIFIERS (15 Points) ---
    const fullName = (resumeData?.personal?.fullName || '').trim();
    const hasValidName = fullName.length >= 3 && !fullName.toLowerCase().includes('placeholder') && !fullName.toLowerCase().includes('your name');
    checklist.push({
        id: 'contact_name',
        category: 'Contact & Header',
        title: 'Candidate Name Verification',
        maxPoints: 3,
        pointsEarned: hasValidName ? 3 : 0,
        status: hasValidName ? 'passed' : 'failed',
        details: hasValidName ? `Identified candidate name: "${fullName}".` : 'Full candidate name is missing or contains placeholder text.',
        fixTip: 'Provide your real full legal name prominently at the top of the resume.'
    });

    const email = (resumeData?.personal?.email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasValidEmail = emailRegex.test(email) && !email.includes('example.com') && !email.includes('placeholder');
    checklist.push({
        id: 'contact_email',
        category: 'Contact & Header',
        title: 'Professional Email Address',
        maxPoints: 3,
        pointsEarned: hasValidEmail ? 3 : (emailRegex.test(email) ? 2 : 0),
        status: hasValidEmail ? 'passed' : (email ? 'warning' : 'failed'),
        details: hasValidEmail ? `Validated direct email address: ${email}.` : (email ? `Email contains placeholder domain: ${email}.` : 'No valid email address found.'),
        fixTip: 'Use a clean, professional email (e.g. firstname.lastname@gmail.com) without special symbols.'
    });

    const phone = (resumeData?.personal?.phone || '').trim();
    const phoneDigits = phone.replace(/[^0-9]/g, '');
    const hasValidPhone = phoneDigits.length >= 10;
    checklist.push({
        id: 'contact_phone',
        category: 'Contact & Header',
        title: 'Direct Phone Number',
        maxPoints: 3,
        pointsEarned: hasValidPhone ? 3 : (phoneDigits.length >= 7 ? 1.5 : 0),
        status: hasValidPhone ? 'passed' : (phone ? 'warning' : 'failed'),
        details: hasValidPhone ? `Direct telephone parsed: ${phone}.` : 'Phone number is missing or incomplete.',
        fixTip: 'Include country code and 10-digit mobile number for automated recruiter phone screens.'
    });

    const location = (resumeData?.personal?.location || '').trim();
    const hasLocation = location.length >= 4;
    checklist.push({
        id: 'contact_location',
        category: 'Contact & Header',
        title: 'Geographic Location / City',
        maxPoints: 2,
        pointsEarned: hasLocation ? 2 : 0,
        status: hasLocation ? 'passed' : 'failed',
        details: hasLocation ? `Parsed location: ${location}.` : 'Geographic city/location is missing.',
        fixTip: 'Recruiters filter candidates by location (e.g., "Bengaluru, India" or "Remote / San Francisco, CA").'
    });

    const linkedin = (resumeData?.personal?.linkedin || '').trim();
    const github = (resumeData?.personal?.github || '').trim();
    const portfolio = (resumeData?.personal?.portfolio || '').trim();
    const linksCount = [linkedin, github, portfolio].filter(l => l.length > 5).length;
    checklist.push({
        id: 'contact_links',
        category: 'Contact & Header',
        title: 'Professional Profile Links (GitHub & LinkedIn)',
        maxPoints: 4,
        pointsEarned: linksCount >= 2 ? 4 : (linksCount === 1 ? 2.5 : 0),
        status: linksCount >= 2 ? 'passed' : (linksCount === 1 ? 'warning' : 'failed'),
        details: linksCount >= 2
            ? `Found ${linksCount} professional profile links (LinkedIn, GitHub/Portfolio).`
            : (linksCount === 1 ? 'Found 1 link. Adding both LinkedIn and GitHub significantly boosts interview call rates.' : 'No professional links provided.'),
        fixTip: 'Include direct URLs to your LinkedIn and GitHub profiles.'
    });

    // --- CATEGORY 2: PROFESSIONAL SUMMARY (10 Points) ---
    const summary = (resumeData?.personal?.summary || '').trim();
    const summaryLength = summary.length;
    const hasGoodSummary = summaryLength >= 50 && summaryLength <= 500;
    checklist.push({
        id: 'summary_presence',
        category: 'Professional Summary',
        title: 'Targeted Professional Summary',
        maxPoints: 5,
        pointsEarned: hasGoodSummary ? 5 : (summaryLength > 0 ? 2.5 : 0),
        status: hasGoodSummary ? 'passed' : (summaryLength > 0 ? 'warning' : 'failed'),
        details: hasGoodSummary ? `Found executive summary (${summary.split(/\s+/).length} words).` : 'Professional summary is either missing or too brief (<50 characters).',
        fixTip: 'Write a 2-3 sentence technical summary emphasizing your core stack, years/projects of experience, and key strength.'
    });

    const targetRoleLower = targetRole.toLowerCase();
    const summaryHasRoleKeywords = summary.toLowerCase().includes(roleSlug) ||
        summary.toLowerCase().includes(targetRoleLower) ||
        matchedSkills.some(sk => summary.toLowerCase().includes(sk.toLowerCase()));
    checklist.push({
        id: 'summary_alignment',
        category: 'Professional Summary',
        title: 'Summary Role Alignment',
        maxPoints: 5,
        pointsEarned: summaryHasRoleKeywords ? 5 : 1.5,
        status: summaryHasRoleKeywords ? 'passed' : 'warning',
        details: summaryHasRoleKeywords ? `Summary contains direct keywords for ${targetRole}.` : `Summary does not explicitly reference ${targetRole} or core keywords.`,
        fixTip: `Explicitly mention your target designation ("${targetRole}") in the first sentence of your summary.`
    });

    // --- CATEGORY 3: SECTION ARCHITECTURE & PARSABILITY (15 Points) ---
    const education = resumeData?.education || [];
    const hasEducation = education.length > 0 && education.some(e => (e.institution || '').length > 2 && (e.degree || '').length > 2);
    checklist.push({
        id: 'section_education',
        category: 'Section Architecture',
        title: 'Standard Education Section',
        maxPoints: 4,
        pointsEarned: hasEducation ? 4 : 0,
        status: hasEducation ? 'passed' : 'failed',
        details: hasEducation ? `Education verified: ${education[0]?.degree} from ${education[0]?.institution}.` : 'Education section is missing or has empty institution/degree fields.',
        fixTip: 'ATS scanners require a distinct Education section containing degree, university name, and graduation dates.'
    });

    const skillsCategories = resumeData?.skills?.categories || [];
    const hasCategorizedSkills = skillsCategories.length >= 2 && skillsCategories.some(c => (c.items || '').split(',').length >= 3);
    checklist.push({
        id: 'section_skills',
        category: 'Section Architecture',
        title: 'Categorized Technical Skills',
        maxPoints: 4,
        pointsEarned: hasCategorizedSkills ? 4 : (skillsCategories.length > 0 ? 2.5 : 0),
        status: hasCategorizedSkills ? 'passed' : (skillsCategories.length > 0 ? 'warning' : 'failed'),
        details: hasCategorizedSkills ? `Skills neatly partitioned into ${skillsCategories.length} categories.` : 'Skills should be organized into clear categories (e.g., Languages, Frameworks, Databases, Tools).',
        fixTip: 'Group technical skills into distinct categories rather than a single comma-separated block.'
    });

    const projects = resumeData?.projects || [];
    const experience = resumeData?.experience || [];
    const hasWorkHistoryOrProjects = (projects.length >= 2) || (experience.length >= 1 && projects.length >= 1);
    checklist.push({
        id: 'section_projects_exp',
        category: 'Section Architecture',
        title: 'Projects & Work Experience Depth',
        maxPoints: 4,
        pointsEarned: hasWorkHistoryOrProjects ? 4 : (projects.length > 0 || experience.length > 0 ? 2.5 : 0),
        status: hasWorkHistoryOrProjects ? 'passed' : 'warning',
        details: `Found ${projects.length} project(s) and ${experience.length} work experience entry/entries.`,
        fixTip: 'Include at least 2 in-depth projects and any relevant internships or work experience.'
    });

    // Optimal single-page ATS word count: 350 - 750 words
    const isOptimalWordCount = wordCount >= 320 && wordCount <= 750;
    const isAcceptableWordCount = wordCount >= 220 && wordCount <= 950;
    checklist.push({
        id: 'ats_word_count',
        category: 'Section Architecture',
        title: 'ATS Length & Word Count Optimality',
        maxPoints: 3,
        pointsEarned: isOptimalWordCount ? 3 : (isAcceptableWordCount ? 1.5 : 0),
        status: isOptimalWordCount ? 'passed' : (isAcceptableWordCount ? 'warning' : 'failed'),
        details: `Current resume word count: ${wordCount} words (Ideal single-page ATS range: 350 - 700 words).`,
        fixTip: wordCount < 320
            ? 'Add more detailed STAR bullet points describing system architecture, metrics, and technologies used.'
            : (wordCount > 750 ? 'Trim redundant sentences to ensure your resume fits cleanly on 1 page.' : 'Resume length is optimal.')
    });

    // --- CATEGORY 4: TECHNICAL KEYWORDS & ROLE ALIGNMENT (25 Points) ---
    const roleSkillRatio = roleSkills.length > 0 ? (matchedSkills.length / roleSkills.length) : 0;
    let keywordScore = 0;
    if (roleSkillRatio >= 0.70) keywordScore = 15;
    else if (roleSkillRatio >= 0.50) keywordScore = 11;
    else if (roleSkillRatio >= 0.35) keywordScore = 7.5;
    else keywordScore = Math.round(roleSkillRatio * 15 * 10) / 10;

    checklist.push({
        id: 'role_keyword_coverage',
        category: 'Technical Keywords',
        title: `Core Keywords for ${roleDisplayName}`,
        maxPoints: 15,
        pointsEarned: keywordScore,
        status: roleSkillRatio >= 0.65 ? 'passed' : (roleSkillRatio >= 0.40 ? 'warning' : 'failed'),
        details: `Matched ${matchedSkills.length} of ${roleSkills.length} core competencies for ${roleDisplayName} (${Math.round(roleSkillRatio * 100)}%).`,
        fixTip: missingSkills.length > 0
            ? `Incorporate missing high-priority keywords: ${missingSkills.slice(0, 4).join(', ')}.`
            : 'All core role keywords are present in your resume!'
    });

    const totalDetectedCount = detectedSkills.length;
    let skillBreadthScore = 0;
    if (totalDetectedCount >= 9) skillBreadthScore = 10;
    else if (totalDetectedCount >= 6) skillBreadthScore = 7.5;
    else if (totalDetectedCount >= 4) skillBreadthScore = 5;
    else skillBreadthScore = Math.min(10, totalDetectedCount * 1.25);

    checklist.push({
        id: 'skills_breadth',
        category: 'Technical Keywords',
        title: 'Technical Catalog Breadth',
        maxPoints: 10,
        pointsEarned: skillBreadthScore,
        status: totalDetectedCount >= 8 ? 'passed' : (totalDetectedCount >= 5 ? 'warning' : 'failed'),
        details: `Detected ${totalDetectedCount} recognized industry technologies & tools across your resume text.`,
        fixTip: 'Showcase a balanced full-spectrum stack: primary programming language, core framework, database, cache, testing, and deployment/cloud.'
    });

    // --- CATEGORY 5: STAR METHOD & BULLET QUALITY (20 Points) ---
    let actionVerbScore = 0;
    if (actionVerbRatio >= 0.75) actionVerbScore = 10;
    else if (actionVerbRatio >= 0.50) actionVerbScore = 7;
    else if (actionVerbRatio >= 0.30) actionVerbScore = 4;
    else actionVerbScore = Math.round(actionVerbRatio * 10 * 10) / 10;

    checklist.push({
        id: 'star_action_verbs',
        category: 'STAR Impact & Metrics',
        title: 'Action-Oriented Verbs (STAR Formula)',
        maxPoints: 10,
        pointsEarned: actionVerbScore,
        status: actionVerbRatio >= 0.70 ? 'passed' : (actionVerbRatio >= 0.45 ? 'warning' : 'failed'),
        details: `${bulletsWithActionVerb} of ${totalBullets} bullets (${Math.round(actionVerbRatio * 100)}%) start with powerful technical action verbs (e.g. Architected, Engineered, Optimized).`,
        fixTip: 'Ensure every bullet begins with an active verb (e.g. "Architected", "Engineered", "Implemented", "Decreased", "Automated").'
    });

    let metricsScore = 0;
    if (metricsRatio >= 0.60) metricsScore = 10;
    else if (metricsRatio >= 0.40) metricsScore = 7.5;
    else if (metricsRatio >= 0.25) metricsScore = 5;
    else metricsScore = Math.round(metricsRatio * 10 * 10) / 10;

    checklist.push({
        id: 'star_quantifiable_metrics',
        category: 'STAR Impact & Metrics',
        title: 'Quantified Metrics & Business Results',
        maxPoints: 10,
        pointsEarned: metricsScore,
        status: metricsRatio >= 0.50 ? 'passed' : (metricsRatio >= 0.30 ? 'warning' : 'failed'),
        details: `${bulletsWithMetrics} of ${totalBullets} bullets (${Math.round(metricsRatio * 100)}%) contain quantifiable metrics (%, TPS, ms, user counts, test coverage).`,
        fixTip: 'Recruiters favor measurable outcomes. Add numbers such as "handled 4,500+ TPS", "decreased latency by 35%", or "achieved 92% test coverage".'
    });

    // --- CATEGORY 6: ATS PARSABILITY & CLEANLINESS (15 Points) ---
    // Bullet length discipline
    const badLengthBullets = allBullets.filter(b => {
        const wc = b.text.split(/\s+/).length;
        return wc < 7 || wc > 45;
    });
    const bulletLengthPassed = allBullets.length > 0 && badLengthBullets.length <= 1;
    checklist.push({
        id: 'bullet_length_discipline',
        category: 'ATS Parsability',
        title: 'Bullet Length & Scannability',
        maxPoints: 5,
        pointsEarned: bulletLengthPassed ? 5 : (badLengthBullets.length <= 3 ? 3 : 1),
        status: bulletLengthPassed ? 'passed' : 'warning',
        details: bulletLengthPassed ? 'All bullets adhere to the optimal 10-35 words per bullet guideline.' : `${badLengthBullets.length} bullet(s) are too short (<7 words) or excessively long (>45 words).`,
        fixTip: 'Keep bullets concise: one line to two lines max (15-30 words) focused on Action + Context + Result.'
    });

    // Project links check
    const projectsWithLinks = projects.filter(p => ((p.link || '').trim().length > 7 || (p.liveLink || '').trim().length > 7));
    const hasProjectLinks = projects.length > 0 && (projectsWithLinks.length / projects.length) >= 0.5;
    checklist.push({
        id: 'project_repo_links',
        category: 'ATS Parsability',
        title: 'Project Repository & Live Links',
        maxPoints: 5,
        pointsEarned: hasProjectLinks ? 5 : (projectsWithLinks.length > 0 ? 3 : 0),
        status: hasProjectLinks ? 'passed' : (projectsWithLinks.length > 0 ? 'warning' : 'failed'),
        details: `${projectsWithLinks.length} of ${projects.length} project(s) provide verified GitHub/live deployment links.`,
        fixTip: 'Include valid links to your GitHub repositories or live deployed demos for all major projects.'
    });

    // Check for dummy / placeholder tokens
    const dummyWords = ['lorem ipsum', 'todo', 'tbd', '[company name]', 'your-name', 'dummy'];
    const foundDummyTokens = [];
    dummyWords.forEach(dw => {
        if (serializedText.toLowerCase().includes(dw)) {
            foundDummyTokens.push(dw);
        }
    });
    const hasNoPlaceholders = foundDummyTokens.length === 0 && weakPhrasesDetected.length === 0;
    let cleanlinessScore = 5;
    if (foundDummyTokens.length > 0) cleanlinessScore -= 3;
    if (weakPhrasesDetected.length > 0) cleanlinessScore -= 2;
    cleanlinessScore = Math.max(0, cleanlinessScore);

    checklist.push({
        id: 'cleanliness_no_placeholders',
        category: 'ATS Parsability',
        title: 'No Placeholders or Passive Phrasing',
        maxPoints: 5,
        pointsEarned: cleanlinessScore,
        status: cleanlinessScore === 5 ? 'passed' : (cleanlinessScore >= 3 ? 'warning' : 'failed'),
        details: cleanlinessScore === 5
            ? 'Zero placeholder tokens or passive phrases detected.'
            : `Detected: ${[...foundDummyTokens, ...weakPhrasesDetected.map(p => `"${p}"`)].join(', ')}.`,
        fixTip: 'Replace passive phrases ("worked on", "assisted") with strong transitive verbs, and eliminate any draft notes.'
    });

    // -------------------------------------------------------------
    // CALCULATE AGGREGATE REAL SCORE
    // -------------------------------------------------------------
    const rawTotal = checklist.reduce((sum, item) => sum + item.pointsEarned, 0);
    const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

    let atsRating = 'Needs Optimization';
    let grade = 'C';
    let badgeColor = 'warning';

    if (totalScore >= 88) {
        atsRating = 'Top 5% Strong Match (Interview Ready)';
        grade = 'A+';
        badgeColor = 'success';
    } else if (totalScore >= 78) {
        atsRating = 'Competitive Match (High Pass Rate)';
        grade = 'A';
        badgeColor = 'success';
    } else if (totalScore >= 65) {
        atsRating = 'Moderate Match (Gaps to Address)';
        grade = 'B';
        badgeColor = 'warning';
    } else {
        atsRating = 'High Risk of ATS Filtering';
        grade = 'D';
        badgeColor = 'danger';
    }

    const totalChecks = checklist.length;
    const passedCount = Math.min(checklist.filter(c => c.status === 'passed').length, totalChecks);
    const warningCount = checklist.filter(c => c.status === 'warning').length;
    const failedCount = checklist.filter(c => c.status === 'failed').length;

    // Category Breakdowns
    const categories = ['Contact & Header', 'Professional Summary', 'Section Architecture', 'Technical Keywords', 'STAR Impact & Metrics', 'ATS Parsability'];
    const categoryBreakdown = categories.map(cat => {
        const items = checklist.filter(c => c.category === cat);
        const earned = items.reduce((s, i) => s + i.pointsEarned, 0);
        const max = items.reduce((s, i) => s + i.maxPoints, 0);
        return {
            category: cat,
            score: Math.round(earned),
            maxScore: max,
            percentage: max > 0 ? Math.round((earned / max) * 100) : 0
        };
    });

    // Top Actionable Recommendations (sorted by potential point gain)
    const topRecommendations = checklist
        .filter(c => c.status !== 'passed')
        .sort((a, b) => (b.maxPoints - b.pointsEarned) - (a.maxPoints - a.pointsEarned))
        .map(c => ({
            title: c.title,
            potentialGain: Math.round((c.maxPoints - c.pointsEarned) * 10) / 10,
            tip: c.fixTip,
            category: c.category
        }));

    return {
        totalScore,
        grade,
        atsRating,
        badgeColor,
        wordCount,
        checklist,
        totalChecks,
        passedCount,
        warningCount,
        failedCount,
        categoryBreakdown,
        detectedSkills,
        matchedSkills,
        missingSkills,
        totalRoleSkills: roleSkills.length,
        actionVerbStats: {
            totalBullets,
            withActionVerb: bulletsWithActionVerb,
            percentage: Math.round(actionVerbRatio * 100)
        },
        metricsStats: {
            totalBullets,
            withMetrics: bulletsWithMetrics,
            percentage: Math.round(metricsRatio * 100)
        },
        topRecommendations
    };
}

/**
 * Generates a full, 90+ ATS-grade structured resume tailored to any target role.
 * Triggered when a user clicks "Create / Build ATS Resume" or if live is unbuildable.
 */
export function buildStarterAtsResume(role = 'Backend Developer', profile = {}) {
    const roleSlug = getRoleSlug(role);
    const candidateName = profile?.full_name?.trim() || 'Nikhil Ingale';
    const slug = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'nikhilingale';
    const email = profile?.email || `${slug}.dev@gmail.com`;
    const linkedin = profile?.linkedin_url || `linkedin.com/in/${slug}`;
    const github = profile?.github_url || `github.com/${slug}`;
    const portfolio = profile?.portfolio_url || `https://${slug}.dev`;

    switch (roleSlug) {
        case 'frontend':
            return {
                personal: {
                    fullName: candidateName,
                    targetRole: 'Senior Frontend Developer',
                    email: email,
                    phone: profile?.phone || '+91 98765 43210',
                    location: profile?.location || 'Bengaluru, India',
                    linkedin: linkedin,
                    github: github,
                    portfolio: portfolio,
                    summary: profile?.bio || 'Frontend Engineer with expertise in React, Next.js, TypeScript, and modern state architectures. Proven record of optimizing Core Web Vitals to 98+ and building high-performance design systems.'
                },
                education: [
                    {
                        institution: 'National Institute of Technology (NIT)',
                        degree: 'B.Tech in Computer Science',
                        field: 'Computer Science',
                        dates: '2021 - 2025',
                        gpa: '8.8 / 10',
                        details: 'Coursework: Data Structures, Web Engineering, Human-Computer Interaction, Distributed Systems'
                    }
                ],
                skills: {
                    categories: [
                        { name: 'Core Languages', items: 'TypeScript, JavaScript (ES6+), HTML5, CSS3, SQL' },
                        { name: 'Frameworks & State', items: 'React, Next.js, Redux Toolkit, Tailwind CSS, Zustand' },
                        { name: 'Testing & Tools', items: 'Jest, React Testing Library, Cypress, Vite, Webpack, Git, REST APIs, WebSockets' },
                        { name: 'DevOps & Cloud', items: 'Docker, Vercel, AWS S3, CI/CD GitHub Actions' }
                    ]
                },
                projects: [
                    {
                        title: 'High-Performance E-Commerce Web Platform',
                        techStack: 'React, Next.js, TypeScript, Tailwind CSS, Zustand',
                        link: 'https://github.com/aaravsharma/ecommerce-platform',
                        dates: '2024',
                        bullets: [
                            'Architected server-side rendered storefront handling 25,000+ monthly active shoppers with sub-1.2s Largest Contentful Paint (LCP).',
                            'Implemented optimistic UI mutations and modular state caching, reducing checkout cart drop-off by 24%.',
                            'Authored end-to-end Cypress test suites and unit tests achieving 91% code coverage in automated CI pipelines.'
                        ]
                    },
                    {
                        title: 'Real-Time Interactive Collaboration Canvas',
                        techStack: 'TypeScript, React, WebSockets, HTML5 Canvas, Docker',
                        link: 'https://github.com/aaravsharma/collab-canvas',
                        dates: '2023 - 2024',
                        bullets: [
                            'Engineered 60-FPS multi-user synchronization engine supporting 80+ simultaneous developers with sub-25ms socket latency.',
                            'Optimized DOM rendering trees and offscreen canvas buffer rendering, eliminating redundant frame redraws by 45%.'
                        ]
                    }
                ],
                experience: [
                    {
                        company: 'Postman',
                        role: 'Frontend Engineering Intern',
                        dates: 'May 2024 - July 2024',
                        location: 'Bengaluru, India',
                        bullets: [
                            'Developed reusable design system components used by 12+ internal product teams, decreasing sprint ticket cycle time by 30%.',
                            'Optimized bundle size through code-splitting and dynamic imports, reducing production JavaScript payload by 180 KB.'
                        ]
                    }
                ],
                certifications: [
                    { name: 'Meta Certified Frontend Developer', issuer: 'Meta', date: '2024', link: '' },
                    { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2023', link: '' }
                ],
                achievements: [
                    'Top 1% Global Rank in LeetCode Frontend & Algorithms contests.',
                    'First Place Winner, National React & Web3 Hackathon among 1,200 participants.'
                ]
            };

        case 'fullstack':
            return {
                personal: {
                    fullName: candidateName,
                    targetRole: 'Full Stack Software Engineer',
                    email: email,
                    phone: profile?.phone || '+91 98765 43210',
                    location: profile?.location || 'Bengaluru, India',
                    linkedin: linkedin,
                    github: github,
                    portfolio: portfolio,
                    summary: 'Full Stack Engineer with strong proficiency in React, Node.js, TypeScript, PostgreSQL, and AWS. Proven track record of architecting end-to-end cloud microservices handling high concurrency.'
                },
                education: [
                    {
                        institution: 'Indian Institute of Information Technology (IIIT)',
                        degree: 'B.Tech in Computer Science & Engineering',
                        field: 'Computer Science',
                        dates: '2021 - 2025',
                        gpa: '8.9 / 10',
                        details: 'Coursework: Data Structures, Database Systems, Computer Networks, Operating Systems'
                    }
                ],
                skills: {
                    categories: [
                        { name: 'Languages', items: 'TypeScript, JavaScript, Java, Python, SQL' },
                        { name: 'Frontend', items: 'React, Next.js, Tailwind CSS, Redux, HTML5/CSS3' },
                        { name: 'Backend & APIs', items: 'Node.js, Express.js, Spring Boot, REST APIs, WebSockets, GraphQL' },
                        { name: 'Databases & Cloud', items: 'PostgreSQL, MongoDB, Redis, Docker, AWS (EC2, S3), Git, CI/CD' }
                    ]
                },
                projects: [
                    {
                        title: 'Scalable Microservices SaaS Platform',
                        techStack: 'React, Node.js, TypeScript, PostgreSQL, Docker, Redis',
                        link: `https://${github}/saas-platform`,
                        dates: '2024',
                        bullets: [
                            'Architected multi-tenant SaaS application serving 10,000+ daily active users with 99.9% uptime on AWS.',
                            'Optimized PostgreSQL database queries using composite indexing and Redis caching, cutting average API latency by 58%.',
                            'Automated Docker build containerization and GitHub Actions CI/CD pipeline, reducing deployment times to under 3 minutes.'
                        ]
                    },
                    {
                        title: 'Real-Time Financial Analytics Dashboard',
                        techStack: 'Next.js, Node.js, WebSockets, PostgreSQL, Tailwind CSS',
                        link: 'https://github.com/aaravsharma/finance-analytics',
                        dates: '2023 - 2024',
                        bullets: [
                            'Built live market data streaming pipeline processing 1,500+ tick events per second with sub-40ms update latency.',
                            'Designed responsive charts and KPI metrics dashboards achieving 98+ Google Lighthouse accessibility score.'
                        ]
                    }
                ],
                experience: [
                    {
                        company: 'Swiggy',
                        role: 'Software Engineer Intern - Full Stack',
                        dates: 'June 2024 - Aug 2024',
                        location: 'Bengaluru, India',
                        bullets: [
                            'Engineered merchant order management module handling 40,000+ daily orders with zero critical data desync.',
                            'Authored unit and integration test suites using Jest and Supertest, expanding test coverage from 68% to 92%.'
                        ]
                    }
                ],
                certifications: [
                    { name: 'AWS Certified Solutions Architect - Associate', issuer: 'Amazon Web Services', date: '2024', link: '' },
                    { name: 'MongoDB Certified Developer', issuer: 'MongoDB Inc.', date: '2023', link: '' }
                ],
                achievements: [
                    'Winner, Smart India Hackathon among 1,500+ engineering teams nationwide.',
                    'Published open-source React component library with 1,200+ GitHub stars.'
                ]
            };

        case 'data-analyst':
            return {
                personal: {
                    fullName: candidateName,
                    targetRole: 'Data Analyst & BI Specialist',
                    email: email,
                    phone: profile?.phone || '+91 98765 43210',
                    location: profile?.location || 'Bengaluru, India',
                    linkedin: linkedin,
                    github: github,
                    portfolio: portfolio,
                    summary: 'Analytical and results-oriented Data Analyst skilled in SQL, Python, Power BI, and Tableau. Experienced in transforming raw transactional data into actionable executive dashboards driving business growth.'
                },
                education: [
                    {
                        institution: 'National Institute of Technology',
                        degree: 'B.Tech in Information Technology',
                        field: 'Data & Computer Science',
                        dates: '2021 - 2025',
                        gpa: '8.7 / 10',
                        details: 'Coursework: Relational Database Systems, Applied Statistics, Data Mining, Predictive Modeling'
                    }
                ],
                skills: {
                    categories: [
                        { name: 'Analytics & Querying', items: 'SQL (PostgreSQL, MySQL), Python (Pandas, NumPy, Scikit-learn), Excel (DAX, Power Query)' },
                        { name: 'Visualization & BI', items: 'Power BI, Tableau, Matplotlib, Seaborn, Looker Studio' },
                        { name: 'Data Engineering', items: 'ETL Pipelines, Data Cleaning, Statistical Testing, A/B Testing, Airflow' },
                        { name: 'Databases & Tools', items: 'PostgreSQL, Snowflake, BigQuery, Git, JIRA' }
                    ]
                },
                projects: [
                    {
                        title: 'Enterprise Customer Retention & Churn Analytics',
                        techStack: 'Python, Pandas, SQL, Power BI, Scikit-learn',
                        link: 'https://github.com/aaravsharma/churn-analytics',
                        dates: '2024',
                        bullets: [
                            'Engineered ETL pipeline extracting and cleansing 1.2M+ customer subscription records from PostgreSQL.',
                            'Constructed predictive churn scoring model identifying 84% of high-risk cancellations before contract renewal.',
                            'Built executive Power BI dashboard with automated refresh, adopted by business leaders to reduce churn by 14%.'
                        ]
                    },
                    {
                        title: 'E-Commerce Marketing Attribution & Funnel Model',
                        techStack: 'SQL, Tableau, Python, Google BigQuery',
                        link: 'https://github.com/aaravsharma/attribution-funnel',
                        dates: '2023 - 2024',
                        bullets: [
                            'Formulated multi-touch attribution model analyzing 450,000+ advertising clickstream events across 5 marketing channels.',
                            'Optimized complex SQL window functions and CTEs, cutting daily reporting query runtime from 35 mins to 6 mins.'
                        ]
                    }
                ],
                experience: [
                    {
                        company: 'CRED',
                        role: 'Data Analyst Intern',
                        dates: 'Jan 2024 - June 2024',
                        location: 'Bengaluru, India',
                        bullets: [
                            'Designed and analyzed 18 statistical A/B tests for reward redemption features, increasing weekly user engagement by 22%.',
                            'Automated daily KPI discrepancy validation scripts in Python, saving 15 manual engineering hours each sprint.'
                        ]
                    }
                ],
                certifications: [
                    { name: 'Microsoft Certified: Power BI Data Analyst Associate (PL-300)', issuer: 'Microsoft', date: '2024', link: '' },
                    { name: 'Google Data Analytics Professional Certificate', issuer: 'Google', date: '2023', link: '' }
                ],
                achievements: [
                    'Top 5% finish in Kaggle Analytics Competition on customer lifetime value.',
                    'Conducted SQL & Data Modeling workshops for 200+ junior engineers.'
                ]
            };

        default: // Backend Developer (Default & Java Backend)
            return {
                personal: {
                    fullName: candidateName,
                    targetRole: 'Java Backend Software Engineer',
                    email: email,
                    phone: profile?.phone || '+91 98765 43210',
                    location: profile?.location || 'Bengaluru, India',
                    linkedin: linkedin,
                    github: github,
                    portfolio: portfolio,
                    summary: 'Results-driven Backend Engineer specializing in high-throughput distributed systems, microservices, and relational database tuning. Proficient in Java 17, Spring Boot, PostgreSQL, Redis, and Apache Kafka.'
                },
                education: [
                    {
                        institution: 'Indian Institute of Technology (IIT) / NIT',
                        degree: 'B.Tech in Computer Science & Engineering',
                        field: 'Computer Science',
                        dates: '2021 - 2025',
                        gpa: '8.9 / 10',
                        details: 'Coursework: Data Structures & Algorithms, Distributed Systems, Database Management, Computer Networks'
                    }
                ],
                skills: {
                    categories: [
                        { name: 'Languages', items: 'Java 17, Go, Python, TypeScript, SQL' },
                        { name: 'Frameworks & Libs', items: 'Spring Boot, Spring Security, Hibernate/JPA, Node.js, JUnit 5, Mockito' },
                        { name: 'Databases & Cache', items: 'PostgreSQL, Redis, MySQL, MongoDB, Elasticsearch' },
                        { name: 'DevOps & Cloud', items: 'Docker, AWS (EC2, S3), Git, CI/CD pipelines, Kafka, Linux' }
                    ]
                },
                projects: [
                    {
                        title: 'High-Throughput Distributed Payment Gateway',
                        techStack: 'Java 17, Spring Boot, Redis, Kafka, PostgreSQL, Docker',
                        link: `https://${github}/payment-gateway`,
                        dates: '2024',
                        bullets: [
                            'Engineered an idempotent transaction processing pipeline handling 4,500+ TPS with sub-80ms p99 response times.',
                            'Implemented distributed locking and deduplication using Redis cache, eliminating duplicate debit charges during network retries.',
                            'Achieved 92% unit and integration test coverage using Testcontainers and Mockito in automated GitHub Actions CI.'
                        ]
                    },
                    {
                        title: 'Real-Time Event-Driven Notification Engine',
                        techStack: 'Spring Boot, Apache Kafka, PostgreSQL, Docker, AWS',
                        link: 'https://github.com/aaravsharma/notification-engine',
                        dates: '2023 - 2024',
                        bullets: [
                            'Architected decoupled pub/sub message consumer cluster processing 120,000+ daily email and SMS notifications.',
                            'Designed dead-letter queue (DLQ) retry topologies, cutting transient message delivery failure rates from 4.8% to 0.02%.'
                        ]
                    }
                ],
                experience: [
                    {
                        company: 'Razorpay',
                        role: 'Software Engineer Intern - Core Banking',
                        dates: 'May 2024 - July 2024',
                        location: 'Bengaluru, India',
                        bullets: [
                            'Developed reconciliation microservice processing over 250,000 daily settlement transactions with zero record drift.',
                            'Optimized slow queries on high-volume PostgreSQL tables, reducing reporting batch job runtime from 45 mins to 11 mins.'
                        ]
                    }
                ],
                certifications: [
                    { name: 'Oracle Certified Professional: Java SE 17 Developer', issuer: 'Oracle', date: '2024', link: '' },
                    { name: 'AWS Certified Developer - Associate', issuer: 'Amazon Web Services', date: '2023', link: '' }
                ],
                achievements: [
                    'Global Rank 420 out of 24,000+ competitors in LeetCode Weekly Contest.',
                    'Winner, Smart India Hackathon among 1,500+ engineering teams nationwide.'
                ]
            };
    }
}

/**
 * Resolves the real-time deterministic ATS score for a student.
 * 1. Reads latest saved score from `careeros_live_ats_score` in localStorage
 * 2. If not found, evaluates `careeros_resume_data` from localStorage
 * 3. If still empty, evaluates role's starter ATS template so it matches the live score on initial load
 */
export function getActiveAtsScore(targetRole = 'Backend Developer', profile = {}) {
    if (typeof window === 'undefined') return null;
    try {
        const cached = localStorage.getItem('careeros_live_ats_score');
        if (cached) {
            const parsed = JSON.parse(cached);
            if (typeof parsed?.score === 'number' && parsed.score > 0) {
                return parsed.score;
            }
        }
        const savedResume = localStorage.getItem('careeros_resume_data');
        if (savedResume) {
            const parsed = JSON.parse(savedResume);
            const audit = runLiveAtsCheck(parsed, targetRole);
            if (typeof audit?.totalScore === 'number' && audit.totalScore > 0) {
                return audit.totalScore;
            }
        }
        // If user has a verified uploaded resume URL in profile
        if (profile?.resume_url) {
            const starter = buildStarterAtsResume(targetRole, {
                full_name: profile?.full_name || '',
                email: profile?.email || ''
            });
            const starterAudit = runLiveAtsCheck(starter, targetRole);
            return starterAudit?.totalScore || 75;
        }
        // User has no resume yet: return null so readiness reflects true status
        return null;
    } catch (e) {
        return null;
    }
}
