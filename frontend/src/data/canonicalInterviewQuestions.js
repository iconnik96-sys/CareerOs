/**
 * Canonical Curated Technical Interview Questions Bank
 * Fallback questions for all primary career tracks calibrated to industry standards.
 */

export const CANONICAL_INTERVIEW_QUESTIONS = [
    // ==========================================
    // 1. FRONTEND DEVELOPER
    // ==========================================
    {
        id: 'fe-q1',
        role_id: 'frontend',
        difficulty: 'Medium',
        topic: 'React',
        question: 'Explain the React Component Lifecycle in functional components using hooks like useEffect, useLayoutEffect, and useRef.',
        answer_key: 'Mental model of functional component mounting, re-rendering, unmounting, difference between useEffect and useLayoutEffect, and mutability with useRef.',
        tips: [
            'Differentiate render phase from commit phase',
            'Explain how dependency arrays drive cleanup functions',
            'Mention useLayoutEffect execution before browser paint'
        ],
        sample_answer: 'In functional React components, lifecycle events are simulated via hooks rather than imperative methods. During mount and render, the component function executes. `useEffect` schedules side effects that run asynchronously AFTER browser layout and paint, preventing UI blocking. In contrast, `useLayoutEffect` runs synchronously after DOM mutations but BEFORE the browser repaints, making it ideal for measuring DOM nodes or preventing layout shift. The cleanup function returned inside an effect runs before component unmount or before the effect re-runs when dependencies change. Finally, `useRef` provides a mutable container that persists across renders without triggering a re-render when mutated.'
    },
    {
        id: 'fe-q2',
        role_id: 'frontend',
        difficulty: 'Easy',
        topic: 'JavaScript',
        question: 'What is the Event Loop in JavaScript, and how do Microtasks (Promises) differ from Macrotasks (setTimeout)?',
        answer_key: 'Single-threaded call stack execution, Web APIs, Microtask queue vs Macrotask/Task queue prioritization, and event loop turn order.',
        tips: [
            'Clarify call stack vs task queues',
            'Specify that the microtask queue is drained completely before next macrotask',
            'Provide an execution order example with Promise.then vs setTimeout'
        ],
        sample_answer: 'JavaScript is single-threaded with a non-blocking concurrency model powered by the Event Loop. Synchronous code executes on the Call Stack. Asynchronous tasks delegate to browser APIs and enqueue callbacks when resolved. Microtasks (such as `Promise.then`, `queueMicrotask`, and `MutationObserver`) have higher priority than Macrotasks (`setTimeout`, `setInterval`, `requestAnimationFrame`, UI events). After each stack turn, the Event Loop drains the entire Microtask queue to exhaustion before picking the next single Macrotask from the task queue. Consequently, a Promise callback will always run before a `setTimeout(fn, 0)` callback registered in the same turn.'
    },
    {
        id: 'fe-q3',
        role_id: 'frontend',
        difficulty: 'Medium',
        topic: 'HTML/CSS',
        question: 'Explain CSS Box Model, the difference between content-box and border-box, and modern centering using CSS Grid vs Flexbox.',
        answer_key: 'Width calculation with padding/border in box-sizing, Flexbox 1D layout vs Grid 2D layout alignment properties.',
        tips: [
            'Explain why border-box is universally preferred (* { box-sizing: border-box; })',
            'Compare justify-content / align-items vs place-items: center'
        ],
        sample_answer: 'The CSS Box Model consists of content, padding, border, and margin. Under `box-sizing: content-box` (the default), specified `width` only accounts for content, causing padding and border to expand the element outer dimension. With `box-sizing: border-box`, `width` encompasses content + padding + border, preventing layout overflows. For centering, Flexbox is one-dimensional (content-driven row or column using `display: flex; justify-content: center; align-items: center;`), whereas CSS Grid is two-dimensional (container-driven using `display: grid; place-items: center;`), which can center an item in a single line of CSS.'
    },
    {
        id: 'fe-q4',
        role_id: 'frontend',
        difficulty: 'Hard',
        topic: 'DOM & Performance',
        question: 'How do you optimize Core Web Vitals (LCP, INP, and CLS) in a modern client-heavy or SSR React application?',
        answer_key: 'Largest Contentful Paint optimization, Interaction to Next Paint latency minimization, and Cumulative Layout Shift prevention.',
        tips: [
            'Mention image optimization, font-display: optional, and priority hints',
            'Address long JavaScript main-thread tasks, hydration costs, and web workers for INP',
            'Describe reserved aspect ratios and skeleton containers for CLS'
        ],
        sample_answer: 'Optimizing Core Web Vitals requires targeting three distinct performance pillars: 1) **LCP (Largest Contentful Paint < 2.5s):** Preload critical hero assets with `<link rel="preload" as="image" fetchpriority="high">`, optimize image formats (WebP/AVIF), eliminate render-blocking CSS/JS, and implement SSR or SSG. 2) **INP (Interaction to Next Paint < 200ms):** Break up long JavaScript main-thread tasks using `scheduler.yield()` or `requestIdleCallback`, debounce expensive input handlers, offload heavy computation to Web Workers, and minimize React re-renders using `React.memo` or transition APIs (`useTransition`). 3) **CLS (Cumulative Layout Shift < 0.1):** Always declare explicit `width` and `height` or `aspect-ratio` on images and embeds, reserve space for dynamic ads/banners, and use `font-display: swap/optional` with size-adjust overrides to eliminate FOIT/FOUT shift.'
    },
    {
        id: 'fe-q5',
        role_id: 'frontend',
        difficulty: 'Medium',
        topic: 'TypeScript',
        question: 'What are Generics in TypeScript, and how do `Record`, `Partial`, and `ReturnType` utility types function under the hood?',
        answer_key: 'Type parameters for reusable abstractions, mapped types, keyof indexation, conditional types and infer keyword.',
        tips: [
            'Show how generics allow functions to retain type fidelity',
            'Explain how Partial uses [P in keyof T]?: T[P]',
            'Explain how ReturnType uses conditional inference T extends (...args: any[]) => infer R ? R : any'
        ],
        sample_answer: 'Generics in TypeScript allow developers to write flexible, reusable functions and classes while preserving strict type safety without resorting to `any`. Under the hood, built-in utility types leverage mapped and conditional types: `Partial<T>` uses `type Partial<T> = { [P in keyof T]?: T[P] };` to make every property optional. `Record<K, T>` creates an object type whose keys are `K` and values are `T`: `type Record<K extends keyof any, T> = { [P in K]: T };`. `ReturnType<T>` leverages conditional types with type inference: `type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;` extracting the deduced return type.'
    },
    {
        id: 'fe-q6',
        role_id: 'frontend',
        difficulty: 'Medium',
        topic: 'React',
        question: 'Compare React Context API vs Zustand or Redux Toolkit for state management in large scale applications.',
        answer_key: 'Context re-render cascading, selector subscriptions, state collocation, and architectural trade-offs.',
        tips: [
            'Explain that Context is a dependency injection tool, not a dedicated state manager',
            'Describe how Zustand avoids unnecessary re-renders via store selectors',
            'Contrast boilerplate between Context and Redux Toolkit slices'
        ],
        sample_answer: 'React Context API is designed for low-frequency global data such as themes or current user authentication. Its primary limitation in high-frequency state updates is that every consumer component re-renders whenever the context value reference changes, even if it only consumes an untouched sub-property. In contrast, Zustand and Redux Toolkit implement the external store subscription pattern (`useSyncExternalStore`), allowing components to subscribe to specific slices of state via selectors (e.g., `useStore(s => s.user.name)`). This prevents unnecessary renders of sibling components. Zustand offers minimal boilerplate with no provider tree wrap, while Redux Toolkit provides strict conventions, Redux DevTools time-travel debugging, and RTK Query for caching.'
    },
    {
        id: 'fe-q7',
        role_id: 'frontend',
        difficulty: 'Easy',
        topic: 'Testing',
        question: 'What is the difference between unit tests, integration tests, and E2E tests in a frontend application?',
        answer_key: 'Testing pyramid, scope of components, mocked vs real APIs, tools like Jest/React Testing Library vs Playwright/Cypress.',
        tips: [
            'Emphasize user-centric queries (getByRole, getByText) over test IDs or DOM classes',
            'Mention execution speed and maintenance cost across test tiers'
        ],
        sample_answer: 'In frontend testing: 1) **Unit Tests** test isolated functions, utility modules, or custom hooks in complete isolation with all dependencies mocked (fast, cheap to run via Jest/Vitest). 2) **Integration Tests** test several components working together (e.g., a form filling, submitting, and updating a list using React Testing Library and MSW for network mocks), validating user behavior rather than implementation details. 3) **E2E (End-to-End) Tests** test the fully built application in real headless browser environments (using Playwright or Cypress) against actual backend staging environments, verifying critical user journeys like login, checkout, and onboarding. High ROI teams prioritize integration tests.'
    },
    {
        id: 'fe-q8',
        role_id: 'frontend',
        difficulty: 'Hard',
        topic: 'JavaScript',
        question: 'Explain Closures, the Lexical Scope chain, and a real-world scenario where closures can cause memory leaks.',
        answer_key: 'Function bundled with its lexical environment reference, retainment of outer variables in heap, detached DOM references causing memory leaks.',
        tips: [
            'Define lexical scoping and activation records',
            'Provide practical use cases (currying, data privacy, factory functions)',
            'Explain how retained event listeners or intervals retain unreferenced parent closures'
        ],
        sample_answer: 'A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). When an inner function is defined inside an outer function, it retains access to variables declared in the outer function even after the outer function has completed execution. A common memory leak occurs when a closure captures large data structures or DOM nodes in an event listener or `setInterval` that is never deregistered when the component or UI view is destroyed. Because the closure retains an active reference on the heap, the JavaScript garbage collector cannot reclaim that memory.'
    },
    {
        id: 'fe-q9',
        role_id: 'frontend',
        difficulty: 'Medium',
        topic: 'DOM & Performance',
        question: 'What is the Virtual DOM in React, how does the Reconciliation Algorithm (Fiber) work, and why are unique keys crucial in lists?',
        answer_key: 'Lightweight in-memory tree representation, diffing heuristic (O(n)), Fiber work units, and list item key reconciliation.',
        tips: [
            'Explain Fiber cooperative scheduling with time slicing',
            'Explain why index-based keys fail when inserting or deleting elements'
        ],
        sample_answer: 'The Virtual DOM is a lightweight JavaScript object representation of the actual browser DOM. React creates virtual trees and, during reconciliation, diffs the new tree against the previous snapshot. With the React Fiber architecture, reconciliation is split into non-blocking units of work that can be paused, prioritized, or aborted. The diffing heuristic assumes elements with different tags generate different trees and uses `key` props to match items in children lists. Without stable, unique keys (e.g. using array indexes), inserting or deleting an item causes React to re-render or mistakenly reuse the internal state and DOM elements of wrong list siblings.'
    },
    {
        id: 'fe-q10',
        role_id: 'frontend',
        difficulty: 'Hard',
        topic: 'React',
        question: 'What are Server Components (RSC) in Next.js / React 19, and how do they differ from traditional Client Side Rendering (CSR) and SSR?',
        answer_key: 'Zero client bundle size, streaming HTML, direct database access on server, boundary serialization, and "use client" directive.',
        tips: [
            'Distinguish initial SSR HTML rendering from client JavaScript hydration',
            'Highlight that RSC code never ships to the browser'
        ],
        sample_answer: 'React Server Components (RSC) execute exclusively on the server and their dependencies never get bundled or sent to the client browser, achieving zero bundle impact for heavy server libraries. Unlike traditional SSR (where the server renders initial HTML but the client still downloads all JavaScript to hydrate the page interactive), Server Components stream serialized React element descriptors to the browser. Client components (`"use client"`) are used only when interactivity (like state, effects, or DOM event listeners) is required. This architecture allows direct backend queries and reduced TTFB.'
    },

    // ==========================================
    // 2. BACKEND DEVELOPER
    // ==========================================
    {
        id: 'be-q1',
        role_id: 'backend',
        difficulty: 'Medium',
        topic: 'Databases & SQL',
        question: 'Explain Database Indexing, B-Trees vs Hash Indexes, and when an index might degrade query performance.',
        answer_key: 'B-Tree balanced search structure, range queries vs point lookups, write amplification on inserts/updates.',
        tips: [
            'Explain log(N) lookup complexity',
            'Discuss index maintenance overhead on high-throughput write workloads',
            'Mention composite index column order and index selectivity'
        ],
        sample_answer: 'A database index is an auxiliary data structure that accelerates data retrieval at the expense of storage and write latency. Most relational databases default to B-Tree indexes, which maintain balanced, sorted tree nodes supporting efficient equality lookups, range queries (`BETWEEN`, `<`, `>`), and sorting in O(log N) time. Hash indexes offer O(1) point lookups but cannot support range scans. While indexes drastically speed up `SELECT` queries, excessive or redundant indexes degrade `INSERT`, `UPDATE`, and `DELETE` performance because the database engine must synchronously update every corresponding index structure on each write.'
    },
    {
        id: 'be-q2',
        role_id: 'backend',
        difficulty: 'Medium',
        topic: 'Caching & Redis',
        question: 'Describe the Cache-Aside pattern, Cache Stampede (Thundering Herd), and how to mitigate cache penetration and avalanche.',
        answer_key: 'Application-managed caching, lock-based stampede mitigation, probabilistic early expiration, bloom filters for penetration.',
        tips: [
            'Detail the read path vs write path in cache-aside',
            'Explain how TTL jitter prevents simultaneous expiration avalanches',
            'Mention distributed locks (Redlock) or mutexes'
        ],
        sample_answer: 'In Cache-Aside, the application first reads from the cache; on a cache miss, it reads from the primary database, populates the cache, and returns the result. A **Cache Stampede** occurs when a popular cache key expires and thousands of concurrent requests simultaneously query the database. This is mitigated using distributed mutex locks or probabilistic early expiration (XFetch). A **Cache Avalanche** happens when multiple keys expire at the same instant; this is resolved by adding random jitter to TTL durations. **Cache Penetration** (querying non-existent records repeatedly) is prevented by caching null values with short TTLs or using Bloom filters.'
    },
    {
        id: 'be-q3',
        role_id: 'backend',
        difficulty: 'Hard',
        topic: 'System Design',
        question: 'Design a distributed Rate Limiter capable of handling 500,000 requests per second across multiple API gateway nodes.',
        answer_key: 'Token Bucket / Sliding Window Counter algorithm, distributed Redis clusters, Redis Lua scripts for atomic operations.',
        tips: [
            'Compare Fixed Window, Sliding Log, and Sliding Window Counter',
            'Explain atomic increment via Redis Lua scripts to avoid race conditions',
            'Discuss local in-memory tiering (memory + Redis fallback) for extreme scale'
        ],
        sample_answer: 'To rate-limit 500k RPS across distributed gateways, I would use the **Sliding Window Counter** algorithm implemented in a Redis cluster. Each gateway evaluates requests by executing an atomic Redis Lua script that checks the current counter window, increments it, and sets an expiration timestamp without race conditions. To avoid overwhelming the Redis cluster at 500k RPS, gateways can use a two-tier approach: a local in-memory batch token bucket (e.g. Guava or Go rate) that syncs aggregated token consumption back to Redis every 50-100ms. Response headers include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` with HTTP 429.'
    },
    {
        id: 'be-q4',
        role_id: 'backend',
        difficulty: 'Medium',
        topic: 'REST APIs',
        question: 'What makes an API idempotent, and how do you design idempotent POST requests for payment or order creation?',
        answer_key: 'Definition of idempotency, Idempotency-Key headers, atomic transaction reservation, and duplicate request replay.',
        tips: [
            'Clarify GET/PUT/DELETE idempotence vs POST non-idempotence',
            'Explain the role of unique UUID Idempotency-Key header',
            'Describe storing initial response and replaying it on retry'
        ],
        sample_answer: 'An API operation is idempotent if executing it multiple times produces the identical server state and outcome as executing it once. `GET`, `PUT`, and `DELETE` are inherently idempotent by HTTP specification, whereas `POST` is not. To make order or payment `POST` endpoints idempotent, the client generates a unique UUID `Idempotency-Key` header. When the server receives the request, it attempts to insert this key into an atomic cache/database with an in-progress state. If the key exists, subsequent duplicate requests wait or receive the saved response immediately. If the operation succeeds, the final response payload is persisted alongside the key for safe retries.'
    },
    {
        id: 'be-q5',
        role_id: 'backend',
        difficulty: 'Hard',
        topic: 'Microservices',
        question: 'How do you maintain data consistency across microservices without 2-Phase Commit (2PC)? Explain the Saga Pattern.',
        answer_key: 'Distributed transactions, Choreography vs Orchestration Sagas, Compensating transactions, and Outbox Pattern.',
        tips: [
            'Explain why 2PC causes locking bottlenecks and single point of failure',
            'Contrast Choreography (event-driven Kafka) with Orchestrator (Temporal / Step Functions)',
            'Describe how compensating transactions roll back partial state'
        ],
        sample_answer: 'Two-Phase Commit (2PC) is rarely suitable for distributed cloud microservices because synchronous distributed locking drastically lowers throughput and availability. Instead, the **Saga Pattern** breaks a distributed transaction into a sequence of local transactions coordinated through asynchronous events. Each local transaction updates its microservice database and publishes an event. If a downstream step fails (e.g., payment declined), the Saga executes **Compensating Transactions** in reverse order to revert previous changes (e.g., release reserved inventory). Sagas can be implemented via **Choreography** (using Kafka/RabbitMQ events) or **Orchestration** (using a centralized workflow coordinator like Temporal).'
    },
    {
        id: 'be-q6',
        role_id: 'backend',
        difficulty: 'Easy',
        topic: 'Databases & SQL',
        question: 'Explain ACID properties in relational databases and the trade-offs between transaction isolation levels.',
        answer_key: 'Atomicity, Consistency, Isolation, Durability. Dirty reads, non-repeatable reads, phantom reads across isolation tiers.',
        tips: [
            'Break down each letter of ACID',
            'List the 4 SQL standard isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable'
        ],
        sample_answer: 'ACID guarantees: **Atomicity** (all operations in a transaction succeed or all roll back), **Consistency** (data adheres to all schema rules and constraints), **Isolation** (concurrent transactions execute without interfering), and **Durability** (committed changes persist through crashes). Isolation levels balance concurrency against anomalies: `Read Uncommitted` allows dirty reads; `Read Committed` prevents dirty reads; `Repeatable Read` prevents non-repeatable reads; and `Serializable` eliminates phantom reads through strict lock ordering or snapshot isolation (MVCC) at the cost of concurrency throughput.'
    },
    {
        id: 'be-q7',
        role_id: 'backend',
        difficulty: 'Medium',
        topic: 'Java & Spring Boot',
        question: 'Explain Dependency Injection and Inversion of Control in Spring Boot, and the difference between Singleton and Prototype bean scopes.',
        answer_key: 'IoC container lifecycle, constructor vs field injection, singleton per container vs new instance per request.',
        tips: [
            'Advise constructor injection over @Autowired field injection for immutability and testability',
            'Explain that Spring singleton is per Spring ApplicationContext, not per JVM classloader'
        ],
        sample_answer: 'Inversion of Control (IoC) is a design principle where the control of object creation and lifecycle management is transferred from the application code to a framework container. Dependency Injection (DI) is the pattern used to supply dependencies to a class. In Spring Boot, the `ApplicationContext` acts as the IoC container. Best practice is Constructor Injection because it ensures dependencies are immutable and facilitates unit testing with mocks. By default, Spring beans are **Singleton** scoped (one shared instance per `ApplicationContext`). In contrast, **Prototype** scope creates a brand new bean instance every time it is injected or requested.'
    },

    // ==========================================
    // 3. FULL STACK DEVELOPER
    // ==========================================
    {
        id: 'fs-q1',
        role_id: 'fullstack',
        difficulty: 'Medium',
        topic: 'Authentication & JWT',
        question: 'How do you architect secure JWT authentication in a single-page app, and where should refresh tokens be stored?',
        answer_key: 'Short-lived access tokens in memory, refresh tokens in httpOnly secure cookies, CSRF protection, and token rotation.',
        tips: [
            'Explain why localStorage is vulnerable to XSS',
            'Explain why cookies need SameSite=Strict and httpOnly to prevent CSRF and XSS',
            'Describe silent refresh mechanism'
        ],
        sample_answer: 'Storing sensitive authentication tokens in `localStorage` or `sessionStorage` exposes users to XSS attacks since any injected script can read them. The secure architecture stores short-lived Access Tokens (e.g., 10-15 minute lifespan) purely in application memory (React state). The long-lived Refresh Token (7-30 days) is stored in a secure, `httpOnly`, `SameSite=Strict`, `Secure` (HTTPS-only) cookie. When the frontend detects access token expiration or a 401 error, an Axios interceptor calls the `/api/auth/refresh` endpoint. The browser automatically sends the httpOnly cookie, and the backend validates the token, issues a new access token, and performs refresh token rotation to detect token theft.'
    },
    {
        id: 'fs-q2',
        role_id: 'fullstack',
        difficulty: 'Hard',
        topic: 'Architecture & Deployment',
        question: 'Walk through the complete lifecycle of a request from browser URL entry to backend database query and back.',
        answer_key: 'DNS resolution, TLS handshake, CDN edge caching, Reverse proxy / Load balancer, Web server routing, ORM / SQL query, JSON response.',
        tips: [
            'Cover networking layers (DNS, TCP 3-way handshake, TLS 1.3)',
            'Mention NGINX / Gateway reverse proxy routing',
            'Mention connection pooling on the database side'
        ],
        sample_answer: 'When a user enters a URL: 1) **DNS Resolution:** The browser checks local cache, resolver, and authoritative nameservers to resolve IP. 2) **TCP & TLS:** The client establishes a TCP connection (SYN, SYN-ACK, ACK) and completes TLS 1.3 cryptographic handshake for HTTPS. 3) **Edge & Gateway:** The request hits a CDN / Cloudflare edge; if cached, static assets return immediately. Otherwise, it forwards to an API Gateway or NGINX reverse proxy for SSL termination and load balancing. 4) **Application Server:** The backend router dispatches the request to middleware (rate limiting, JWT validation) and the controller. 5) **Database:** The service acquires a pooled connection, executes an indexed SQL query, and serializes the result into JSON, returning HTTP 200 with appropriate caching headers.'
    },
    {
        id: 'fs-q3',
        role_id: 'fullstack',
        difficulty: 'Medium',
        topic: 'Backend APIs',
        question: 'How do WebSockets differ from HTTP Polling and Server-Sent Events (SSE), and when should each be used?',
        answer_key: 'Full-duplex bi-directional TCP vs half-duplex unidirectional streams, overhead and reconnection protocols.',
        tips: [
            'Identify SSE as ideal for LLM streaming responses or live notifications',
            'Identify WebSockets for collaborative multiplayer editors or chat',
            'Identify Polling as a fallback or for low-frequency status checks'
        ],
        sample_answer: 'HTTP Short/Long Polling involves repetitive client requests, incurring heavy HTTP header overhead and latency. **Server-Sent Events (SSE)** provide a persistent, unidirectional stream from server to client over standard HTTP (Content-Type: `text/event-stream`). SSE has built-in browser reconnection, works through standard firewalls, and is ideal for LLM AI token streaming or live activity feeds. **WebSockets** upgrade an HTTP connection to a full-duplex, bi-directional TCP socket with minimal per-message framing overhead, making it the choice for low-latency two-way interactions like real-time chat, multiplayer gaming, or collaborative document editing.'
    },

    // ==========================================
    // 4. DEVOPS ENGINEER
    // ==========================================
    {
        id: 'do-q1',
        role_id: 'devops',
        difficulty: 'Medium',
        topic: 'Docker & Containers',
        question: 'Explain Multi-Stage Docker builds and best practices for creating secure, minimal production container images.',
        answer_key: 'Separation of build environment from runtime container, alpine/distroless bases, non-root users, layer caching.',
        tips: [
            'Highlight elimination of build tools (compilers, npm devDependencies) in final stage',
            'Mention ordering Dockerfile instructions from least to most frequently modified for caching'
        ],
        sample_answer: 'Multi-stage Docker builds use multiple `FROM` instructions in a single Dockerfile to separate the compilation and dependency-installation environment from the final execution image. In the first stage (`builder`), compilers, SDKs, and build tooling are used to produce binaries or minified bundles. In the final stage, a minimal runtime base (such as Alpine Linux or Google Distroless) is used, and only the generated artifacts are copied across via `COPY --from=builder`. Best practices include running as an explicit non-root user (`USER nonroot`), leveraging Docker build layer caching by copying lockfiles before source code, and scanning images for CVEs using Trivy.'
    },
    {
        id: 'do-q2',
        role_id: 'devops',
        difficulty: 'Hard',
        topic: 'Kubernetes',
        question: 'Explain Kubernetes Pod lifecycle, readiness vs liveness probes, and zero-downtime rolling deployments.',
        answer_key: 'Liveness probes restart containers, readiness probes control service routing, RollingUpdate strategy with maxSurge/maxUnavailable.',
        tips: [
            'Explain how a failing readiness probe prevents traffic from hitting unready pods',
            'Explain how rolling updates guarantee zero downtime'
        ],
        sample_answer: 'In Kubernetes, **Liveness Probes** verify whether a container is healthy; if it fails, the kubelet kills and restarts the container according to its restart policy. **Readiness Probes** verify if the application is ready to accept incoming user traffic; if it fails, the pod IP is temporarily removed from the Kubernetes Service endpoints, preventing 502/503 errors during cold starts. For zero-downtime rolling updates, the Deployment configuration defines `strategy: RollingUpdate` with parameters like `maxSurge: 25%` and `maxUnavailable: 0`. Kubernetes launches new pods, waits for their readiness probes to pass, shifts traffic gradually, and then terminates old pods gracefully.'
    },

    // ==========================================
    // 5. DATA ANALYST
    // ==========================================
    {
        id: 'da-q1',
        role_id: 'data-analyst',
        difficulty: 'Medium',
        topic: 'SQL Queries',
        question: 'Explain SQL Window Functions, the difference between RANK(), DENSE_RANK(), and ROW_NUMBER(), and a practical use case.',
        answer_key: 'OVER (PARTITION BY ... ORDER BY ...), tie-breaking behaviors, identifying top N records per category.',
        tips: [
            'Differentiate how ties are assigned sequential or skipped ranks',
            'Write or explain finding the top 3 highest-paid employees per department'
        ],
        sample_answer: 'Window functions perform calculations across a set of table rows that are related to the current row without collapsing rows into a single output group like `GROUP BY`. All three functions order rows within a partition: `ROW_NUMBER()` assigns a strict sequential integer (1, 2, 3...) regardless of ties. `RANK()` assigns identical ranks to tied values but leaves gaps in subsequent rankings (e.g., 1, 2, 2, 4). `DENSE_RANK()` assigns identical ranks to ties without gaps (e.g., 1, 2, 2, 3). A primary use case is finding the top N performers per department using `DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY revenue DESC)` in a Common Table Expression (CTE).'
    },
    {
        id: 'da-q2',
        role_id: 'data-analyst',
        difficulty: 'Medium',
        topic: 'Python & Pandas',
        question: 'How do you handle missing data (imputation vs deletion) and diagnose data leakage in exploratory analysis?',
        answer_key: 'MCAR, MAR, MNAR missingness patterns, mean/median/mode/KNN imputation, and preventing future information from leaking into training.',
        tips: [
            'Explain when deletion is dangerous (introducing bias)',
            'Define data leakage with scaling or imputing before train/test split'
        ],
        sample_answer: 'Handling missing data begins by diagnosing the missingness mechanism: Missing Completely at Random (MCAR), Missing at Random (MAR), or Missing Not at Random (MNAR). Listwise deletion is only acceptable for negligible MCAR data (< 3%); otherwise, it introduces severe sample bias. Imputation strategies include median for skewed distributions, mode for categorical variables, or KNN/IterativeImputer for multi-feature correlations. Data leakage occurs when information outside the training dataset (or from the future) is inadvertently used. For example, fitting a scaler or calculating imputation statistics on the entire dataset prior to splitting leaks target distribution information into the test set.'
    },

    // ==========================================
    // 6. AI/ML ENGINEER
    // ==========================================
    {
        id: 'ai-q1',
        role_id: 'ai-ml',
        difficulty: 'Hard',
        topic: 'LLMs & RAG',
        question: 'Explain the architecture of a production Retrieval-Augmented Generation (RAG) system and how to reduce hallucinations.',
        answer_key: 'Chunking strategies, embedding models, vector similarity search (HNSW/Cosine), re-ranking, and grounded generation.',
        tips: [
            'Discuss semantic chunking and chunk overlap',
            'Explain re-ranking with cross-encoders (e.g., Cohere, BGE-reranker)',
            'Mention citation verification and hallucination guardrails'
        ],
        sample_answer: 'A production RAG pipeline ingests documents by applying semantic chunking with overlapping boundaries (e.g. 500 tokens with 50-token overlap) and converts them into dense vector embeddings stored in a vector index (like pgvector, Pinecone, or Milvus with HNSW indexing). Upon user query, hybrid search (combining sparse BM25 keyword search with dense semantic vector search via Reciprocal Rank Fusion) retrieves top candidates. A Cross-Encoder Re-ranker (e.g. BGE-reranker) refines candidate relevance. The LLM is provided with strict grounding system prompts instructing it to answer strictly based on retrieved context and cite source chunks. Hallucinations are monitored using evaluation frameworks like Ragas or TruLens.'
    },
    {
        id: 'ai-q2',
        role_id: 'ai-ml',
        difficulty: 'Medium',
        topic: 'Deep Learning',
        question: 'Explain the Self-Attention mechanism in Transformers and the computational complexity difference between standard Attention and FlashAttention.',
        answer_key: 'Query, Key, Value matrices, Softmax(QK^T / sqrt(d_k))V, O(N^2) quadratic complexity, and FlashAttention IO awareness.',
        tips: [
            'Walk through Q, K, V dot product and scaling factor',
            'Explain how FlashAttention avoids reading/writing intermediate N x N attention matrices to high-bandwidth GPU memory (HBM)'
        ],
        sample_answer: 'In the Transformer architecture, Self-Attention computes semantic relationships between all tokens in a sequence. Input embeddings are projected into Query (Q), Key (K), and Value (V) matrices. The attention weights are calculated as `Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V`. Standard attention has O(N^2) time and memory complexity with sequence length N, creating memory bottlenecks because intermediate N x N matrices are repeatedly read from and written to GPU High-Bandwidth Memory (HBM). **FlashAttention** re-architects the operation by tiling queries, keys, and values into fast SRAM cache and computing softmax incrementally (online softmax), drastically accelerating training and inference without altering mathematical output.'
    },

    // ==========================================
    // 7. CYBERSECURITY SPECIALIST
    // ==========================================
    {
        id: 'cs-q1',
        role_id: 'cybersecurity',
        difficulty: 'Medium',
        topic: 'OWASP Top 10',
        question: 'Explain SQL Injection (SQLi), Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF), and how each is prevented.',
        answer_key: 'Parameterized queries for SQLi; context-aware output encoding and CSP for XSS; SameSite cookies and anti-CSRF tokens for CSRF.',
        tips: [
            'Differentiate Stored vs Reflected vs DOM-based XSS',
            'Explain why parameterized prepared statements guarantee code/data separation in SQL'
        ],
        sample_answer: '1) **SQL Injection (SQLi)** occurs when untrusted input is concatenated into database queries; prevented through parameterized queries / prepared statements (which separate code from data) and ORMs. 2) **Cross-Site Scripting (XSS)** allows attackers to execute malicious scripts in victim browsers (Stored, Reflected, or DOM); mitigated by context-aware output encoding, HTML sanitization (DOMPurify), and strict Content Security Policies (CSP). 3) **CSRF** forces authenticated users to submit unintended actions; mitigated by enforcing `SameSite=Lax/Strict` on session cookies, anti-CSRF challenge tokens, and validating Custom Request Headers.'
    },
    {
        id: 'cs-q2',
        role_id: 'cybersecurity',
        difficulty: 'Hard',
        topic: 'SIEM & SOC',
        question: 'How do you investigate and contain a compromised internal host exhibiting suspicious outbound C2 (Command & Control) beaconing?',
        answer_key: 'Log triage (DNS/firewall/proxy), host isolation, process tree memory analysis, IOC extraction, and eradication.',
        tips: [
            'Follow NIST / SANS Incident Response lifecycle (Identification, Containment, Eradication, Recovery)',
            'Mention isolating host via EDR network containment without powering off to preserve volatile RAM'
        ],
        sample_answer: 'Upon detecting periodic outbound beaconing: 1) **Containment:** Immediately apply network isolation via EDR (CrowdStrike/Defender) to block all lateral movement while preserving active network connection to the SOC console. Never power down the machine, as this destroys volatile RAM evidence. 2) **Identification:** Analyze proxy and firewall logs to determine beaconing periodicity, destination IP/domain, and user-agent string. Inspect host process telemetry (Sysmon/EDR) to locate the spawning parent process, injected threads, and associated persistence mechanisms (scheduled tasks, registry run keys). 3) **Eradication & Remediation:** Revoke logged-in user credentials and active Kerberos/session tokens, block C2 IPs and domain IOCs enterprise-wide on firewalls, and re-image the host.'
    },

    // ==========================================
    // 8. LIVE CODING & PROBLEM SOLVING (DSA_CODING TRACK)
    // ==========================================
    {
        id: 'dsa-q1',
        role_id: 'common',
        track: 'DSA_CODING',
        difficulty: 'Medium',
        topic: 'Two Pointers & Sliding Window',
        question: 'Explain the Two Pointers vs Sliding Window pattern. Given an array of integers, how do you find the maximum sum subarray of size K in O(N) time?',
        answer_key: 'Sliding window maintains sum in O(1) by subtracting leftmost and adding rightmost, rather than re-computing sum in O(K).',
        tips: [
            'Contrast brute force O(N*K) with sliding window O(N)',
            'Mention fixed-size vs dynamic-size window conditions'
        ],
        sample_answer: 'The Two Pointers technique involves two pointer variables traversing a data structure (e.g. opposite ends inward for sorted Two Sum, or fast/slow pointers for cycle detection). The Sliding Window pattern is a specialized variation where the two pointers define a continuous subsegment (window). To find the maximum sum subarray of fixed size K: 1) Calculate the initial sum of the first K elements. 2) Slide the window forward one index at a time from index K to N-1, adding `nums[i]` and subtracting `nums[i - K]`. 3) Update the running maximum. This avoids re-computing the sum from scratch, reducing time complexity from O(N*K) brute force to linear O(N) time with O(1) auxiliary space.'
    },
    {
        id: 'dsa-q2',
        role_id: 'common',
        track: 'DSA_CODING',
        difficulty: 'Medium',
        topic: 'Arrays & HashMaps',
        question: 'How do you solve the "Two Sum" problem in O(N) time? How does a HashMap resolve hash collisions, and what is its amortized lookup complexity?',
        answer_key: 'Complement lookup (target - num) in single pass O(N), Hash collision handling (chaining vs open addressing), O(1) amortized vs O(N) worst case.',
        tips: [
            'Walk through complement map lookup',
            'Explain how Java 8+ converts linked lists to red-black trees when bucket exceeds threshold'
        ],
        sample_answer: 'In the Two Sum problem, instead of an O(N^2) nested loop, we maintain a HashMap storing each number and its index. For each element `x`, we check if `target - x` exists in the map in O(1) time; if present, we return both indices, achieving O(N) time and O(N) space. Under the hood, HashMaps compute an array bucket index using `hash(key) % capacity`. When distinct keys hash to the same bucket (collision), standard implementations use Separate Chaining (linked list at bucket) or Open Addressing (probing). In modern runtimes like Java 8+, if a bucket list exceeds 8 entries, it dynamically converts into a balanced Red-Black tree, ensuring worst-case lookup remains O(log N) rather than degrading to O(N).'
    },
    {
        id: 'dsa-q3',
        role_id: 'common',
        track: 'DSA_CODING',
        difficulty: 'Hard',
        topic: 'Trees & Graphs',
        question: 'Explain Breadth-First Search (BFS) vs Depth-First Search (DFS) on graphs. How do you detect cycles in directed vs undirected graphs?',
        answer_key: 'Queue for BFS level-order; Stack/Recursion for DFS; Undirected cycles using visited parent check; Directed cycles using 3-color / recursion stack state.',
        tips: [
            'State time and space complexity: O(V + E) time, O(V) space',
            'Explain why visited parent check is insufficient for directed graphs'
        ],
        sample_answer: 'BFS explores graph vertices level by level using a FIFO Queue, making it optimal for finding the shortest path in unweighted graphs. DFS explores as deeply as possible down each branch using recursion or a LIFO Stack, ideal for topological sort, path finding, and connected components. Both run in O(V + E) time and O(V) space. **Cycle Detection in Undirected Graph:** During DFS/BFS, if we encounter a visited neighbor that is NOT the immediate parent node that we came from, a cycle exists. **Cycle Detection in Directed Graph:** Parent tracking is insufficient. We must track nodes in the active recursion call stack (or 3-color states: Unvisited=0, Visiting=1, Visited=2). Encountering a node currently in state "Visiting" signifies a back-edge, confirming a directed cycle.'
    },
    {
        id: 'dsa-q4',
        role_id: 'common',
        track: 'DSA_CODING',
        difficulty: 'Hard',
        topic: 'Dynamic Programming',
        question: 'How do you identify whether a problem can be solved with Dynamic Programming? Explain Memoization (Top-Down) vs Tabulation (Bottom-Up).',
        answer_key: 'Overlapping Subproblems and Optimal Substructure. Top-Down recursion + cache vs Bottom-Up iterative table filling.',
        tips: [
            'Contrast call stack overhead in recursion vs iterative space optimization',
            'Give a concrete example like Fibonacci, Coin Change, or 0/1 Knapsack'
        ],
        sample_answer: 'A problem is solvable with Dynamic Programming if it exhibits two core properties: 1) **Optimal Substructure:** The optimal solution to the problem can be constructed from optimal solutions to its subproblems. 2) **Overlapping Subproblems:** The same subproblems are solved repeatedly rather than generating new ones (unlike Divide and Conquer). In **Top-Down (Memoization)**, we write intuitive recursion matching the mathematical recurrence relation and cache subproblem results in a hash table or array, avoiding redundant branches. In **Bottom-Up (Tabulation)**, we iteratively populate a DP table starting from base cases, eliminating recursion stack frame overhead and often allowing space optimization (e.g. keeping only the last 2 variables instead of an entire array).'
    },

    // ==========================================
    // 9. BEHAVIORAL & HR (BEHAVIORAL TRACK - STAR METHOD)
    // ==========================================
    {
        id: 'beh-q1',
        role_id: 'common',
        track: 'BEHAVIORAL',
        difficulty: 'Medium',
        topic: 'Conflict Resolution',
        question: 'Tell me about a time you strongly disagreed with a technical direction chosen by your team lead or peer. How did you handle it using the STAR method?',
        answer_key: 'Situation, Task, Action (data-driven discussion, testing benchmarks, disagree and commit), Result (measurable positive outcome).',
        tips: [
            'Structure answer strictly using STAR (Situation, Task, Action, Result)',
            'Emphasize professionalism, empirical data, and willingness to support team consensus'
        ],
        sample_answer: '• **Situation:** During a sprint at my previous role, our team lead proposed migrating our core data ingestion service to a NoSQL document store to handle high write bursts, whereas I believed our relational PostgreSQL database with connection pooling and partitioning was sufficient and would avoid eventual consistency bugs.\n• **Task:** My responsibility was to ensure our architecture met our 99.9% uptime and latency SLA without introducing unnecessary operational overhead.\n• **Action:** Instead of arguing theoretically, I built a quick load-test benchmark simulating 25k writes/sec using k6 against both PostgreSQL with pg_partman and the proposed NoSQL database. I documented query latency, failover characteristics, and developer onboarding effort in a concise RFC document, and scheduled a 30-minute review with the lead.\n• **Result:** Seeing the empirical benchmarks, the lead agreed PostgreSQL comfortably met our 3-year growth projections. We saved an estimated 3 weeks of migration time and maintained ACID transactional integrity.'
    },
    {
        id: 'beh-q2',
        role_id: 'common',
        track: 'BEHAVIORAL',
        difficulty: 'Medium',
        topic: 'Overcoming Failure',
        question: 'Describe a situation where a production bug, release failure, or broken feature was caused by your code. How did you respond?',
        answer_key: 'Immediate ownership, incident mitigation/rollback, root cause analysis (5 Whys), automated blameless post-mortem prevention.',
        tips: [
            'Do not blame others or external libraries',
            'Highlight calm crisis management, immediate rollback, and long-term automated prevention'
        ],
        sample_answer: '• **Situation:** Following a Friday deployment, an unchecked null pointer edge case in my checkout discount calculation caused intermittent payment gateway failures for European users using multi-currency codes.\n• **Task:** I needed to halt financial errors, restore payment processing immediately, and establish permanent prevention.\n• **Action:** The moment Datadog alerted on 500 status spikes, I immediately owned the error in the incident Slack channel and initiated a graceful zero-downtime rollback to the prior release within 4 minutes. Once services stabilized, I wrote a comprehensive unit test reproducing the exact currency conversion edge case, fixed the null handling with strict schema validation, and added CI automated regression checks.\n• **Result:** Production downtime was limited to under 6 minutes with zero financial loss. I led a blameless post-mortem that introduced mandatory currency edge-case test suites across all billing services.'
    },
    {
        id: 'beh-q3',
        role_id: 'common',
        track: 'BEHAVIORAL',
        difficulty: 'Medium',
        topic: 'Leadership & Ownership',
        question: 'Tell me about a time you took ownership of an ambiguous problem or unassigned initiative to improve team velocity or code quality.',
        answer_key: 'Proactive ownership, identifying developer friction, creating automated tooling/documentation, measurable velocity gain.',
        tips: [
            'Demonstrate proactive mindset without waiting for explicit tasks',
            'Quantify the time or friction saved for peers'
        ],
        sample_answer: '• **Situation:** In our engineering team, local development environment setup for new frontend engineers required over 15 manual installation steps and consistently took 1-2 days due to mismatched Node.js versions and database seed drift.\n• **Task:** Although my core sprint task was feature development, I recognized this friction was degrading team onboarding velocity and developer satisfaction.\n• **Action:** Over two afternoons, I containerized the entire local development environment using Docker Compose with automated database migrations, hot-reloading Vite dev server, and mock API seed data. I authored a clean 1-page Quickstart README and a single `make dev` command.\n• **Result:** New engineer onboarding time dropped from 2 days to under 15 minutes. The initiative was adopted by 12 cross-functional developers and highlighted in our quarterly engineering retrospective.'
    },
    {
        id: 'beh-q4',
        role_id: 'common',
        track: 'BEHAVIORAL',
        difficulty: 'Medium',
        topic: 'Handling Deadlines',
        question: 'How do you handle situations where shifting project requirements threaten an agreed-upon release deadline?',
        answer_key: 'Early communication, scope negotiation, prioritizing MVP core user value, avoiding unvalidated shortcuts.',
        tips: [
            'Show proactive stakeholder communication rather than last-minute surprise',
            'Distinguish non-negotiable quality standards from negotiable scope features'
        ],
        sample_answer: '• **Situation:** Two weeks before a major company release, product leadership requested two additional third-party payment integrations that were not in the original scope.\n• **Task:** Deliver a reliable, secure payment experience on schedule without burning out the team or introducing security vulnerabilities.\n• **Action:** I performed a rapid technical breakdown and identified that implementing both integrations with full test coverage would require an additional 10 business days. I met with the Product Manager and proposed an MVP phasing approach: launch on the agreed date with Stripe (handling 85% of target users) and deploy PayPal/Apple Pay in Phase 2 two weeks later behind a feature flag.\n• **Result:** The business launched on schedule, hit its target customer acquisition metrics with zero checkout failures, and seamlessly enabled the secondary payment methods two weeks later.'
    },

    // ==========================================
    // 10. SYSTEM DESIGN & ARCHITECTURE (SYSTEM_DESIGN TRACK)
    // ==========================================
    {
        id: 'sd-q1',
        role_id: 'common',
        track: 'SYSTEM_DESIGN',
        difficulty: 'Hard',
        topic: 'URL Shortener',
        question: 'Design a highly available URL Shortener service like Bitly handling 100M new URLs per month and a 100:1 read-to-write ratio.',
        answer_key: 'Capacity estimation, Base62 encoding vs MD5 hash truncation, Key Generation Service (KGS), Redis caching, 301 vs 302 redirects.',
        tips: [
            'Calculate write TPS (approx 40 RPS) and read TPS (approx 4,000 RPS)',
            'Explain why 301 (permanent) vs 302 (temporary) redirect affects analytics tracking',
            'Explain Key Generation Service to prevent duplicate token collisions'
        ],
        sample_answer: '1) **Capacity Estimation:** 100M writes/month = ~40 writes/sec; 100:1 read ratio = ~4,000 reads/sec. 2) **Short URL Generation:** A 7-character string using Base62 (a-z, A-Z, 0-9) yields 62^7 = ~3.5 trillion unique URLs. To prevent collision overhead with hashing, use a pre-generating **Key Generation Service (KGS)** that creates unique tokens offline in memory batches. 3) **Data Layer:** High read throughput favors a distributed NoSQL key-value store (DynamoDB/Cassandra) or PostgreSQL with B-tree index on `short_hash`. 4) **Caching:** Deploy a Redis cluster caching the top 20% most accessed URLs (Pareto Principle), absorbing 80%+ of incoming read traffic. 5) **Redirect Protocol:** Use HTTP 302 (Temporary Redirect) so every click passes through our servers for click analytics, rather than HTTP 301 which gets cached permanently in user browsers.'
    },
    {
        id: 'sd-q2',
        role_id: 'common',
        track: 'SYSTEM_DESIGN',
        difficulty: 'Hard',
        topic: 'Notification System',
        question: 'Design a real-time Notification System supporting Push, SMS, and Email with rate-limiting, priority queues, and deduplication.',
        answer_key: 'Fan-out architecture, Message brokers (Kafka/RabbitMQ) with priority topics, User preference service, Third-party gateway adapters (APNs, FCM, Twilio, SendGrid).',
        tips: [
            'Separate transactional notifications (OTP, fraud alerts) from bulk marketing',
            'Describe deduplication cache using Redis hash of (user_id + event_type + timestamp_window)',
            'Mention exponential backoff retries and dead-letter queues (DLQ)'
        ],
        sample_answer: '1) **Architecture:** Upstream microservices publish notification events to an API Gateway. A Notification Validator checks user contact information and notification preferences. 2) **Queuing & Decoupling:** Events route into partitioned Kafka message queues categorized by priority: High-Priority (OTPs, Security Alerts) and Standard-Priority (social likes, marketing). 3) **Deduplication:** A Redis cache checks key `dedup:{userId}:{notificationType}:{hash}` with a 5-minute TTL to prevent duplicate sends from retried upstream calls. 4) **Delivery Workers:** Stateless consumer workers consume from queues and dispatch to third-party provider adapters (Apple APNs / Google FCM for mobile push, Twilio for SMS, SendGrid for Email). 5) **Reliability:** Failed deliveries retry with exponential backoff and jitter; messages failing after 3 retries are published to a Dead Letter Queue (DLQ) for monitoring.'
    },
    {
        id: 'sd-q3',
        role_id: 'common',
        track: 'SYSTEM_DESIGN',
        difficulty: 'Hard',
        topic: 'Real-Time Chat Engine',
        question: 'Architect a 1-on-1 and Group Chat System supporting online status, message delivery receipts, and offline message synchronization.',
        answer_key: 'WebSocket gateways, User Connection Registry in Redis, Cassandra/HBase for time-series chat history, message sequence numbers.',
        tips: [
            'Differentiate HTTP for initial auth/handshake from persistent WebSocket connections',
            'Explain how offline messages are stored and synced via last-acknowledged message ID',
            'Describe heartbeat pings for online presence detection'
        ],
        sample_answer: '1) **Connection Management:** Clients authenticate via HTTP and establish persistent, bidirectional WebSocket connections through a scalable WebSocket Gateway layer. 2) **User Connection Registry:** A distributed Redis hash maps `user_id -> gateway_pod_id` to route messages directly to active connections. 3) **Message Flow:** When User A sends a message to User B: the WebSocket server writes the message to an append-heavy wide-column store (Cassandra or ScyllaDB keyed by `chat_id` and sorted by time-UUID). 4) **Delivery & Offline Handling:** If User B is online, the message is routed to their gateway pod; once received, client B sends an ACK updating status to "Delivered/Read". If User B is offline, an asynchronous worker pushes a notification via FCM/APNs. When User B reconnects, their client sends `sync(last_received_msg_id)` to stream all missed messages in order.'
    }
];

/**
 * Returns filtered questions from the canonical question bank.
 */
export function getCanonicalQuestions(filters = {}) {
    const { roleSlug = 'frontend', track = 'TECHNICAL', difficulty = 'All', topic = 'All', count = 10 } = filters;

    // 1. Filter by track first
    let pool = CANONICAL_INTERVIEW_QUESTIONS.filter(q => (q.track || 'TECHNICAL') === track);

    // 2. For TECHNICAL track, narrow to the candidate's canonical role if available
    if (track === 'TECHNICAL') {
        const rolePool = pool.filter(q => q.role_id === roleSlug);
        if (rolePool.length > 0) {
            pool = rolePool;
        }
    }

    // 3. Fallback to any questions in pool if none match
    if (pool.length === 0) {
        pool = CANONICAL_INTERVIEW_QUESTIONS.filter(q => q.role_id === roleSlug);
        if (pool.length === 0) {
            pool = CANONICAL_INTERVIEW_QUESTIONS;
        }
    }

    // 4. Filter by topic if specified and not 'All'
    if (topic && topic !== 'All') {
        const topicNorm = topic.toLowerCase();
        const topicMatches = pool.filter(q => 
            q.topic?.toLowerCase().includes(topicNorm) || 
            topicNorm.includes(q.topic?.toLowerCase())
        );
        if (topicMatches.length > 0) {
            pool = topicMatches;
        }
    }

    // 5. Filter by difficulty if specified and not 'All'
    if (difficulty && difficulty !== 'All') {
        const diffMatches = pool.filter(q => q.difficulty?.toLowerCase() === difficulty.toLowerCase());
        if (diffMatches.length > 0) {
            pool = diffMatches;
        }
    }

    return pool.slice(0, count);
}

