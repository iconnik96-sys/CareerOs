// Comprehensive Technical Skill Dictionary & Text Extractor
export const SKILL_CATALOG = [
    // Languages
    { name: 'Java', category: 'Languages', aliases: ['java', 'core java', 'j2ee', 'jvm'] },
    { name: 'Python', category: 'Languages', aliases: ['python', 'python3', 'py'] },
    { name: 'JavaScript', category: 'Languages', aliases: ['javascript', 'es6', 'vanilla js', 'js'] },
    { name: 'TypeScript', category: 'Languages', aliases: ['typescript', 'ts'] },
    { name: 'C++', category: 'Languages', aliases: ['c++', 'cpp'] },
    { name: 'C#', category: 'Languages', aliases: ['c#', 'csharp', '.net', 'dotnet', 'asp.net'] },
    { name: 'C', category: 'Languages', aliases: ['c language', 'ansi c'] },
    { name: 'Go / Golang', category: 'Languages', aliases: ['golang', 'go language'] },
    { name: 'Rust', category: 'Languages', aliases: ['rust', 'rustlang'] },
    { name: 'PHP', category: 'Languages', aliases: ['php', 'laravel', 'symfony'] },
    { name: 'Ruby', category: 'Languages', aliases: ['ruby', 'ruby on rails', 'rails'] },
    { name: 'Kotlin', category: 'Languages', aliases: ['kotlin'] },
    { name: 'Swift', category: 'Languages', aliases: ['swift', 'swiftui', 'ios development'] },
    { name: 'Dart', category: 'Languages', aliases: ['dart', 'flutter'] },
    { name: 'SQL', category: 'Languages', aliases: ['sql', 'structured query language', 'pl/sql', 't-sql'] },
    { name: 'HTML/CSS', category: 'Frontend', aliases: ['html', 'html5', 'css', 'css3', 'sass', 'scss', 'bootstrap'] },
    { name: 'Tailwind CSS', category: 'Frontend', aliases: ['tailwind', 'tailwindcss'] },
    // Frontend Frameworks
    { name: 'React', category: 'Frontend', aliases: ['react', 'react.js', 'reactjs', 'redux', 'redux toolkit', 'zustand'] },
    { name: 'Next.js', category: 'Frontend', aliases: ['next.js', 'nextjs', 'next'] },
    { name: 'Vue.js', category: 'Frontend', aliases: ['vue', 'vue.js', 'vuejs', 'vue3', 'vuex', 'pinia', 'nuxt', 'nuxtjs'] },
    { name: 'Angular', category: 'Frontend', aliases: ['angular', 'angularjs', 'angular 2+'] },
    { name: 'Svelte', category: 'Frontend', aliases: ['svelte', 'sveltekit'] },
    // Backend Frameworks
    { name: 'Spring Boot', category: 'Backend', aliases: ['spring boot', 'spring framework', 'spring security', 'spring mvc', 'spring data', 'hibernate', 'jpa'] },
    { name: 'Node.js', category: 'Backend', aliases: ['node.js', 'nodejs', 'node'] },
    { name: 'Express.js', category: 'Backend', aliases: ['express', 'express.js', 'expressjs'] },
    { name: 'FastAPI', category: 'Backend', aliases: ['fastapi', 'uvicorn', 'pydantic'] },
    { name: 'Django', category: 'Backend', aliases: ['django', 'django rest framework', 'drf'] },
    { name: 'Flask', category: 'Backend', aliases: ['flask'] },
    { name: 'NestJS', category: 'Backend', aliases: ['nestjs', 'nest.js'] },
    { name: 'GraphQL', category: 'Backend', aliases: ['graphql', 'apollo graphql'] },
    // Databases & Caches
    { name: 'PostgreSQL', category: 'Databases', aliases: ['postgresql', 'postgres', 'psql'] },
    { name: 'MySQL', category: 'Databases', aliases: ['mysql', 'mariadb'] },
    { name: 'MongoDB', category: 'Databases', aliases: ['mongodb', 'mongo', 'mongoose'] },
    { name: 'Redis', category: 'Databases', aliases: ['redis', 'caching'] },
    { name: 'SQLite', category: 'Databases', aliases: ['sqlite', 'sqlite3'] },
    { name: 'Firebase', category: 'Databases', aliases: ['firebase', 'firestore', 'realtime database'] },
    { name: 'Supabase', category: 'Databases', aliases: ['supabase'] },
    { name: 'Elasticsearch', category: 'Databases', aliases: ['elasticsearch', 'elastic search', 'kibana'] },
    { name: 'Cassandra', category: 'Databases', aliases: ['cassandra', 'apache cassandra'] },
    { name: 'DynamoDB', category: 'Databases', aliases: ['dynamodb', 'amazon dynamodb'] },
    // Cloud & DevOps
    { name: 'AWS', category: 'Cloud & DevOps', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'rds', 'lambda', 'cloudwatch', 'iam'] },
    { name: 'Docker', category: 'Cloud & DevOps', aliases: ['docker', 'containerization', 'docker-compose', 'dockerfile'] },
    { name: 'Kubernetes', category: 'Cloud & DevOps', aliases: ['kubernetes', 'k8s', 'helm', 'minikube'] },
    { name: 'Google Cloud (GCP)', category: 'Cloud & DevOps', aliases: ['gcp', 'google cloud', 'google cloud platform', 'bigquery'] },
    { name: 'Microsoft Azure', category: 'Cloud & DevOps', aliases: ['azure', 'microsoft azure', 'azure devops'] },
    { name: 'CI/CD', category: 'Cloud & DevOps', aliases: ['ci/cd', 'github actions', 'jenkins', 'gitlab ci', 'circleci', 'travis ci'] },
    { name: 'Linux / Bash', category: 'Cloud & DevOps', aliases: ['linux', 'bash', 'shell script', 'shell scripting', 'ubuntu'] },
    { name: 'Terraform', category: 'Cloud & DevOps', aliases: ['terraform', 'infrastructure as code', 'iac'] },
    // Architecture & Messaging
    { name: 'REST APIs', category: 'Architecture', aliases: ['rest', 'restful', 'rest api', 'rest apis', 'api design', 'restful api', 'restful apis'] },
    { name: 'Microservices', category: 'Architecture', aliases: ['microservices', 'microservice', 'distributed systems'] },
    { name: 'Apache Kafka', category: 'Architecture', aliases: ['kafka', 'apache kafka', 'event streaming'] },
    { name: 'RabbitMQ', category: 'Architecture', aliases: ['rabbitmq', 'message queue', 'amqp'] },
    { name: 'WebSockets', category: 'Architecture', aliases: ['websocket', 'websockets', 'socket.io'] },
    { name: 'System Design', category: 'Architecture', aliases: ['system design', 'load balancing', 'horizontal scaling', 'microservices architecture'] },
    // Testing & Quality
    { name: 'JUnit / Mockito', category: 'Testing', aliases: ['junit', 'junit 5', 'mockito', 'test-driven development', 'tdd'] },
    { name: 'PyTest', category: 'Testing', aliases: ['pytest', 'unittest'] },
    { name: 'Jest / Cypress', category: 'Testing', aliases: ['jest', 'cypress', 'mocha', 'chai', 'playwright', 'selenium'] },
    // AI & Data
    { name: 'Machine Learning', category: 'AI & Data', aliases: ['machine learning', 'deep learning', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'nlp', 'computer vision'] },
    { name: 'Data Analysis', category: 'AI & Data', aliases: ['data analysis', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'power bi', 'tableau'] },
    // Tools & Version Control
    { name: 'Git / GitHub', category: 'Tools', aliases: ['git', 'github', 'gitlab', 'bitbucket', 'version control'] },
    { name: 'Postman', category: 'Tools', aliases: ['postman', 'api testing', 'swagger', 'openapi'] }
];
/**
 * Scans arbitrary text (e.g. parsed resume text) and detects technical skills.
 * Handles boundary checks to avoid false positives on short acronyms.
 */
export function extractSkillsFromText(text) {
    if (!text || typeof text !== 'string')
        return [];
    const normalized = ' ' + text.toLowerCase().replace(/[\r\n\t]/g, ' ') + ' ';
    const matched = [];
    for (const entry of SKILL_CATALOG) {
        for (const alias of entry.aliases) {
            // Escape regex special chars except + and #
            const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Create pattern ensuring word/boundary separation
            const pattern = new RegExp(`(?:^|[^a-zA-Z0-9_#+])${escaped}(?:$|[^a-zA-Z0-9_#+])`, 'i');
            if (pattern.test(normalized)) {
                matched.push(entry.name);
                break;
            }
        }
    }
    return matched;
}
