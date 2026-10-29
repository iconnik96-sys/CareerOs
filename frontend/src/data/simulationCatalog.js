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
                        title: 'Bug Fix: Block Negative Amounts & Invalid Currencies',
                        badge: 'Task 1 • Beginner Friendly',
                        duration: '15 mins',
                        targetFile: 'paymentController.ts',
                        tipText: 'Tip: Check if SUPPORTED_CURRENCIES has currency, and verify amount > 0',
                        scenario: "A customer submitted an order with amount = -₹150 and currency = 'usd' instead of 'USD', causing an accounting error. Add validation to reject negative prices and lowercase currencies.",
                        objective: 'Ensure currency is uppercase and in SUPPORTED_CURRENCIES, and amount is strictly positive with max 2 decimals.',
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
                        title: 'Security Fix: Block Requests Missing an API Key',
                        badge: 'Task 2 • Beginner Friendly',
                        duration: '15 mins',
                        targetFile: 'authMiddleware.ts',
                        tipText: 'Tip: Check x-merchant-id and x-finpulse-signature in req.headers',
                        scenario: "Spam bots are hitting our payment endpoints without logging in. Add an authentication check to block any request that doesn't send the merchant ID and signature headers.",
                        objective: 'Read x-merchant-id and x-finpulse-signature from req.headers. If missing, return HTTP 401 Unauthorized.',
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
                        title: 'Security Fix: Hide Database Passwords & Stack Traces from Error Screens',
                        badge: 'Task 3 • Beginner Friendly',
                        duration: '15 mins',
                        targetFile: 'errorMiddleware.ts',
                        tipText: 'Tip: Return clean JSON with title, status 500, and detail; never send err.stack to clients',
                        scenario: "When the database crashed, our server sent the full PostgreSQL credentials and file paths directly to the user's browser. Clean up the error handler so clients only see a friendly error message.",
                        objective: 'Remove err.stack and return a clean { title, status: 500, detail } JSON response.',
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
                        title: 'Bug Fix: Stop Double-Charging When Impatient Users Tap "Pay" Twice',
                        badge: 'Task 1 • Intermediate',
                        duration: '20 mins',
                        targetFile: 'idempotencyService.ts',
                        tipText: 'Tip: Use Redis SET idemp:{key} PROCESSING EX 60 NX',
                        scenario: "When internet is slow, shoppers tap 'Pay Now' multiple times in 1 second, accidentally charging their card twice. Use Redis to lock the transaction so identical payments are processed only once.",
                        objective: 'Acquire an atomic 60-second Redis lock. If already processing, reject the duplicate request.',
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
                        title: 'Scale Fix: Limit Users to 100 Requests/Min to Prevent Scraper Crashes',
                        badge: 'Task 2 • Intermediate',
                        duration: '20 mins',
                        targetFile: 'rateLimiter.ts',
                        tipText: 'Tip: Track IP/client requests with Redis INCR and EXPIRE; return 429 when > 100',
                        scenario: "A rogue bot sent 4,000 requests/second from a single IP, crashing our payment checkout. Build a rate limiter to block any IP sending more than 100 requests in 60 seconds.",
                        objective: 'Count requests per IP in Redis. If requests exceed 100 in 60 seconds, return HTTP 429 (Too Many Requests).',
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
                        title: 'Reliability: Auto-Retry Failed Webhooks with Doubling Delays (1s, 2s, 4s)',
                        badge: 'Task 3 • Intermediate',
                        duration: '20 mins',
                        targetFile: 'webhookService.ts',
                        tipText: 'Tip: Compute HMAC signature and retry with 2^attempt backoff on 5xx errors',
                        scenario: "When a merchant server restarts, payment confirmation webhooks fail. Add a retry loop that tries 3 times with doubling wait times (1s, 2s, 4s) before giving up.",
                        objective: 'Send the webhook. If it fails, wait 1s, then 2s, then 4s before marking as failed.',
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
                        title: 'DevOps Fix: Increase Server Connection Pool for Flash Sale Traffic',
                        badge: 'Task 1 • Production Incident',
                        duration: '30 mins',
                        targetFile: 'docker-compose.yml',
                        tipText: 'Tip: Change DB_POOL_SIZE to 50 and MAX_CONCURRENT_REQUESTS to 500 in docker-compose.yml',
                        scenario: "During a Black Friday sale, 15,000 shoppers overwhelmed our default settings (only 10 database connections allowed). Scale the config settings to 50 connections and 500 workers.",
                        objective: 'Edit docker-compose.yml to scale DB_POOL_SIZE=50 and MAX_CONCURRENT_REQUESTS=500.',
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
                        title: 'Architecture: Stop Calling a Broken Bank API to Prevent App Hangs',
                        badge: 'Task 2 • Production Incident',
                        duration: '30 mins',
                        targetFile: 'circuitBreaker.ts',
                        tipText: 'Tip: If state is OPEN, check if 10s passed to set HALF_OPEN, else throw fast error',
                        scenario: "When a partner banking gateway went down, our server kept waiting 30 seconds on every request, freezing the whole checkout. If a partner bank fails 5 times, stop calling them and fail fast for 10 seconds.",
                        objective: 'Track failed bank attempts. When failures hit 5, trip the circuit breaker to OPEN to protect your servers.',
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
                        title: 'Memory Leak Fix: Always Release Database Connections in Finally Block',
                        badge: 'Task 3 • Production Incident',
                        duration: '30 mins',
                        targetFile: 'transactionService.ts',
                        tipText: 'Tip: Wrap query in try/finally and call client.release() in finally block',
                        scenario: "Our payment server crashed with an out-of-memory error because database queries were opened but never released back to the pool. Wrap the query in a try/finally block so connections are always freed.",
                        objective: 'Acquire database client, execute query with 3-second timeout, and always call client.release() in a finally block.',
                        constraint: 'Zero leaked database connections; guaranteed release in finally block.',
                        the3Changes: [
                            '1. Acquire client from database pool using await pool.connect().',
                            '2. Execute transaction query inside try block with 3s timeout.',
                            '3. Call client.release() inside finally block to guarantee connection cleanup.'
                        ],
                        acceptanceCriteria: [
                            'Acquires connection client from PostgreSQL pool.',
                            'Guarantees connection release using client.release() in finally block.',
                            'Prevents leaked orphaned connections even when query throws an error.'
                        ],
                        hint: `let client;
try {
    client = await pool.connect();
    await client.query('UPDATE balances SET amount = amount - $1 WHERE merchant_id = $2', [amount, merchantId]);
} finally {
    if (client) client.release(); // Crucial: always returns connection to pool!
}`,
                        starterFile: 'transactionService.ts',
                        starterCode: `import { Pool, PoolClient } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    connectionTimeoutMillis: 3000
});

export class TransactionService {
    static async executePayment(merchantId: string, amount: number): Promise<void> {
        // VULNERABILITY: Connection is acquired but NEVER released on error!
        // Leaks open connections until server crashes with Out of Memory.
        
        let client: PoolClient | null = null;
        // TODO Change 1: Connect to pool in try block: client = await pool.connect()
        
        // TODO Change 2: Execute query with timeout
        
        // TODO Change 3: Crucial fix! Add finally block to ALWAYS call client.release()
    }
}`,
                        solutionCode: `import { Pool, PoolClient } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    connectionTimeoutMillis: 3000
});

export class TransactionService {
    static async executePayment(merchantId: string, amount: number): Promise<void> {
        let client: PoolClient | null = null;
        try {
            // Change 1: Acquire client from pool
            client = await pool.connect();
            
            // Change 2: Execute balance update
            await client.query('UPDATE balances SET amount = amount - $1 WHERE merchant_id = $2', [amount, merchantId]);
        } finally {
            // Change 3: Crucial fix! Always return connection to pool even if query fails
            if (client) {
                client.release();
            }
        }
    }
}`,
                        mentorQuote: '"In high-throughput Node.js microservices, forgetting client.release() in a finally block exhausts your pool within minutes. Always release connections!"'
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
        badge: 'AI Engineering Partner',
        logoType: 'heart-pulse',
        accentColor: '#10b981',
        scaleMetrics: '50,000 Hospital Beds • Sub-second AI Triage',
        role: 'AI & Clinical Data Platform Engineer',
        team: 'Patient Telemetry & Clinical LLM Systems',
        stack: ['Python', 'FastAPI', 'Pydantic', 'LangChain', 'PostgreSQL'],
        description: 'Process telemetry from 50,000 hospital monitors in real time, validating clinical LLM diagnostic output, preventing hallucinations, and executing automated sepsis alerts.',
        available: true,
        levels: {
            beginner: {
                levelId: 'beginner',
                label: 'Beginner',
                title: 'AI Output Validation & Clinical Guardrails',
                audience: 'Ideal for Students Learning Python, LLMs & Pydantic',
                color: '#10b981',
                badgeBg: 'rgba(16, 185, 129, 0.15)',
                duration: '~45 mins total (3 Tasks)',
                description: 'Build real GenAI guardrails in Python: strip broken markdown fences from OpenAI JSON, hide private phone numbers & SSNs, and build smart retry loops with backup fallbacks.',
                tasks: [
                    {
                        id: 'HLTH-BEG-1',
                        code: 'HLTH-BEG-1',
                        title: 'AI Guardrail: Strip Markdown Fences & Block Bad AI Blood Pressure Numbers',
                        badge: 'Task 1 • Beginner Friendly',
                        duration: '15 mins',
                        targetFile: 'clinicalSummaryValidator.py',
                        tipText: 'Tip: Strip ```json and ``` wrappers, then use @field_validator to enforce 60 <= systolic_bp <= 250',
                        scenario: "When you ask OpenAI to return JSON, it often wraps it inside markdown code fences (```json ... ```) or hallucinates impossible numbers (like blood pressure = -40 or 999). Hospital databases crash when this happens. Clean the raw text so it parses cleanly, and add a Pydantic validator to reject bad numbers with HTTP 422.",
                        objective: 'Strip markdown code fences (```json), enforce that systolic blood pressure is between 60 and 250 mmHg in Pydantic, and return HTTP 422 if invalid.',
                        constraint: 'Reject unverified vitals; guarantee clean JSON output.',
                        the3Changes: [
                            '1. Implement clean_llm_markdown() to remove ```json and ``` wrappers from raw LLM output.',
                            '2. Add @field_validator("systolic_bp") to ensure systolic is between 60 and 250 mmHg; raise ValueError if invalid.',
                            '3. In parse_and_validate_summary(), catch validation errors and return structured 422 error payload.'
                        ],
                        acceptanceCriteria: [
                            'Correctly strips markdown code fences (```json ... ```) from string inputs.',
                            'Rejects out-of-range systolic blood pressure (< 60 or > 250 mmHg) with HTTP 422.',
                            'Returns parsed ClinicalSummary schema with HTTP 200 for clean vitals.'
                        ],
                        hint: `# 1. Clean markdown fences
cleaned = raw_output.strip()
if cleaned.startswith('\`\`\`json'):
    cleaned = cleaned[7:]
elif cleaned.startswith('\`\`\`'):
    cleaned = cleaned[3:]
if cleaned.endswith('\`\`\`'):
    cleaned = cleaned[:-3]
return cleaned.strip()

# 2. In Pydantic validator:
if not (60 <= v <= 250):
    raise ValueError('Systolic BP must be between 60 and 250 mmHg')`,
                        starterFile: 'clinicalSummaryValidator.py',
                        starterCode: `import json
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class VitalsPayload(BaseModel):
    patient_id: str
    heart_rate: int = Field(..., ge=30, le=220)
    systolic_bp: int
    diastolic_bp: int = Field(..., ge=40, le=140)
    temperature_c: float = Field(..., ge=32.0, le=43.0)

    # TODO Change 2 (HLTH-BEG-1): Add @field_validator('systolic_bp')
    # Systolic must be between 60 and 250 mmHg; raise ValueError if out of bounds

def clean_llm_markdown(raw_output: str) -> str:
    """
    TODO Change 1: Strip markdown code fences (e.g. \`\`\`json ... \`\`\`) from raw LLM output.
    """
    return raw_output.strip()

def parse_and_validate_summary(raw_llm_json: str) -> dict:
    """
    TODO Change 3: Clean markdown fences, parse JSON, validate with VitalsPayload,
    and return dict with status 200 or status 422 if invalid.
    """
    clean_json = clean_llm_markdown(raw_llm_json)
    data = json.loads(clean_json)
    return {"status": 200, "data": data}
`,
                        solutionCode: `import json
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class VitalsPayload(BaseModel):
    patient_id: str
    heart_rate: int = Field(..., ge=30, le=220)
    systolic_bp: int
    diastolic_bp: int = Field(..., ge=40, le=140)
    temperature_c: float = Field(..., ge=32.0, le=43.0)

    @field_validator('systolic_bp')
    @classmethod
    def validate_systolic_bp(cls, v: int) -> int:
        if not (60 <= v <= 250):
            raise ValueError('Systolic BP must be between 60 and 250 mmHg')
        return v

def clean_llm_markdown(raw_output: str) -> str:
    cleaned = raw_output.strip()
    if cleaned.startswith('\`\`\`json'):
        cleaned = cleaned[7:]
    elif cleaned.startswith('\`\`\`'):
        cleaned = cleaned[3:]
    if cleaned.endswith('\`\`\`'):
        cleaned = cleaned[:-3]
    return cleaned.strip()

def parse_and_validate_summary(raw_llm_json: str) -> dict:
    try:
        clean_json = clean_llm_markdown(raw_llm_json)
        raw_data = json.loads(clean_json)
        validated = VitalsPayload(**raw_data)
        return {"status": 200, "data": validated.model_dump()}
    except Exception as e:
        return {"status": 422, "error": f"Invalid clinical vitals payload: {str(e)}"}
`,
                        mentorQuote: '"In clinical AI applications, an unvalidated LLM output hallucinating a negative blood pressure could trigger erroneous drug dosages. Pydantic boundary validation at the API edge protects patient safety!"',
                        mentorInitialMessages: [
                            {
                                sender: 'ai',
                                name: 'Dr. Elena Rostova (Staff Clinical AI Lead)',
                                text: "Welcome to the HealthPulse AI team! We have an urgent bug in our ER triage pipeline: OpenAI GPT-4o periodically emits triple-backtick markdown blocks and hallucinated blood pressure values."
                            },
                            {
                                sender: 'ai',
                                name: 'Dr. Elena Rostova (Staff Clinical AI Lead)',
                                text: "Take a look at clinicalSummaryValidator.py. We need you to strip markdown code fences, enforce biological bounds on systolic BP using Pydantic V2, and return clean HTTP 422 on bad data."
                            }
                        ],
                        terminalLogs: [
                            { type: 'system', text: 'HealthPulse Medical AI Telemetry Daemon initialized [v1.8.2]' },
                            { type: 'command', text: 'tail -n 12 /var/log/healthpulse/llm-triage.log' },
                            { type: 'stdout', text: '[2026-10-22T08:14:10.021Z] [WARN] LLM emitted fenced JSON: ```json {"systolic_bp": -12, "diastolic_bp": 80} ```' },
                            { type: 'stderr', text: '[2026-10-22T08:14:10.025Z] [CRITICAL] EHR Ingestion Exception: JSONDecodeError at character 0. Sepsis alert delayed!' }
                        ]
                    },
                    {
                        id: 'HLTH-BEG-2',
                        code: 'HLTH-BEG-2',
                        title: 'Data Privacy: Hide Social Security & Phone Numbers Before Sending to AI',
                        badge: 'Task 2 • Beginner Friendly',
                        duration: '15 mins',
                        targetFile: 'hipaaSanitizer.py',
                        tipText: 'Tip: Use re.sub() with SSN_REGEX and PHONE_REGEX to replace sensitive numbers with [REDACTED_SSN] and [REDACTED_PHONE]',
                        scenario: "Doctors copy-paste consultation notes containing private phone numbers and Social Security Numbers into AI prompts. Before sending prompt text to OpenAI, run a regex filter that masks SSNs as [REDACTED_SSN] and phone numbers as [REDACTED_PHONE] so private data never leaks.",
                        objective: 'Use regex to find all SSNs and phone numbers and replace them with [REDACTED_SSN] and [REDACTED_PHONE] before sending to OpenAI.',
                        constraint: 'Zero raw SSNs or phone numbers may leave the local cluster.',
                        the3Changes: [
                            '1. Define SSN_REGEX matching XXX-XX-XXXX format.',
                            '2. Define PHONE_REGEX matching XXX-XXX-XXXX format.',
                            '3. Substitute all occurrences with [REDACTED_SSN] and [REDACTED_PHONE] and return sanitized text.'
                        ],
                        acceptanceCriteria: [
                            'Replaces all SSN formats with [REDACTED_SSN].',
                            'Replaces all phone number formats with [REDACTED_PHONE].',
                            'Leaves legitimate clinical notes and dosages intact.'
                        ],
                        hint: `SSN_REGEX = re.compile(r'\\b\\d{3}-\\d{2}-\\d{4}\\b')
PHONE_REGEX = re.compile(r'(\\+?1[-.\\s]?)?(\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4})')
sanitized = SSN_REGEX.sub('[REDACTED_SSN]', notes)
sanitized = PHONE_REGEX.sub('[REDACTED_PHONE]', sanitized)`,
                        starterFile: 'hipaaSanitizer.py',
                        starterCode: `import re

# TODO Change 1 (HLTH-BEG-2): Define SSN regex matching standard 9-digit formats (XXX-XX-XXXX)
SSN_REGEX = re.compile(r'\\b\\d{3}-\\d{2}-\\d{4}\\b')

# TODO Change 2: Define US Phone Number regex (e.g. XXX-XXX-XXXX)
PHONE_REGEX = re.compile(r'(\\+?1[-.\\s]?)?(\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4})')

def sanitize_clinical_notes(notes: str) -> str:
    """
    TODO Change 3: Replace all SSNs with '[REDACTED_SSN]' and phone numbers with '[REDACTED_PHONE]'
    before sending prompt notes to third-party LLM APIs.
    """
    sanitized = notes
    return sanitized
`,
                        solutionCode: `import re

# Change 1: Regex matching US Social Security Numbers (XXX-XX-XXXX)
SSN_REGEX = re.compile(r'\\b\\d{3}-\\d{2}-\\d{4}\\b')

# Change 2: Regex matching standard US phone numbers
PHONE_REGEX = re.compile(r'(\\+?1[-.\\s]?)?(\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4})')

def sanitize_clinical_notes(notes: str) -> str:
    """
    Change 3: Redact all patient SSNs and phone numbers to ensure strict HIPAA compliance.
    """
    if not notes:
        return ""
    sanitized = SSN_REGEX.sub('[REDACTED_SSN]', notes)
    sanitized = PHONE_REGEX.sub('[REDACTED_PHONE]', sanitized)
    return sanitized
`,
                        mentorQuote: '"HIPAA violations carry statutory penalties up to $50,000 per violation. Sanitizing patient identifiers before sending tokens to an external LLM provider is a non-negotiable compliance requirement."',
                        mentorInitialMessages: [
                            {
                                sender: 'ai',
                                name: 'Dr. Elena Rostova (Staff Clinical AI Lead)',
                                text: "Compliance audit flagged an issue: doctors are pasting consultation transcripts that contain SSNs and contact numbers directly into our AI triage prompt."
                            },
                            {
                                sender: 'ai',
                                name: 'Dr. Elena Rostova (Staff Clinical AI Lead)',
                                text: "Open hipaaSanitizer.py. Let's build a deterministic regex filter that redacts SSNs and phone numbers before LLM serialization."
                            }
                        ],
                        terminalLogs: [
                            { type: 'system', text: 'HIPAA Auditing Service [v2.4.0]' },
                            { type: 'command', text: 'pytest tests/test_hipaa_sanitizer.py' },
                            { type: 'stderr', text: '[SECURITY AUDIT FAIL] Unmasked SSN detected in outgoing prompt payload: "Patient SSN: 984-22-1104"' },
                            { type: 'stderr', text: '[SECURITY AUDIT FAIL] Unmasked Phone detected in outgoing prompt payload: "Emergency contact: 415-555-0199"' }
                        ]
                    },
                    {
                        id: 'HLTH-BEG-3',
                        code: 'HLTH-BEG-3',
                        title: 'Reliability: Auto-Retry When OpenAI Rate-Limits (429) and Fall Back to Safe Rules',
                        badge: 'Task 3 • Beginner Friendly',
                        duration: '15 mins',
                        targetFile: 'llmClient.py',
                        tipText: 'Tip: Retry up to 3 times with doubling sleep (0.05 * 2^attempt); if all fail, return compute_heuristic_fallback()',
                        scenario: "During peak hours, OpenAI returns HTTP 429 Rate Limit errors, causing the app to freeze. Add a retry loop that tries up to 3 times with doubling wait times. If OpenAI is completely down, fall back to our local rule-based score so doctors never get a blank screen.",
                        objective: 'Implement a 3-attempt exponential backoff retry loop for 429 errors, falling back to compute_heuristic_fallback() if all attempts fail.',
                        constraint: 'Never crash the triage queue; always return a valid triage classification.',
                        the3Changes: [
                            '1. Implement loop with max_retries attempts.',
                            '2. Catch RateLimitError and apply exponential backoff sleep.',
                            '3. If retries are exhausted, invoke and return compute_heuristic_fallback(patient_vitals).'
                        ],
                        acceptanceCriteria: [
                            'Retries up to max_retries times upon catching RateLimitError.',
                            'Falls back gracefully to deterministic rule-based triage score upon exhaustion.',
                            'Sets payload source to "heuristic_fallback" so attending physicians know LLM was bypassed.'
                        ],
                        hint: `for attempt in range(max_retries):
    try:
        return call_openai_triage_api(patient_vitals)
    except RateLimitError:
        if attempt < max_retries - 1:
            time.sleep((2 ** attempt) * 0.05)
        continue
return compute_heuristic_fallback(patient_vitals)`,
                        starterFile: 'llmClient.py',
                        starterCode: `import time
from typing import Dict, Any

class RateLimitError(Exception):
    pass

def call_openai_triage_api(patient_vitals: Dict[str, Any]) -> Dict[str, Any]:
    # Simulated API that raises RateLimitError under hospital load spikes
    raise RateLimitError("HTTP 429: Rate limit exceeded")

def compute_heuristic_fallback(patient_vitals: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic rule-based triage score for emergency fallback."""
    hr = patient_vitals.get("heart_rate", 75)
    triage_level = "LEVEL_2_EMERGENT" if hr > 120 else "LEVEL_3_URGENT"
    return {
        "status": 200,
        "triage_score": triage_level,
        "source": "heuristic_fallback"
    }

def triage_patient_with_retry(patient_vitals: Dict[str, Any], max_retries: int = 3) -> Dict[str, Any]:
    """
    TODO Change 1, 2, 3 (HLTH-BEG-3):
    1. Implement loop with max_retries attempts.
    2. Exponential backoff (e.g. sleep 2 ** attempt).
    3. If all retries exhausted with RateLimitError, return compute_heuristic_fallback(patient_vitals).
    """
    try:
        return call_openai_triage_api(patient_vitals)
    except RateLimitError:
        # TODO: Implement retry and fallback
        return compute_heuristic_fallback(patient_vitals)
`,
                        solutionCode: `import time
from typing import Dict, Any

class RateLimitError(Exception):
    pass

def call_openai_triage_api(patient_vitals: Dict[str, Any]) -> Dict[str, Any]:
    raise RateLimitError("HTTP 429: Rate limit exceeded")

def compute_heuristic_fallback(patient_vitals: Dict[str, Any]) -> Dict[str, Any]:
    hr = patient_vitals.get("heart_rate", 75)
    triage_level = "LEVEL_2_EMERGENT" if hr > 120 else "LEVEL_3_URGENT"
    return {
        "status": 200,
        "triage_score": triage_level,
        "source": "heuristic_fallback"
    }

def triage_patient_with_retry(patient_vitals: Dict[str, Any], max_retries: int = 3) -> Dict[str, Any]:
    for attempt in range(max_retries):
        try:
            return call_openai_triage_api(patient_vitals)
        except RateLimitError:
            if attempt < max_retries - 1:
                backoff_delay = (2 ** attempt) * 0.05
                time.sleep(backoff_delay)
            continue
        except Exception:
            break
            
    return compute_heuristic_fallback(patient_vitals)
`,
                        mentorQuote: '"Hospital triage queues cannot halt just because an external LLM API is rate-limiting. A reliable AI system always has a deterministic rule-based fallback."',
                        mentorInitialMessages: [
                            {
                                sender: 'ai',
                                name: 'Dr. Elena Rostova (Staff Clinical AI Lead)',
                                text: "Shift change at 7:00 AM triggered an OpenAI 429 rate limit spike. Our triage queue froze, delaying patient intake."
                            },
                            {
                                sender: 'ai',
                                name: 'Dr. Elena Rostova (Staff Clinical AI Lead)',
                                text: "Look at llmClient.py. Wrap the API call with exponential backoff and fall back to our local deterministic triage function if all retries fail."
                            }
                        ],
                        terminalLogs: [
                            { type: 'system', text: 'Telemetry Client v3.1.0' },
                            { type: 'command', text: 'python -m pytest tests/test_llm_retry.py' },
                            { type: 'stderr', text: '[HTTP 429 RateLimitError] OpenAI TPM rate limit exhausted. No retry configured; request aborted.' }
                        ]
                    }
                ]
            },
            intermediate: {
                levelId: 'intermediate',
                label: 'Intermediate',
                title: 'RAG Pipeline Retrieval & Context Optimization',
                audience: 'Ideal for 3rd & 4th Year College Students',
                color: '#3b82f6',
                badgeBg: 'rgba(59, 130, 246, 0.15)',
                duration: '~20 mins (Preview Task)',
                description: 'Implement hybrid BM25 + semantic vector search to improve clinical document retrieval precision. (Advanced Level Preview)',
                tasks: [
                    {
                        id: 'HLTH-INT-1',
                        code: 'HLTH-INT-1',
                        title: 'RAG Pipeline Hybrid BM25 & Semantic Vector Re-Ranking',
                        badge: 'Task 1 • Intermediate',
                        duration: '20 mins',
                        targetFile: 'ragRetriever.py',
                        tipText: 'Tip: Combine dense embeddings with sparse keyword BM25 to prevent missing exact medication dosages',
                        scenario: "Doctors search patient history, but pure vector cosine similarity fails to match exact drug trade names like 'Metoprolol Succinate 25mg', retrieving irrelevant cardiology notes.",
                        objective: 'Build a reciprocal rank fusion (RRF) retriever combining dense vector similarities with sparse BM25 scores.',
                        constraint: 'Ensure sub-50ms hybrid retrieval latency.',
                        the3Changes: [
                            '1. Calculate reciprocal rank score for dense vector candidates.',
                            '2. Calculate reciprocal rank score for sparse BM25 keyword candidates.',
                            '3. Fuse and sort top 5 clinical documents.'
                        ],
                        acceptanceCriteria: [
                            'Matches exact medication trade names with 100% precision.',
                            'Returns top-k documents sorted by combined RRF score.'
                        ],
                        starterFile: 'ragRetriever.py',
                        starterCode: `def hybrid_rrf_retrieval(query: str, top_k: int = 5):\n    # TODO (HLTH-INT-1): Implement Reciprocal Rank Fusion\n    return []`,
                        solutionCode: `def hybrid_rrf_retrieval(query: str, top_k: int = 5):\n    return [{"doc_id": "doc_1", "score": 0.94}]`
                    }
                ]
            },
            pro: {
                levelId: 'pro',
                label: 'Pro',
                title: 'Sub-Second Sepsis Edge Inference & Drift Guardrails',
                audience: 'Targeting 12+ LPA Applied AI Roles',
                color: '#ef4444',
                badgeBg: 'rgba(239, 68, 68, 0.15)',
                duration: '~30 mins (Preview Task)',
                description: 'Engineer high-throughput ONNX micro-batching to eliminate inference telemetry bottlenecks. (Production Level Preview)',
                tasks: [
                    {
                        id: 'HLTH-PRO-1',
                        code: 'HLTH-PRO-1',
                        title: 'ONNX Micro-Batching for Sepsis Risk Scoring',
                        badge: 'Task 1 • Pro Challenge',
                        duration: '30 mins',
                        targetFile: 'inferenceEngine.py',
                        tipText: 'Tip: Aggregate incoming telemetry ticks into 32-sample tensors before executing ONNX session run',
                        scenario: "Sequential PyTorch inference takes 380ms per bed, causing severe telemetry backpressure across 50,000 active monitors. Sepsis early-warning alerts are delayed by up to 12 minutes.",
                        objective: 'Implement dynamic micro-batching with 20ms queue timeout in ONNX Runtime, cutting inference latency to 12ms per batch.',
                        constraint: 'Zero dropped sensor frames; p99 latency < 20ms.',
                        the3Changes: [
                            '1. Collect telemetry events into an asyncio thread-safe batch queue.',
                            '2. Dispatch batch once size reaches 32 or timeout reaches 20ms.',
                            '3. Execute batch inference on onnx_session and scatter results to patient sockets.'
                        ],
                        acceptanceCriteria: [
                            'Achieves sub-20ms batch inference throughput under 50,000 telemetry events/sec.'
                        ],
                        starterFile: 'inferenceEngine.py',
                        starterCode: `class BatchInferenceEngine:\n    # TODO (HLTH-PRO-1): Dynamic micro-batching\n    pass`,
                        solutionCode: `class BatchInferenceEngine:\n    pass`
                    }
                ]
            }
        }
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

export const TASK_INTERVIEW_PITCHES = {
    'FIN-BEG-1': {
        taskCode: 'FIN-BEG-1',
        title: 'ISO-4217 Currency Code & Boundary Validation',
        elevatorPitch: "In my FinPulse payment simulation, downstream settlement reconciliation was failing because external webhooks transmitted lowercase currency codes and non-positive floats. I implemented strict RFC-7807 payload boundary validations with whitelist sets and decimal regex, cutting unprocessable ledger exceptions by 100%.",
        starAnswer: {
            situation: "Downstream settlement reconciliation engines were throwing 500 errors when foreign merchants sent lowercase or negative amounts.",
            task: "Enforce strict ISO-4217 uppercase currency whitelisting and numerical boundary verification before dispatching to the core payment processor.",
            action: "Created an O(1) Set lookup for whitelisted ISO-4217 currencies, enforced uppercase formatting, and validated positive decimal amounts (< 2 decimal points) with HTTP 422 RFC-7807 responses.",
            result: "Completely eliminated invalid currency entries before they touched the database, reducing downstream reconciliation errors to zero."
        },
        interviewerQuestions: [
            {
                q: "Why did you validate this in the controller rather than letting the PostgreSQL database schema handle the constraints?",
                a: "Validating at the edge in the controller fails fast with HTTP 422 before allocating expensive database connections or transaction locks, protecting the database connection pool under high traffic."
            }
        ]
    },
    'FIN-BEG-2': {
        taskCode: 'FIN-BEG-2',
        title: 'Idempotency Keys & Replay Attack Prevention',
        elevatorPitch: "During payment retries under network dropouts, customers were charged twice. I engineered an idempotency middleware using Redis atomic SETNX with a 120-second TTL, ensuring identical transaction payloads return cached responses without double-charging.",
        starAnswer: {
            situation: "Network timeouts caused mobile clients to retry checkout requests, causing double-deductions on merchant bank accounts.",
            task: "Guarantee that duplicate HTTP POST requests with the same Idempotency-Key return the original response without re-executing ledger operations.",
            action: "Implemented distributed Redis locking with atomic SETNX and sha256 payload hashing, caching the original response headers and body with an expiration window.",
            result: "Prevented duplicate charges across 10,000 simulated concurrent retries with 0 double-billing errors."
        },
        interviewerQuestions: [
            {
                q: "What happens if a request with the same idempotency key arrives while the first request is still processing?",
                a: "We acquire an in-flight lock status (HTTP 409 Conflict or waiting on Redis pub/sub) so subsequent requests don't execute concurrently, returning the final response once the initial worker finishes."
            }
        ]
    },
    'FIN-BEG-3': {
        taskCode: 'FIN-BEG-3',
        title: 'PostgreSQL Connection Leak & Query Timeout Fix',
        elevatorPitch: "Under 15,000 req/sec load, the payment microservice suffered a SIGSEGV OOM crash due to orphaned database connections. I wrapped all queries in 3-second context timeouts and enforced deferred connection releases, restoring 99.99% availability.",
        starAnswer: {
            situation: "Connection pool starvation under 15k req/sec caused cascading gateway timeouts and memory leaks in the Go payment service.",
            task: "Diagnose connection leaks and prevent rogue slow queries from holding database connection slots indefinitely.",
            action: "Wrapped context queries with context.WithTimeout (3s), added deferred connection releases (defer conn.Close()), and configured pool max idle limits.",
            result: "Eliminated connection starvation; p99 latency dropped from 8,400ms to 42ms under full load."
        },
        interviewerQuestions: [
            {
                q: "Why is defer conn.Close() critical in Go even when an error occurs?",
                a: "In Go's database/sql package, acquiring a connection checks it out of the pool. If an early return occurs on error without closing, the connection remains orphaned, eventually exhausting the pool."
            }
        ]
    },
    'ECOM-INT-1': {
        taskCode: 'ECOM-INT-1',
        title: 'Flash Sale Distributed Lock & Inventory Race Condition',
        elevatorPitch: "During flash sales, concurrent shoppers bought the last item simultaneously, causing negative stock inventory. I built a distributed Redlock mutex in Redis to serialize inventory deductions safely.",
        starAnswer: {
            situation: "High-concurrency flash sales caused multiple checkout workers to read stock=1 and all approve transactions, resulting in 50+ oversold orders.",
            task: "Prevent overselling without creating high-latency database table locks.",
            action: "Utilized Redis distributed locks with short TTLs and Lua scripts for atomic decrement, rolling back failed acquires with HTTP 409.",
            result: "Handled 5,000 concurrent purchase attempts on 10 units with exactly zero oversold items."
        },
        interviewerQuestions: [
            {
                q: "Why use Redis distributed locks instead of SELECT ... FOR UPDATE in SQL?",
                a: "SELECT FOR UPDATE locks rows at the database level, which degrades transactional throughput and spikes DB CPU under flash sales. Redis handles 100k+ ops/sec in-memory with sub-millisecond lock acquisition."
            }
        ]
    },
    'ECOM-INT-2': {
        taskCode: 'ECOM-INT-2',
        title: 'Flash Sale Redis Cache Stampede & TTL Jitter',
        elevatorPitch: "When popular product cache keys expired during flash sales, 50,000 requests hammered PostgreSQL simultaneously. I resolved this cache stampede using probabilistic early expiration and random TTL jitter.",
        starAnswer: {
            situation: "Cache stampede collapsed the primary PostgreSQL instance when a hot product key hit TTL expiration under 50k RPS.",
            task: "Eliminate simultaneous cache misses while ensuring data freshness.",
            action: "Implemented a Mutex lock on cache misses so only 1 worker computes the DB query, combined with a 15% randomized TTL jitter to prevent synchronized key expiry.",
            result: "DB query volume during key renewal dropped from 50,000 queries to exactly 1 query, saving the database from crashing."
        },
        interviewerQuestions: [
            {
                q: "What is TTL jitter and why does it help?",
                a: "TTL jitter adds random delta seconds (e.g. 300s ± 30s) to cache expiration times so keys created at the same time don't all expire at the exact same instant, spreading out cache refreshes."
            }
        ]
    },
    'CLOUD-PRO-1': {
        taskCode: 'CLOUD-PRO-1',
        title: 'Kafka Consumer Group Poison Pill & Dead-Letter Queue',
        elevatorPitch: "A malformed payload crashed Kafka consumer workers in an infinite restart loop, stalling all message processing. I designed a Dead-Letter Queue (DLQ) circuit breaker that diverts unprocessable events after 3 failed retries.",
        starAnswer: {
            situation: "A poison pill message caused unhandled exceptions in consumer partition 4, triggering continuous rebalances that blocked the entire pipeline.",
            task: "Isolate corrupt payloads without crashing consumer workers or dropping event streams.",
            action: "Configured an exponential backoff retry handler with max 3 attempts before publishing the payload to an isolated DLQ topic with error metadata.",
            result: "Consumer lag normalized in seconds and 100% of valid events resumed processing without manual pipeline intervention."
        },
        interviewerQuestions: [
            {
                q: "What information should you preserve when routing a message to the DLQ?",
                a: "You must preserve the original message key, raw payload, timestamp, failure exception message, stack trace, and consumer attempt count in the DLQ header."
            }
        ]
    },
    'HLTH-BEG-1': {
        taskCode: 'HLTH-BEG-1',
        title: 'AI Guardrail: Strip Markdown Fences & Block Bad AI Blood Pressure Numbers',
        elevatorPitch: "In my HealthPulse AI work simulation, GPT-4 occasionally emitted markdown fences and hallucinated biologically impossible blood pressures that crashed hospital EHR ingestion. I engineered strict Pydantic V2 schema boundary validators and code-fence sanitizers, eliminating 100% of EHR ingestion exceptions.",
        starAnswer: {
            situation: "Hospital ER triage dashboard experienced 500 errors when OpenAI models outputted raw markdown backticks and out-of-range systolic blood pressures.",
            task: "Enforce strict schema validation and strip markdown fences before EHR database ingestion.",
            action: "Implemented a regex fence stripper and Pydantic field validators enforcing 60-250 mmHg boundaries, returning structured RFC-7807 422 errors on violations.",
            result: "Completely eliminated invalid triage ingestions and guaranteed EHR schema compliance."
        },
        interviewerQuestions: [
            {
                q: "Why use Pydantic V2 field_validator instead of raw if/else statements?",
                a: "Pydantic centralizes schema enforcement, provides automatic type coercion, generates standard validation errors, and integrates natively with FastAPI request/response validation pipelines."
            }
        ]
    },
    'HLTH-BEG-2': {
        taskCode: 'HLTH-BEG-2',
        title: 'Data Privacy: Hide Social Security & Phone Numbers Before Sending to AI',
        elevatorPitch: "Clinical notes contained unmasked SSNs and phone numbers that were leaking to third-party LLM providers. I built a deterministic regex sanitization pipeline that masked 100% of PII before serialization, bringing our AI platform into full HIPAA compliance.",
        starAnswer: {
            situation: "Doctors pasted raw patient records into the triage prompt, transmitting SSNs and contact numbers in cleartext.",
            task: "Prevent any raw PII from leaving the hospital's private VPC.",
            action: "Engineered pre-serialization sanitization regexes that replace SSNs and phone numbers with standard [REDACTED] tokens while preserving clinical dosages.",
            result: "Achieved 100% HIPAA compliance in automated data privacy audit."
        },
        interviewerQuestions: [
            {
                q: "Why not use an LLM itself to redact PII?",
                a: "Using an LLM to redact PII requires sending the raw unmasked PII to the model in the first place, violating zero-data-retention compliance. Deterministic local regex/NER runs within the VPC before tokens leave the network."
            }
        ]
    },
    'HLTH-BEG-3': {
        taskCode: 'HLTH-BEG-3',
        title: 'Reliability: Auto-Retry When OpenAI Rate-Limits (429) and Fall Back to Safe Rules',
        elevatorPitch: "During morning shift change, OpenAI 429 rate limit spikes froze hospital triage. I designed an exponential backoff retry loop with a deterministic rule-based heuristic fallback, guaranteeing sub-second triage scores even during complete LLM outages.",
        starAnswer: {
            situation: "Rate limit errors on third-party LLM APIs stalled ER patient intake during peak hours.",
            task: "Guarantee 100% availability for patient triage classification.",
            action: "Implemented a 3-attempt exponential backoff with jitter and a deterministic rule-based fallback based on clinical vital thresholds.",
            result: "Achieved 100% uptime for triage scoring with zero queue freezes during LLM provider downtime."
        },
        interviewerQuestions: [
            {
                q: "How does the attending staff know if a triage score came from the LLM vs the fallback?",
                a: "The payload explicitly attaches metadata including source='heuristic_fallback' and timestamps, ensuring clinical transparency and auditability."
            }
        ]
    }
};

export const getInterviewPitchForTask = (taskCode) => {
    return TASK_INTERVIEW_PITCHES[taskCode] || {
        taskCode: taskCode,
        title: 'Production System Engineering Ticket',
        elevatorPitch: `In this simulation, I solved critical reliability bottlenecks by isolating failure modes, implementing defensive boundary validations, and verifying automated regression tests before deployment.`,
        starAnswer: {
            situation: "Production systems experienced latency spikes and inconsistent responses under heavy traffic.",
            task: "Identify the architectural bottleneck and refactor the codebase to maintain sub-50ms SLA.",
            action: "Profiled the execution flow, applied defensive checks and asynchronous patterns, and validated against automated test suites.",
            result: "Restored full system throughput and prevented cascading downstream outages."
        },
        interviewerQuestions: [
            {
                q: "How did you verify this fix wouldn't break existing functionality?",
                a: "I executed end-to-end regression tests verifying boundary edge cases, idempotency, and error status code compliance."
            }
        ]
    };
};

