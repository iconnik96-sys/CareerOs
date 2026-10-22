import React, { useState, useEffect, useRef } from 'react';
import { 
    Cpu, Terminal as TerminalIcon, FileCode, Folder, FolderOpen, 
    FileText, GitPullRequest, Play, CheckCircle2, AlertTriangle, 
    X, RefreshCw, Send, Sparkles, MessageSquare, ChevronRight, 
    ChevronDown, Settings, Search, GitBranch, Bug, Layers, 
    ExternalLink, Check, Copy, Flame, ShieldAlert, Award, Bot
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
    reviewResult = null 
}) => {
    const toast = useToast();

    // 1. Multi-File Virtual Filesystem State
    const [openFiles, setOpenFiles] = useState(['paymentController.ts', 'docker-compose.yml']);
    const [activeFile, setActiveFile] = useState('paymentController.ts');
    const [folderOpen, setFolderOpen] = useState({ src: true, controllers: true, middleware: true, config: false });
    const [editorViewMode, setEditorViewMode] = useState('editor'); // 'editor' | 'diff'
    
    // File contents state (Pre-loaded with modified demo fix in docker-compose.yml)
    const [files, setFiles] = useState({
        ...STARTER_REPOSITORY_FILES,
        'docker-compose.yml': `version: '3.8'
services:
  payment-service:
    build: .
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      # Original Bottleneck: DB_POOL_SIZE=10
      # Proposed Production Fix:
      - DB_POOL_SIZE=50
      - MAX_CONCURRENT_REQUESTS=500
      - REDIS_HOST=redis
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis`
    });

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
    const [terminalLines, setTerminalLines] = useState([
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
    ]);
    const terminalEndRef = useRef(null);

    // Auto-scroll terminal to bottom
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
        }
    }, [terminalLines]);

    // 3. AI Copilot Mentor State
    const [mentorMessages, setMentorMessages] = useState([
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
    ]);
    const [mentorInput, setMentorInput] = useState('');
    const [aiThinking, setAiThinking] = useState(false);
    const [wasmRunning, setWasmRunning] = useState(false);

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

    // Run in-browser test execution
    const runWasmTests = async () => {
        setWasmRunning(true);
        setTerminalLines(prev => [
            ...prev,
            { type: 'system', text: '⚙️ Initializing In-Browser Test Runner...' },
            { type: 'stdout', text: `Testing changes across ${modifiedFiles.length > 0 ? modifiedFiles.join(', ') : 'working tree'}...` }
        ]);

        try {
            // Test both the code and the docker configuration
            const combinedCode = files['paymentController.ts'] + '\n' + files['docker-compose.yml'];
            const result = await wasmExecutionService.executeCode('node', combinedCode);

            setTerminalLines(prev => [
                ...prev,
                ...result.logs.map(l => ({ type: l.type === 'stderr' ? 'stderr' : 'stdout', text: l.text })),
                { 
                    type: result.success ? 'success' : 'stderr', 
                    text: result.success 
                        ? `✓ ALL TESTS PASSED (${result.durationMs}ms) — Ready for Pull Request Review!` 
                        : `✗ TESTS FAILED (${result.durationMs}ms) — Please fix the identified bottlenecks.`
                }
            ]);

            if (result.success) {
                toast?.success?.('In-browser tests passed! You are ready to submit your Pull Request.');
            } else {
                toast?.warning?.('Tests reported issues. Check the terminal output.');
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
            toast?.warning?.('No files modified yet. Make your code changes before submitting!');
            return;
        }

        // Bundle ALL modified files into a clean unified Pull Request package
        const prPayload = modifiedFiles.map(file => {
            return `=== FILE: ${file} ===\n${files[file]}`;
        }).join('\n\n');

        toast?.info?.(`Bundling ${modifiedFiles.length} modified file(s) into Pull Request...`);

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
            if (msg.toLowerCase().includes('pool') || msg.toLowerCase().includes('database')) {
                fallbackHint = "Exactly. A connection pool of 10 means only 10 queries can execute simultaneously. Increasing DB_POOL_SIZE to 50 or 100 allows your API workers to process requests without queuing.";
            } else if (msg.toLowerCase().includes('memory') || msg.toLowerCase().includes('oom')) {
                fallbackHint = "The out of memory error was caused by millions of incoming requests queueing in RAM waiting for a free DB connection. Fixing the pool bottleneck eliminates the queue backlog!";
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

                {/* Breadcrumbs / Active Incident & Modified Files Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        color: '#f87171',
                        fontSize: '0.75rem',
                        fontWeight: 700
                    }}>
                        <AlertTriangle size={13} />
                        <span>ACTIVE INCIDENT: Production Flash Sale 504 Bottleneck</span>
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

            {/* 2. MAIN 4-PANE WORKSPACE BODY */}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontWeight: 800, marginBottom: '0.4rem' }}>
                            <AlertTriangle size={14} />
                            <span>Simulation Mission Brief</span>
                        </div>
                        <p style={{ margin: '0 0 0.4rem 0', color: '#94a3b8', lineHeight: 1.35 }}>
                            <strong style={{ color: '#f8fafc' }}>Scenario:</strong> Flash sale spike caused 504 Gateway Timeouts. Investigate pool exhaustion and adjust connection limits.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: '#cbd5e1' }}>
                            <div>🎯 <strong>Objective:</strong> Fix bottleneck under load.</div>
                            <div>⚡ <strong>Constraint:</strong> Production SLA.</div>
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
        </div>
    );
};
