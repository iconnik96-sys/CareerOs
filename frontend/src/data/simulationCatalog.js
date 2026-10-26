// simulationCatalog.js - Modular and extensible catalog for CareerOS AI Work Simulations
// Easily extendable for adding new partner companies in the future

export const SIMULATION_COMPANIES = [
    {
        id: 'finpulse-payments',
        name: 'FinPulse Payments',
        tagline: 'High-Throughput Global Fintech & Payment Gateway Infrastructure',
        industry: 'Fintech & Banking',
        badge: 'Enterprise Partner',
        logoType: 'credit-card',
        accentColor: '#3b82f6',
        scaleMetrics: '15,000 req/sec • Sub-50ms SLA',
        role: 'Junior Backend & Platform Engineer',
        team: 'Core Payments & Ledger Infrastructure',
        stack: ['TypeScript', 'Node.js', 'Redis', 'PostgreSQL', 'Docker'],
        description: 'FinPulse powers real-time checkout and automated settlement infrastructure for 1,200+ global e-commerce merchants processing millions in daily GMV.',
        available: true,
        levels: {
            beginner: {
                levelId: 'beginner',
                label: 'Beginner',
                title: 'Fresher to Production Foundations',
                audience: 'Ideal for 1st & 2nd Year College Students',
                color: '#10b981',
                badgeBg: 'rgba(16, 185, 129, 0.15)',
                duration: '~45 mins total (3 Tasks)',
                description: 'Master strict payload boundary validation, API security headers, and structured RFC-7807 error handling with 1-click hints and plain-English guides.',
                tasks: [
                    {
                        id: 'FIN-BEG-1',
                        code: 'FIN-BEG-1',
                        title: 'Strict ISO-4217 Currency Code & Amount Boundary Validation',
                        badge: 'Task 1 • Beginner Friendly',
                        duration: '15 mins',
                        targetFile: 'paymentController.ts',
                        tipText: 'Tip: Check SUPPORTED_CURRENCIES & ensure amount > 0 with max 2 decimals',
                        scenario: "Downstream settlement reconciliation is failing because merchant webhooks send lowercase currency codes ('usd' instead of 'USD') and negative numbers.",
                        objective: 'Validate currency against SUPPORTED_CURRENCIES, enforce uppercase strings, and reject non-positive amounts with HTTP 422.',
                        constraint: 'RFC-7807 compliance; reject unverified decimal charges.',
                        the3Changes: [
                            '1. Declare/import SUPPORTED_CURRENCIES Set (USD, EUR, GBP, CAD, JPY, INR).',
                            '2. Validate currency is uppercase and in SUPPORTED_CURRENCIES; return 422 if invalid.',
                            '3. Validate amount is a positive number (amount > 0) with max 2 decimals; return 422 if invalid.'
                        ],
                        acceptanceCriteria: [
                            'Rejects lowercase currency codes ("usd", "eur") with HTTP 422 Unprocessable Entity.',
                            'Rejects negative or zero charge amounts (amount <= 0) with HTTP 422.',
                            'Only dispatches processPayment() when payload passes all boundary checks.'
                        ],
                        hint: `// 1. Verify currency in whitelist and uppercase
if (!currency || !SUPPORTED_CURRENCIES.has(currency) || currency !== currency.toUpperCase()) {
    return res.status(422).json({ error: 'Invalid currency. Must be uppercase ISO-4217: USD, EUR, GBP, CAD, JPY, INR' });
}
// 2. Verify amount is strictly positive
if (typeof amount !== 'number' || amount <= 0 || !/^\\d+(\\.\\d{1,2})?$/.test(amount.toString())) {
    return res.status(422).json({ error: 'Amount must be strictly positive with at most 2 decimal places' });
}`,
                        starterFile: 'paymentController.ts',
                        starterCode: `import { Request, Response } from 'express';
import { processPayment } from '../services/paymentService';
import { logger } from '../utils/logger';

// TODO Change 1 (FIN-BEG-1): Whitelist supported ISO-4217 currencies
const SUPPORTED_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'INR']);

export const handlePayment = async (req: Request, res: Response) => {
    try {
        const { amount, currency, paymentMethodId } = req.body;
        logger.info(\`Processing payment for \${amount} \${currency}\`);

        // TODO Change 2: Validate that currency exists in whitelist AND is uppercase ISO-4217
        // Return res.status(422).json({ error: '...' }) if validation fails

        // TODO Change 3: Validate that amount is a positive number (> 0) with max 2 decimals
        // Return res.status(422).json({ error: '...' }) if validation fails

        const result = await processPayment(amount, currency, paymentMethodId);
        return res.status(200).json(result);
    } catch (error: any) {
        logger.error('Payment processing failed', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};`,
                        solutionCode: `import { Request, Response } from 'express';
import { processPayment } from '../services/paymentService';
import { logger } from '../utils/logger';

// Change 1: Whitelist supported ISO-4217 currencies
const SUPPORTED_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'INR']);

export const handlePayment = async (req: Request, res: Response) => {
    try {
        const { amount, currency, paymentMethodId } = req.body;
        logger.info(\`Processing payment for \${amount} \${currency}\`);

        // Change 2: Strict ISO-4217 Currency Validation
        if (!currency || !SUPPORTED_CURRENCIES.has(currency) || currency !== currency.toUpperCase()) {
            return res.status(422).json({ error: 'Invalid currency. Must be uppercase ISO-4217: USD, EUR, GBP, CAD, JPY, INR' });
        }

        // Change 3: Strict Positive Amount Validation
        if (typeof amount !== 'number' || amount <= 0 || !/^\\d+(\\.\\d{1,2})?$/.test(amount.toString())) {
            return res.status(422).json({ error: 'Amount must be strictly positive with at most 2 decimal places' });
        }

        const result = await processPayment(amount, currency, paymentMethodId);
        return res.status(200).json(result);
    } catch (error: any) {
        logger.error('Payment processing failed', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};`,
                        mentorQuote: '"In high-volume fintech gateways, accepting lowercase strings like \\"usd\\" can corrupt ledger reconciliation. Validating boundaries at the edge prevents hundreds of thousands in accounting errors!"',
                        mentorInitialMessages: [
                            {
                                sender: 'ai',
                                name: 'Marcus (Staff Software Engineer)',
                                text: "Welcome to the payments core team! We have an audit warning from operations: several client requests slipped through with lowercase strings ('usd') and negative amounts."
                            },
                            {
                                sender: 'ai',
                                name: 'Marcus (Staff Software Engineer)',
                                text: "Look at paymentController.ts. Notice how handlePayment currently calls processPayment without verifying input boundaries."
                            },
                            {
                                sender: 'ai',
                                name: 'Marcus (Staff Software Engineer)',
                                text: "💡 Tip: Check if currency is in SUPPORTED_CURRENCIES, ensure currency === currency.toUpperCase(), and verify amount > 0. If invalid, return HTTP 422."
                            }
                        ],
                        terminalLogs: [
                            { type: 'system', text: 'CareerOS WebAssembly & Simulation Lab initialized [v2.4.0-release]' },
                            { type: 'command', text: 'tail -n 15 /var/log/finpulse/payment-validation.log' },
                            { type: 'stdout', text: '[2026-10-22T10:14:02.110Z] [WARN] Merchant 8829 submitted payload: { amount: -150.00, currency: "usd" }' },
                            { type: 'stderr', text: '[2026-10-22T10:14:02.115Z] [ERROR] Banking settlement network rejected: Invalid currency "usd" (expected ISO-4217 uppercase).' },
                            { type: 'stderr', text: '[2026-10-22T10:14:03.220Z] [ERROR] Ledger anomaly: Negative charge of -$150.00 attempted. Transaction aborted.' }
                        ]
                    },
                    {
                        id: 'FIN-BEG-2',
                        code: 'FIN-BEG-2',
                        title: 'Merchant API Key Signature Verification',
                        badge: 'Task 2 • Beginner Friendly',
                        duration: '15 mins',
                        targetFile: 'authMiddleware.ts',
                        tipText: 'Tip: Check x-merchant-id and x-finpulse-signature in req.headers',
                        scenario: "Unauthenticated requests are hitting internal payment endpoints. We must enforce API key signature authentication on all merchant requests.",
                        objective: 'Extract signature and merchant ID headers, verify formatting, and reject unauthenticated calls with HTTP 401.',
                        constraint: 'Block unauthorized requests before reaching controllers.',
                        the3Changes: [
                            '1. Extract x-merchant-id and x-finpulse-signature from req.headers.',
                            '2. Verify that both headers exist and are non-empty strings.',
                            '3. If missing or invalid, return HTTP 401 Unauthorized; otherwise, call next().'
                        ],
                        acceptanceCriteria: [
                            'Extracts x-merchant-id and x-finpulse-signature headers.',
                            'Returns 401 Unauthorized with descriptive JSON if either header is missing.',
                            'Calls next() to proceed to controller when headers are valid.'
                        ],
                        hint: `const merchantId = req.headers['x-merchant-id'];
const signature = req.headers['x-finpulse-signature'];
if (!merchantId || !signature) {
    return res.status(401).json({ error: 'Missing required merchant credentials (x-merchant-id, x-finpulse-signature)' });
}
next();`,
                        starterFile: 'authMiddleware.ts',
                        starterCode: `import { Request, Response, NextFunction } from 'express';

export const verifyMerchantSignature = (req: Request, res: Response, next: NextFunction) => {
    // TODO Change 1: Extract 'x-merchant-id' and 'x-finpulse-signature' from req.headers

    // TODO Change 2: Validate that both merchantId and signature are present and non-empty

    // TODO Change 3: If missing, return res.status(401).json({ error: 'Missing merchant credentials' })
    // If valid, call next()
    next();
};`,
                        solutionCode: `import { Request, Response, NextFunction } from 'express';

export const verifyMerchantSignature = (req: Request, res: Response, next: NextFunction) => {
    // Change 1: Extract merchant headers
    const merchantId = req.headers['x-merchant-id'];
    const signature = req.headers['x-finpulse-signature'];

    // Change 2: Validate presence
    if (!merchantId || !signature || typeof signature !== 'string' || signature.trim() === '') {
        // Change 3: Reject unauthorized requests with HTTP 401
        return res.status(401).json({ error: 'Missing required merchant credentials (x-merchant-id, x-finpulse-signature)' });
    }

    next();
};`,
                        mentorQuote: '"Authentication at the gateway boundary shields downstream databases from denial-of-service spam and unauthorized ledger queries."'
                    },
                    {
                        id: 'FIN-BEG-3',
                        code: 'FIN-BEG-3',
                        title: 'Structured RFC-7807 JSON Error Sanitizer',
                        badge: 'Task 3 • Beginner Friendly',
                        duration: '15 mins',
                        targetFile: 'errorMiddleware.ts',
                        tipText: 'Tip: Format error as RFC-7807 JSON and strip stack traces in production',
                        scenario: "Internal PostgreSQL connection strings and server stack traces were exposed to clients during a database timeout, violating security audit compliance.",
                        objective: 'Sanitize error responses, strip err.stack, and standardize output to RFC-7807 Problem Details JSON format.',
                        constraint: 'Zero sensitive internal stack trace leaks to client responses.',
                        the3Changes: [
                            '1. Catch unhandled error in global Express error handler.',
                            '2. Sanitize and remove stack trace from the client response payload.',
                            '3. Return HTTP 500 with standard RFC-7807 JSON: { type, title, status, detail, timestamp }.'
                        ],
                        acceptanceCriteria: [
                            'Strips err.stack from client response in all non-test environments.',
                            'Returns HTTP 500 Internal Server Error status code.',
                            'Returns structured JSON payload containing title, status, and detail.'
                        ],
                        hint: `res.status(500).json({
    type: 'https://api.finpulse.com/errors/internal-server-error',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected payment processing error occurred. Incident has been logged.',
    timestamp: new Date().toISOString()
});`,
                        starterFile: 'errorMiddleware.ts',
                        starterCode: `import { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Security vulnerability: currently leaking raw err.stack to clients!
    console.error('Unhandled payment error:', err);

    // TODO Change 1: Determine HTTP status (default to 500)
    // TODO Change 2: Strip sensitive stack traces and database credentials
    // TODO Change 3: Format output as RFC-7807 Problem Details JSON and send response
    res.status(500).json({ error: err.message, stack: err.stack });
};`,
                        solutionCode: `import { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled payment error:', err);

    // Change 1 & 2: Sanitize error and strip stack traces to prevent credential leaks
    const status = err.status || 500;
    
    // Change 3: Standard RFC-7807 Problem Details payload
    res.status(status).json({
        type: 'https://api.finpulse.com/errors/internal-server-error',
        title: 'Internal Payment Processing Error',
        status: status,
        detail: 'An unexpected processing error occurred. Transaction safely halted and logged for audit.',
        timestamp: new Date().toISOString()
    });
};`,
                        mentorQuote: '"Never leak stack traces in production! Attackers use stack traces to discover database table names and framework versions. Sanitize every boundary."'
                    }
                ]
            },
            intermediate: {
                levelId: 'intermediate',
                label: 'Intermediate',
                title: 'Concurrency & Resilience Engineering',
                audience: 'Ideal for 3rd & 4th Year Engineering Students',
                color: '#f59e0b',
                badgeBg: 'rgba(245, 158, 11, 0.15)',
                duration: '~60 mins total (3 Tasks)',
                description: 'Build enterprise-grade distributed systems: Redis distributed locks to prevent double-charges, sliding-window rate limiters, and resilient webhook dispatchers with exponential backoff.',
                tasks: [
                    {
                        id: 'FIN-INT-1',
                        code: 'FIN-INT-1',
                        title: 'Distributed Idempotency Key Lock (Race Condition Prevention)',
                        badge: 'Task 1 • Intermediate',
                        duration: '20 mins',
                        targetFile: 'idempotencyService.ts',
                        tipText: 'Tip: Use Redis SET idemp:{key} PROCESSING EX 60 NX',
                        scenario: "Mobile users with high latency double-tap 'Pay Now' within 100ms. Without distributed locks, concurrent threads double-charge customers $159.98.",
                        objective: 'Implement an atomic Redis lock using SET NX with 60s TTL; reject concurrent attempts with HTTP 409 Conflict.',
                        constraint: 'Zero duplicate charges under high concurrency race conditions.',
                        the3Changes: [
                            '1. Validate idempotencyKey presence and build redis key `idemp:${idempotencyKey}`.',
                            '2. Execute atomic Redis command SET NX with 60s TTL (rejecting duplicates).',
                            '3. Implement releaseLock / finalizeLock to cache final transaction payload with 24h TTL.'
                        ],
                        acceptanceCriteria: [
                            'Uses atomic redis.set() with NX (Not Exists) and 60-second TTL.',
                            'Returns false when lock acquisition fails (preventing duplicate processing).',
                            'Caches transaction result in Redis for subsequent duplicate queries.'
                        ],
                        hint: `const acquired = await redis.set(\`idemp:\${idempotencyKey}\`, 'PROCESSING', 'EX', 60, 'NX');
if (!acquired) {
    return false; // Lock acquisition failed: already running!
}
return true;`,
                        starterFile: 'idempotencyService.ts',
                        starterCode: `import { Redis } from 'ioredis';

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost' });

export class IdempotencyService {
    // TODO (FIN-INT-1): Prevent race conditions and double charges
    static async acquireLock(idempotencyKey: string): Promise<boolean> {
        // Change 1: Validate that idempotencyKey exists
        // Change 2: Acquire distributed lock in Redis atomically using SET NX and 60s TTL
        // Change 3: Return true if acquired, false if already in progress
        return true; // Insecure stub: currently accepts all duplicates!
    }

    static async releaseLock(idempotencyKey: string, result?: any): Promise<void> {
        // TODO: Save result with 24h TTL or delete key on failure
    }
}`,
                        solutionCode: `import { Redis } from 'ioredis';

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost' });

export class IdempotencyService {
    // Distributed Idempotency Key Lock (FIN-INT-1)
    static async acquireLock(idempotencyKey: string): Promise<boolean> {
        // Change 1: Validate key presence
        if (!idempotencyKey) {
            throw new Error('Missing Idempotency-Key header');
        }
        
        // Change 2 & 3: Atomic Redis SET with NX and 60s TTL
        const acquired = await redis.set(\`idemp:\${idempotencyKey}\`, 'PROCESSING', 'EX', 60, 'NX');
        if (!acquired) {
            return false; // Already locked or currently processing
        }
        return true;
    }

    static async releaseLock(idempotencyKey: string, result?: any): Promise<void> {
        if (result) {
            await redis.set(\`idemp:\${idempotencyKey}\`, JSON.stringify(result), 'EX', 86400);
        } else {
            await redis.del(\`idemp:\${idempotencyKey}\`);
        }
    }
}`,
                        mentorQuote: '"An atomic distributed lock ensures that even if a shopper taps pay five times in 50ms, exactly one charge reaches Visa/Mastercard."'
                    },
                    {
                        id: 'FIN-INT-2',
                        code: 'FIN-INT-2',
                        title: 'Token Bucket API Rate Limiter Middleware',
                        badge: 'Task 2 • Intermediate',
                        duration: '20 mins',
                        targetFile: 'rateLimiter.ts',
                        tipText: 'Tip: Track IP/client requests with Redis INCR and EXPIRE; return 429 when > 100',
                        scenario: "A rogue merchant script began sending 4,000 requests/second from a single IP, overwhelming payment workers. We need per-client rate limiting.",
                        objective: 'Implement a token bucket rate limiter tracking requests per minute; return HTTP 429 with standard Retry-After headers.',
                        constraint: 'Limit: 100 requests per 60 seconds per client IP.',
                        the3Changes: [
                            '1. Extract client IP and generate redis key `ratelimit:${clientIp}`.',
                            '2. Increment counter and set 60s TTL if key is new.',
                            '3. If count > 100, set Retry-After header and return HTTP 429 Too Many Requests.'
                        ],
                        acceptanceCriteria: [
                            'Increments request counter per IP in Redis.',
                            'Returns HTTP 429 Too Many Requests when requests exceed 100 in window.',
                            'Attaches X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After headers.'
                        ],
                        hint: `const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 60);
if (count > 100) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too Many Requests' });
}`,
                        starterFile: 'rateLimiter.ts',
                        starterCode: `import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost' });
const RATE_LIMIT_MAX = 100;

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // TODO Change 1: Extract client identifier (IP or API key)
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const key = \`ratelimit:\${clientIp}\`;

    // TODO Change 2: Atomic increment and sliding 60-second window in Redis

    // TODO Change 3: Check threshold (> RATE_LIMIT_MAX). Set headers and return 429 if exceeded
    next();
};`,
                        solutionCode: `import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost' });
const RATE_LIMIT_MAX = 100;

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const key = \`ratelimit:\${clientIp}\`;

    // Change 1 & 2: Increment count and set 60s window
    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, 60);
    }

    const remaining = Math.max(0, RATE_LIMIT_MAX - count);
    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    // Change 3: Enforce 429 Too Many Requests
    if (count > RATE_LIMIT_MAX) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ 
            error: 'Too Many Requests', 
            message: 'Rate limit exceeded. Maximum 100 requests per minute.' 
        });
    }

    next();
};`,
                        mentorQuote: '"Rate limiters protect the integrity of your platform. Without them, a single misconfigured merchant crawler can take down checkout for everyone."'
                    },
                    {
                        id: 'FIN-INT-3',
                        code: 'FIN-INT-3',
                        title: 'Webhook Event Dispatcher & Exponential Backoff',
                        badge: 'Task 3 • Intermediate',
                        duration: '20 mins',
                        targetFile: 'webhookService.ts',
                        tipText: 'Tip: Compute HMAC signature and retry with 2^attempt backoff on 5xx errors',
                        scenario: "Merchants miss crucial charge completion notifications when their endpoint experiences temporary server restarts.",
                        objective: 'Build an HMAC-signed webhook dispatcher with exponential backoff retries (1s, 2s, 4s) on HTTP failures.',
                        constraint: 'Sign payloads with HMAC-SHA256 and cap retries at 3 attempts.',
                        the3Changes: [
                            '1. Generate HMAC-SHA256 signature using merchant secret.',
                            '2. Implement retry loop executing up to 3 attempts with exponential delay (1000 * 2^attempt ms).',
                            '3. Return delivery status DELIVERED on 2xx response, or throw error after exhausted retries.'
                        ],
                        acceptanceCriteria: [
                            'Attaches X-FinPulse-Signature header computed via HMAC-SHA256.',
                            'Retries failed requests up to 3 times on HTTP 5xx responses.',
                            'Applies exponential backoff between retry attempts.'
                        ],
                        hint: `for (let attempt = 0; attempt < 3; attempt++) {
    try {
        const res = await fetch(url, { headers: { 'X-Signature': signature } });
        if (res.ok) return { status: 'DELIVERED' };
    } catch (e) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
}`,
                        starterFile: 'webhookService.ts',
                        starterCode: `import crypto from 'crypto';

export class WebhookService {
    static async dispatchWebhook(url: string, payload: any, secret: string): Promise<{ status: string }> {
        // TODO Change 1: Sign payload with HMAC-SHA256 using crypto.createHmac
        
        // TODO Change 2: Implement retry loop with exponential backoff (attempt 0, 1, 2)
        
        // TODO Change 3: Return { status: 'DELIVERED' } on success or throw after max retries
        return { status: 'PENDING' };
    }
}`,
                        solutionCode: `import crypto from 'crypto';

export class WebhookService {
    static async dispatchWebhook(url: string, payload: any, secret: string): Promise<{ status: string }> {
        // Change 1: HMAC-SHA256 Signature
        const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

        // Change 2: Exponential backoff retry loop (up to 3 attempts)
        const maxAttempts = 3;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-FinPulse-Signature': signature
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    // Change 3: Verified delivery
                    return { status: 'DELIVERED' };
                }
            } catch (err) {
                // If not last attempt, wait with exponential backoff
                if (attempt < maxAttempts - 1) {
                    const delayMs = 1000 * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }

        return { status: 'FAILED_RETRIES_EXHAUSTED' };
    }
}`,
                        mentorQuote: '"In distributed finance, at-least-once delivery with cryptographic signatures guarantees merchants never lose track of money."'
                    }
                ]
            },
            pro: {
                levelId: 'pro',
                label: 'Pro / Advanced',
                title: 'High-Concurrency Outages & Outage Engineering',
                audience: 'Production Incident & Systems Engineering',
                color: '#ef4444',
                badgeBg: 'rgba(239, 68, 68, 0.15)',
                duration: '~90 mins total (3 Tasks)',
                description: 'Full 4-pane workstation with live terminal logs, Docker container metrics, and zero handholding. Diagnose 504 flash-sale bottlenecks, circuit breakers, and goroutine memory leaks.',
                tasks: [
                    {
                        id: 'FIN-PRO-1',
                        code: 'FIN-PRO-1',
                        title: '504 Flash Sale Spike Connection Pool Bottleneck',
                        badge: 'Task 1 • Production Incident',
                        duration: '30 mins',
                        targetFile: 'docker-compose.yml',
                        tipText: 'Tip: Scale DB_POOL_SIZE and MAX_CONCURRENT_REQUESTS in environment',
                        scenario: "Black Friday flash sale surge: 15,000 customers checked out simultaneously, causing 504 Gateway Timeouts and OOM service crashes.",
                        objective: 'Reconfigure container limits: scale DB_POOL_SIZE from 10 to 50 and MAX_CONCURRENT_REQUESTS to 500.',
                        constraint: 'Eliminate 504 dropped transactions while respecting PostgreSQL server limits.',
                        the3Changes: [
                            '1. Scale database connection pool: change DB_POOL_SIZE from 10 to 50.',
                            '2. Increase incoming request worker capacity: change MAX_CONCURRENT_REQUESTS from 50 to 500.',
                            '3. Verify redis host and postgres dependency linkages.'
                        ],
                        acceptanceCriteria: [
                            'Configures DB_POOL_SIZE to 50.',
                            'Configures MAX_CONCURRENT_REQUESTS to 500.',
                            'P95 latency drops below 50ms and zero 504 Gateway Timeout errors occur.'
                        ],
                        hint: `DB_POOL_SIZE=50
MAX_CONCURRENT_REQUESTS=500`,
                        starterFile: 'docker-compose.yml',
                        starterCode: `version: '3.8'
services:
  payment-service:
    build: .
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      # Incident #504 Bottleneck: Only 10 DB connections for 15,000 req/sec!
      # TODO Change 1: Scale DB_POOL_SIZE to 50
      - DB_POOL_SIZE=10
      # TODO Change 2: Scale MAX_CONCURRENT_REQUESTS to 500
      - MAX_CONCURRENT_REQUESTS=50
      - REDIS_HOST=redis
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis`,
                        solutionCode: `version: '3.8'
services:
  payment-service:
    build: .
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      # Scaled Connection Pool for 15,000 req/sec flash sale
      # Change 1: Increased pool size to 50
      - DB_POOL_SIZE=50
      # Change 2: Increased concurrent worker capacity to 500
      - MAX_CONCURRENT_REQUESTS=500
      - REDIS_HOST=redis
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis`,
                        mentorQuote: '"Scaling DB connection pools to match worker concurrency is the classic difference between a Black Friday outage and record-breaking revenue."'
                    },
                    {
                        id: 'FIN-PRO-2',
                        code: 'FIN-PRO-2',
                        title: 'Zero-Downtime Circuit Breaker Implementation',
                        badge: 'Task 2 • Production Incident',
                        duration: '30 mins',
                        targetFile: 'circuitBreaker.ts',
                        tipText: 'Tip: Implement CLOSED, OPEN, HALF_OPEN state machine based on failure threshold',
                        scenario: "A partner banking gateway experienced an outage. Our payment service kept hammering the broken bank, tying up server threads until all services crashed.",
                        objective: 'Implement a Circuit Breaker pattern with 3 states (CLOSED, OPEN, HALF_OPEN) that fails fast when error rate exceeds 50%.',
                        constraint: 'Fail fast in < 2ms when circuit is OPEN, probe recovery after 10s cooldown.',
                        the3Changes: [
                            '1. Track consecutive failure counts in rolling window.',
                            '2. When failures >= 5, transition state to OPEN and reject requests immediately.',
                            '3. After resetTimeout (10s), enter HALF_OPEN and allow a trial probe request to test recovery.'
                        ],
                        acceptanceCriteria: [
                            'Maintains state machine transitions: CLOSED -> OPEN -> HALF_OPEN -> CLOSED.',
                            'Throws immediate circuit open exception when state is OPEN without making network call.',
                            'Resets failure counter and transitions to CLOSED upon successful trial probe.'
                        ],
                        hint: `if (this.state === 'OPEN') {
    if (Date.now() - this.lastFailureTime > 10000) {
        this.state = 'HALF_OPEN';
    } else {
        throw new Error('Circuit Breaker is OPEN: downstream bank unreachable');
    }
}`,
                        starterFile: 'circuitBreaker.ts',
                        starterCode: `export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
    private state: CircuitState = 'CLOSED';
    private failureCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly failureThreshold: number = 5;
    private readonly resetTimeoutMs: number = 10000;

    async execute<T>(action: () => Promise<T>): Promise<T> {
        // TODO Change 1: Check if circuit is OPEN. If timeout elapsed, enter HALF_OPEN, else throw fast
        
        // TODO Change 2: Execute action in try block. On success, reset failures and transition to CLOSED
        
        // TODO Change 3: On error, increment failure count. If >= threshold, transition to OPEN
        return await action();
    }
}`,
                        solutionCode: `export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
    private state: CircuitState = 'CLOSED';
    private failureCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly failureThreshold: number = 5;
    private readonly resetTimeoutMs: number = 10000;

    async execute<T>(action: () => Promise<T>): Promise<T> {
        // Change 1: State validation and fast failure
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('CircuitBreaker: OPEN - Downstream banking partner unreachable. Failing fast.');
            }
        }

        try {
            const result = await action();
            // Change 2: Recovery on success
            this.failureCount = 0;
            this.state = 'CLOSED';
            return result;
        } catch (err) {
            // Change 3: Failure tracking and circuit tripping
            this.failureCount++;
            this.lastFailureTime = Date.now();
            if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
                this.state = 'OPEN';
            }
            throw err;
        }
    }
}`,
                        mentorQuote: '"A circuit breaker prevents cascading failures. If a bank API goes down, fail fast immediately so your checkout servers remain responsive for other cards."'
                    },
                    {
                        id: 'FIN-PRO-3',
                        code: 'FIN-PRO-3',
                        title: 'Database Connection Drain & Context Timeout (Memory Leak Fix)',
                        badge: 'Task 3 • Production Incident',
                        duration: '30 mins',
                        targetFile: 'transactionService.go',
                        tipText: 'Tip: Add context.WithTimeout(ctx, 3*time.Second) and defer conn.Close()',
                        scenario: "Our Go transaction processor suffered a SIGSEGV out-of-memory crash. Profiling showed database connections were opened but never returned to the pool.",
                        objective: 'Fix the connection leak by adding defer conn.Close(), apply 3-second query timeouts, and handle context cancellations.',
                        constraint: 'Zero leaked database connections; strict 3-second deadline.',
                        the3Changes: [
                            '1. Add context.WithTimeout(ctx, 3*time.Second) with defer cancel().',
                            '2. Acquire connection and immediately defer conn.Close() to return connection to pool.',
                            '3. Execute transaction with timeout context.'
                        ],
                        acceptanceCriteria: [
                            'Applies 3-second context deadline with cancellation cleanup.',
                            'Guarantees connection release using defer conn.Close().',
                            'Prevents unclosed connection accumulation under high concurrency.'
                        ],
                        hint: `ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
defer cancel()

conn, err := s.db.Conn(ctx)
if err != nil { return err }
defer conn.Close()`,
                        starterFile: 'transactionService.go',
                        starterCode: `package main

import (
    "context"
    "database/sql"
    "fmt"
    "time"
)

type TransactionService struct {
    db *sql.DB
}

func (s *TransactionService) ExecutePayment(ctx context.Context, merchantID string, amount float64) error {
    // VULNERABILITY: No query timeout & connection is NEVER closed!
    
    // TODO Change 1: Wrap ctx with context.WithTimeout (3 seconds) and defer cancel()
    
    // TODO Change 2: Acquire connection and guarantee release with defer conn.Close()
    conn, err := s.db.Conn(ctx)
    if err != nil {
        return fmt.Errorf("connection pool exhausted: %w", err)
    }
    // Missing defer conn.Close() causes SIGSEGV OOM crash!

    // TODO Change 3: Execute query safely with context
    _ = conn
    return nil
}`,
                        solutionCode: `package main

import (
    "context"
    "database/sql"
    "fmt"
    "time"
)

type TransactionService struct {
    db *sql.DB
}

func (s *TransactionService) ExecutePayment(ctx context.Context, merchantID string, amount float64) error {
    // Change 1: 3-second deadline context
    ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
    defer cancel()

    // Change 2: Acquire connection and guarantee cleanup back to pool
    conn, err := s.db.Conn(ctx)
    if err != nil {
        return fmt.Errorf("connection pool exhausted: %w", err)
    }
    defer conn.Close() // Fixes memory and connection pool leak

    // Change 3: Execute query with timeout context
    _, err = conn.ExecContext(ctx, "UPDATE balances SET amount = amount - $1 WHERE merchant_id = $2", amount, merchantID)
    if err != nil {
        return fmt.Errorf("payment execution failed: %w", err)
    }

    return nil
}`,
                        mentorQuote: '"In high-throughput Go services, forgetting `defer conn.Close()` exhausts the pool within minutes. Always tie connection lifetimes to request contexts."'
                    }
                ]
            }
        }
    },
    // Future partner companies slot in here seamlessly:
    {
        id: 'healthpulse-ai',
        name: 'HealthPulse Medical AI',
        tagline: 'HIPAA-Compliant Real-Time Patient Analytics & Triage Platform',
        industry: 'Healthcare & AI',
        badge: 'Coming Soon',
        logoType: 'heart-pulse',
        accentColor: '#10b981',
        scaleMetrics: 'HIPAA Audited • HL7 FHIR Protocol',
        role: 'Healthcare Data & API Engineer',
        team: 'Patient Telemetry & Edge Inference',
        stack: ['Python', 'FastAPI', 'Kafka', 'PostgreSQL'],
        description: 'Process telemetry from 50,000 hospital monitors in real time, executing automated early-warning sepsis alerts with sub-second accuracy.',
        available: false
    },
    {
        id: 'cloudscale-infra',
        name: 'CloudScale Infra',
        tagline: 'Multi-Region Kubernetes Observability & Distributed Tracing',
        industry: 'Cloud & DevOps',
        badge: 'Coming Soon',
        logoType: 'cloud',
        accentColor: '#6366f1',
        scaleMetrics: '100k Pods • eBPF Tracing',
        role: 'Site Reliability & Cloud Infrastructure Engineer',
        team: 'Core Reliability & Traffic Routing',
        stack: ['Go', 'Kubernetes', 'Prometheus', 'Envoy'],
        description: 'Maintain 99.999% uptime across 12 AWS regions, engineering self-healing service meshes and automated canary rollbacks.',
        available: false
    }
];

export const getCompanyById = (id) => {
    return SIMULATION_COMPANIES.find(c => c.id === id) || SIMULATION_COMPANIES[0];
};

export const getLevelData = (companyId, levelKey) => {
    const company = getCompanyById(companyId);
    return company?.levels?.[levelKey] || company?.levels?.beginner;
};
