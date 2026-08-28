export const TARGET_ROLES = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Cybersecurity Specialist',
    'Data Analyst',
    'AI/ML Engineer',
    'DevOps Engineer'
];

/**
 * Normalizes any role name, title, or alias to a canonical role slug
 * Uses strict word boundaries to avoid substring collisions (e.g. 'soc' in 'associate')
 */
export function getRoleSlug(roleName = '') {
    if (!roleName) return 'backend';
    const lower = ` ${roleName.toLowerCase().trim()} `;

    // 1. Full Stack (checked early so "Full Stack Java Developer" routes to fullstack)
    if (
        lower.includes('full stack') ||
        lower.includes('fullstack') ||
        lower.includes('full-stack') ||
        lower.includes('mern') ||
        lower.includes('mean')
    ) {
        return 'fullstack';
    }

    // 2. Cybersecurity (strict word boundaries for 'soc')
    if (
        lower.includes('cyber') ||
        lower.includes('security') ||
        /\bsoc\b/.test(lower) ||
        lower.includes('infosec') ||
        lower.includes('pentest') ||
        lower.includes('penetration') ||
        lower.includes('vulnerability')
    ) {
        return 'cybersecurity';
    }

    // 3. Frontend
    if (
        lower.includes('front') ||
        lower.includes('react') ||
        /\bui\b/.test(lower) ||
        lower.includes('ui/ux') ||
        lower.includes('web developer') ||
        lower.includes('vue') ||
        lower.includes('angular') ||
        lower.includes('next.js') ||
        lower.includes('nextjs')
    ) {
        return 'frontend';
    }

    // 4. Data Analyst
    if (
        lower.includes('data analyst') ||
        lower.includes('data analytics') ||
        lower.includes('data analysis') ||
        lower.includes('analytics') ||
        lower.includes('business intelligence') ||
        lower.includes('power bi') ||
        lower.includes('tableau') ||
        /\bbi\b/.test(lower) ||
        (/\banalyst\b/.test(lower) && !lower.includes('security'))
    ) {
        return 'data-analyst';
    }

    // 5. AI / ML
    if (
        /\bai\b/.test(lower) ||
        /\bml\b/.test(lower) ||
        lower.includes('machine learning') ||
        lower.includes('deep learning') ||
        lower.includes('data scientist') ||
        lower.includes('data science') ||
        lower.includes('nlp') ||
        lower.includes('llm') ||
        lower.includes('pytorch') ||
        lower.includes('tensorflow') ||
        lower.includes('genai')
    ) {
        return 'ai-ml';
    }

    // 6. DevOps & Cloud
    if (
        lower.includes('devops') ||
        lower.includes('cloud') ||
        /\bsre\b/.test(lower) ||
        lower.includes('infra') ||
        lower.includes('platform') ||
        lower.includes('kubernetes') ||
        lower.includes('docker') ||
        lower.includes('terraform')
    ) {
        return 'devops';
    }

    // 7. Backend
    if (
        lower.includes('back') ||
        lower.includes('java') ||
        lower.includes('python') ||
        lower.includes('spring') ||
        lower.includes('node') ||
        lower.includes('fastapi') ||
        lower.includes('django') ||
        lower.includes('flask') ||
        /\bapi\b/.test(lower) ||
        lower.includes('golang') ||
        lower.includes('sql')
    ) {
        return 'backend';
    }

    return 'backend';
}

/**
 * Returns canonical display name for a role slug or job title
 */
export function getRoleDisplayName(roleOrSlug = '') {
    const slug = getRoleSlug(roleOrSlug);
    switch (slug) {
        case 'frontend': return 'Frontend Developer';
        case 'backend': return 'Backend Developer';
        case 'fullstack': return 'Full Stack Developer';
        case 'cybersecurity': return 'Cybersecurity Specialist';
        case 'data-analyst': return 'Data Analyst';
        case 'ai-ml': return 'AI/ML Engineer';
        case 'devops': return 'DevOps Engineer';
        default: return 'Backend Developer';
    }
}

/**
 * Intelligently matches a database job to a target role track based strictly
 * on the Job Title and Job Description with word-boundary precision.
 */
export function isJobMatchingRole(job, targetRole = '') {
    if (!job || !targetRole || targetRole === 'All') return true;

    const targetSlug = getRoleSlug(targetRole);

    // 1. Check explicit role_id if set in the database
    if (job.role_id) {
        const jobSlug = getRoleSlug(job.role_id);
        if (jobSlug === targetSlug) return true;
    }

    // 2. Extract job title and description
    const title = ` ${(job.title || '').toLowerCase().trim()} `;
    const desc = (job.description || '').toLowerCase();

    // 3. Match based on target track with strict boundaries
    switch (targetSlug) {
        case 'cybersecurity':
            return (
                title.includes('cyber') ||
                title.includes('security') ||
                /\bsoc\b/.test(title) ||
                title.includes('infosec') ||
                title.includes('pentest') ||
                title.includes('penetration') ||
                title.includes('vulnerability') ||
                title.includes('incident response') ||
                title.includes('firewall') ||
                title.includes('threat') ||
                desc.includes('cybersecurity') ||
                desc.includes('soc analyst') ||
                desc.includes('information security') ||
                desc.includes('siem') ||
                desc.includes('wireshark') ||
                desc.includes('threat detection') ||
                desc.includes('incident response') ||
                desc.includes('vulnerability assessment')
            );

        case 'frontend':
            return (
                (
                    title.includes('front') ||
                    title.includes('react') ||
                    /\bui\b/.test(title) ||
                    title.includes('ui/ux') ||
                    title.includes('web developer') ||
                    title.includes('vue') ||
                    title.includes('angular') ||
                    title.includes('next.js') ||
                    title.includes('nextjs') ||
                    title.includes('javascript') ||
                    title.includes('typescript') ||
                    desc.includes('frontend developer') ||
                    desc.includes('front-end') ||
                    desc.includes('react developer') ||
                    desc.includes('user interface') ||
                    desc.includes('client-side')
                ) &&
                !title.includes('full stack') &&
                !title.includes('fullstack') &&
                !title.includes('backend')
            );

        case 'backend':
            return (
                (
                    title.includes('backend') ||
                    title.includes('back-end') ||
                    title.includes('back end') ||
                    title.includes('java') ||
                    title.includes('python') ||
                    title.includes('spring') ||
                    title.includes('fastapi') ||
                    title.includes('django') ||
                    title.includes('flask') ||
                    title.includes('node') ||
                    title.includes('express') ||
                    title.includes('golang') ||
                    title.includes('c++') ||
                    title.includes('.net') ||
                    /\bapi\b/.test(title) ||
                    title.includes('database engineer') ||
                    title.includes('sql') ||
                    desc.includes('backend') ||
                    desc.includes('back-end') ||
                    desc.includes('server-side') ||
                    desc.includes('microservices') ||
                    desc.includes('spring boot') ||
                    desc.includes('rest api') ||
                    desc.includes('fastapi') ||
                    desc.includes('database architecture')
                ) &&
                !title.includes('full stack') &&
                !title.includes('fullstack') &&
                !title.includes('frontend')
            );

        case 'fullstack':
            return (
                title.includes('full stack') ||
                title.includes('fullstack') ||
                title.includes('full-stack') ||
                title.includes('mern') ||
                title.includes('mean') ||
                desc.includes('full stack') ||
                desc.includes('fullstack') ||
                (title.includes('software engineer') &&
                 !title.includes('frontend') &&
                 !title.includes('cyber') &&
                 !title.includes('platform'))
            );

        case 'data-analyst':
            return (
                title.includes('data analyst') ||
                title.includes('data analysis') ||
                title.includes('data analytics') ||
                title.includes('analytics') ||
                title.includes('business intelligence') ||
                title.includes('bi analyst') ||
                title.includes('power bi') ||
                title.includes('tableau') ||
                title.includes('sql analyst') ||
                desc.includes('data analyst') ||
                desc.includes('data analytics') ||
                desc.includes('business intelligence') ||
                (/\banalyst\b/.test(title) && !title.includes('security') && !/\bsoc\b/.test(title))
            );

        case 'ai-ml':
            return (
                /\bai\b/.test(title) ||
                /\bml\b/.test(title) ||
                title.includes('machine learning') ||
                title.includes('deep learning') ||
                title.includes('data science') ||
                title.includes('data scientist') ||
                title.includes('nlp') ||
                title.includes('llm') ||
                title.includes('pytorch') ||
                title.includes('tensorflow') ||
                title.includes('genai') ||
                title.includes('artificial intelligence') ||
                desc.includes('machine learning') ||
                desc.includes('deep learning') ||
                desc.includes('artificial intelligence') ||
                desc.includes('llm') ||
                desc.includes('model training')
            );

        case 'devops':
            return (
                title.includes('devops') ||
                title.includes('cloud') ||
                /\bsre\b/.test(title) ||
                title.includes('site reliability') ||
                title.includes('infrastructure') ||
                title.includes('platform') ||
                title.includes('kubernetes') ||
                title.includes('docker') ||
                title.includes('terraform') ||
                title.includes('aws') ||
                title.includes('azure') ||
                title.includes('gcp') ||
                title.includes('ci/cd') ||
                desc.includes('devops') ||
                desc.includes('ci/cd') ||
                desc.includes('kubernetes') ||
                desc.includes('cloud infrastructure') ||
                desc.includes('terraform') ||
                desc.includes('site reliability')
            );

        default:
            return true;
    }
}

/**
 * Safely parses and normalizes the required skills for any job.
 * Supports JSON arrays, Postgres arrays, comma-separated strings, or infers
 * from the role and description if the skills column was omitted.
 */
export function parseJobSkills(job) {
    if (!job) return [];

    // 1. If job.skills is already an array of strings or objects
    if (Array.isArray(job.skills) && job.skills.length > 0) {
        const list = job.skills
            .map(s => (typeof s === 'string' ? s.trim() : s?.name || s?.skill?.name || ''))
            .filter(Boolean);
        if (list.length > 0) return list;
    }

    // 2. If job.skills is a string in database (JSON string, postgres array, or comma-separated)
    if (typeof job.skills === 'string' && job.skills.trim()) {
        const raw = job.skills.trim();
        // Check if JSON array string e.g. '["Java", "Spring Boot", "AWS"]'
        if (raw.startsWith('[') && raw.endsWith(']')) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(s => (typeof s === 'string' ? s.trim() : s?.name || '')).filter(Boolean);
                }
            } catch (e) {}
        }
        // Check if Postgres array syntax e.g. '{"Java", "Spring Boot"}'
        if (raw.startsWith('{') && raw.endsWith('}')) {
            const cleaned = raw.slice(1, -1).split(',').map(s => s.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
            if (cleaned.length > 0) return cleaned;
        }
        // Comma-separated string e.g. "Java, Spring Boot, PostgreSQL, AWS"
        const commaSplit = raw.split(',').map(s => s.trim()).filter(Boolean);
        if (commaSplit.length > 0) return commaSplit;
    }

    // 3. Fallback: Automatically extract matched skills from the role's skills map using title + description
    const roleSlug = getRoleSlug(job.role_id || job.title);
    const roleDisplayName = getRoleDisplayName(roleSlug);
    const candidateSkills = ROLE_SKILLS_MAP[roleDisplayName] || DEFAULT_FALLBACK_SKILLS;

    const fullText = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    const matched = candidateSkills.filter(sk => fullText.includes(sk.toLowerCase()));

    return matched.length >= 3 ? matched : candidateSkills.slice(0, 6);
}

export const ROLE_SKILLS_MAP = {
    'Frontend Developer': [
        'HTML/CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js',
        'Tailwind CSS', 'Redux', 'REST APIs', 'WebSockets', 'Jest / Testing', 'Git', 'Vite'
    ],
    'Backend Developer': [
        'Java', 'Spring Boot', 'Python', 'FastAPI', 'SQL', 'PostgreSQL',
        'REST APIs', 'Microservices', 'Redis', 'Apache Kafka', 'Docker', 'AWS', 'JUnit / Mockito', 'Git'
    ],
    'Full Stack Developer': [
        'React', 'Next.js', 'Node.js', 'Express.js', 'TypeScript', 'JavaScript',
        'PostgreSQL', 'MongoDB', 'REST APIs', 'Docker', 'AWS', 'Tailwind CSS', 'Git', 'CI/CD'
    ],
    'Cybersecurity Specialist': [
        'Networking & TCP/IP', 'Linux & Bash', 'Cybersecurity Fundamentals', 'OWASP Top 10',
        'SIEM & Log Analysis', 'Wireshark', 'SOC Operations', 'Incident Response', 'Web Security', 'Cloud Security'
    ],
    'Data Analyst': [
        'SQL', 'Python', 'Pandas', 'NumPy', 'Power BI', 'Tableau',
        'Excel & Advanced Formulas', 'Data Cleaning', 'Exploratory Data Analysis', 'Statistical Analysis', 'Data Visualization'
    ],
    'AI/ML Engineer': [
        'Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas & NumPy',
        'Supervised & Unsupervised ML', 'Deep Learning', 'NLP & LLMs', 'Vector Databases & RAG', 'FastAPI', 'Docker', 'MLOps'
    ],
    'DevOps Engineer': [
        'Linux & Shell Scripting', 'Networking', 'Docker', 'Kubernetes', 'CI/CD Pipelines',
        'Terraform / IaC', 'AWS / Cloud', 'Prometheus & Grafana', 'Git', 'Microservices'
    ]
};

// Aliases support
ROLE_SKILLS_MAP['Java Backend Developer'] = ROLE_SKILLS_MAP['Backend Developer'];
ROLE_SKILLS_MAP['Python Backend Developer'] = ROLE_SKILLS_MAP['Backend Developer'];
ROLE_SKILLS_MAP['Cybersecurity Analyst'] = ROLE_SKILLS_MAP['Cybersecurity Specialist'];

export const DEFAULT_FALLBACK_SKILLS = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js',
    'SQL', 'PostgreSQL', 'Docker', 'AWS', 'Git', 'REST APIs'
];

export const ROLE_TOPICS_MAP = {
    'frontend': ['All', 'HTML/CSS', 'JavaScript', 'React', 'TypeScript', 'DOM & Performance', 'Testing'],
    'backend': ['All', 'Java & Spring Boot', 'REST APIs', 'Databases & SQL', 'Microservices', 'Caching & Redis', 'System Design'],
    'fullstack': ['All', 'Frontend & React', 'Backend APIs', 'Databases & SQL', 'Authentication & JWT', 'Architecture & Deployment'],
    'cybersecurity': ['All', 'Networking & TCP/IP', 'Linux Security', 'OWASP Top 10', 'SIEM & SOC', 'Incident Response', 'Cloud Security'],
    'data-analyst': ['All', 'SQL Queries', 'Python & Pandas', 'Statistics & EDA', 'Power BI & Tableau', 'Data Modeling'],
    'ai-ml': ['All', 'Python & Math', 'Classical ML', 'Deep Learning', 'LLMs & RAG', 'Model Evaluation & MLOps'],
    'devops': ['All', 'Linux & Networking', 'Docker & Containers', 'Kubernetes', 'CI/CD & GitHub Actions', 'AWS & Cloud', 'Monitoring']
};

export const ROLE_RECOMMENDED_ACTIONS = {
    'Cybersecurity Specialist': [
        { title: 'Practice Traffic Analysis with Wireshark', desc: 'Inspect PCAP packet captures and identify abnormal TCP/UDP payloads.', link: '/roadmap' },
        { title: 'Set up a SIEM / Log Analysis Lab', desc: 'Configure Elastic/Splunk to detect brute-force and privilege escalation alerts.', link: '/roadmap' },
        { title: 'Test OWASP Top 10 Web Vulnerabilities', desc: 'Explore SQL injection, XSS, and broken access controls in Juice Shop or DVWA.', link: '/interview-prep' },
        { title: 'Master Linux Security Hardening', desc: 'Implement iptables firewalls, SSH key restrictions, and file permission auditing.', link: '/roadmap' }
    ],
    'Frontend Developer': [
        { title: 'Build a Full-Featured React Application', desc: 'Implement custom hooks, compound components, and responsive layout architectures.', link: '/roadmap' },
        { title: 'Master TypeScript with React', desc: 'Type component props, API responses, generic state handlers, and context providers.', link: '/roadmap' },
        { title: 'Practice Modern CSS & Responsive UI', desc: 'Build pixel-perfect layouts using CSS Grid and modern design tokens.', link: '/profile' },
        { title: 'Review Frontend Performance & Rendering', desc: 'Master SSR vs CSR in Next.js, code-splitting, and memoization techniques.', link: '/interview-prep' }
    ],
    'Backend Developer': [
        { title: 'Learn Redis fundamentals', desc: 'Complete cache-aside pattern tutorial and implement cache annotations.', link: '/roadmap' },
        { title: 'Build a microservice with Spring Boot / FastAPI', desc: 'Containerize and publish your backend service with Docker and PostgreSQL.', link: '/profile' },
        { title: 'Practice backend interview questions', desc: 'Review top database indexing, transaction isolation, REST, and concurrency patterns.', link: '/interview-prep' },
        { title: 'Implement asynchronous Kafka messaging', desc: 'Set up producer/consumer event streaming for decoupled order processing.', link: '/roadmap' }
    ],
    'Full Stack Developer': [
        { title: 'Build an end-to-end full stack project', desc: 'Create a full CRUD web application connecting React frontend to backend API.', link: '/profile' },
        { title: 'Design relational database schemas', desc: 'Write normalized PostgreSQL tables, indexes, transactions, and foreign keys.', link: '/roadmap' },
        { title: 'Implement secure JWT authentication', desc: 'Set up refresh token rotation, bcrypt password hashing, and role-based access.', link: '/interview-prep' },
        { title: 'Deploy with Docker & CI/CD', desc: 'Write multi-stage Dockerfiles and automated GitHub Actions deployment pipelines.', link: '/roadmap' }
    ],
    'Data Analyst': [
        { title: 'Perform Exploratory Data Analysis (EDA)', desc: 'Clean, manipulate, and analyze datasets with Pandas, NumPy, and visualization tools.', link: '/roadmap' },
        { title: 'Build an interactive Power BI / Tableau dashboard', desc: 'Design KPI executive metrics, filter slices, and calculated measures for business insights.', link: '/profile' },
        { title: 'Master advanced SQL querying', desc: 'Practice window functions (RANK, DENSE_RANK, LAG/LEAD), CTEs, and complex joins.', link: '/interview-prep' },
        { title: 'Automate reporting with Python scripts', desc: 'Build automated data extraction and transformation pipelines scheduled via cron.', link: '/roadmap' }
    ],
    'DevOps Engineer': [
        { title: 'Provision Cloud Infrastructure with Terraform', desc: 'Write reusable HCL modules to deploy VPCs, subnets, and compute instances.', link: '/roadmap' },
        { title: 'Orchestrate Microservices on Kubernetes', desc: 'Deploy Pods, Deployments, Services, and Ingress with resource limits on Minikube.', link: '/profile' },
        { title: 'Build automated GitHub Actions CI/CD pipelines', desc: 'Automate linting, unit testing, Docker image building, and deployment stages.', link: '/roadmap' },
        { title: 'Configure Prometheus & Grafana Monitoring', desc: 'Scrape service metrics and construct alert rules for cluster resource usage.', link: '/interview-prep' }
    ],
    'AI/ML Engineer': [
        { title: 'Train & Evaluate Scikit-Learn Models', desc: 'Build regression and classification pipelines with cross-validation and hyperparameter tuning.', link: '/roadmap' },
        { title: 'Fine-tune a Deep Learning / NLP Model', desc: 'Utilize PyTorch and Hugging Face Transformers for text classification or embeddings.', link: '/roadmap' },
        { title: 'Serve ML Predictions via FastAPI', desc: 'Wrap your trained ML model inside an asynchronous FastAPI REST endpoint with Docker.', link: '/profile' },
        { title: 'Practice ML System Design & Metrics', desc: 'Review precision, recall, ROC-AUC, feature drift, and model latency tradeoffs.', link: '/interview-prep' }
    ]
};

ROLE_RECOMMENDED_ACTIONS['Java Backend Developer'] = ROLE_RECOMMENDED_ACTIONS['Backend Developer'];
ROLE_RECOMMENDED_ACTIONS['Python Backend Developer'] = ROLE_RECOMMENDED_ACTIONS['Backend Developer'];
ROLE_RECOMMENDED_ACTIONS['Cybersecurity Analyst'] = ROLE_RECOMMENDED_ACTIONS['Cybersecurity Specialist'];

export const DEFAULT_ACTIONS = [
    { title: 'Deepen core foundations', desc: 'Focus on clean architecture, design patterns, and algorithmic problem solving.', link: '/roadmap' },
    { title: 'Build a production-grade portfolio project', desc: 'Add authentication, relational databases, and live deployment to your GitHub.', link: '/profile' },
    { title: 'Practice role-specific interview questions', desc: 'Review key technical concepts and answer frameworks for upcoming campus rounds.', link: '/interview-prep' },
    { title: 'Bridge top identified skill gaps', desc: 'Follow your personalized milestone roadmap to master missing technologies.', link: '/roadmap' }
];

/**
 * Normalizes and checks if two skill names match
 */
export function isSkillMatch(skillA, skillB) {
    if (!skillA || !skillB) return false;
    const a = skillA.toLowerCase().trim();
    const b = skillB.toLowerCase().trim();

    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;

    const aParts = a.split(/[/,&+]/).map(p => p.trim()).filter(Boolean);
    const bParts = b.split(/[/,&+]/).map(p => p.trim()).filter(Boolean);

    for (const ap of aParts) {
        for (const bp of bParts) {
            if (ap === bp || (ap.length > 2 && bp.length > 2 && (ap.includes(bp) || bp.includes(ap)))) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Computes a realistic, objective Career Readiness Index (0-100%)
 */
export function calculateCareerReadiness(userSkills = [], targetRole = '', profile = {}, extraData = {}) {
    const roleSlug = getRoleSlug(targetRole);
    const displayName = getRoleDisplayName(roleSlug);
    const requiredSkills = ROLE_SKILLS_MAP[displayName] || DEFAULT_FALLBACK_SKILLS;
    
    const userSkillNames = Array.isArray(userSkills)
        ? userSkills.map(s => (typeof s === 'string' ? s : s?.skill?.name || s?.name || '')).filter(Boolean)
        : [];

    let matchedCount = 0;
    for (const req of requiredSkills) {
        if (userSkillNames.some(u => isSkillMatch(u, req))) {
            matchedCount++;
        }
    }
    const skillRatio = requiredSkills.length > 0 ? (matchedCount / requiredSkills.length) : 0;
    const skillScore = Math.round(skillRatio * 65);

    let profileScore = 0;
    if (profile?.full_name?.trim()) profileScore += 4;
    if (profile?.degree?.trim()) profileScore += 4;
    if (profile?.target_role?.trim()) profileScore += 4;
    if (profile?.location?.trim()) profileScore += 4;
    if (profile?.college?.trim() || profile?.bio?.trim()) profileScore += 4;

    let bonusScore = 0;
    if (extraData.hasResume || profile?.resume_url) bonusScore += 8;
    if (extraData.projectCount > 0) bonusScore += Math.min(7, extraData.projectCount * 3.5);
    else if (userSkillNames.length > 3) bonusScore += 5;

    const total = Math.min(98, Math.max(5, skillScore + profileScore + bonusScore));
    return Math.round(total);
}

/**
 * Returns dynamic Top Skill Gaps for the user's target role
 */
export function getSkillGapsForRole(targetRole = '', userSkills = []) {
    const roleSlug = getRoleSlug(targetRole);
    const displayName = getRoleDisplayName(roleSlug);
    const requiredSkills = ROLE_SKILLS_MAP[displayName] || DEFAULT_FALLBACK_SKILLS;
    const userSkillNames = Array.isArray(userSkills)
        ? userSkills.map(s => (typeof s === 'string' ? s : s?.skill?.name || s?.name || '')).filter(Boolean)
        : [];

    const gaps = [];
    const acquired = [];

    for (const req of requiredSkills) {
        const isAcquired = userSkillNames.some(u => isSkillMatch(u, req));
        if (isAcquired) {
            acquired.push(req);
        } else {
            gaps.push(req);
        }
    }

    const colors = ['#ef4444', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];
    const result = [];

    for (let i = 0; i < Math.min(4, gaps.length); i++) {
        const skillName = gaps[i];
        const progress = Math.floor(10 + ((i * 7) % 20));
        result.push({
            name: skillName,
            progress: progress,
            gap: `${100 - progress}% Gap`,
            color: colors[i % colors.length]
        });
    }

    if (result.length < 4) {
        for (const acq of acquired) {
            if (result.length >= 4) break;
            result.push({
                name: acq,
                progress: 85,
                gap: '15% Gap',
                color: '#10b981'
            });
        }
    }

    return result;
}

/**
 * Returns dynamic Recommended Next Actions for the user's target role
 */
export function getRecommendedActionsForRole(targetRole = '') {
    const roleSlug = getRoleSlug(targetRole);
    const displayName = getRoleDisplayName(roleSlug);
    if (ROLE_RECOMMENDED_ACTIONS[displayName]) {
        return ROLE_RECOMMENDED_ACTIONS[displayName];
    }
    return DEFAULT_ACTIONS;
}
