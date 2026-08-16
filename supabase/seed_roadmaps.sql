-- ====================================================================
-- CareerOS — Role Roadmaps Database Seed Script
-- Description: Manual, curated roadmaps for every career track.
-- You can run this script directly in the Supabase SQL Editor.
-- ====================================================================

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS public.role_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    phases JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_role_roadmaps_role_id ON public.role_roadmaps(role_id);

-- Enable RLS and grant read access
ALTER TABLE public.role_roadmaps ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'role_roadmaps' AND policyname = 'Anyone can view role roadmaps'
    ) THEN
        CREATE POLICY "Anyone can view role roadmaps" 
            ON public.role_roadmaps FOR SELECT 
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'role_roadmaps' AND policyname = 'Authenticated users can manage role roadmaps'
    ) THEN
        CREATE POLICY "Authenticated users can manage role roadmaps" 
            ON public.role_roadmaps FOR ALL 
            WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;


-- ====================================================================
-- 2. Seed Manual Roadmaps for All Major Career Roles
-- ====================================================================

-- Track 1: Backend Developer (Java / Python / Node / Microservices)
INSERT INTO public.role_roadmaps (role_id, title, description, phases)
VALUES (
    'backend',
    'Backend Developer',
    'Curated curriculum covering server-side architecture, relational & NoSQL databases, RESTful APIs, distributed caching, and microservices.',
    '[
        {
            "id": "be-phase-1",
            "phase_number": 1,
            "title": "Core Languages & Data Structures",
            "description": "Master core backend programming, OOP principles, and computational algorithmic complexity.",
            "status": "IN_PROGRESS",
            "skills": [
                {
                    "id": "be-s-1",
                    "name": "Core Java / Python Foundations",
                    "category": "Languages",
                    "estimated_effort": "3-4 weeks",
                    "why_learn": "Core backend language proficiency with OOP, exception handling, memory management, and concurrency.",
                    "status": "IN_PROGRESS",
                    "what_to_learn": [
                        "Object-Oriented Programming (Polymorphism, Inheritance, Encapsulation)",
                        "Collections framework & Data Structures (Lists, Sets, Maps, Queues)",
                        "Multi-threading, Async/Await, and Concurrency Controls",
                        "Memory management and garbage collection basics"
                    ],
                    "suggested_project": "Build a multi-threaded CLI task runner or in-memory LRU cache."
                },
                {
                    "id": "be-s-2",
                    "name": "Data Structures & Algorithms (LeetCode)",
                    "category": "Algorithms",
                    "estimated_effort": "4-6 weeks",
                    "why_learn": "Mandatory for passing backend technical assessments and writing time/space-optimal code.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Time & Space Complexity analysis (Big-O notation)",
                        "Binary Search, Two Pointers, and Sliding Window techniques",
                        "Trees, Binary Search Trees, DFS & BFS graph traversals",
                        "Dynamic Programming and Greedy algorithms"
                    ],
                    "suggested_project": "Solve 75 curated Blind 75 LeetCode challenges in your primary language."
                }
            ]
        },
        {
            "id": "be-phase-2",
            "phase_number": 2,
            "title": "Databases & API Engineering",
            "description": "Design normalized schemas, optimize complex SQL queries, and build robust REST APIs.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "be-s-3",
                    "name": "Relational Databases & PostgreSQL",
                    "category": "Databases",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Relational databases are the backbone of production transaction systems requiring ACID guarantees.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Schema normalization (1NF to 3NF) and Foreign Key constraints",
                        "B-Tree indexing, Composite Indexes, and Query EXPLAIN ANALYZE",
                        "ACID transactions, Row locking, and Isolation Levels",
                        "Complex JOINs, Window Functions, and CTEs"
                    ],
                    "suggested_project": "Design a high-concurrency banking ledger database schema with transactional transfer guarantees."
                },
                {
                    "id": "be-s-4",
                    "name": "REST API Development (Spring Boot / FastAPI)",
                    "category": "API Frameworks",
                    "estimated_effort": "3-4 weeks",
                    "why_learn": "Industrial-standard frameworks for structuring modular, secure, testable web services.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "REST architectural constraints and HTTP status codes",
                        "Request validation, Global Exception Handlers, and DTOs",
                        "JWT Authentication, Role-based Access Control (RBAC), and bcrypt",
                        "Database ORM/Query builders (JPA/Hibernate or SQLAlchemy)"
                    ],
                    "suggested_project": "Create a fully functional E-commerce backend API with catalog search, auth, and order checkout."
                }
            ]
        },
        {
            "id": "be-phase-3",
            "phase_number": 3,
            "title": "Caching, Messaging & System Design",
            "description": "Scale backend systems to handle high concurrency with Redis, Kafka, Docker, and distributed architectural patterns.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "be-s-5",
                    "name": "Distributed Caching with Redis",
                    "category": "Scalability",
                    "estimated_effort": "2 weeks",
                    "why_learn": "Sub-millisecond latency caching to prevent database overload under peak traffic.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Cache-Aside, Write-Through, and Write-Back patterns",
                        "Cache Invalidation strategies & TTL expiration",
                        "Preventing Cache Stampede, Cache Penetration, and Avalanche",
                        "Redis Data Structures (Hashes, Sorted Sets, Pub/Sub)"
                    ],
                    "suggested_project": "Implement an API rate limiter (Token Bucket) and product leaderboard with Redis."
                },
                {
                    "id": "be-s-6",
                    "name": "Message Queues & Microservices (Kafka / RabbitMQ)",
                    "category": "Distributed Systems",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Decouple services asynchronously for resilient event-driven architectures.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Event-driven architecture: Topics, Partitions, and Consumer Groups",
                        "At-least-once vs Exactly-once message delivery semantics",
                        "Docker containerization of multi-container microservices",
                        "Microservice patterns: API Gateway, Circuit Breaker (Resilience4j)"
                    ],
                    "suggested_project": "Build an asynchronous notification & email dispatch microservice with Kafka and Docker."
                }
            ]
        }
    ]'::jsonb
)
ON CONFLICT (role_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    phases = EXCLUDED.phases,
    updated_at = NOW();


-- Track 2: Cybersecurity Specialist (SOC, Pentesting, Network & Cloud Security)
INSERT INTO public.role_roadmaps (role_id, title, description, phases)
VALUES (
    'cybersecurity',
    'Cybersecurity Specialist',
    'Curriculum covering network security, Linux hardening, OWASP Top 10 web vulnerabilities, SIEM/SOC log analysis, and incident response.',
    '[
        {
            "id": "cs-phase-1",
            "phase_number": 1,
            "title": "Networking & Operating System Security",
            "description": "Understand core protocols, packet inspection, Linux internals, and access control models.",
            "status": "IN_PROGRESS",
            "skills": [
                {
                    "id": "cs-s-1",
                    "name": "Networking Protocols & Wireshark Traffic Analysis",
                    "category": "Networking",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Recognizing anomalous packet traffic, protocol headers, and network attacks at the packet layer.",
                    "status": "IN_PROGRESS",
                    "what_to_learn": [
                        "OSI & TCP/IP 4-layer model (TCP 3-way handshake, UDP, ICMP)",
                        "DNS, DHCP, ARP Poisoning, and Man-in-the-Middle (MitM) mechanics",
                        "Packet sniffing and PCAP traffic dissection in Wireshark",
                        "Port scanning techniques and service enumeration with Nmap"
                    ],
                    "suggested_project": "Analyze infected PCAP network captures to identify malware beaconing and exfiltration IPs."
                },
                {
                    "id": "cs-s-2",
                    "name": "Linux Security & System Hardening",
                    "category": "Operating Systems",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Servers run on Linux; mastering CLI administration, permissions, and auditing is foundational.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Linux file permissions (chmod, chown, SUID/SGID, sticky bit)",
                        "Configuring host firewalls (iptables / UFW) and SSH hardening",
                        "Log analysis (/var/log/auth.log, syslog, journalctl)",
                        "Automated bash scripting for security auditing"
                    ],
                    "suggested_project": "Write a Bash script that audits and hardens an Ubuntu server against CIS benchmarks."
                }
            ]
        },
        {
            "id": "cs-phase-2",
            "phase_number": 2,
            "title": "Application Security & Vulnerability Assessment",
            "description": "Identify, exploit, and remediate common application layer vulnerabilities.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "cs-s-3",
                    "name": "OWASP Top 10 Web Vulnerabilities",
                    "category": "Web Security",
                    "estimated_effort": "4 weeks",
                    "why_learn": "The definitive security standard for identifying and preventing critical web application flaws.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "SQL Injection (SQLi) & Cross-Site Scripting (XSS: Stored, Reflected, DOM)",
                        "Cross-Site Request Forgery (CSRF) and Broken Object Level Auth (BOLA)",
                        "Security Misconfigurations & Sensitive Data Exposure",
                        "Intercepting HTTP traffic with Burp Suite Proxy"
                    ],
                    "suggested_project": "Complete OWASP Juice Shop challenges and compile a professional remediation report."
                },
                {
                    "id": "cs-s-4",
                    "name": "Cryptography & Public Key Infrastructure (PKI)",
                    "category": "Cryptography",
                    "estimated_effort": "2 weeks",
                    "why_learn": "Ensure confidentiality, integrity, and non-repudiation in modern communication protocols.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Symmetric (AES, ChaCha20) vs Asymmetric encryption (RSA, ECC)",
                        "Hashing algorithms (SHA-256, bcrypt) and Salt/HMAC integrity",
                        "TLS/SSL Handshake and X.509 Digital Certificate management"
                    ],
                    "suggested_project": "Build an encrypted messaging CLI tool using AES-GCM and RSA key exchange in Python."
                }
            ]
        },
        {
            "id": "cs-phase-3",
            "phase_number": 3,
            "title": "SOC Operations, SIEM & Incident Response",
            "description": "Detect active intrusions, analyze telemetry, and execute incident response playbooks.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "cs-s-5",
                    "name": "SIEM & Log Analysis (Elastic / Splunk / Wazuh)",
                    "category": "Blue Team / SOC",
                    "estimated_effort": "3-4 weeks",
                    "why_learn": "Essential for Security Operations Center (SOC) analysts to correlate alerts across enterprise assets.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Ingesting Windows Event Logs (Sysmon) and Linux auditd logs",
                        "Writing detection rules (Sigma rules, KQL, SPL)",
                        "MITRE ATT&CK Framework mapping for threat adversary behaviors",
                        "Brute force, lateral movement, and privilege escalation alert triage"
                    ],
                    "suggested_project": "Set up a virtual SOC home lab with Wazuh/Elastic and generate detection alerts for brute force attacks."
                },
                {
                    "id": "cs-s-6",
                    "name": "Incident Response & Digital Forensics Basics",
                    "category": "Incident Response",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Execute structured response methodologies during a breach to contain and eradicate threats.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "NIST & SANS Incident Response lifecycle (Preparation to Post-Incident)",
                        "Memory forensics basics with Volatility",
                        "Triage artifact collection (Prefetch, Amcache, Shimcache, Browser history)"
                    ],
                    "suggested_project": "Analyze a compromised memory dump to extract injected malicious DLLs and C2 IP addresses."
                }
            ]
        }
    ]'::jsonb
)
ON CONFLICT (role_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    phases = EXCLUDED.phases,
    updated_at = NOW();


-- Track 3: Frontend Developer (React, Next.js, TypeScript, State Management, UI/UX)
INSERT INTO public.role_roadmaps (role_id, title, description, phases)
VALUES (
    'frontend',
    'Frontend Developer',
    'Comprehensive track covering modern JavaScript/TypeScript, React 19, responsive layout systems, client state management, and web performance.',
    '[
        {
            "id": "fe-phase-1",
            "phase_number": 1,
            "title": "Modern JavaScript & Responsive Web Design",
            "description": "Master ES6+ syntax, asynchronous programming, DOM manipulation, and CSS Grid/Flexbox architectures.",
            "status": "IN_PROGRESS",
            "skills": [
                {
                    "id": "fe-s-1",
                    "name": "Modern JavaScript (ES6+) & DOM",
                    "category": "Core Languages",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Deep language mastery of closures, prototypes, event loop, and promises is crucial for frontend engineering.",
                    "status": "IN_PROGRESS",
                    "what_to_learn": [
                        "Closures, Scopes, Hoisting, and Execution Contexts",
                        "Event Loop, Microtasks, Promises, and Async/Await",
                        "DOM Event Delegation, Bubbling, and Event Listeners",
                        "Array methods (map, filter, reduce) and Object destructuring"
                    ],
                    "suggested_project": "Build an interactive Kanban board with vanilla JS and HTML5 Drag and Drop API."
                },
                {
                    "id": "fe-s-2",
                    "name": "Advanced CSS, Flexbox, Grid & Responsive UI",
                    "category": "Styling",
                    "estimated_effort": "2 weeks",
                    "why_learn": "Building pixel-perfect, accessible, and responsive user interfaces across all screen breakpoints.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "CSS Grid layout, Flexbox alignment, and Subgrid",
                        "CSS Custom Properties (Variables) and Theme Switching",
                        "Animations, Transitions, and Keyframes",
                        "Mobile-first media queries and responsive typography"
                    ],
                    "suggested_project": "Design a responsive SaaS landing page with dark/light mode and micro-interactions."
                }
            ]
        },
        {
            "id": "fe-phase-2",
            "phase_number": 2,
            "title": "React, TypeScript & State Management",
            "description": "Build scalable, type-safe single page applications with component-driven architecture.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "fe-s-3",
                    "name": "React Fundamentals & Custom Hooks",
                    "category": "Frameworks",
                    "estimated_effort": "4 weeks",
                    "why_learn": "React is the dominant frontend framework used across the industry.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Component lifecycle, JSX, and Props/State management",
                        "Hooks: useState, useEffect, useMemo, useCallback, useRef",
                        "Building reusable custom hooks for data fetching and debouncing",
                        "Context API and compound component design patterns"
                    ],
                    "suggested_project": "Build an interactive Analytics Dashboard with filters, live charts, and paginated tables."
                },
                {
                    "id": "fe-s-4",
                    "name": "TypeScript for React Developers",
                    "category": "Type Safety",
                    "estimated_effort": "2-3 weeks",
                    "why_learn": "Eliminate runtime bugs and establish self-documenting code in large frontend codebases.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Generics, Interfaces, Type Aliases, and Union Types",
                        "Typing React Props, Events, HTML elements, and Hooks",
                        "Utility Types (Partial, Pick, Omit, Record)",
                        "Typing async API responses and error states"
                    ],
                    "suggested_project": "Refactor a JavaScript React application into strict, type-safe TypeScript."
                }
            ]
        },
        {
            "id": "fe-phase-3",
            "phase_number": 3,
            "title": "Next.js, Performance & Testing",
            "description": "Production frontend architecture with Server-Side Rendering (SSR), Core Web Vitals optimization, and automated testing.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "fe-s-5",
                    "name": "Next.js & Server Components",
                    "category": "Fullstack Frontend",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Next.js App Router delivers blazing-fast SEO, static pre-rendering, and streaming UI.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "App Router, Server Components vs Client Components",
                        "Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR)",
                        "API Routes and Server Actions for data mutations",
                        "Dynamic routing, loading states, and error boundaries"
                    ],
                    "suggested_project": "Build a high-performance content platform / blog with dynamic SSR and SEO metadata."
                },
                {
                    "id": "fe-s-6",
                    "name": "Frontend Testing & Web Performance Optimization",
                    "category": "Quality & Performance",
                    "estimated_effort": "2-3 weeks",
                    "why_learn": "Ensure bulletproof stability and top 100/100 Lighthouse performance metrics.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Unit testing with Vitest / Jest and React Testing Library",
                        "Core Web Vitals (LCP, FID/INP, CLS) optimization",
                        "Code splitting, Lazy loading, and Image optimization",
                        "Lighthouse audits and bundle size analyzers"
                    ],
                    "suggested_project": "Write comprehensive component tests and optimize a web app to achieve 95+ Lighthouse score."
                }
            ]
        }
    ]'::jsonb
)
ON CONFLICT (role_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    phases = EXCLUDED.phases,
    updated_at = NOW();


-- Track 4: Full Stack Developer (React, Node / Python, SQL/NoSQL, Docker & Cloud)
INSERT INTO public.role_roadmaps (role_id, title, description, phases)
VALUES (
    'fullstack',
    'Full Stack Developer',
    'End-to-end curriculum bridging responsive client applications with scalable server-side APIs, relational databases, and cloud deployments.',
    '[
        {
            "id": "fs-phase-1",
            "phase_number": 1,
            "title": "Full Stack Foundations & UI Engineering",
            "description": "Build dynamic user interfaces and connect them to backend servers.",
            "status": "IN_PROGRESS",
            "skills": [
                {
                    "id": "fs-s-1",
                    "name": "React & Modern Client Architecture",
                    "category": "Frontend",
                    "estimated_effort": "3-4 weeks",
                    "why_learn": "Construct modular, responsive client-side SPAs that consume RESTful or GraphQL endpoints.",
                    "status": "IN_PROGRESS",
                    "what_to_learn": [
                        "React components, state, hooks, and lifecycle",
                        "State management (Zustand / Redux Toolkit)",
                        "Client-side routing with React Router",
                        "Form validation and asynchronous data fetching (TanStack Query)"
                    ],
                    "suggested_project": "Build a responsive social media feed with comments, likes, and image uploads."
                },
                {
                    "id": "fs-s-2",
                    "name": "Node.js & Express / Python API Development",
                    "category": "Backend",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Create performant server-side REST APIs handling routing, middleware, and business logic.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Express.js / FastAPI routing and middleware chains",
                        "Authentication with JWT, refresh tokens, and bcrypt",
                        "CORS policies, rate limiting, and security headers (Helmet)",
                        "File uploads, validation schemas, and error handling"
                    ],
                    "suggested_project": "Build a full REST API for an issue tracker with role-based permissions."
                }
            ]
        },
        {
            "id": "fs-phase-2",
            "phase_number": 2,
            "title": "Database Architecture & End-to-End Integration",
            "description": "Design relational & NoSQL schemas, write transactions, and connect full stack apps.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "fs-s-3",
                    "name": "Relational Databases & ORM (PostgreSQL & Prisma/TypeORM)",
                    "category": "Databases",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Persist and query relational structured data with type-safe schema migrations.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "PostgreSQL schema design and relationships (1-1, 1-N, N-N)",
                        "Prisma / TypeORM / Drizzle migrations and seeds",
                        "Transactions, indexes, and complex aggregations",
                        "NoSQL document databases (MongoDB) basics"
                    ],
                    "suggested_project": "Build a multi-tenant project management SaaS with team workspaces and billing schemas."
                },
                {
                    "id": "fs-s-4",
                    "name": "Real-time Communication & WebSockets",
                    "category": "Real-time",
                    "estimated_effort": "2 weeks",
                    "why_learn": "Enable instantaneous live updates between clients and servers without polling.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "WebSocket protocol vs HTTP long-polling",
                        "Socket.io rooms, events, and disconnect handling",
                        "Broadcasting presence and live notifications",
                        "Securing WebSocket handshakes with JWT"
                    ],
                    "suggested_project": "Create a real-time collaborative whiteboarding / chat room application."
                }
            ]
        },
        {
            "id": "fs-phase-3",
            "phase_number": 3,
            "title": "Docker, CI/CD & Cloud Deployment",
            "description": "Containerize full stack applications and set up automated deployment pipelines.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "fs-s-5",
                    "name": "Docker & Multi-Container Orchestration",
                    "category": "DevOps",
                    "estimated_effort": "2-3 weeks",
                    "why_learn": "Package frontend, backend, and database services into reproducible container images.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Multi-stage Dockerfiles for optimized production builds",
                        "Docker Compose for local full stack multi-service orchestration",
                        "Volume persistence and network bridging between containers",
                        "Environment variable injection and secrets management"
                    ],
                    "suggested_project": "Dockerize a React + Node.js + PostgreSQL + Redis full stack app with Docker Compose."
                },
                {
                    "id": "fs-s-6",
                    "name": "CI/CD Pipelines & Cloud Hosting",
                    "category": "Cloud & CI/CD",
                    "estimated_effort": "2 weeks",
                    "why_learn": "Automate testing and continuous deployment to AWS/Vercel/Render.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "GitHub Actions automated lint, test, and build workflows",
                        "Deploying frontend to Vercel/Cloudflare and backend to AWS/Render",
                        "Custom domains, SSL certificates, and CORS configurations",
                        "Monitoring, logging, and error tracking (Sentry)"
                    ],
                    "suggested_project": "Set up a complete CI/CD pipeline that automatically tests and deploys code on Git push."
                }
            ]
        }
    ]'::jsonb
)
ON CONFLICT (role_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    phases = EXCLUDED.phases,
    updated_at = NOW();


-- Track 5: Data Analyst (SQL, Python, Pandas, Power BI, Tableau, EDA)
INSERT INTO public.role_roadmaps (role_id, title, description, phases)
VALUES (
    'data-analyst',
    'Data Analyst',
    'Curriculum focusing on advanced SQL querying, data cleaning with Python/Pandas, statistical exploratory analysis, and executive Power BI dashboards.',
    '[
        {
            "id": "da-phase-1",
            "phase_number": 1,
            "title": "Advanced SQL & Relational Analytics",
            "description": "Master SQL querying, window functions, CTEs, and business KPI metrics extraction.",
            "status": "IN_PROGRESS",
            "skills": [
                {
                    "id": "da-s-1",
                    "name": "Advanced SQL for Analytics",
                    "category": "SQL",
                    "estimated_effort": "3-4 weeks",
                    "why_learn": "SQL is the #1 required skill for every data analyst to query relational data warehouses.",
                    "status": "IN_PROGRESS",
                    "what_to_learn": [
                        "Window functions (ROW_NUMBER, RANK, DENSE_RANK, LEAD/LAG, NTILE)",
                        "Common Table Expressions (CTEs) and recursive queries",
                        "Complex aggregate aggregations with GROUP BY and HAVING",
                        "Calculating Month-over-Month growth, churn, and retention metrics"
                    ],
                    "suggested_project": "Analyze a retail transactional dataset to identify top customer cohorts and churn rates."
                },
                {
                    "id": "da-s-2",
                    "name": "Excel for Business Intelligence & Modeling",
                    "category": "Spreadsheets",
                    "estimated_effort": "2 weeks",
                    "why_learn": "Standard corporate medium for ad-hoc business models, financial forecasting, and pivots.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "XLOOKUP, INDEX/MATCH, SUMIFS, and dynamic array formulas",
                        "Pivot Tables, Slicers, and Pivot Charts",
                        "Power Query for Excel ETL extraction and transformation",
                        "What-If Analysis, Goal Seek, and Scenario Manager"
                    ],
                    "suggested_project": "Build an executive financial budget and revenue forecasting model in Excel."
                }
            ]
        },
        {
            "id": "da-phase-2",
            "phase_number": 2,
            "title": "Python Data Wrangling & Exploratory Analysis (EDA)",
            "description": "Transform messy raw datasets and uncover hidden patterns with Pandas, NumPy, and Seaborn.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "da-s-3",
                    "name": "Python, Pandas & NumPy Data Cleaning",
                    "category": "Python Analytics",
                    "estimated_effort": "3-4 weeks",
                    "why_learn": "Handle million-row datasets, clean missing data, and reshape data frames programmatically.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Data manipulation with DataFrames and Series in Pandas",
                        "Handling null values, duplicate records, and data type conversions",
                        "Merging, joining, concatenating, and melting datasets",
                        "DateTime parsing, string manipulation, and regex extraction"
                    ],
                    "suggested_project": "Clean and normalize a messy 100k+ row real estate dataset using Pandas."
                },
                {
                    "id": "da-s-4",
                    "name": "Exploratory Data Analysis & Statistics",
                    "category": "Statistics",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Apply statistical distributions and hypotheses to validate actionable business findings.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Descriptive statistics (Mean, Median, Standard Deviation, IQR)",
                        "Hypothesis testing (A/B testing, p-values, t-tests, Chi-square)",
                        "Correlation vs Causation analysis",
                        "Visualizing distributions with Matplotlib and Seaborn"
                    ],
                    "suggested_project": "Perform a complete A/B test analysis on e-commerce conversion rates and present findings."
                }
            ]
        },
        {
            "id": "da-phase-3",
            "phase_number": 3,
            "title": "Business Intelligence Dashboards & Data Storytelling",
            "description": "Design interactive, real-time executive dashboards with Power BI and Tableau.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "da-s-5",
                    "name": "Power BI & DAX Calculations",
                    "category": "BI Tools",
                    "estimated_effort": "3 weeks",
                    "why_learn": "The market-leading BI suite for corporate enterprise analytics and executive reporting.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Data Modeling: Star schemas, Snowflake schemas, and active relationships",
                        "DAX formulas (CALCULATE, FILTER, ALL, RELATED, Time Intelligence)",
                        "Custom drill-through reports, interactive slicers, and KPI cards",
                        "Publishing reports and scheduled dataset refreshes"
                    ],
                    "suggested_project": "Build an interactive Executive Sales & Profitability Dashboard in Power BI."
                },
                {
                    "id": "da-s-6",
                    "name": "Data Storytelling & Executive Presentations",
                    "category": "Communication",
                    "estimated_effort": "2 weeks",
                    "why_learn": "Translating quantitative metrics into high-impact strategic business recommendations.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Choosing the right chart types (avoiding pie chart pitfalls)",
                        "Designing decluttered, accessible visualization layouts",
                        "Structuring executive presentations (Problem -> Insight -> Action)",
                        "Automating weekly reporting pipelines"
                    ],
                    "suggested_project": "Create a 5-slide executive presentation delivering actionable recommendations based on churn data."
                }
            ]
        }
    ]'::jsonb
)
ON CONFLICT (role_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    phases = EXCLUDED.phases,
    updated_at = NOW();


-- Track 6: AI/ML Engineer (Python, PyTorch, Deep Learning, LLMs, RAG, MLOps)
INSERT INTO public.role_roadmaps (role_id, title, description, phases)
VALUES (
    'ai-ml',
    'AI/ML Engineer',
    'Master classical Machine Learning, Deep Learning architectures with PyTorch, Large Language Models (LLMs), RAG pipelines, and production MLOps deployment.',
    '[
        {
            "id": "ai-phase-1",
            "phase_number": 1,
            "title": "Math Foundations & Classical Machine Learning",
            "description": "Build mathematical rigor in linear algebra, calculus, probability, and Scikit-Learn algorithms.",
            "status": "IN_PROGRESS",
            "skills": [
                {
                    "id": "ai-s-1",
                    "name": "Math for Machine Learning & Python Foundations",
                    "category": "Foundations",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Understand gradient descent, matrix transformations, and loss function optimizations under the hood.",
                    "status": "IN_PROGRESS",
                    "what_to_learn": [
                        "Linear Algebra: Matrix multiplication, Eigenvalues, SVD",
                        "Multivariate Calculus: Partial derivatives, gradients, chain rule",
                        "Probability & Statistics: Bayes Theorem, distributions, expectation",
                        "Vectorized computing with NumPy and SciPy"
                    ],
                    "suggested_project": "Implement Linear Regression and Logistic Regression from scratch using only NumPy."
                },
                {
                    "id": "ai-s-2",
                    "name": "Supervised & Unsupervised Machine Learning (Scikit-Learn)",
                    "category": "Classical ML",
                    "estimated_effort": "4 weeks",
                    "why_learn": "Industry-standard models for tabular classification, regression, and clustering.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Decision Trees, Random Forests, and Gradient Boosting (XGBoost / LightGBM)",
                        "Support Vector Machines (SVM), K-Means, and PCA dimensionality reduction",
                        "Hyperparameter tuning (GridSearchCV, Optuna) and cross-validation",
                        "Evaluation metrics: Precision, Recall, F1-Score, ROC-AUC, RMSE"
                    ],
                    "suggested_project": "Build an end-to-end customer churn prediction pipeline with XGBoost and Optuna."
                }
            ]
        },
        {
            "id": "ai-phase-2",
            "phase_number": 2,
            "title": "Deep Learning & Neural Networks (PyTorch)",
            "description": "Construct neural architectures for computer vision and natural language processing.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "ai-s-3",
                    "name": "PyTorch & Deep Neural Networks",
                    "category": "Deep Learning",
                    "estimated_effort": "4 weeks",
                    "why_learn": "PyTorch is the premier framework used for modern AI research and industrial applications.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "PyTorch Tensors, Autograd, Dataset, and DataLoader abstractions",
                        "Multilayer Perceptrons (MLPs), Activation functions (ReLU, GELU)",
                        "Convolutional Neural Networks (CNNs) for image classification",
                        "Recurrent architectures (LSTMs, GRUs) and Attention mechanism"
                    ],
                    "suggested_project": "Train a custom PyTorch image classification model on a medical dataset with transfer learning (ResNet)."
                },
                {
                    "id": "ai-s-4",
                    "name": "Transformers, LLMs & Retrieval-Augmented Generation (RAG)",
                    "category": "Generative AI",
                    "estimated_effort": "4 weeks",
                    "why_learn": "Generative AI and RAG are the fastest-growing sectors in enterprise software.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Transformer architecture: Self-attention, Positional Encoding, Encoders/Decoders",
                        "Hugging Face Transformers library and model fine-tuning (LoRA / QLoRA)",
                        "Vector databases (Pinecone, Qdrant, ChromaDB) and text embeddings",
                        "Building RAG systems with LangChain / LlamaIndex"
                    ],
                    "suggested_project": "Build an enterprise document Q&A copilot using RAG, vector embeddings, and FastAPI."
                }
            ]
        },
        {
            "id": "ai-phase-3",
            "phase_number": 3,
            "title": "MLOps, Model Serving & Deployment",
            "description": "Package, serve, and monitor AI models in high-availability production environments.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "ai-s-5",
                    "name": "Model Serving with FastAPI & Docker",
                    "category": "Serving",
                    "estimated_effort": "2-3 weeks",
                    "why_learn": "Expose trained AI models through low-latency REST endpoints with batching support.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Async API serving with FastAPI and Pydantic validation",
                        "Model serialization (ONNX, TorchScript, Joblib)",
                        "Batch inference vs real-time inference optimization",
                        "Containerizing ML microservices with GPU/CPU Docker builds"
                    ],
                    "suggested_project": "Deploy a containerized FastAPI endpoint serving an ONNX-optimized sentiment analysis model."
                },
                {
                    "id": "ai-s-6",
                    "name": "MLOps, Experiment Tracking & Monitoring (MLflow)",
                    "category": "MLOps",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Track experiments, manage model registries, and detect data/concept drift in production.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Experiment tracking and model registry with MLflow / Weights & Biases",
                        "Data versioning with DVC",
                        "Detecting feature drift and model degradation in production",
                        "Automated retraining pipelines with GitHub Actions"
                    ],
                    "suggested_project": "Build an automated ML training and model registry pipeline using MLflow."
                }
            ]
        }
    ]'::jsonb
)
ON CONFLICT (role_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    phases = EXCLUDED.phases,
    updated_at = NOW();


-- Track 7: DevOps Engineer (Linux, Docker, Kubernetes, Terraform, CI/CD, AWS)
INSERT INTO public.role_roadmaps (role_id, title, description, phases)
VALUES (
    'devops',
    'DevOps Engineer',
    'Curriculum spanning Linux administration, container orchestration with Kubernetes, Infrastructure as Code (Terraform), CI/CD pipelines, and Prometheus monitoring.',
    '[
        {
            "id": "do-phase-1",
            "phase_number": 1,
            "title": "Linux, Networking & Containers",
            "description": "Master Unix systems engineering, network routing, and containerization fundamentals.",
            "status": "IN_PROGRESS",
            "skills": [
                {
                    "id": "do-s-1",
                    "name": "Linux Systems Administration & Bash Scripting",
                    "category": "Core OS",
                    "estimated_effort": "3 weeks",
                    "why_learn": "95%+ of production servers and cloud infrastructure run on Linux distributions.",
                    "status": "IN_PROGRESS",
                    "what_to_learn": [
                        "Process management (systemd, ps, top, htop, nice, kill)",
                        "File systems, disk partitioning (LVM), and I/O redirection",
                        "Automated Shell/Bash scripting with error traps and arguments",
                        "User management, SSH key management, and sudoers permissions"
                    ],
                    "suggested_project": "Write an automated Linux backup and log rotation script with alerting."
                },
                {
                    "id": "do-s-2",
                    "name": "Docker & Container Architecture",
                    "category": "Containers",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Containerization provides immutable, lightweight execution environments for applications.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Docker architecture (Namespaces, Cgroups, UnionFS)",
                        "Multi-stage Dockerfiles and image layer caching",
                        "Docker Compose multi-container networks and volumes",
                        "Container security scanning (Trivy) and non-root users"
                    ],
                    "suggested_project": "Create hardened, minimal Alpine/Distroless multi-stage Docker images for web services."
                }
            ]
        },
        {
            "id": "do-phase-2",
            "phase_number": 2,
            "title": "Kubernetes & Infrastructure as Code (IaC)",
            "description": "Orchestrate distributed clusters and provision reproducible cloud infrastructure with code.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "do-s-3",
                    "name": "Kubernetes (K8s) Cluster Orchestration",
                    "category": "Orchestration",
                    "estimated_effort": "4-5 weeks",
                    "why_learn": "The industry gold standard for automating deployment, scaling, and operations of containers.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Core primitives: Pods, Deployments, ReplicaSets, Services (ClusterIP, NodePort, LoadBalancer)",
                        "ConfigMaps, Secrets, PersistentVolumes, and PVCs",
                        "Ingress controllers, Routing rules, and cert-manager",
                        "Horizontal Pod Autoscaling (HPA) and Resource Limits"
                    ],
                    "suggested_project": "Deploy a multi-tier microservices application to a Minikube/K3s cluster with auto-scaling and Ingress."
                },
                {
                    "id": "do-s-4",
                    "name": "Terraform / OpenTofu (Infrastructure as Code)",
                    "category": "IaC",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Provision cloud infrastructure declaratively, version-controlled across multi-cloud providers.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "HCL syntax: Providers, Resources, Variables, and Outputs",
                        "Managing remote Terraform state and locking with AWS S3 + DynamoDB",
                        "Reusable Terraform modules for VPCs, Subnets, and Compute",
                        "Terraform plan, apply, destroy workflows and drift detection"
                    ],
                    "suggested_project": "Write modular Terraform code to provision an AWS VPC, public/private subnets, and an EKS/EC2 cluster."
                }
            ]
        },
        {
            "id": "do-phase-3",
            "phase_number": 3,
            "title": "CI/CD Automation & Observability",
            "description": "Automate deployment pipelines with GitHub Actions and monitor cluster telemetry with Prometheus & Grafana.",
            "status": "NOT_STARTED",
            "skills": [
                {
                    "id": "do-s-5",
                    "name": "CI/CD Automation (GitHub Actions & ArgoCD)",
                    "category": "CI/CD",
                    "estimated_effort": "3 weeks",
                    "why_learn": "Deliver fast, zero-downtime automated releases from commit to production.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "GitHub Actions workflows, matrix builds, secrets, and environments",
                        "Automated testing, linting, Docker build & push to registry (ECR/DockerHub)",
                        "GitOps deployment principles with ArgoCD",
                        "Blue-Green and Canary zero-downtime deployment strategies"
                    ],
                    "suggested_project": "Build an end-to-end GitOps pipeline deploying updates to Kubernetes upon git tag push."
                },
                {
                    "id": "do-s-6",
                    "name": "Observability with Prometheus & Grafana",
                    "category": "Monitoring",
                    "estimated_effort": "2-3 weeks",
                    "why_learn": "Gain complete real-time visibility into infrastructure metrics, application traces, and alerts.",
                    "status": "NOT_STARTED",
                    "what_to_learn": [
                        "Prometheus scraping, metrics types (Counter, Gauge, Histogram)",
                        "Writing PromQL queries and Alertmanager alert rules",
                        "Building actionable Grafana dashboards for cluster health",
                        "Distributed tracing and centralized logging (Grafana Loki / ELK)"
                    ],
                    "suggested_project": "Configure Prometheus and Grafana to monitor Kubernetes node CPU/memory usage and trigger Slack alerts."
                }
            ]
        }
    ]'::jsonb
)
ON CONFLICT (role_id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    phases = EXCLUDED.phases,
    updated_at = NOW();
