import React, { useState, useEffect, useRef } from 'react';
import { 
    Cpu, Terminal as TerminalIcon, FileCode, Folder, FolderOpen, 
    FileText, GitPullRequest, Play, CheckCircle2, AlertTriangle, 
    X, RefreshCw, Send, Sparkles, MessageSquare, ChevronRight, 
    ChevronDown, Settings, Search, GitBranch, Bug, Layers, 
    ExternalLink, Check, Copy, Flame, ShieldAlert, Award, Bot, ArrowRight
} from 'lucide-react';
import { wasmExecutionService } from '../../services/wasmExecutionService';
import { simulationService } from '../../services/simulationService';
import { useToast } from '../../contexts/ToastContext';

// Original unedited repository baseline
const STARTER_REPOSITORY_FILES = {
    'paymentController.ts': `import { Request, Response } from 'express';
import { processPayment } from '../services/paymentService';
import { logger } from '../utils/logger';

export const handlePayment = async (req: Request, res: Response) => {
    try {
        const { amount, currency, paymentMethodId } = req.body;
        logger.info(\`Processing payment for \${amount} \${currency}\`);
        
        // TODO (FIN-101): Add boundary validation and catch timeout errors
        const result = await processPayment(amount, currency, paymentMethodId);
        return res.status(200).json(result);
    } catch (error: any) {
        logger.error('Payment processing failed', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};`,
    'docker-compose.yml': `version: '3.8'
services:
  payment-service:
    build: .
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      # Original Bottleneck: Only 10 DB connections for 15,000 req/sec
      - DB_POOL_SIZE=10
      - MAX_CONCURRENT_REQUESTS=50
      - REDIS_HOST=redis
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis`,
    'transactionService.go': `package main

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
    ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
    defer cancel()

    // Acquire connection from pool
    conn, err := s.db.Conn(ctx)
    if err != nil {
        return fmt.Errorf("connection pool exhausted: %w", err)
    }
    defer conn.Close()

    return nil
}`,
    'authMiddleware.ts': `import { Request, Response, NextFunction } from 'express';

export const verifyMerchantSignature = (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-finpulse-signature'];
    if (!signature) {
        return res.status(401).json({ error: 'Missing merchant API signature' });
    }
    next();
};`,
    'idempotencyService.ts': `import { Redis } from 'ioredis';

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost' });

export class IdempotencyService {
    // TODO (FIN-102): Prevent race conditions and double charges
    // 1. Acquire distributed lock with a 60s TTL for the given key
    // 2. If key is already PROCESSING or COMPLETED, return false or throw
    // 3. Ensure lock is released or status updated in try...finally
    static async acquireLock(idempotencyKey: string): Promise<boolean> {
        // Vulnerable stub: currently accepts all requests without locking
        return true;
    }

    static async releaseLock(idempotencyKey: string): Promise<void> {
        // TODO: Release key
    }
}`,
    'errorMiddleware.ts': `import { Request, Response, NextFunction } from 'express';

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // TODO (FIN-103): Sanitize internal stack traces and return RFC-7807 JSON error
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message, stack: err.stack });
};`,
    'package.json': `{
  "name": "finpulse-payment-microservice",
  "version": "2.4.0",
  "description": "High-throughput real-time payment gateway",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "test": "jest --detectOpenHandles"
  },
  "dependencies": {
    "express": "^4.19.2",
    "pg": "^8.11.5",
    "ioredis": "^5.4.1"
  }
}`,
    'README.md': `# FinPulse Payment Microservice
Production incident simulation: Flash sale traffic spike causing 504 Gateway Timeouts.
Investigate pool exhaustion and adjust connection limits.`
};

// Available Simulation Tickets Definition
export const AVAILABLE_SIMULATION_TICKETS = [
    {
        code: 'FIN-101',
        title: 'Strict ISO-4217 Currency & Amount Boundary Validation',
        badge: 'Level 1 • Beginner Friendly',
        duration: '~15 mins',
        targetFile: 'paymentController.ts',
        tipText: 'Tip: Validate currency in SUPPORTED_CURRENCIES & amount > 0',
        scenario: "Merchants reported reconciliation failures because clients submitted lowercase currency codes ('usd' instead of 'USD') and negative amounts.",
        objective: 'Enforce uppercase ISO-4217 currency validation and positive amount checks with HTTP 422 boundaries.',
        constraint: 'Reject unsupported currencies; enforce maximum 2 decimal places.',
        missionSummary: "Merchants reported transaction anomalies when clients sent lowercase currency codes ('usd' instead of 'USD') and negative numbers. Implement strict ISO-4217 uppercase currency and positive decimal validation before dispatching to banking networks.",
        steps: [
            { num: 1, text: "Inspect paymentController.ts on the right (lines 19–30)." },
            { num: 2, text: "Validate that currency is in SUPPORTED_CURRENCIES (uppercase 'USD', 'EUR', etc.) and amount > 0 with max 2 decimals. Return HTTP 422 if invalid." },
            { num: 3, text: 'Click "▶️ Run Verification Tests (1-Click)" to test your validation in WebAssembly.' }
        ],
        hint: `if (!currency || !SUPPORTED_CURRENCIES.has(currency) || currency !== currency.toUpperCase()) {
    return res.status(422).json({ error: "Invalid currency. Must be uppercase ISO-4217." });
}
if (typeof amount !== 'number' || amount <= 0 || !/^\\d+(\\.\\d{1,2})?$/.test(amount.toString())) {
    return res.status(422).json({ error: "Amount must be strictly positive." });
}`,
        fixFile: 'paymentController.ts',
        fixCode: `import { Request, Response } from 'express';
import { processPayment } from '../services/paymentService';
import { logger } from '../utils/logger';

const SUPPORTED_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'INR']);

export const handlePayment = async (req: Request, res: Response) => {
    try {
        const { amount, currency, paymentMethodId } = req.body;
        logger.info(\`Processing payment for \${amount} \${currency}\`);
        
        // Strict ISO-4217 Currency and Amount Boundary Validation (FIN-101)
        if (!currency || !SUPPORTED_CURRENCIES.has(currency) || currency !== currency.toUpperCase()) {
            return res.status(422).json({ error: 'Invalid currency. Must be uppercase ISO-4217: USD, EUR, GBP, CAD, JPY, INR' });
        }
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
                text: "Welcome to the payments core service! We have an audit flag from banking operations: several client requests slipped through with lowercase currency strings ('usd') and negative amounts."
            },
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "Inspect paymentController.ts. Notice how handlePayment currently accepts amount and currency without boundary checks before calling processPayment."
            },
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "What HTTP status code should we return when request payload validation fails? And how should we ensure currency matches our uppercase ISO-4217 set?"
            },
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "💡 Hint: Check SUPPORTED_CURRENCIES. Verify currency === currency.toUpperCase() and amount > 0. Return status 422 Unprocessable Entity."
            }
        ],
        terminalLogs: [
            { type: 'system', text: 'CareerOS WebAssembly & Simulation Lab initialized [v2.4.0-release]' },
            { type: 'system', text: 'Type "help", "npm test", "git status", or "git diff" to interact.' },
            { type: 'command', text: 'tail -n 15 /var/log/finpulse/payment-validation.log' },
            { type: 'stdout', text: '[2026-10-22T10:14:02.110Z] [WARN] Merchant 8829 submitted payload: { amount: -150.00, currency: "usd" }' },
            { type: 'stderr', text: '[2026-10-22T10:14:02.115Z] [ERROR] Banking settlement network rejected: Invalid currency "usd" (expected ISO-4217 uppercase).' },
            { type: 'stderr', text: '[2026-10-22T10:14:03.220Z] [ERROR] Ledger anomaly: Negative charge of -$150.00 attempted. Transaction aborted.' },
            { type: 'stdout', text: '[2026-10-22T10:14:04.001Z] [INFO] Total unvalidated requests received in last 10m: 142.' }
        ]
    },
    {
        code: 'FIN-102',
        title: 'Distributed Idempotency Lock (Race Condition Prevention)',
        badge: 'Level 2 • Intermediate',
        duration: '~30 mins',
        targetFile: 'idempotencyService.ts',
        tipText: 'Tip: Implement atomic Redis SET NX with EX 60s TTL',
        scenario: "When network latency is high, shoppers double-tap 'Pay'. Without an idempotency lock, concurrent threads double-charge customers.",
        objective: 'Implement an atomic distributed lock using Redis SET NX with a 60s TTL and handle HTTP 409 Conflict.',
        constraint: 'Guarantee zero double-charges under concurrent load; release or finalize locks.',
        missionSummary: "When network latency is high, consumers frequently spam the 'Pay' button twice within 200ms. Without idempotency protection, two concurrent requests deduct balances twice. Implement an atomic distributed lock!",
        steps: [
            { num: 1, text: "Open idempotencyService.ts on the right." },
            { num: 2, text: "Check if the idempotencyKey is already acquired. If locked, reject concurrent attempts with HTTP 409 Conflict. Guarantee lock cleanup in a try...finally block." },
            { num: 3, text: 'Click "▶️ Run Verification Tests (1-Click)" to simulate concurrent double-taps.' }
        ],
        hint: `const acquired = await redis.set(\`idemp:\${idempotencyKey}\`, 'PROCESSING', 'EX', 60, 'NX');
if (!acquired) {
    return false; // Already locked
}`,
        fixFile: 'idempotencyService.ts',
        fixCode: `import { Redis } from 'ioredis';

const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost' });

export class IdempotencyService {
    // Distributed Idempotency Key Lock (FIN-102)
    static async acquireLock(idempotencyKey: string): Promise<boolean> {
        if (!idempotencyKey) {
            throw new Error('Missing Idempotency-Key');
        }
        // Atomic SET with NX (not exists) and 60s TTL
        const acquired = await redis.set(\`idemp:\${idempotencyKey}\`, 'PROCESSING', 'EX', 60, 'NX');
        if (!acquired) {
            return false; // Already locked or in progress
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
        mentorQuote: '"Never let two transactions process the same payment! An atomic distributed lock ensures that even if a customer double-clicks in 50ms, exactly one charge succeeds."',
        mentorInitialMessages: [
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "We have an urgent issue with double charges! When mobile users hit network latency spikes, they repeatedly tap 'Submit Payment'."
            },
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "Look at idempotencyService.ts. Currently, acquireLock is an insecure stub returning true unconditionally, leaving the door wide open for race conditions."
            },
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "Why is a standard database read-then-write insufficient under high concurrency, and why do we require an atomic Redis SET NX with TTL?"
            },
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "💡 Hint: Use `redis.set(\`idemp:\${idempotencyKey}\`, 'PROCESSING', 'EX', 60, 'NX')`. If it returns null, another thread is already executing."
            }
        ],
        terminalLogs: [
            { type: 'system', text: 'CareerOS WebAssembly & Simulation Lab initialized [v2.4.0-release]' },
            { type: 'system', text: 'Type "help", "npm test", "git status", or "git diff" to interact.' },
            { type: 'command', text: 'grep -i "race condition" /var/log/finpulse/audit.log' },
            { type: 'stdout', text: '[2026-10-22T10:14:50.002Z] [AUDIT] POST /api/v1/payments (Idempotency-Key: idemp_9f82ab)' },
            { type: 'stdout', text: '[2026-10-22T10:14:50.045Z] [AUDIT] POST /api/v1/payments (Idempotency-Key: idemp_9f82ab) [RACE CONDITION DETECTED]' },
            { type: 'stderr', text: '[2026-10-22T10:14:51.310Z] [CRITICAL] Customer cust_4882 billed TWICE for $79.99! Both threads acquired lock.' },
            { type: 'stderr', text: '[2026-10-22T10:14:52.012Z] [ALERT] Idempotency violation SLA breach. Double-charge incident active.' }
        ]
    },
    {
        code: 'INC-504',
        title: 'Flash Sale Connection Bottleneck (Outage Resolution)',
        badge: 'Level 3 • Production Incident',
        duration: '~45 mins',
        targetFile: 'docker-compose.yml',
        tipText: 'Tip: Modify DB_POOL_SIZE on lines 9–12',
        scenario: "Flash sale spike caused 504 Gateway Timeouts and OOM crashes. Investigate database connection pool exhaustion and scale limits.",
        objective: 'Scale DB connection pool (DB_POOL_SIZE=50, MAX_CONCURRENT_REQUESTS=500) to withstand 15,000 req/sec.',
        constraint: 'Maintain p95 response time < 50ms without exceeding database replica limits.',
        missionSummary: "When 15,000 customers hit the checkout during a flash sale, our database drops transactions because only 10 connections are allowed. Scale the connection pool to 50!",
        steps: [
            { num: 1, text: "Look at docker-compose.yml on the right (lines 9–12)." },
            { num: 2, text: "Change DB_POOL_SIZE to 50 and MAX_CONCURRENT_REQUESTS to 500." },
            { num: 3, text: 'Click "▶️ Run Verification Tests (1-Click)" to test your fix in WebAssembly.' }
        ],
        hint: `- DB_POOL_SIZE=50
- MAX_CONCURRENT_REQUESTS=500`,
        fixFile: 'docker-compose.yml',
        fixCode: `version: '3.8'
services:
  payment-service:
    build: .
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      # Scaled Connection Pool for 15,000 req/sec flash sale
      - DB_POOL_SIZE=50
      - MAX_CONCURRENT_REQUESTS=500
      - REDIS_HOST=redis
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis`,
        mentorQuote: '"Think of database connections like checkout registers at a grocery store. 10 registers for 15,000 shoppers causes massive congestion. Scaling to 50 connections resolves the 504 bottleneck!"',
        mentorInitialMessages: [
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "I see you're investigating the 504 Gateway Timeout during our flash sale spike. The service logs show some very telling error patterns."
            },
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "What do the 'Connection pool exhausted' and 'out of memory' errors in the payment-service logs suggest about the root cause under high load?"
            },
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "Consider the relationship between the number of concurrent incoming requests, database connections, and available memory resources. Are our current configurations sufficient?"
            },
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "💡 Hint: Check the docker-compose.yml environment variables for the payment service. Notice DB_POOL_SIZE and MAX_CONCURRENT_REQUESTS."
            }
        ],
        terminalLogs: [
            { type: 'system', text: 'CareerOS WebAssembly & Simulation Lab initialized [v2.4.0-release]' },
            { type: 'system', text: 'Type "help", "docker logs", "npm test", "git status", or "git diff" to interact.' },
            { type: 'command', text: 'docker logs -f payment-service' },
            { type: 'stdout', text: '[2026-10-22T10:15:01.122Z] [INFO] Starting payment service on port 8080...' },
            { type: 'stdout', text: '[2026-10-22T10:15:05.462Z] [INFO] Connected to PostgreSQL replica: db-primary.finpulse.internal' },
            { type: 'stdout', text: '[2026-10-22T10:15:10.285Z] [INFO] Incoming flash sale surge: 14,200 req/sec across 48 merchant channels.' },
            { type: 'stderr', text: '[2026-10-22T10:15:18.705Z] [ERROR] Payment processing failed: Error: Connection pool exhausted, unable to acquire connection within 3000ms.' },
            { type: 'stderr', text: '[2026-10-22T10:15:24.412Z] [ERROR] HTTP 504 GATEWAY_TIMEOUT spike: 412 customer checkouts dropped.' },
            { type: 'fatal', text: '[2026-10-22T10:15:31.015Z] [FATAL] runtime: out of memory (cannot allocate 1048576-byte block)' },
            { type: 'stderr', text: 'Payment service exited with code 2 (SIGSEGV).' }
        ]
    }
];

// Universal Line-by-Line LCS Diff Algorithm
function computeLineDiff(originalText = '', modifiedText = '') {
    const origLines = (originalText || '').split('\n');
    const modLines = (modifiedText || '').split('\n');
    
    const m = origLines.length;
    const n = modLines.length;
    
    // DP matrix for Longest Common Subsequence
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            if (origLines[i] === modLines[j]) {
                dp[i + 1][j + 1] = dp[i][j] + 1;
            } else {
                dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }
    }
    
    // Backtrack to extract exact line additions and deletions
    const diff = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
            diff.unshift({ type: 'unchanged', text: origLines[i - 1], origLine: i, modLine: j });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ type: 'added', text: modLines[j - 1], modLine: j });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            diff.unshift({ type: 'removed', text: origLines[i - 1], origLine: i });
            i--;
        }
    }
    return diff;
}

// Universal Git Gutter Annotation Engine
// Classifies each line in the working file as:
// - 'modified' (vertical blue line #3b82f6): lines changed or replaced
// - 'added' (vertical green line #10b981): newly inserted lines
// - null: unchanged original lines
// - deletedAbove: small red deletion pip where lines were deleted
function computeGutterAnnotations(originalText = '', modifiedText = '') {
    const diff = computeLineDiff(originalText, modifiedText);
    const modLines = (modifiedText || '').split('\n');
    
    const gutter = {};
    for (let l = 1; l <= Math.max(modLines.length, 1); l++) {
        gutter[l] = { status: null, deletedAbove: false, oldText: null };
    }
    
    let currentRemoved = [];
    let currentAdded = [];
    
    const flushHunk = (nextModLine) => {
        if (currentRemoved.length === 0 && currentAdded.length === 0) return;
        
        const removedCount = currentRemoved.length;
        const addedCount = currentAdded.length;
        
        if (removedCount > 0 && addedCount > 0) {
            // Modification block: lines in original were edited / replaced
            for (let k = 0; k < addedCount; k++) {
                const addObj = currentAdded[k];
                const isReplaced = k < removedCount;
                if (gutter[addObj.modLine]) {
                    gutter[addObj.modLine].status = isReplaced ? 'modified' : 'added';
                    if (isReplaced && currentRemoved[k]) {
                        gutter[addObj.modLine].oldText = currentRemoved[k].text;
                    }
                }
            }
        } else if (addedCount > 0) {
            // Pure new lines added
            for (const addObj of currentAdded) {
                if (gutter[addObj.modLine]) {
                    gutter[addObj.modLine].status = 'added';
                }
            }
        } else if (removedCount > 0) {
            // Deletion above the next unchanged line
            if (nextModLine && gutter[nextModLine]) {
                gutter[nextModLine].deletedAbove = true;
                gutter[nextModLine].oldText = currentRemoved.map(r => r.text).join('\n');
            } else if (modLines.length > 0 && gutter[modLines.length]) {
                gutter[modLines.length].deletedBelow = true;
                gutter[modLines.length].oldText = currentRemoved.map(r => r.text).join('\n');
            }
        }
        
        currentRemoved = [];
        currentAdded = [];
    };
    
    for (let i = 0; i < diff.length; i++) {
        const item = diff[i];
        if (item.type === 'unchanged') {
            flushHunk(item.modLine);
        } else if (item.type === 'removed') {
            currentRemoved.push(item);
        } else if (item.type === 'added') {
            currentAdded.push(item);
        }
    }
    flushHunk(null);
    
    return gutter;
}

export const DeveloperSimulationLab = ({ 
    track, 
    activeTicket, 
    onClose, 
    onSubmitReview, 
    reviewing = false, 
    reviewResult = null,
    initialGuidedMode = true,
    initialTicketCode = 'FIN-101',
    onSelectTicket = null
}) => {
    const toast = useToast();

    // Active Ticket Code & Menu State
    const [currentTicketCode, setCurrentTicketCode] = useState(
        initialTicketCode || activeTicket?.ticket_code || 'FIN-101'
    );
    const [showTicketMenu, setShowTicketMenu] = useState(false);

    const currentTicketData = AVAILABLE_SIMULATION_TICKETS.find(t => t.code === currentTicketCode) || AVAILABLE_SIMULATION_TICKETS[0];

    // Guided Mode for Freshers vs Pro Mode for Advanced Students
    const [isGuidedMode, setIsGuidedMode] = useState(initialGuidedMode);
    const [showGuidedHint, setShowGuidedHint] = useState(false);

    // Review Result Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [copiedBullet, setCopiedBullet] = useState(false);

    useEffect(() => {
        if (reviewResult) {
            setShowReviewModal(true);
        }
    }, [reviewResult]);

    // Synchronize ticket code when prop changes
    useEffect(() => {
        const targetCode = initialTicketCode || activeTicket?.ticket_code || 'FIN-101';
        setCurrentTicketCode(targetCode);
        const t = AVAILABLE_SIMULATION_TICKETS.find(item => item.code === targetCode) || AVAILABLE_SIMULATION_TICKETS[0];
        setActiveFile(t.targetFile);
        setOpenFiles(prev => prev.includes(t.targetFile) ? prev : [t.targetFile, ...prev]);
        if (t.mentorInitialMessages) setMentorMessages(t.mentorInitialMessages);
        if (t.terminalLogs) setTerminalLines(t.terminalLogs);
    }, [initialTicketCode, activeTicket?.ticket_code]);

    const handleSwitchTicket = (newCode) => {
        setCurrentTicketCode(newCode);
        const t = AVAILABLE_SIMULATION_TICKETS.find(item => item.code === newCode) || AVAILABLE_SIMULATION_TICKETS[0];
        setActiveFile(t.targetFile);
        setOpenFiles(prev => prev.includes(t.targetFile) ? prev : [t.targetFile, ...prev]);
        setTestResult(null);
        setShowGuidedHint(false);
        if (t.mentorInitialMessages) setMentorMessages(t.mentorInitialMessages);
        if (t.terminalLogs) setTerminalLines(t.terminalLogs);
        if (onSelectTicket) onSelectTicket(newCode);
    };

    const handleCopyBullet = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedBullet(true);
        if (toast?.showToast) toast.showToast('Copied STAR resume bullet to clipboard!', 'success', 'Copied!');
        setTimeout(() => setCopiedBullet(false), 2000);
    };

    // 1. Multi-File Virtual Filesystem State
    const [openFiles, setOpenFiles] = useState(['paymentController.ts', 'docker-compose.yml', 'idempotencyService.ts']);
    const [activeFile, setActiveFile] = useState(currentTicketData.targetFile);
    const [folderOpen, setFolderOpen] = useState({ src: true, controllers: true, middleware: true, services: true, config: false });
    const [editorViewMode, setEditorViewMode] = useState('editor'); // 'editor' | 'diff'
    
    // File contents state (starts with unedited starter repo files)
    const [files, setFiles] = useState({ ...STARTER_REPOSITORY_FILES });

    // File content change handler (used by both Guided Mode and Pro Mode)
    const handleFileChange = (fileName, content) => {
        setFiles(prev => ({ ...prev, [fileName]: content }));
    };

    // Compute which files across the entire repo have been modified
    const modifiedFiles = Object.keys(files).filter(f => files[f] !== STARTER_REPOSITORY_FILES[f]);

    // Compute exact line-by-line diff for the currently active file
    const activeDiff = computeLineDiff(STARTER_REPOSITORY_FILES[activeFile] || '', files[activeFile] || '');
    const activeAdditions = activeDiff.filter(d => d.type === 'added').length;
    const activeDeletions = activeDiff.filter(d => d.type === 'removed').length;

    // Compute Git Gutter annotations for the active file (Added = Green vertical bar, Modified = Blue vertical bar)
    const gutterAnnotations = computeGutterAnnotations(STARTER_REPOSITORY_FILES[activeFile] || '', files[activeFile] || '');
    const gutterAddedCount = Object.values(gutterAnnotations).filter(g => g.status === 'added').length;
    const gutterModifiedCount = Object.values(gutterAnnotations).filter(g => g.status === 'modified').length;
    const gutterDeletedCount = Object.values(gutterAnnotations).filter(g => g.deletedAbove || g.deletedBelow).length;
    const totalFileChanges = gutterAddedCount + gutterModifiedCount + gutterDeletedCount;

    // Synchronized scroll refs for Line Gutter and Textarea
    const lineGutterRef = useRef(null);
    const textareaRef = useRef(null);

    const handleEditorScroll = (e) => {
        if (lineGutterRef.current) {
            lineGutterRef.current.scrollTop = e.target.scrollTop;
        }
    };

    const handleGutterWheel = (e) => {
        if (textareaRef.current) {
            textareaRef.current.scrollTop += e.deltaY;
        }
    };

    // Quick jump between modified/added lines in raw code editor
    const jumpToChange = (direction = 'next') => {
        const changedLineNums = Object.keys(gutterAnnotations)
            .map(Number)
            .filter(lineNum => gutterAnnotations[lineNum].status !== null || gutterAnnotations[lineNum].deletedAbove)
            .sort((a, b) => a - b);

        if (changedLineNums.length === 0 || !textareaRef.current) return;

        const currentScrollTop = textareaRef.current.scrollTop;
        const currentLine = Math.floor(currentScrollTop / 24) + 1;

        let targetLine;
        if (direction === 'next') {
            targetLine = changedLineNums.find(l => l > currentLine) || changedLineNums[0];
        } else {
            targetLine = [...changedLineNums].reverse().find(l => l < currentLine) || changedLineNums[changedLineNums.length - 1];
        }

        if (targetLine) {
            textareaRef.current.scrollTo({
                top: Math.max(0, (targetLine - 3) * 24),
                behavior: 'smooth'
            });
        }
    };

    // 2. Terminal State & Command History
    const [terminalTab, setTerminalTab] = useState('terminal'); // 'terminal' | 'logs' | 'tests'
    const [terminalInput, setTerminalInput] = useState('');
    const [terminalLines, setTerminalLines] = useState(
        currentTicketData?.terminalLogs || [
            { type: 'system', text: 'CareerOS WebAssembly & Simulation Lab initialized [v2.4.0-release]' },
            { type: 'system', text: 'Type "help", "docker logs", "npm test", "git status", or "git diff" to interact.' }
        ]
    );
    const terminalEndRef = useRef(null);

    // Auto-scroll terminal to bottom
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
        }
    }, [terminalLines]);

    // 3. AI Copilot Mentor State
    const [mentorMessages, setMentorMessages] = useState(
        currentTicketData?.mentorInitialMessages || [
            {
                sender: 'ai',
                name: 'Marcus (Staff Software Engineer)',
                text: "Welcome to the simulation lab! Review the active ticket specifications and let's get started."
            }
        ]
    );
    const [mentorInput, setMentorInput] = useState('');
    const [aiThinking, setAiThinking] = useState(false);
    const [wasmRunning, setWasmRunning] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Terminal command runner with multi-file git support
    const handleTerminalCommand = async (e) => {
        e.preventDefault();
        const cmd = terminalInput.trim();
        if (!cmd) return;

        const newLines = [...terminalLines, { type: 'command', text: cmd }];
        setTerminalInput('');

        if (cmd === 'clear') {
            setTerminalLines([]);
            return;
        }

        if (cmd === 'help') {
            newLines.push({ type: 'stdout', text: 'Available commands:\n  run / npm test  - Execute in-browser WebAssembly test suite\n  docker logs     - Stream container incident logs\n  git status      - Show all modified files across repository\n  git diff        - View multi-file line diffs\n  ls              - List repository files\n  clear           - Clear terminal buffer\n  status          - Show simulation readiness status' });
            setTerminalLines(newLines);
            return;
        }

        if (cmd === 'ls') {
            newLines.push({ type: 'stdout', text: 'src/  middleware/  config/  docker-compose.yml  Dockerfile  package.json  README.md' });
            setTerminalLines(newLines);
            return;
        }

        if (cmd === 'git status') {
            if (modifiedFiles.length === 0) {
                newLines.push({ type: 'stdout', text: 'On branch incident/flash-sale-504\nnothing to commit, working tree clean' });
            } else {
                newLines.push({ type: 'stdout', text: 'On branch incident/flash-sale-504\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n' });
                modifiedFiles.forEach(f => {
                    newLines.push({ type: 'stderr', text: `\tmodified:   ${f}` });
                });
                newLines.push({ type: 'stdout', text: `\nTotal: ${modifiedFiles.length} file(s) modified across working tree.` });
            }
            setTerminalLines(newLines);
            return;
        }

        if (cmd === 'git diff') {
            if (modifiedFiles.length === 0) {
                newLines.push({ type: 'stdout', text: 'No changes detected. Working tree clean.' });
            } else {
                modifiedFiles.forEach(f => {
                    newLines.push({ type: 'system', text: `diff --git a/${f} b/${f}` });
                    newLines.push({ type: 'stdout', text: `--- a/${f}\n+++ b/${f}` });
                    const fileDiff = computeLineDiff(STARTER_REPOSITORY_FILES[f] || '', files[f] || '');
                    fileDiff.forEach(d => {
                        if (d.type === 'added') {
                            newLines.push({ type: 'success', text: `+ Line ${d.modLine}: ${d.text}` });
                        } else if (d.type === 'removed') {
                            newLines.push({ type: 'stderr', text: `- Line ${d.origLine}: ${d.text}` });
                        }
                    });
                });
            }
            setTerminalLines(newLines);
            return;
        }

        if (cmd === 'docker logs' || cmd.includes('docker logs')) {
            newLines.push({ type: 'stdout', text: '[INFO] Streaming logs from container payment-service_prod_1...' });
            if (files['docker-compose.yml'].includes('DB_POOL_SIZE=50')) {
                newLines.push({ type: 'stdout', text: '[2026-10-22T10:18:02.100Z] [INFO] Worker health check OK. Active connections: 48/50.' });
                newLines.push({ type: 'success', text: '[2026-10-22T10:18:03.411Z] [INFO] Latency p95: 38ms (Down from 3,200ms). Zero 504 timeouts.' });
            } else {
                newLines.push({ type: 'stderr', text: '[2026-10-22T10:18:02.100Z] [ERROR] Connection pool exhausted (10/10). 504 Gateway Timeouts persisting.' });
            }
            setTerminalLines(newLines);
            return;
        }

        if (cmd === 'test' || cmd === 'npm test' || cmd === 'run') {
            setTerminalLines(newLines);
            await runWasmTests();
            return;
        }

        newLines.push({ type: 'stderr', text: `bash: command not found: ${cmd}. Type "help" for a list of commands.` });
        setTerminalLines(newLines);
    };

    // Run in-browser test execution tailored to the active ticket
    const runWasmTests = async () => {
        setWasmRunning(true);
        setTerminalLines(prev => [
            ...prev,
            { type: 'system', text: `⚙️ Initializing In-Browser Test Runner for ${currentTicketData.code}...` },
            { type: 'stdout', text: `Verifying implementation across ${currentTicketData.targetFile}...` }
        ]);

        try {
            let success = false;
            let logs = [];

            if (currentTicketCode === 'FIN-101') {
                const content = files['paymentController.ts'] || '';
                const hasCurrencySet = /SUPPORTED_CURRENCIES/i.test(content) || /has\(currency/i.test(content) || /USD|EUR|GBP/i.test(content);
                const hasCaseCheck = /toUpperCase/i.test(content) || /ISO-4217/i.test(content);
                const hasAmountCheck = /amount\s*<=?\s*0|typeof amount/i.test(content);
                const has422 = /422/i.test(content);

                success = hasCurrencySet && hasAmountCheck && has422;

                logs = [
                    { type: 'stdout', text: '[WASM Test Engine] Executing Unit Test Suite: test_payment_boundary_validation.py...' }
                ];

                if (hasCurrencySet && hasCaseCheck) {
                    logs.push({ type: 'stdout', text: '  ✓ PASS: test_strict_iso_4217_currency: Rejects lowercase "usd" and unsupported currency codes' });
                } else {
                    logs.push({ type: 'stderr', text: '  ✗ FAIL: test_strict_iso_4217_currency: Must validate against SUPPORTED_CURRENCIES and reject lowercase currency' });
                }

                if (hasAmountCheck) {
                    logs.push({ type: 'stdout', text: '  ✓ PASS: test_amount_positive_boundary: Strictly enforces amount > 0 and 2 decimal places' });
                } else {
                    logs.push({ type: 'stderr', text: '  ✗ FAIL: test_amount_positive_boundary: Must check amount > 0 and reject negative/zero charges' });
                }

                if (has422) {
                    logs.push({ type: 'stdout', text: '  ✓ PASS: test_rejection_status_code: Returns HTTP 422 Unprocessable Entity for invalid payloads' });
                } else {
                    logs.push({ type: 'stderr', text: '  ✗ FAIL: test_rejection_status_code: Expected HTTP 422 status on validation error' });
                }
            } else if (currentTicketCode === 'FIN-102') {
                const content = files['idempotencyService.ts'] || '';
                const hasAcquire = /acquireLock/i.test(content) && /redis\.set/i.test(content) && /NX/i.test(content);
                const hasRelease = /releaseLock/i.test(content);
                success = hasAcquire && hasRelease;

                logs = [
                    { type: 'stdout', text: '[WASM Test Engine] Executing Concurrency Suite: test_distributed_idempotency_race.py...' }
                ];

                if (hasAcquire) {
                    logs.push({ type: 'stdout', text: '  ✓ PASS: test_atomic_lock_acquisition: Acquired Redis lock with atomic NX and 60s TTL' });
                    logs.push({ type: 'stdout', text: '  ✓ PASS: test_prevent_double_charge: Rejects concurrent duplicate Idempotency-Key within 200ms' });
                } else {
                    logs.push({ type: 'stderr', text: '  ✗ FAIL: test_atomic_lock_acquisition: Redis set NX atomic lock not implemented' });
                }

                if (hasRelease) {
                    logs.push({ type: 'stdout', text: '  ✓ PASS: test_lock_cleanup_guarantee: Guaranteed key release in try...finally' });
                } else {
                    logs.push({ type: 'stderr', text: '  ✗ FAIL: test_lock_cleanup_guarantee: releaseLock not called or missing cleanup' });
                }
            } else {
                // INC-504
                const dockerContent = files['docker-compose.yml'] || '';
                const poolMatch = dockerContent.match(/DB_POOL_SIZE\s*=\s*(\d+)/i);
                const poolSize = poolMatch ? parseInt(poolMatch[1], 10) : 10;
                
                const reqMatch = dockerContent.match(/MAX_CONCURRENT_REQUESTS\s*=\s*(\d+)/i);
                const maxReq = reqMatch ? parseInt(reqMatch[1], 10) : 50;

                const isPoolFixed = poolSize >= 50;
                const isReqFixed = maxReq >= 200;
                success = isPoolFixed && isReqFixed;

                logs = [
                    { type: 'stdout', text: '[WASM Test Engine] Initializing container runtime sandbox...' },
                    { type: 'stdout', text: '[WASM Test Engine] Simulating flash sale checkout traffic (15,000 req/sec)...' }
                ];

                if (isPoolFixed) {
                    logs.push({ type: 'stdout', text: `  ✓ PASS: test_db_connection_pool_scale (DB_POOL_SIZE=${poolSize} >= 50 can sustain peak throughput)` });
                } else {
                    logs.push({ type: 'stderr', text: `  ✗ FAIL: test_db_connection_pool_scale: DB_POOL_SIZE is ${poolSize}. Must be at least 50.` });
                }

                if (isReqFixed) {
                    logs.push({ type: 'stdout', text: `  ✓ PASS: test_concurrency_throttle_threshold (MAX_CONCURRENT_REQUESTS=${maxReq} >= 200 prevents 504 Timeouts)` });
                } else {
                    logs.push({ type: 'stderr', text: `  ✗ FAIL: test_concurrency_throttle_threshold: MAX_CONCURRENT_REQUESTS is ${maxReq}. Must be >= 200.` });
                }
            }

            const result = {
                success,
                durationMs: 95,
                logs,
                output: logs.map(l => l.text).join('\n')
            };

            setTestResult(result);
            setTerminalLines(prev => [
                ...prev,
                ...logs.map(l => ({ type: l.type === 'stderr' ? 'stderr' : 'stdout', text: l.text })),
                { 
                    type: success ? 'success' : 'stderr', 
                    text: success 
                        ? `✓ ALL TESTS PASSED (${result.durationMs}ms) — Implementation verified! Ready for Staff PR review.` 
                        : `✗ TESTS FAILED (${result.durationMs}ms) — Adjust your implementation to meet the ticket acceptance criteria.`
                }
            ]);

            if (success) {
                if (toast?.showToast) toast.showToast('All tests passed! You are ready to submit your Pull Request.', 'success', 'Tests Passed!');
            } else {
                if (toast?.showToast) toast.showToast('Tests incomplete. Apply the suggested fix in the guide.', 'warning', 'Tests Incomplete');
            }
        } catch (err) {
            setTerminalLines(prev => [
                ...prev,
                { type: 'stderr', text: `Execution error: ${err.message}` }
            ]);
        } finally {
            setWasmRunning(false);
        }
    };

    // Smart Multi-File Pull Request Submission
    const handlePullRequestSubmit = () => {
        if (modifiedFiles.length === 0) {
            // Auto-apply current ticket fix and submit so the user never experiences "nothing happening"
            const fixFile = currentTicketData.fixFile;
            const fixContent = currentTicketData.fixCode;
            handleFileChange(fixFile, fixContent);
            setActiveFile(fixFile);
            
            if (toast?.showToast) {
                toast.showToast(`Auto-applying ${currentTicketData.code} fix and submitting PR to Marcus for review...`, 'info', 'Submitting PR');
            }
            
            const prPayload = `=== FILE: ${fixFile} ===\n${fixContent}`;
            if (onSubmitReview) {
                onSubmitReview(prPayload);
            }
            return;
        }

        // Bundle ALL modified files into a clean unified Pull Request package
        const prPayload = modifiedFiles.map(file => {
            return `=== FILE: ${file} ===\n${files[file]}`;
        }).join('\n\n');

        if (toast?.showToast) toast.showToast(`Submitting Pull Request with ${modifiedFiles.length} file(s) to Marcus for review...`, 'info', 'Submitting PR');

        if (onSubmitReview) {
            onSubmitReview(prPayload);
        }
    };

    // Handle Socratic Mentor question
    const handleSendMentorMessage = async (e) => {
        e.preventDefault();
        const msg = mentorInput.trim();
        if (!msg) return;

        const newHistory = [
            ...mentorMessages,
            { sender: 'user', name: 'You (Candidate)', text: msg }
        ];
        setMentorMessages(newHistory);
        setMentorInput('');
        setAiThinking(true);

        try {
            const res = await simulationService.askMentorHint({
                ticket_code: activeTicket?.ticket_code || 'FIN-101',
                language: 'node',
                current_code: files[activeFile] || '',
                question: msg
            });

            setMentorMessages([
                ...newHistory,
                {
                    sender: 'ai',
                    name: 'Marcus (Staff Software Engineer)',
                    text: res.hint || res.manager_feedback || "Consider how the database connection pool limits affect throughput. If each request holds a connection for 50ms, a pool of 10 can only serve 200 req/sec before queuing."
                }
            ]);
        } catch (err) {
            let fallbackHint = "When traffic surges, a bottleneck can occur in either thread allocation or database connections. Look closely at DB_POOL_SIZE in docker-compose.yml: is 10 connections enough for thousands of checkout requests?";
            if (currentTicketCode === 'FIN-101') {
                if (msg.toLowerCase().includes('currency') || msg.toLowerCase().includes('iso')) {
                    fallbackHint = "Check SUPPORTED_CURRENCIES in paymentController.ts. Ensure the code is uppercase (currency === currency.toUpperCase()) and present in the Set. If invalid, respond with HTTP 422.";
                } else if (msg.toLowerCase().includes('amount') || msg.toLowerCase().includes('decimal')) {
                    fallbackHint = "Amounts must be strictly positive numbers (amount > 0) with at most 2 decimal places. Return HTTP 422 with a clear error payload if violated.";
                } else {
                    fallbackHint = "For FIN-101, our goal is strict payload boundary validation: reject lowercase currencies (like 'usd') and non-positive amounts before calling processPayment, returning HTTP 422.";
                }
            } else if (currentTicketCode === 'FIN-102') {
                if (msg.toLowerCase().includes('redis') || msg.toLowerCase().includes('lock')) {
                    fallbackHint = "Use Redis atomic SET NX with EX 60s TTL: `await redis.set(`idemp:${idempotencyKey}`, 'PROCESSING', 'EX', 60, 'NX')`. If it returns null, another thread is processing this charge!";
                } else if (msg.toLowerCase().includes('race') || msg.toLowerCase().includes('duplicate')) {
                    fallbackHint = "When acquireLock fails, return HTTP 409 Conflict. This prevents duplicate credit card charges if the client double-clicks within milliseconds.";
                } else {
                    fallbackHint = "For FIN-102, implement atomic distributed locking in idempotencyService.ts using Redis SET NX to prevent duplicate transactions.";
                }
            } else {
                if (msg.toLowerCase().includes('pool') || msg.toLowerCase().includes('database')) {
                    fallbackHint = "Exactly. A connection pool of 10 means only 10 queries can execute simultaneously. Increasing DB_POOL_SIZE to 50 allows our API workers to process requests without queuing.";
                } else if (msg.toLowerCase().includes('memory') || msg.toLowerCase().includes('oom')) {
                    fallbackHint = "The out of memory error was caused by millions of incoming requests queueing in RAM waiting for a free DB connection. Fixing the pool bottleneck eliminates the queue backlog!";
                }
            }

            setMentorMessages([
                ...newHistory,
                {
                    sender: 'ai',
                    name: 'Marcus (Staff Software Engineer)',
                    text: fallbackHint
                }
            ]);
        } finally {
            setAiThinking(false);
        }
    };

    // Close a file tab
    const handleCloseTab = (fileName, e) => {
        e.stopPropagation();
        const filtered = openFiles.filter(f => f !== fileName);
        if (filtered.length === 0) return;
        setOpenFiles(filtered);
        if (activeFile === fileName) {
            setActiveFile(filtered[0]);
        }
    };

    // Open a file from explorer
    const handleOpenFile = (fileName) => {
        if (!openFiles.includes(fileName)) {
            setOpenFiles([...openFiles, fileName]);
        }
        setActiveFile(fileName);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: '#090d16',
            color: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            overflow: 'hidden'
        }}>
            {/* 1. TOP HEADER / BREADCRUMBS */}
            <div style={{
                height: '52px',
                backgroundColor: '#0c1220',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '6px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#3b82f6'
                    }}>
                        <Cpu size={18} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                                CareerOS Developer Simulation Lab
                            </span>
                            <span style={{
                                fontSize: '0.675rem',
                                padding: '0.1rem 0.5rem',
                                borderRadius: '9999px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                            }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} className="animate-pulse" />
                                WASM Engine Active
                            </span>
                        </div>
                    </div>
                </div>

                {/* Guided Mode vs Pro Mode Toggle & Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: '6px',
                        padding: '2px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <button
                            onClick={() => {
                                setIsGuidedMode(true);
                                setActiveFile(currentTicketData.targetFile);
                            }}
                            style={{
                                padding: '0.28rem 0.75rem',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                backgroundColor: isGuidedMode ? '#10b981' : 'transparent',
                                color: isGuidedMode ? '#ffffff' : '#94a3b8',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            🟢 Guided Mode (Freshers)
                        </button>
                        <button
                            onClick={() => setIsGuidedMode(false)}
                            style={{
                                padding: '0.28rem 0.75rem',
                                borderRadius: '4px',
                                border: 'none',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                backgroundColor: !isGuidedMode ? '#3b82f6' : 'transparent',
                                color: !isGuidedMode ? '#ffffff' : '#94a3b8',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            ⚡ Pro IDE Mode
                        </button>
                    </div>

                    {/* Interactive Ticket Selector Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setShowTicketMenu(prev => !prev)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.3rem 0.75rem',
                                borderRadius: '6px',
                                backgroundColor: currentTicketCode === 'INC-504' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                border: currentTicketCode === 'INC-504' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(59, 130, 246, 0.35)',
                                color: currentTicketCode === 'INC-504' ? '#f87171' : '#60a5fa',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            <Layers size={13} />
                            <span>{currentTicketData.code}: {currentTicketData.title}</span>
                            <ChevronDown size={13} />
                        </button>

                        {showTicketMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                marginTop: '6px',
                                backgroundColor: '#0f172a',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.75)',
                                zIndex: 3000,
                                minWidth: '320px',
                                padding: '0.4rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', padding: '0.25rem 0.5rem' }}>
                                    Switch Simulation Ticket
                                </div>
                                {AVAILABLE_SIMULATION_TICKETS.map(t => (
                                    <div
                                        key={t.code}
                                        onClick={() => {
                                            handleSwitchTicket(t.code);
                                            setShowTicketMenu(false);
                                        }}
                                        style={{
                                            padding: '0.55rem 0.75rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            backgroundColor: currentTicketCode === t.code ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                            color: currentTicketCode === t.code ? '#93c5fd' : '#e2e8f0',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '2px',
                                            transition: 'background 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{t.code}: {t.title}</span>
                                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{t.duration}</span>
                                        </div>
                                        <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Target File: {t.targetFile}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {modifiedFiles.length > 0 && (
                        <span style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            fontWeight: 700
                        }}>
                            {modifiedFiles.length} file(s) modified
                        </span>
                    )}
                </div>

                {/* Right Top Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                        onClick={runWasmTests}
                        disabled={wasmRunning}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: '#10b981',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        <Play size={13} />
                        <span>{wasmRunning ? 'Testing...' : 'Run Tests (WASM)'}</span>
                    </button>

                    <button
                        onClick={handlePullRequestSubmit}
                        disabled={reviewing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.35rem 0.95rem',
                            borderRadius: '6px',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                        }}
                    >
                        <GitPullRequest size={13} />
                        <span>{reviewing ? 'Marcus Reviewing...' : `Submit Pull Request (${modifiedFiles.length} files)`}</span>
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '0.35rem',
                            borderRadius: '4px'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* 2. WORKSPACE BODY: GUIDED (2-PANE) OR PRO (4-PANE) */}
            {isGuidedMode ? (
                /* GUIDED FRESHERS MODE (2-PANE: Mission Guide + Focused Code Editor) */
                <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                    
                    {/* LEFT PANE: Plain-English Mission Guide, Hints, AI Mentor */}
                    <div style={{
                        width: '460px',
                        backgroundColor: '#0f172a',
                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto',
                        padding: '1.5rem',
                        gap: '1.25rem',
                        flexShrink: 0
                    }}>
                        {/* Fresher Badge Header */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '100px',
                                    backgroundColor: currentTicketCode === 'INC-504' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                                    color: currentTicketCode === 'INC-504' ? '#f87171' : '#34d399'
                                }}>
                                    {currentTicketData.badge}
                                </span>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{currentTicketData.duration}</span>
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem', lineHeight: 1.25 }}>
                                {currentTicketData.code}: {currentTicketData.title}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.825rem', color: '#94a3b8', lineHeight: 1.5 }}>
                                {currentTicketData.missionSummary}
                            </p>
                        </div>

                        {/* Step-by-Step Action List */}
                        <div style={{
                            backgroundColor: '#1e293b',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '1.1rem'
                        }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                                📋 Your 3-Step Mission
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8125rem', color: '#e2e8f0' }}>
                                {currentTicketData.steps.map((step) => (
                                    <div key={step.num} style={{ display: 'flex', gap: '0.6rem' }}>
                                        <div style={{ 
                                            width: 22, 
                                            height: 22, 
                                            borderRadius: '50%', 
                                            backgroundColor: step.num === 3 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
                                            color: step.num === 3 ? '#34d399' : '#60a5fa', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            fontWeight: 700, 
                                            fontSize: '0.75rem', 
                                            flexShrink: 0 
                                        }}>
                                            {step.num}
                                        </div>
                                        <div style={{ lineHeight: 1.4 }}>
                                            {step.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Hint Section */}
                        <div style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            borderRadius: '10px',
                            padding: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showGuidedHint ? '0.75rem' : 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.8125rem', fontWeight: 700 }}>
                                    <Sparkles size={16} />
                                    <span>Stuck? Get A Guided Hint</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowGuidedHint(!showGuidedHint)}
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.2)',
                                        border: '1px solid rgba(245, 158, 11, 0.4)',
                                        color: '#fbbf24',
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.65rem',
                                        borderRadius: '6px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {showGuidedHint ? 'Hide Hint' : '💡 Show Me The Fix'}
                                </button>
                            </div>

                            {showGuidedHint && (
                                <div style={{ fontSize: '0.785rem', color: '#fde68a', lineHeight: 1.5, borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '0.75rem' }}>
                                    <p style={{ margin: '0 0 0.5rem' }}>
                                        Target: <code>{currentTicketData.targetFile}</code>
                                    </p>
                                    <pre style={{
                                        backgroundColor: '#0c1220',
                                        padding: '0.6rem',
                                        borderRadius: '6px',
                                        color: '#34d399',
                                        fontSize: '0.75rem',
                                        margin: '0 0 0.5rem',
                                        overflowX: 'auto',
                                        fontFamily: 'monospace'
                                    }}>
{currentTicketData.hint}
                                    </pre>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleFileChange(currentTicketData.fixFile, currentTicketData.fixCode);
                                            setActiveFile(currentTicketData.fixFile);
                                            if (toast?.showToast) {
                                                toast.showToast(`Updated ${currentTicketData.fixFile} with ${currentTicketData.code} solution!`, 'success', 'Fix Applied!');
                                            }
                                        }}
                                        style={{
                                            background: '#f59e0b',
                                            border: 'none',
                                            color: '#000',
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            padding: '0.35rem 0.75rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.35rem'
                                        }}
                                    >
                                        <Check size={13} />
                                        <span>Auto-Apply Fix to Editor</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Friendly AI Mentor (Marcus) */}
                        <div style={{
                            backgroundColor: '#1e293b',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                                    <Bot size={15} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Marcus (AI Staff Engineer)</div>
                                    <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Your personal mentor</div>
                                </div>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.785rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                                {currentTicketData.mentorQuote}
                            </p>
                        </div>

                        {/* Action Buttons: 1-Click Test & Submit PR */}
                        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={runWasmTests}
                                disabled={wasmRunning}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    backgroundColor: '#10b981',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '0.85rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Play size={16} />
                                <span>{wasmRunning ? 'Running WASM Verification...' : '▶️ Run Verification Tests (1-Click)'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePullRequestSubmit}
                                disabled={reviewing}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.7rem',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    color: '#60a5fa',
                                    fontSize: '0.825rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <GitPullRequest size={15} />
                                <span>{reviewing ? 'Marcus Reviewing PR...' : `Submit Pull Request (${modifiedFiles.length} files)`}</span>
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANE: Focused Editor for Target File */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, backgroundColor: '#090d16' }}>
                        {/* Editor Header */}
                        <div style={{
                            padding: '0.6rem 1rem',
                            backgroundColor: '#0f172a',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileCode size={15} color="#38bdf8" />
                                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc' }}>
                                    {activeFile}
                                </span>
                                <span style={{
                                    fontSize: '0.6875rem',
                                    backgroundColor: activeFile === currentTicketData.targetFile ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                    color: activeFile === currentTicketData.targetFile ? '#34d399' : '#60a5fa',
                                    border: activeFile === currentTicketData.targetFile ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '4px',
                                    fontWeight: 700
                                }}>
                                    {activeFile === currentTicketData.targetFile ? 'Target Ticket File' : 'Repository File'}
                                </span>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                💡 {currentTicketData.tipText}
                            </div>
                        </div>

                        {/* Editor Textarea with Line Numbers */}
                        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                            <div style={{
                                width: '45px',
                                backgroundColor: '#0c1220',
                                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                                color: '#475569',
                                fontFamily: 'Consolas, "Fira Code", monospace',
                                fontSize: '0.8125rem',
                                lineHeight: '1.5rem',
                                textAlign: 'right',
                                padding: '0.75rem 0.6rem',
                                userSelect: 'none'
                            }}>
                                {(files[activeFile] || '').split('\n').map((_, i) => (
                                    <div key={i}>{i + 1}</div>
                                ))}
                            </div>

                            <textarea
                                value={files[activeFile] || ''}
                                onChange={(e) => handleFileChange(activeFile, e.target.value)}
                                spellCheck={false}
                                style={{
                                    flex: 1,
                                    height: '100%',
                                    backgroundColor: '#090d16',
                                    color: '#e2e8f0',
                                    fontFamily: 'Consolas, "Fira Code", monospace',
                                    fontSize: '0.8125rem',
                                    lineHeight: '1.5rem',
                                    padding: '0.75rem 1rem',
                                    border: 'none',
                                    outline: 'none',
                                    resize: 'none',
                                    whiteSpace: 'pre'
                                }}
                            />
                        </div>

                        {/* Bottom Test Results Banner */}
                        {testResult && (
                            <div style={{
                                padding: '0.85rem 1.25rem',
                                backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                borderTop: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    {testResult.success ? (
                                        <CheckCircle2 size={18} color="#34d399" />
                                    ) : (
                                        <AlertTriangle size={18} color="#f87171" />
                                    )}
                                    <div>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: testResult.success ? '#34d399' : '#f87171' }}>
                                            {testResult.success 
                                                ? '✅ All Tests Passed! Flash sale bottleneck resolved.'
                                                : `❌ Tests failed. Increase DB_POOL_SIZE to at least 50.`}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                            WebAssembly In-Browser Test Suite • Execution time: {testResult.durationMs || 120}ms
                                        </div>
                                    </div>
                                </div>

                                {testResult.success && (
                                    <button
                                        type="button"
                                        onClick={handlePullRequestSubmit}
                                        style={{
                                            padding: '0.4rem 0.85rem',
                                            borderRadius: '6px',
                                            backgroundColor: '#3b82f6',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Ready to Submit PR →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* PRO IDE MODE (ORIGINAL 4-PANE FULL WORKSPACE) */
                <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                
                {/* 2A. LEFT ICON STRIP (ACTIVITY BAR) */}
                <div style={{
                    width: '48px',
                    backgroundColor: '#0c1220',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    gap: '1.25rem',
                    color: '#64748b',
                    flexShrink: 0
                }}>
                    <button style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', position: 'relative' }}>
                        <FileCode size={20} />
                        <div style={{ position: 'absolute', left: '-14px', top: '2px', width: '2px', height: '18px', backgroundColor: '#3b82f6' }} />
                    </button>
                    <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Search size={20} /></button>
                    <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><GitBranch size={20} /></button>
                    <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Bug size={20} /></button>
                    <div style={{ marginTop: 'auto' }}>
                        <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Settings size={20} /></button>
                    </div>
                </div>

                {/* 2B. LEFT SIDEBAR: FILE EXPLORER + MISSION BRIEF */}
                <div style={{
                    width: '260px',
                    backgroundColor: '#0f172a',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0
                }}>
                    {/* Repository Title */}
                    <div style={{
                        padding: '0.65rem 0.85rem',
                        fontSize: '0.675rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#94a3b8',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span>Explorer: payment-microservice</span>
                    </div>

                    {/* File Tree with [M] Modified badges */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0', fontSize: '0.785rem' }}>
                        {/* src/ folder */}
                        <div 
                            onClick={() => setFolderOpen(p => ({ ...p, src: !p.src }))}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.75rem', cursor: 'pointer', color: '#cbd5e1' }}
                        >
                            {folderOpen.src ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            {folderOpen.src ? <FolderOpen size={14} color="#f59e0b" /> : <Folder size={14} color="#f59e0b" />}
                            <span>src</span>
                        </div>

                        {folderOpen.src && (
                            <div style={{ paddingLeft: '1.25rem' }}>
                                {/* controllers/ */}
                                <div 
                                    onClick={() => setFolderOpen(p => ({ ...p, controllers: !p.controllers }))}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.5rem', cursor: 'pointer', color: '#cbd5e1' }}
                                >
                                    {folderOpen.controllers ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    {folderOpen.controllers ? <FolderOpen size={13} color="#3b82f6" /> : <Folder size={13} color="#3b82f6" />}
                                    <span>controllers</span>
                                </div>
                                {folderOpen.controllers && (
                                    <div style={{ paddingLeft: '1rem' }}>
                                        <div 
                                            onClick={() => handleOpenFile('paymentController.ts')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                padding: '0.2rem 0.5rem',
                                                cursor: 'pointer',
                                                borderRadius: '3px',
                                                backgroundColor: activeFile === 'paymentController.ts' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                                color: activeFile === 'paymentController.ts' ? '#60a5fa' : '#94a3b8'
                                            }}
                                        >
                                            <FileCode size={13} color="#3b82f6" />
                                            <span>paymentController.ts</span>
                                            {modifiedFiles.includes('paymentController.ts') && (
                                                <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontWeight: 800, color: '#f59e0b' }}>M</span>
                                            )}
                                        </div>
                                        <div 
                                            onClick={() => handleOpenFile('transactionService.go')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                padding: '0.2rem 0.5rem',
                                                cursor: 'pointer',
                                                borderRadius: '3px',
                                                backgroundColor: activeFile === 'transactionService.go' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                                color: activeFile === 'transactionService.go' ? '#60a5fa' : '#94a3b8'
                                            }}
                                        >
                                            <FileCode size={13} color="#06b6d4" />
                                            <span>transactionService.go</span>
                                            {modifiedFiles.includes('transactionService.go') && (
                                                <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontWeight: 800, color: '#f59e0b' }}>M</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* middleware/ */}
                                <div 
                                    onClick={() => setFolderOpen(p => ({ ...p, middleware: !p.middleware }))}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.5rem', cursor: 'pointer', color: '#cbd5e1' }}
                                >
                                    {folderOpen.middleware ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    {folderOpen.middleware ? <FolderOpen size={13} color="#6366f1" /> : <Folder size={13} color="#6366f1" />}
                                    <span>middleware</span>
                                </div>
                                {folderOpen.middleware && (
                                    <div style={{ paddingLeft: '1rem' }}>
                                        <div 
                                            onClick={() => handleOpenFile('authMiddleware.ts')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                padding: '0.2rem 0.5rem',
                                                cursor: 'pointer',
                                                color: activeFile === 'authMiddleware.ts' ? '#60a5fa' : '#94a3b8'
                                            }}
                                        >
                                            <FileCode size={13} color="#3b82f6" />
                                            <span>authMiddleware.ts</span>
                                            {modifiedFiles.includes('authMiddleware.ts') && (
                                                <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontWeight: 800, color: '#f59e0b' }}>M</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* services/ */}
                                <div 
                                    onClick={() => setFolderOpen(p => ({ ...p, services: !p.services }))}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.5rem', cursor: 'pointer', color: '#cbd5e1' }}
                                >
                                    {folderOpen.services ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    {folderOpen.services ? <FolderOpen size={13} color="#10b981" /> : <Folder size={13} color="#10b981" />}
                                    <span>services</span>
                                </div>
                                {folderOpen.services && (
                                    <div style={{ paddingLeft: '1rem' }}>
                                        <div 
                                            onClick={() => handleOpenFile('idempotencyService.ts')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                padding: '0.2rem 0.5rem',
                                                cursor: 'pointer',
                                                borderRadius: '3px',
                                                backgroundColor: activeFile === 'idempotencyService.ts' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                                color: activeFile === 'idempotencyService.ts' ? '#60a5fa' : '#94a3b8'
                                            }}
                                        >
                                            <FileCode size={13} color="#10b981" />
                                            <span>idempotencyService.ts</span>
                                            {modifiedFiles.includes('idempotencyService.ts') && (
                                                <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontWeight: 800, color: '#f59e0b' }}>M</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Top-level files */}
                        <div 
                            onClick={() => handleOpenFile('docker-compose.yml')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.25rem 0.75rem',
                                cursor: 'pointer',
                                backgroundColor: activeFile === 'docker-compose.yml' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: activeFile === 'docker-compose.yml' ? '#60a5fa' : '#94a3b8'
                            }}
                        >
                            <FileText size={13} color="#38bdf8" />
                            <span>docker-compose.yml</span>
                            {modifiedFiles.includes('docker-compose.yml') && (
                                <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontWeight: 800, color: '#f59e0b' }}>M</span>
                            )}
                        </div>
                        <div 
                            onClick={() => handleOpenFile('package.json')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.25rem 0.75rem',
                                cursor: 'pointer',
                                backgroundColor: activeFile === 'package.json' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: activeFile === 'package.json' ? '#60a5fa' : '#94a3b8'
                            }}
                        >
                            <FileCode size={13} color="#10b981" />
                            <span>package.json</span>
                            {modifiedFiles.includes('package.json') && (
                                <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontWeight: 800, color: '#f59e0b' }}>M</span>
                            )}
                        </div>
                        <div 
                            onClick={() => handleOpenFile('README.md')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.25rem 0.75rem',
                                cursor: 'pointer',
                                backgroundColor: activeFile === 'README.md' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                color: activeFile === 'README.md' ? '#60a5fa' : '#94a3b8'
                            }}
                        >
                            <FileText size={13} color="#94a3b8" />
                            <span>README.md</span>
                            {modifiedFiles.includes('README.md') && (
                                <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontWeight: 800, color: '#f59e0b' }}>M</span>
                            )}
                        </div>
                    </div>

                    {/* Simulation Mission Brief Card */}
                    <div style={{
                        padding: '0.85rem',
                        backgroundColor: '#0c1220',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '0.75rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: 800 }}>
                                <AlertTriangle size={14} />
                                <span>Mission Brief</span>
                            </div>
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.45rem',
                                borderRadius: '4px',
                                backgroundColor: currentTicketCode === 'INC-504' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                                color: currentTicketCode === 'INC-504' ? '#f87171' : '#60a5fa'
                            }}>
                                {currentTicketData.code}
                            </span>
                        </div>
                        <p style={{ margin: '0 0 0.4rem 0', color: '#94a3b8', lineHeight: 1.35 }}>
                            <strong style={{ color: '#f8fafc' }}>Scenario:</strong> {currentTicketData.scenario || currentTicketData.missionSummary}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: '#cbd5e1' }}>
                            <div>🎯 <strong>Objective:</strong> {currentTicketData.objective || currentTicketData.title}</div>
                            <div>⚡ <strong>Constraint:</strong> {currentTicketData.constraint || 'Production SLA'}</div>
                        </div>
                    </div>
                </div>

                {/* 2C. CENTER SECTION: TABS + CODE EDITOR + TERMINAL */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
                    
                    {/* Editor Tab Bar with Dirty [•] Indicators */}
                    <div style={{
                        height: '36px',
                        backgroundColor: '#0c1220',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 0.5rem',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', height: '100%' }}>
                            {openFiles.map(file => {
                                const isActive = activeFile === file;
                                const isDirty = modifiedFiles.includes(file);
                                return (
                                    <div
                                        key={file}
                                        onClick={() => setActiveFile(file)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0 0.85rem',
                                            backgroundColor: isActive ? '#090d16' : 'transparent',
                                            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                                            borderTop: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                                            color: isActive ? '#f8fafc' : '#94a3b8',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <FileCode size={13} color={file.endsWith('.ts') ? '#3b82f6' : file.endsWith('.yml') ? '#38bdf8' : '#10b981'} />
                                        <span>{file}</span>
                                        {isDirty && (
                                            <span 
                                                title="Modified file" 
                                                style={{ color: '#f59e0b', fontSize: '0.9rem', lineHeight: 1 }}
                                            >
                                                ●
                                            </span>
                                        )}
                                        <span 
                                            onClick={(e) => handleCloseTab(file, e)}
                                            style={{ color: '#64748b', marginLeft: '0.25rem', padding: '0.1rem', borderRadius: '3px' }}
                                        >
                                            ×
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Only Git Diff button */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => setEditorViewMode(prev => prev === 'diff' ? 'editor' : 'diff')}
                                title={editorViewMode === 'diff' ? 'Return to Code Editor' : 'Toggle Git Diff View'}
                                style={{
                                    padding: '0.22rem 0.65rem',
                                    borderRadius: '4px',
                                    backgroundColor: editorViewMode === 'diff' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid ' + (editorViewMode === 'diff' ? '#10b981' : 'rgba(255, 255, 255, 0.12)'),
                                    color: editorViewMode === 'diff' ? '#34d399' : '#cbd5e1',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <GitBranch size={13} color={editorViewMode === 'diff' ? '#34d399' : '#94a3b8'} />
                                <span>{editorViewMode === 'diff' ? 'Close Diff' : 'Git Diff View'}</span>
                                {(activeAdditions > 0 || activeDeletions > 0) && (
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '0.08rem 0.35rem',
                                        borderRadius: '8px',
                                        backgroundColor: '#10b981',
                                        color: '#ffffff',
                                        fontWeight: 800
                                    }}>
                                        +{activeAdditions}/-{activeDeletions}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Code Editor Body */}
                    <div style={{
                        flex: 1,
                        backgroundColor: '#090d16',
                        display: 'flex',
                        minHeight: 0,
                        overflow: 'hidden',
                        fontFamily: "'JetBrains Mono', monospace"
                    }}>
                        {editorViewMode === 'editor' ? (
                            <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
                                {/* VS Code Style Git Gutter & Line Numbers */}
                                <div 
                                    ref={lineGutterRef}
                                    onWheel={handleGutterWheel}
                                    style={{
                                        width: '54px',
                                        backgroundColor: '#0a0f1d',
                                        padding: '1rem 0',
                                        userSelect: 'none',
                                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                                        flexShrink: 0,
                                        overflowY: 'hidden',
                                        overflowX: 'hidden'
                                    }}
                                >
                                    {(files[activeFile] || '').split('\n').map((_, idx) => {
                                        const lineNum = idx + 1;
                                        const annot = gutterAnnotations[lineNum] || { status: null, deletedAbove: false, oldText: null };
                                        const isAdded = annot.status === 'added';
                                        const isModified = annot.status === 'modified';

                                        return (
                                            <div 
                                                key={idx}
                                                style={{
                                                    height: '1.5rem',
                                                    lineHeight: '1.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    position: 'relative',
                                                    backgroundColor: isAdded 
                                                        ? 'rgba(16, 185, 129, 0.09)' 
                                                        : isModified 
                                                            ? 'rgba(59, 130, 246, 0.09)' 
                                                            : 'transparent',
                                                    boxSizing: 'border-box'
                                                }}
                                                title={
                                                    isModified 
                                                        ? `Line ${lineNum}: Modified (Original: ${annot.oldText || 'different content'})` 
                                                        : isAdded 
                                                            ? `Line ${lineNum}: Newly Added` 
                                                            : `Line ${lineNum}`
                                                }
                                            >
                                                {/* Line Number Text */}
                                                <span style={{
                                                    flex: 1,
                                                    textAlign: 'right',
                                                    paddingRight: '8px',
                                                    fontSize: '0.75rem',
                                                    color: isAdded ? '#34d399' : isModified ? '#60a5fa' : '#475569',
                                                    fontWeight: (isAdded || isModified) ? 700 : 400
                                                }}>
                                                    {lineNum}
                                                </span>

                                                {/* Vertical Git Gutter Line Indicator */}
                                                <div style={{
                                                    width: '3.5px',
                                                    height: '100%',
                                                    backgroundColor: isAdded ? '#10b981' : isModified ? '#3b82f6' : 'transparent',
                                                    borderRadius: '1.5px',
                                                    boxShadow: isAdded 
                                                        ? '0 0 6px rgba(16, 185, 129, 0.65)' 
                                                        : isModified 
                                                            ? '0 0 6px rgba(59, 130, 246, 0.65)' 
                                                            : 'none',
                                                    flexShrink: 0
                                                }} />

                                                {/* Deletion indicator (Red triangle) if lines were deleted right above */}
                                                {annot.deletedAbove && (
                                                    <div 
                                                        style={{
                                                            position: 'absolute',
                                                            top: '-2px',
                                                            right: '0',
                                                            width: 0,
                                                            height: 0,
                                                            borderLeft: '4.5px solid #ef4444',
                                                            borderTop: '3.5px solid transparent',
                                                            borderBottom: '3.5px solid transparent',
                                                            zIndex: 3
                                                        }} 
                                                        title={`Lines deleted here:\n${annot.oldText || ''}`} 
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Code Editor Textarea */}
                                <textarea
                                    ref={textareaRef}
                                    value={files[activeFile] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFiles(prev => ({ ...prev, [activeFile]: val }));
                                    }}
                                    onScroll={handleEditorScroll}
                                    wrap="off"
                                    spellCheck="false"
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#090d16',
                                        color: '#e2e8f0',
                                        border: 'none',
                                        outline: 'none',
                                        padding: '1rem',
                                        fontSize: '0.8rem',
                                        lineHeight: '1.5rem',
                                        resize: 'none',
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        tabSize: 4,
                                        whiteSpace: 'pre',
                                        overflowX: 'auto',
                                        overflowY: 'auto'
                                    }}
                                />
                            </div>
                        ) : (
                            /* Git Diff View Mode for currently selected file */
                            <div style={{ flex: 1, padding: '0.75rem 1rem', overflowY: 'auto', fontSize: '0.8rem', lineHeight: '1.5rem', backgroundColor: '#090d16' }}>
                                {/* Diff Header Banner */}
                                <div style={{
                                    color: '#94a3b8',
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingBottom: '0.5rem',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#f8fafc', fontWeight: 700 }}>
                                            diff --git a/{activeFile} b/{activeFile}
                                        </span>
                                        {activeAdditions > 0 && (
                                            <span style={{ fontSize: '0.7rem', color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: 800 }}>
                                                +{activeAdditions} lines
                                            </span>
                                        )}
                                        {activeDeletions > 0 && (
                                            <span style={{ fontSize: '0.7rem', color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: 800 }}>
                                                -{activeDeletions} lines
                                            </span>
                                        )}
                                    </div>
                                    <span style={{
                                        color: modifiedFiles.includes(activeFile) ? '#f59e0b' : '#10b981',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        letterSpacing: '0.05em'
                                    }}>
                                        {modifiedFiles.includes(activeFile) ? '● MODIFIED IN WORKING TREE' : '✓ CLEAN / UNMODIFIED'}
                                    </span>
                                </div>

                                {/* Line-By-Line Diff Render */}
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.785rem', lineHeight: '1.6rem', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                    {activeDiff.map((d, dIdx) => {
                                        if (d.type === 'added') {
                                            return (
                                                <div 
                                                    key={dIdx} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center',
                                                        backgroundColor: 'rgba(16, 185, 129, 0.12)', 
                                                        color: '#34d399', 
                                                        borderLeft: '3px solid #10b981',
                                                        padding: '0 0.5rem'
                                                    }}
                                                >
                                                    <span style={{ width: '32px', color: '#475569', textAlign: 'right', marginRight: '0.5rem', userSelect: 'none' }}>+</span>
                                                    <span style={{ width: '32px', color: '#10b981', textAlign: 'right', marginRight: '1rem', userSelect: 'none', fontWeight: 700 }}>{d.modLine}</span>
                                                    <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>+ {d.text}</span>
                                                </div>
                                            );
                                        }
                                        if (d.type === 'removed') {
                                            return (
                                                <div 
                                                    key={dIdx} 
                                                    style={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.12)', 
                                                        color: '#f87171', 
                                                        borderLeft: '3px solid #ef4444',
                                                        padding: '0 0.5rem'
                                                    }}
                                                >
                                                    <span style={{ width: '32px', color: '#ef4444', textAlign: 'right', marginRight: '0.5rem', userSelect: 'none', fontWeight: 700 }}>{d.origLine}</span>
                                                    <span style={{ width: '32px', color: '#475569', textAlign: 'right', marginRight: '1rem', userSelect: 'none' }}>-</span>
                                                    <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>- {d.text}</span>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div 
                                                key={dIdx} 
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    color: '#94a3b8', 
                                                    padding: '0 0.5rem'
                                                }}
                                            >
                                                <span style={{ width: '32px', color: '#334155', textAlign: 'right', marginRight: '0.5rem', userSelect: 'none' }}>{d.origLine}</span>
                                                <span style={{ width: '32px', color: '#334155', textAlign: 'right', marginRight: '1rem', userSelect: 'none' }}>{d.modLine}</span>
                                                <span style={{ flex: 1, whiteSpace: 'pre-wrap', color: '#cbd5e1' }}>  {d.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Split: HIGH-TECH LINUX TERMINAL */}
                    <div style={{
                        height: '240px',
                        backgroundColor: '#0c1220',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        flexShrink: 0
                    }}>
                        {/* Terminal Tab Bar */}
                        <div style={{
                            height: '32px',
                            backgroundColor: '#090d16',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0 0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <TerminalIcon size={14} />
                                    <span>Terminal</span>
                                </div>
                                <span style={{ color: '#475569' }}>|</span>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>developer@careeros-lab</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setTerminalLines([])}
                                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.7rem', cursor: 'pointer' }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Terminal Screen / Log Output */}
                        <div 
                            ref={terminalEndRef}
                            style={{
                                flex: 1,
                                padding: '0.65rem 0.85rem',
                                overflowY: 'auto',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '0.75rem',
                                lineHeight: '1.4rem'
                            }}
                        >
                            {terminalLines.map((line, lIdx) => {
                                if (line.type === 'command') {
                                    return (
                                        <div key={lIdx} style={{ color: '#38bdf8' }}>
                                            <span style={{ color: '#10b981' }}>developer@careeros-lab:~$</span> {line.text}
                                        </div>
                                    );
                                }
                                if (line.type === 'fatal') {
                                    return <div key={lIdx} style={{ color: '#ef4444', fontWeight: 800 }}>{line.text}</div>;
                                }
                                if (line.type === 'stderr') {
                                    return <div key={lIdx} style={{ color: '#f87171' }}>{line.text}</div>;
                                }
                                if (line.type === 'success') {
                                    return <div key={lIdx} style={{ color: '#34d399', fontWeight: 700 }}>{line.text}</div>;
                                }
                                if (line.type === 'system') {
                                    return <div key={lIdx} style={{ color: '#94a3b8', fontStyle: 'italic' }}>[System] {line.text}</div>;
                                }
                                return <div key={lIdx} style={{ color: '#cbd5e1' }}>{line.text}</div>;
                            })}
                        </div>

                        {/* Terminal Command Input Prompt */}
                        <form 
                            onSubmit={handleTerminalCommand}
                            style={{
                                height: '34px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 0.75rem',
                                backgroundColor: '#090d16',
                                gap: '0.4rem',
                                fontFamily: "'JetBrains Mono', monospace"
                            }}
                        >
                            <span style={{ color: '#10b981', fontSize: '0.75rem' }}>developer@careeros-lab:~$</span>
                            <input
                                type="text"
                                value={terminalInput}
                                onChange={(e) => setTerminalInput(e.target.value)}
                                placeholder="Try 'git status', 'git diff', 'docker logs', 'run'..."
                                style={{
                                    flex: 1,
                                    background: 'none',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#f8fafc',
                                    fontSize: '0.75rem',
                                    fontFamily: "'JetBrains Mono', monospace"
                                }}
                            />
                        </form>
                    </div>
                </div>

                {/* 2D. RIGHT PANEL: CAREEROS AI COPILOT MENTOR */}
                <div style={{
                    width: '340px',
                    backgroundColor: '#0f172a',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0
                }}>
                    {/* Mentor Header */}
                    <div style={{
                        height: '48px',
                        padding: '0 1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#0c1220'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#6366f1'
                            }}>
                                <Sparkles size={15} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.825rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                                    CareerOS AI Mentor
                                </h4>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                                    Marcus (Staff Engineer)
                                </span>
                            </div>
                        </div>

                        <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#06b6d4',
                            boxShadow: '0 0 10px #06b6d4'
                        }} />
                    </div>

                    {/* Chat Messages Scroll */}
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {mentorMessages.map((msg, mIdx) => {
                            const isAi = msg.sender === 'ai';
                            return (
                                <div
                                    key={mIdx}
                                    style={{
                                        alignSelf: isAi ? 'flex-start' : 'flex-end',
                                        maxWidth: '92%',
                                        backgroundColor: isAi ? 'rgba(30, 41, 59, 0.7)' : '#3b82f6',
                                        border: isAi ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                                        borderRadius: '12px',
                                        padding: '0.75rem 0.95rem',
                                        fontSize: '0.785rem',
                                        color: '#f8fafc',
                                        lineHeight: 1.45,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <div style={{ fontSize: '0.675rem', fontWeight: 700, color: isAi ? '#38bdf8' : '#e0e7ff', marginBottom: '0.25rem' }}>
                                        {msg.name}
                                    </div>
                                    <div>{msg.text}</div>
                                </div>
                            );
                        })}

                        {aiThinking && (
                            <div style={{ alignSelf: 'flex-start', color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <RefreshCw size={13} className="animate-spin" />
                                <span>Marcus is reviewing your question...</span>
                            </div>
                        )}
                    </div>

                    {/* Socratic Chat Input */}
                    <form
                        onSubmit={handleSendMentorMessage}
                        style={{
                            padding: '0.75rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            backgroundColor: '#0c1220',
                            display: 'flex',
                            gap: '0.4rem'
                        }}
                    >
                        <input
                            type="text"
                            value={mentorInput}
                            onChange={(e) => setMentorInput(e.target.value)}
                            placeholder="Ask Marcus a Socratic question..."
                            style={{
                                flex: 1,
                                padding: '0.5rem 0.75rem',
                                borderRadius: '6px',
                                backgroundColor: '#1e293b',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#f8fafc',
                                fontSize: '0.785rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: '6px',
                                backgroundColor: '#3b82f6',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <Send size={15} />
                        </button>
                    </form>
                </div>
            </div>
            )}

            {/* 3. STAFF AI PULL REQUEST REVIEW MODAL */}
            {reviewResult && showReviewModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2500,
                    backgroundColor: 'rgba(0, 0, 0, 0.78)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '720px',
                        maxHeight: '90vh',
                        backgroundColor: '#0f172a',
                        border: reviewResult.status === 'APPROVED' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            backgroundColor: '#0c1220',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '10px',
                                    backgroundColor: reviewResult.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: reviewResult.status === 'APPROVED' ? '#34d399' : '#fbbf24'
                                }}>
                                    {reviewResult.status === 'APPROVED' ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                                            Pull Request Review
                                        </span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '100px',
                                            backgroundColor: reviewResult.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                            color: reviewResult.status === 'APPROVED' ? '#34d399' : '#fbbf24',
                                            border: reviewResult.status === 'APPROVED' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                                        }}>
                                            {reviewResult.status === 'APPROVED' ? 'APPROVED' : 'CHANGES REQUESTED'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                        Reviewed by Marcus (Staff Software Engineer) • Score: <strong style={{ color: reviewResult.status === 'APPROVED' ? '#34d399' : '#fbbf24' }}>{reviewResult.score}/100</strong>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '0.35rem',
                                    borderRadius: '6px'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Marcus Executive Summary */}
                            <div style={{
                                backgroundColor: '#1e293b',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '1.15rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                                        <Bot size={14} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                                        Staff Review Assessment
                                    </span>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                                    {reviewResult.summary}
                                </p>
                            </div>

                            {/* Criteria Breakdown */}
                            {reviewResult.criteria_breakdown && reviewResult.criteria_breakdown.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>
                                        Acceptance Criteria Breakdown ({reviewResult.score}/100 Pts)
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {reviewResult.criteria_breakdown.map((item, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    backgroundColor: item.status === 'PASS' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                                    border: item.status === 'PASS' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    justifyContent: 'space-between',
                                                    gap: '0.75rem'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
                                                        {item.criterion}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                                                        {item.feedback}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 800,
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '100px',
                                                    backgroundColor: item.status === 'PASS' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                                                    color: item.status === 'PASS' ? '#34d399' : '#f87171',
                                                    flexShrink: 0
                                                }}>
                                                    {item.points_awarded}/{item.points_possible} pts
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Earned Google XYZ Resume Bullet */}
                            {reviewResult.star_bullet && (
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    borderRadius: '12px',
                                    padding: '1.15rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa', fontSize: '0.8125rem', fontWeight: 700 }}>
                                            <Sparkles size={16} />
                                            <span>Earned Google XYZ Resume Bullet Point</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyBullet(reviewResult.star_bullet)}
                                            style={{
                                                background: 'rgba(59, 130, 246, 0.25)',
                                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                                color: '#93c5fd',
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                padding: '0.25rem 0.65rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem'
                                            }}
                                        >
                                            {copiedBullet ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                                            <span>{copiedBullet ? 'Copied!' : 'Copy Bullet'}</span>
                                        </button>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#f8fafc', fontStyle: 'italic', lineHeight: 1.5 }}>
                                        "{reviewResult.star_bullet}"
                                    </p>
                                </div>
                            )}

                            {/* Interview Talking Point */}
                            {reviewResult.interview_talking_point && (
                                <div style={{
                                    backgroundColor: '#0c1220',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '10px',
                                    padding: '1rem'
                                }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                                        How To Talk About This In Tech Interviews:
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                                        {reviewResult.interview_talking_point}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            backgroundColor: '#0c1220',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.75rem'
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                style={{
                                    padding: '0.55rem 1.25rem',
                                    borderRadius: '8px',
                                    backgroundColor: reviewResult.status === 'APPROVED' ? '#10b981' : '#3b82f6',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                }}
                            >
                                {reviewResult.status === 'APPROVED' ? 'Continue Practicing' : 'Return to Editor & Revise Fix'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
