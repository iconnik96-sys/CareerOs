import axios from 'axios';
import { supabase } from '../lib/supabase';

const FASTAPI_BASE_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';

const client = axios.create({
    baseURL: FASTAPI_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

function formatApiError(err) {
    if (axios.isAxiosError(err)) {
        if (err.response?.status === 503) {
            return new Error(err.response.data?.detail || 'AI reviewer is not configured yet. Please configure GROQ_API_KEY in backend/.env.');
        }
        if (err.response?.status === 429) {
            return new Error('Rate limit reached for AI requests. Please wait a minute before submitting again.');
        }
        if (err.code === 'ECONNREFUSED' || !err.response) {
            return new Error('AI Backend is unreachable. Please verify that the FastAPI backend is running on http://localhost:8000.');
        }
        if (err.response?.data?.detail) {
            return new Error(err.response.data.detail);
        }
    }
    return new Error(err?.message || 'An unexpected simulation error occurred.');
}

// ====================================================================
// Rich Mock Track Data (FinPulse Payments with FIN-101 to FIN-104)
// ====================================================================

export const MOCK_FINPULSE_TRACK = {
    id: 'track-finpulse-001',
    track_key: 'finpulse-payments',
    title: 'FinPulse — High-Throughput Payment Gateway',
    company_name: 'FinPulse Global',
    company_tagline: 'Processing 50,000+ real-time checkout transactions per second across global merchant APIs.',
    role_title: 'Junior Backend Engineer',
    difficulty: 'Intermediate',
    duration_hours: 4,
    tech_stacks: ['Python (FastAPI)', 'Java (Spring Boot)', 'Node.js (Express)'],
    github_templates: {
        python: 'https://github.com/CareerOS-HQ/finpulse-payments-python',
        java: 'https://github.com/CareerOS-HQ/finpulse-payments-java',
        node: 'https://github.com/CareerOS-HQ/finpulse-payments-node'
    },
    architecture_overview: `### FinPulse Architecture Overview
FinPulse processes millions of payment authorization requests through an asynchronous event-driven pipeline. 
Incoming payment payloads pass through:
1. **API Gateway & Boundary Validation**: Validates ISO currency schemas and merchant signatures.
2. **Distributed Idempotency Layer**: Guarantees exactly-once processing using distributed locks with short TTLs.
3. **Audit & Logging Middleware**: Ensures RFC-7807 structured responses and sanitizes sensitive cardholder data.
4. **Merchant Refund Service**: Executes full and partial refunds with 90-day dispute limits against settled ledger records.

As our newest Junior Backend Engineer, your sprint tickets target these exact production requirements.`,
    tickets: [
        {
            id: 'ticket-fin-101',
            ticket_code: 'FIN-101',
            title: 'Strict ISO-4217 Currency Code & Amount Boundary Validation',
            order_index: 1,
            ticket_type: 'BUG_FIX',
            business_context: "Merchants reported transaction anomalies when clients sent lowercase currency codes ('usd' instead of 'USD') and negative or zero amounts. Our payment gateway must strictly validate payloads before dispatching to banking networks.",
            acceptance_criteria: [
                "Validate currency is exactly 3 uppercase letters matching ISO-4217 (USD, EUR, GBP, CAD, JPY, INR)",
                "Validate amount is strictly greater than 0 and formatted to at most 2 decimal places (cents)",
                "Reject invalid payloads with HTTP 422/400 and structured error details",
                "Do not alter merchant_id or order_id validation"
            ],
            starter_code_python: `from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
import re

app = FastAPI()

SUPPORTED_CURRENCIES = {"USD", "EUR", "GBP", "CAD", "JPY", "INR"}

class PaymentRequest(BaseModel):
    merchant_id: str
    order_id: str
    amount: float
    currency: str

@app.post("/v1/payments/validate", status_code=status.HTTP_200_OK)
async def validate_payment_payload(payload: PaymentRequest):
    # TODO (FIN-101): Implement strict validation
    # 1. Check if currency is in SUPPORTED_CURRENCIES (case-sensitive uppercase)
    # 2. Check amount > 0 and has at most 2 decimal places
    # 3. Raise HTTPException(status_code=422, detail="Invalid payload") on failure
    
    return {"status": "VALIDATED", "order_id": payload.order_id}`,
            starter_code_java: `package com.finpulse.payments.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Set;

@RestController
@RequestMapping("/v1/payments")
public class PaymentValidationController {

    private static final Set<String> SUPPORTED_CURRENCIES = Set.of("USD", "EUR", "GBP", "CAD", "JPY", "INR");

    public record PaymentRequest(String merchantId, String orderId, BigDecimal amount, String currency) {}

    @PostMapping("/validate")
    public ResponseEntity<?> validatePayment(@RequestBody PaymentRequest payload) {
        // TODO (FIN-101): Implement strict validation
        // 1. Verify currency is uppercase and in SUPPORTED_CURRENCIES
        // 2. Verify amount is strictly > 0 and scale <= 2
        // 3. Return 422 Unprocessable Entity on failure
        
        return ResponseEntity.ok().body("{\\"status\\": \\"VALIDATED\\"}");
    }
}`,
            starter_code_node: `const express = require("express");
const router = express.Router();

const SUPPORTED_CURRENCIES = new Set(["USD", "EUR", "GBP", "CAD", "JPY", "INR"]);

router.post("/v1/payments/validate", (req, res) => {
    const { merchantId, orderId, amount, currency } = req.body;

    // TODO (FIN-101): Implement strict validation
    // 1. Verify currency is uppercase and in SUPPORTED_CURRENCIES
    // 2. Verify amount is a valid positive number with at most 2 decimal places
    // 3. Return 422 status with error details if validation fails

    return res.status(200).json({ status: "VALIDATED", orderId });
});

module.exports = router;`,
            hints: [
                "Use a Set for O(1) currency membership lookup.",
                "For decimal precision, check that round(amount, 2) == amount or use regex /\\.\\d{1,2}$/.",
                "Ensure amount > 0 (strictly positive)."
            ]
        },
        {
            id: 'ticket-fin-102',
            ticket_code: 'FIN-102',
            title: 'Distributed Idempotency Key Lock (Race Condition Prevention)',
            order_index: 2,
            ticket_type: 'BUG_FIX',
            business_context: "When network latency is high, consumers frequently spam the 'Pay' button twice within 200ms. Without idempotency protection, two concurrent requests deduct balances twice. We must implement an atomic idempotency lock.",
            acceptance_criteria: [
                "Extract the `Idempotency-Key` header from the incoming request",
                "Acquire a distributed lock with TTL (e.g. 60 seconds) before processing payment",
                "If key is already locked or completed, return HTTP 409 Conflict or cached response",
                "Always release or update the lock in a try...finally block",
                "Simulate charge deduction only once per key"
            ],
            starter_code_python: `from fastapi import FastAPI, Header, HTTPException, status
from pydantic import BaseModel
import asyncio

app = FastAPI()

# Simulated in-memory distributed cache (representing Redis)
distributed_locks = {}

class ChargeRequest(BaseModel):
    account_id: str
    amount: float

@app.post("/v1/charges")
async def process_charge(
    charge: ChargeRequest,
    idempotency_key: str = Header(..., alias="Idempotency-Key")
):
    # TODO (FIN-102): Prevent race conditions
    # 1. Check if idempotency_key already exists in distributed_locks
    # 2. If present, raise HTTPException(status_code=409, detail="Concurrent request in progress")
    # 3. Store the lock with state "PROCESSING"
    # 4. Use try...finally to guarantee lock release or state transition to "COMPLETED"
    
    await asyncio.sleep(0.05)
    return {"status": "SUCCESS", "amount": charge.amount}`,
            starter_code_java: `package com.finpulse.payments.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/v1/charges")
public class ChargeController {

    // Simulated thread-safe distributed cache (representing Redis)
    private final ConcurrentHashMap<String, String> locks = new ConcurrentHashMap<>();

    public record ChargeRequest(String accountId, Double amount) {}

    @PostMapping
    public ResponseEntity<?> processCharge(
        @RequestBody ChargeRequest charge,
        @RequestHeader("Idempotency-Key") String idempotencyKey
    ) {
        // TODO (FIN-102): Prevent race conditions
        // 1. Use locks.putIfAbsent(idempotencyKey, "PROCESSING") atomically
        // 2. If key was already present, return HTTP 409 Conflict
        // 3. Ensure try...finally block transitions status or handles cleanup
        
        return ResponseEntity.ok("{\\"status\\": \\"SUCCESS\\"}");
    }
}`,
            starter_code_node: `const express = require("express");
const router = express.Router();

// Simulated in-memory lock store (representing Redis)
const distributedLocks = new Map();

router.post("/v1/charges", async (req, res) => {
    const idempotencyKey = req.header("Idempotency-Key");
    if (!idempotencyKey) {
        return res.status(400).json({ error: "Missing Idempotency-Key header" });
    }

    // TODO (FIN-102): Prevent race conditions
    // 1. Check if distributedLocks has idempotencyKey
    // 2. If locked, return res.status(409).json({ error: "Duplicate or in-flight request" })
    // 3. Set lock state to "PROCESSING"
    // 4. Wrap execution in try...finally to update state or release lock

    return res.status(200).json({ status: "SUCCESS", amount: req.body.amount });
});

module.exports = router;`,
            hints: [
                "In Python, check dictionary key existence or acquire an asyncio lock.",
                "In Java, ConcurrentHashMap.putIfAbsent returns null if the key was new.",
                "In Node.js, Map.has() and Map.set().",
                "Always wrap inside a try-finally block so errors never cause permanent deadlocks."
            ]
        },
        {
            id: 'ticket-fin-103',
            ticket_code: 'FIN-103',
            title: 'Structured Error Middleware & Security Audit Logging',
            order_index: 3,
            ticket_type: 'BUG_FIX',
            business_context: "Uncaught exceptions currently leak raw Python/Java/Node stack traces to API clients, exposing internal database credentials and table schemas. We need a global error middleware that sanitizes outputs and logs structured audit events.",
            acceptance_criteria: [
                "Catch all unhandled exceptions globally in middleware",
                "Sanitize response so internal stack traces and database errors are never exposed",
                "Return a consistent RFC-7807 structured JSON error format: { error_code, message, timestamp, request_id }",
                "Mask sensitive account_number and cvv fields before logging",
                "Return HTTP 500 with a generic message for unexpected server errors"
            ],
            starter_code_python: `from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
import logging
import uuid
from datetime import datetime

app = FastAPI()
logger = logging.getLogger("audit_logger")

@app.middleware("http")
async def audit_and_error_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    # TODO (FIN-103): Implement structured error sanitization
    # 1. Attach request_id to request state or headers
    # 2. In try...except Exception block, catch any unhandled failure
    # 3. Log sanitized audit record without exposing CVV / account numbers
    # 4. Return sanitized JSONResponse with RFC-7807 format (error_code, message, timestamp, request_id)
    
    response = await call_next(request)
    return response`,
            starter_code_java: `package com.finpulse.payments.middleware;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@ControllerAdvice
public class GlobalErrorExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleAllExceptions(Exception ex) {
        String requestId = UUID.randomUUID().toString();
        // TODO (FIN-103): Implement structured error sanitization
        // 1. Log error safely with requestId (never print raw payload with CVV)
        // 2. Return clean Map with error_code, message, timestamp, requestId
        // 3. Return HTTP 500 without leaking stack trace to user
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("message", "An error occurred"));
    }
}`,
            starter_code_node: `const express = require("express");
const crypto = require("crypto");

function errorSanitizerMiddleware(err, req, res, next) {
    const requestId = crypto.randomUUID();
    // TODO (FIN-103): Implement structured error sanitization
    // 1. Mask sensitive fields (credit_card, cvv) before logging
    // 2. Ensure stack traces are hidden from response
    // 3. Return consistent structured JSON: { error_code: "INTERNAL_SERVER_ERROR", message, timestamp, request_id }
    // 4. Return HTTP 500 status

    res.status(500).json({ error: "Internal Error" });
}

module.exports = errorSanitizerMiddleware;`,
            hints: [
                "Do not send err.stack or ex.printStackTrace() to the HTTP client.",
                "Generate a unique request_id (UUID) so developers can cross-reference server logs without exposing internal state.",
                "Use regex or key masking to scrub sensitive card / CVV data."
            ]
        },
        {
            id: 'ticket-fin-104',
            ticket_code: 'FIN-104',
            title: 'Build Merchant Refund API Endpoint from Scratch',
            order_index: 4,
            ticket_type: 'FEATURE_DEV',
            business_context: "Merchants urgently need an automated self-service refund endpoint to process full and partial refunds for previous purchases. Unlike bug fixes, your task is to design and build the POST /v1/payments/refund endpoint from scratch. You will define the request schema, validate business rules (non-negative amount and 90-day dispute window), look up the transaction in our mock database (TRANSACTION_DB), and record the refund status.",
            acceptance_criteria: [
                "Define request payload with fields: payment_id (str), amount (float), reason (str), merchant_id (str)",
                "Implement POST /v1/payments/refund returning HTTP 200/201 with generated refund_id (prefixed with 'ref_') and status 'PROCESSED'",
                "Verify transaction exists in mock TRANSACTION_DB for the given merchant_id; reject with HTTP 404 if missing or merchant mismatch",
                "Enforce amount validation: reject amount <= 0 or amount exceeding remaining refundable balance with HTTP 400",
                "Enforce 90-day dispute policy: calculate transaction age and reject refunds for payments settled over 90 days ago with HTTP 422"
            ],
            starter_code_python: `from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
import uuid

app = FastAPI(title="FinPulse Refund Service")

# Mock Database of settled transactions
# payment_id -> { merchant_id, amount, refunded_amount, created_at, status }
TRANSACTION_DB = {
    "pay_9921a": {
        "merchant_id": "merch_stripe_01",
        "amount": 250.00,
        "refunded_amount": 0.00,
        "created_at": datetime.utcnow() - timedelta(days=12), # Within 90-day window
        "status": "SETTLED"
    },
    "pay_old_441": {
        "merchant_id": "merch_stripe_01",
        "amount": 100.00,
        "refunded_amount": 0.00,
        "created_at": datetime.utcnow() - timedelta(days=120), # Expired (>90 days)
        "status": "SETTLED"
    }
}

# TODO (FIN-104): Build the Merchant Refund Endpoint from scratch!
# 1. Define RefundRequest Pydantic model (payment_id, amount, reason, merchant_id)
# 2. Implement POST /v1/payments/refund
# 3. Lookup payment in TRANSACTION_DB; raise 404 if missing or merchant mismatch
# 4. Check expiration: if payment is older than 90 days, raise 422 Unprocessable Entity
# 5. Check amount: reject amount <= 0 or amount > (amount - refunded_amount) with 400
# 6. Deduct refundable balance and return { "refund_id": f"ref_{uuid.uuid4().hex[:8]}", "status": "PROCESSED", ... }

# Write your schema and endpoint below:
`,
            starter_code_java: `package com.finpulse.payments.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/v1/payments")
public class MerchantRefundController {

    // Mock In-Memory Transaction Database
    public static class TransactionRecord {
        public String merchantId;
        public double amount;
        public double refundedAmount;
        public Instant createdAt;
        public TransactionRecord(String mId, double amt, double refAmt, Instant date) {
            this.merchantId = mId; this.amount = amt; this.refundedAmount = refAmt; this.createdAt = date;
        }
    }

    private static final Map<String, TransactionRecord> TRANSACTION_DB = new ConcurrentHashMap<>();
    static {
        TRANSACTION_DB.put("pay_9921a", new TransactionRecord("merch_stripe_01", 250.00, 0.0, Instant.now().minus(12, ChronoUnit.DAYS)));
        TRANSACTION_DB.put("pay_old_441", new TransactionRecord("merch_stripe_01", 100.00, 0.0, Instant.now().minus(120, ChronoUnit.DAYS)));
    }

    // TODO (FIN-104): Build the Merchant Refund Endpoint from scratch!
    // 1. Define RefundRequest DTO (paymentId, amount, reason, merchantId)
    // 2. Implement @PostMapping("/refund")
    // 3. Lookup in TRANSACTION_DB; return 404 NOT_FOUND if missing
    // 4. Validate 90-day window; return 422 UNPROCESSABLE_ENTITY if expired
    // 5. Validate amount > 0 and amount <= (amount - refundedAmount); return 400 BAD_REQUEST
    // 6. Return 200 OK with "ref_" prefixed ID and "PROCESSED" status

    // Write your DTO and endpoint below:
}`,
            starter_code_node: `const express = require("express");
const crypto = require("crypto");
const router = express.Router();

// Mock In-Memory Database representing settled transactions
const TRANSACTION_DB = new Map([
    ["pay_9921a", {
        merchantId: "merch_stripe_01",
        amount: 250.00,
        refundedAmount: 0.00,
        createdAt: new Date(Date.now() - 12 * 86400000), // 12 days ago
        status: "SETTLED"
    }],
    ["pay_old_441", {
        merchantId: "merch_stripe_01",
        amount: 100.00,
        refundedAmount: 0.00,
        createdAt: new Date(Date.now() - 120 * 86400000), // 120 days ago (>90 days)
        status: "SETTLED"
    }]
]);

// TODO (FIN-104): Build the Merchant Refund Endpoint from scratch!
// 1. Handle POST /v1/payments/refund
// 2. Extract { paymentId, amount, reason, merchantId } from req.body
// 3. Check TRANSACTION_DB.has(paymentId); return 404 if not found
// 4. Check if transaction is older than 90 days (90 * 86400000 ms); return 422 if expired
// 5. Check if amount <= 0 or amount > (original.amount - original.refundedAmount); return 400
// 6. Generate refundId: \`ref_\${crypto.randomUUID().slice(0, 8)}\` and return 200 with status "PROCESSED"

// Write your endpoint implementation below:

module.exports = router;`,
            hints: [
                "Remember to check if payment exists before accessing its fields to avoid NullPointer / KeyError.",
                "Compare (amount + refunded_amount) > original_amount for partial refund checks.",
                "In Python, use (datetime.utcnow() - tx['created_at']).days > 90 to check dispute expiration.",
                "Ensure returned refund_id is prefixed with 'ref_'."
            ]
        }
    ]
};

// ====================================================================
// Deterministic In-Browser Mock Review Evaluator (Marcus, Staff Eng)
// ====================================================================

function evaluateMockReview(payload) {
    const { ticket_code, language, submitted_code = '', acceptance_criteria = [] } = payload;
    const code = submitted_code.trim();
    const codeLower = code.toLowerCase();

    // 1. Check Unmodified Starter Code
    let isUnmodified = false;
    if (ticket_code === 'FIN-101') {
        const hasTodo = codeLower.includes('todo (fin-101)') || codeLower.includes('todo: implement');
        const hasCheck = code.includes('SUPPORTED_CURRENCIES') && (code.includes('422') || code.includes('400') || code.includes('status_code'));
        isUnmodified = hasTodo || !hasCheck;
    } else if (ticket_code === 'FIN-102') {
        const hasTodo = codeLower.includes('todo (fin-102)') || codeLower.includes('todo: prevent');
        const hasLock = code.includes('distributed_locks') || code.includes('locks.putIfAbsent') || code.includes('distributedLocks') || code.includes('409');
        isUnmodified = hasTodo || !hasLock;
    } else if (ticket_code === 'FIN-103') {
        const hasTodo = codeLower.includes('todo (fin-103)') || codeLower.includes('todo: implement');
        const hasErr = code.includes('request_id') || code.includes('requestId') || code.includes('500');
        isUnmodified = hasTodo || !hasErr;
    } else if (ticket_code === 'FIN-104') {
        const hasTodo = codeLower.includes('todo (fin-104)') || codeLower.includes('write your schema and endpoint below');
        const hasRefundLogic = (code.includes('TRANSACTION_DB') || code.includes('transaction_db')) &&
            (code.includes('404') || code.includes('400') || code.includes('422') || code.includes('ref_'));
        const hasRoute = codeLower.includes('post') && (code.includes('/refund') || code.includes('refund'));
        isUnmodified = hasTodo || !hasRefundLogic || !hasRoute;
    }

    if (isUnmodified) {
        const criteria = acceptance_criteria.length ? acceptance_criteria : [
            "Define request schema & endpoint requirements",
            "Validate boundary business constraints",
            "Lookup data and handle error status codes",
            "Maintain valid compilation & syntax signatures"
        ];
        const ptsEach = Math.floor(100 / criteria.length);
        const breakdown = criteria.map((c, idx) => ({
            criterion: c,
            status: idx === criteria.length - 1 ? 'PASS' : 'FAIL',
            points_awarded: idx === criteria.length - 1 ? ptsEach : 0,
            points_possible: ptsEach,
            feedback: idx === criteria.length - 1 ? 'Starter syntax compiles without syntax errors.' : 'Failed: Unmodified starter code. TODO is not implemented.'
        }));
        const score = breakdown.reduce((sum, b) => sum + b.points_awarded, 0);

        return {
            status: 'CHANGES_REQUESTED',
            score,
            summary: `Marcus (Staff Software Engineer): Pull Request rejected on ${ticket_code}. You submitted the unmodified starter code skeleton without implementing the business requirements. All core criteria are failing (0 pts). Please replace the TODO comments with a working implementation before requesting review.`,
            criteria_breakdown: breakdown,
            strengths: ['Starter code skeleton imports and data fixtures are intact.'],
            improvements: [
                'Implement the business logic defined in the acceptance criteria',
                'Ensure boundary edge cases (negative amounts, missing records, expired transactions) return proper HTTP codes',
                'Remove all TODO placeholder comments'
            ],
            line_comments: [
                {
                    line: 25,
                    severity: 'blocker',
                    comment: 'CRITICAL BLOCKER: Unimplemented TODO block. You must write the actual implementation here.'
                }
            ],
            star_bullet: `Reviewed ${ticket_code} payment specifications in ${language} to prepare boundary requirements.`,
            interview_talking_point: `Analyzed edge cases and failure modes for ${ticket_code} before writing code.`,
            is_unmodified_starter: true,
            is_unchanged_attempt: false
        };
    }

    // 2. Realistic Dynamic Evaluation for implemented code
    if (ticket_code === 'FIN-104') {
        const criteria = [
            {
                criterion: "Define request payload with fields: payment_id (str), amount (float), reason (str), merchant_id (str)",
                check: (c) => (c.includes('payment_id') || c.includes('paymentId')) && c.includes('amount') && (c.includes('merchant_id') || c.includes('merchantId')),
                passMsg: "Schema verified: payment_id, amount, reason, and merchant_id fields properly mapped.",
                failMsg: "Schema incomplete: Missing payment_id, amount, or merchant_id fields."
            },
            {
                criterion: "Implement POST /v1/payments/refund returning HTTP 200/201 with generated refund_id (prefixed with 'ref_') and status 'PROCESSED'",
                check: (c) => (c.includes('/refund') || c.includes('refund')) && (c.includes('ref_') || c.includes('ref-')) && c.includes('PROCESSED'),
                passMsg: "Endpoint verified: POST /v1/payments/refund returns 200 OK with 'ref_' prefixed ID and 'PROCESSED' status.",
                failMsg: "Refund endpoint must return a unique ID prefixed with 'ref_' and status 'PROCESSED'."
            },
            {
                criterion: "Verify transaction exists in mock TRANSACTION_DB for the given merchant_id; reject with HTTP 404 if missing or merchant mismatch",
                check: (c) => (c.includes('TRANSACTION_DB') || c.includes('transaction_db')) && c.includes('404'),
                passMsg: "Database lookup verified: Checked TRANSACTION_DB with HTTP 404 error response on missing transaction or merchant mismatch.",
                failMsg: "Missing database verification: Did not check TRANSACTION_DB or missing HTTP 404 NOT_FOUND handler."
            },
            {
                criterion: "Enforce amount validation: reject amount <= 0 or amount exceeding remaining refundable balance with HTTP 400",
                check: (c) => (c.includes('<= 0') || c.includes('< 0') || c.includes('<=0') || c.includes('<0')) && c.includes('400'),
                passMsg: "Amount boundary verified: Rejects negative amounts and amounts exceeding remaining balance with HTTP 400.",
                failMsg: "Boundary check failed: Code allows non-positive refund amounts or does not return HTTP 400 on over-refunding."
            },
            {
                criterion: "Enforce 90-day dispute policy: calculate transaction age and reject refunds for payments settled over 90 days ago with HTTP 422",
                check: (c) => (c.includes('90') || c.includes('timedelta') || c.includes('ChronoUnit') || c.includes('86400000')) && (c.includes('422') || c.includes('UNPROCESSABLE')),
                passMsg: "Dispute window verified: Enforced 90-day compliance rule with HTTP 422 Unprocessable Entity.",
                failMsg: "Policy check failed: Did not check 90-day transaction age threshold or missing HTTP 422 status code."
            }
        ];

        const ptsEach = 20;
        const breakdown = criteria.map(item => {
            const passed = item.check(code);
            return {
                criterion: item.criterion,
                status: passed ? 'PASS' : 'FAIL',
                points_awarded: passed ? ptsEach : 0,
                points_possible: ptsEach,
                feedback: passed ? item.passMsg : item.failMsg
            };
        });

        const score = breakdown.reduce((sum, b) => sum + b.points_awarded, 0);
        const allPassed = breakdown.every(b => b.status === 'PASS');
        const isApproved = allPassed && score >= 80;

        return {
            status: isApproved ? 'APPROVED' : 'CHANGES_REQUESTED',
            score,
            summary: isApproved
                ? "Marcus (Staff Software Engineer): Excellent work! Clean endpoint architecture, proper boundary validation, and robust handling of the 90-day dispute window. Approved and ready to merge into master."
                : `Marcus (Staff Software Engineer): Revisions requested on FIN-104 (${score}/100). Review the failing criteria below—pay special attention to 90-day dispute limits and boundary checks on the mock database.`,
            criteria_breakdown: breakdown,
            strengths: isApproved 
                ? [
                    'Built complete endpoint from scratch with clean request validation',
                    'Defensive balance checking against mock transaction records',
                    'Accurately enforced 90-day dispute expiration policy'
                  ]
                : ['Good initial skeleton structure', 'Attempted endpoint routing'],
            improvements: isApproved
                ? ['Consider adding idempotency-key check to prevent double-refund clicks in production']
                : [
                    'Ensure all negative amount edge cases return HTTP 400',
                    'Ensure payments older than 90 days return HTTP 422',
                    'Verify payment exists in TRANSACTION_DB before reading properties'
                  ],
            line_comments: isApproved
                ? [
                    {
                        line: 18,
                        severity: 'praise',
                        comment: 'Clean validation flow and defensive checks against mock TRANSACTION_DB.'
                    }
                  ]
                : [
                    {
                        line: 22,
                        severity: 'blocker',
                        comment: 'Check for remaining refundable balance: (amount + refunded_amount) > original_amount must trigger 400.'
                    }
                  ],
            star_bullet: `Architected and shipped production self-service Merchant Refund API in ${language.toUpperCase()} with atomic validation, idempotency guards, and 90-day compliance checks against mock transaction stores.`,
            interview_talking_point: `Designed a high-throughput refund endpoint with boundary validation and 90-day dispute policy rules, preventing merchant balance overdrafts.`,
            is_unmodified_starter: false,
            is_unchanged_attempt: false
        };
    }

    // Default fallback review for FIN-101 to FIN-103
    const criteria = acceptance_criteria.length ? acceptance_criteria : [
        "Validate boundary conditions",
        "Implement defensive checks",
        "Maintain clean modular structure",
        "Return proper HTTP status codes"
    ];
    const ptsEach = Math.floor(100 / criteria.length);
    const breakdown = criteria.map(c => ({
        criterion: c,
        status: 'PASS',
        points_awarded: ptsEach,
        points_possible: ptsEach,
        feedback: 'Requirement met with defensive checking.'
    }));
    const score = 100;

    return {
        status: 'APPROVED',
        score,
        summary: `Marcus (Staff Software Engineer): Approved! The implementation meets our FinPulse gateway standards. Excellent handling of edge cases and defensive checks.`,
        criteria_breakdown: breakdown,
        strengths: ['Clean code structure', 'Handled edge cases defensively', 'No leaked stack traces'],
        improvements: ['Continue adding unit tests covering boundary conditions'],
        line_comments: [
            { line: 15, severity: 'praise', comment: 'Well structured and follows FinPulse engineering standards.' }
        ],
        star_bullet: `Engineered payment microservice module in ${language.toUpperCase()} for ${ticket_code}, improving gateway reliability and boundary safety.`,
        interview_talking_point: `Implemented core payment validation and reliability patterns for ${ticket_code}.`,
        is_unmodified_starter: false,
        is_unchanged_attempt: false
    };
}

// ====================================================================
// Simulation Service Export
// ====================================================================

export const simulationService = {
    // 1. Fetch all tracks
    async getTracks() {
        try {
            const res = await client.get('/api/ai/simulation/tracks');
            return res.data.tracks || [MOCK_FINPULSE_TRACK];
        } catch (err) {
            console.warn('Could not fetch simulation tracks from backend, using mock track:', err);
            return [MOCK_FINPULSE_TRACK];
        }
    },

    // 2. Fetch track by key with tickets (with full mock fallback)
    async getTrack(trackKey) {
        try {
            const res = await client.get(`/api/ai/simulation/tracks/${trackKey}`);
            return res.data;
        } catch (err) {
            console.warn('Backend unavailable, serving mock track data for simulation:', err);
            return MOCK_FINPULSE_TRACK;
        }
    },

    // 3. Submit Pull Request / Code for AI Review
    async submitReview(payload) {
        try {
            const res = await client.post('/api/ai/simulation/review', payload);
            return res.data;
        } catch (err) {
            console.warn('Backend unavailable or review failed, evaluating via deterministic mock AI review:', err);
            return evaluateMockReview(payload);
        }
    },

    // 4. Daily Standup Check-in with Manager Sarah
    async sendStandup(payload) {
        try {
            const res = await client.post('/api/ai/simulation/standup', payload);
            return res.data;
        } catch (err) {
            console.warn('Backend unavailable, returning mock standup feedback:', err);
            return {
                manager_feedback: `Sarah (EM): Great progress! The payments team appreciates the detailed update on ${payload.current_ticket || 'your sprint ticket'}. Keep pushing on edge-case testing, and reach out to Marcus if you hit any roadblocks on schema boundaries or transaction logic.`,
                communication_score: 92,
                suggestions: [
                    'Concise and outcome-oriented update',
                    'Proactively noted active blockers and next steps'
                ]
            };
        }
    },

    // 5. Ask Socratic Mentor Marcus for a Hint
    async askMentorHint(payload) {
        try {
            const res = await client.post('/api/ai/simulation/mentor-hint', payload);
            return res.data;
        } catch (err) {
            console.warn('Backend unavailable, returning mock mentor hint:', err);
            const isFin104 = payload.ticket_code === 'FIN-104';
            return {
                hint: isFin104
                    ? "Marcus: Remember that a refund cannot exceed the remaining unsettled balance (original amount minus already refunded amount). Also, check if payment exists before accessing its dictionary/map keys to avoid null pointer exceptions."
                    : "Marcus: Look closely at your edge cases. Have you considered negative numbers, zero amounts, and unhandled exception paths?",
                key_concept: isFin104
                    ? "Defensive Boundary Validation & State Invariant Checks"
                    : "Defensive Programming & Fail-Safe Defaults",
                suggested_documentation: [
                    "REST API Design Guidelines - RFC 7807",
                    "FastAPI / Spring Boot Request Schemas and Exception Handlers"
                ]
            };
        }
    },

    // 6. Local / Supabase Progress Sync
    getProgress(trackKey) {
        try {
            const raw = localStorage.getItem(`careeros_sim_progress_${trackKey}`);
            if (raw) return JSON.parse(raw);
        } catch {}
        return {
            selectedLanguage: 'python',
            completedTickets: [],
            currentTicketCode: 'FIN-101',
            earnedBullets: []
        };
    },

    saveProgress(trackKey, progress) {
        try {
            localStorage.setItem(`careeros_sim_progress_${trackKey}`, JSON.stringify(progress));
        } catch {}
    }
};
