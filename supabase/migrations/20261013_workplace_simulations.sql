-- ====================================================================
-- CareerOS — Workplace Simulation Sandbox Schema & Seed Data
-- ====================================================================

-- 1. Simulation Tracks Table
CREATE TABLE IF NOT EXISTS public.simulation_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_tagline TEXT NOT NULL,
    role_title TEXT NOT NULL DEFAULT 'Junior Backend Engineer',
    difficulty TEXT DEFAULT 'Intermediate',
    duration_hours INTEGER DEFAULT 4,
    tech_stacks JSONB DEFAULT '["Python (FastAPI)", "Java (Spring Boot)", "Node.js (Express)"]'::jsonb,
    github_templates JSONB DEFAULT '{
        "python": "https://github.com/CareerOS-HQ/finpulse-payments-python",
        "java": "https://github.com/CareerOS-HQ/finpulse-payments-java",
        "node": "https://github.com/CareerOS-HQ/finpulse-payments-node"
    }'::jsonb,
    architecture_overview TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Simulation Tickets Table
CREATE TABLE IF NOT EXISTS public.simulation_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID REFERENCES public.simulation_tracks(id) ON DELETE CASCADE NOT NULL,
    ticket_code TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    business_context TEXT NOT NULL,
    acceptance_criteria JSONB DEFAULT '[]'::jsonb,
    starter_code_python TEXT,
    starter_code_java TEXT,
    starter_code_node TEXT,
    hints JSONB DEFAULT '[]'::jsonb,
    solution_guidelines TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(track_id, ticket_code)
);

CREATE INDEX IF NOT EXISTS idx_simulation_tickets_track ON public.simulation_tickets(track_id, order_index);

-- 3. Simulation User Enrollments
CREATE TABLE IF NOT EXISTS public.simulation_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    track_id UUID REFERENCES public.simulation_tracks(id) ON DELETE CASCADE NOT NULL,
    selected_language TEXT DEFAULT 'python' CHECK (selected_language IN ('python', 'java', 'node')),
    status TEXT DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
    current_ticket_index INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, track_id)
);

-- 4. Simulation Submissions & PR Reviews
CREATE TABLE IF NOT EXISTS public.simulation_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    ticket_id UUID REFERENCES public.simulation_tickets(id) ON DELETE CASCADE NOT NULL,
    submission_mode TEXT DEFAULT 'IN_BROWSER' CHECK (submission_mode IN ('IN_BROWSER', 'GITHUB_PR')),
    language TEXT NOT NULL DEFAULT 'python',
    submitted_code TEXT NOT NULL,
    github_pr_url TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'CHANGES_REQUESTED')),
    score INTEGER DEFAULT 0,
    review_feedback JSONB DEFAULT '{}'::jsonb,
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Simulation Standups
CREATE TABLE IF NOT EXISTS public.simulation_standups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    track_id UUID REFERENCES public.simulation_tracks(id) ON DELETE CASCADE NOT NULL,
    yesterday_work TEXT NOT NULL,
    today_plan TEXT NOT NULL,
    blockers TEXT DEFAULT 'None',
    manager_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.simulation_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_standups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view simulation tracks" ON public.simulation_tracks FOR SELECT USING (true);
CREATE POLICY "Anyone can view simulation tickets" ON public.simulation_tickets FOR SELECT USING (true);

CREATE POLICY "Users view own enrollments" ON public.simulation_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own enrollments" ON public.simulation_enrollments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own submissions" ON public.simulation_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own submissions" ON public.simulation_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own standups" ON public.simulation_standups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own standups" ON public.simulation_standups FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ====================================================================
-- SEED DATA: Track 1 - FinPulse Global (High-Throughput Payment Engine)
-- ====================================================================

DO $$
DECLARE
    track_uuid UUID;
BEGIN
    INSERT INTO public.simulation_tracks (
        track_key,
        title,
        company_name,
        company_tagline,
        role_title,
        difficulty,
        duration_hours,
        tech_stacks,
        github_templates,
        architecture_overview
    ) VALUES (
        'finpulse-payments',
        'FinPulse — High-Throughput Payment Gateway',
        'FinPulse Global',
        'Processing 50,000+ real-time checkout transactions per second across global merchant APIs.',
        'Junior Backend Engineer',
        'Intermediate',
        4,
        '["Python (FastAPI)", "Java (Spring Boot)", "Node.js (Express)"]'::jsonb,
        '{
            "python": "https://github.com/CareerOS-HQ/finpulse-payments-python",
            "java": "https://github.com/CareerOS-HQ/finpulse-payments-java",
            "node": "https://github.com/CareerOS-HQ/finpulse-payments-node"
        }'::jsonb,
        'FinPulse processes transactions across distributed microservices. As our newest junior backend engineer, you join the Core Payments Squad. You are tasked with resolving production defects and implementing critical safety constraints into our checkout pipeline.'
    )
    ON CONFLICT (track_key) DO UPDATE SET title = EXCLUDED.title
    RETURNING id INTO track_uuid;

    -- TICKET 1: FIN-101
    INSERT INTO public.simulation_tickets (
        track_id,
        ticket_code,
        title,
        order_index,
        business_context,
        acceptance_criteria,
        starter_code_python,
        starter_code_java,
        starter_code_node,
        hints,
        solution_guidelines
    ) VALUES (
        track_uuid,
        'FIN-101',
        'Strict ISO-4217 Currency Code & Amount Boundary Validation',
        1,
        'Merchants reported anomalies when clients sent lowercase currency codes ("usd" instead of "USD") and negative or zero amounts. Our payment gateway must strictly validate payloads before dispatching to banking networks.',
        '["Validate currency is exactly 3 uppercase letters matching ISO-4217 (USD, EUR, GBP, CAD, JPY, INR)", "Validate amount is strictly greater than 0 and formatted to at most 2 decimal places (cents)", "Reject invalid payloads with HTTP 422/400 and structured error codes", "Do not alter merchant_id or order_id validation"]'::jsonb,
        'from fastapi import FastAPI, HTTPException, status
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
    # 3. Raise HTTPException(status_code=422, detail="...") on failure
    
    return {"status": "VALIDATED", "order_id": payload.order_id}',
        'package com.finpulse.payments.controller;

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
        // 3. Return 422 Unprocessable Entity with error message on failure
        
        return ResponseEntity.ok().body("{\"status\": \"VALIDATED\"}");
    }
}',
        'const express = require("express");
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

module.exports = router;',
        '["Use a Set for O(1) currency membership lookup.", "For decimal precision, check that round(amount, 2) == amount or use regex /\\.\\d{1,2}$/.", "Ensure amount > 0 (strictly positive)."]'::jsonb,
        'Reject negative numbers, zero, lowercase currency codes, and amounts with more than 2 decimal digits.'
    )
    ON CONFLICT (track_id, ticket_code) DO NOTHING;

    -- TICKET 2: FIN-102
    INSERT INTO public.simulation_tickets (
        track_id,
        ticket_code,
        title,
        order_index,
        business_context,
        acceptance_criteria,
        starter_code_python,
        starter_code_java,
        starter_code_node,
        hints,
        solution_guidelines
    ) VALUES (
        track_uuid,
        'FIN-102',
        'Distributed Idempotency Key Lock (Race Condition Prevention)',
        2,
        'When network latency is high, consumers frequently spam the "Pay" button twice within 200ms. Without idempotency protection, two concurrent requests deduct balances twice. We must implement an atomic idempotency lock.',
        '["Extract the `Idempotency-Key` header from the incoming request", "Acquire a distributed lock with TTL (e.g. 60 seconds) before processing payment", "If key is already locked or completed, return HTTP 409 Conflict or cached response", "Always release or update the lock in a try...finally block", "Simulate charge deduction only once per key"]'::jsonb,
        'from fastapi import FastAPI, Header, HTTPException, status
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
    
    # Simulated payment processing delay
    await asyncio.sleep(0.05)
    return {"status": "SUCCESS", "amount": charge.amount}',
        'package com.finpulse.payments.controller;

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
        
        return ResponseEntity.ok("{\"status\": \"SUCCESS\"}");
    }
}',
        'const express = require("express");
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

module.exports = router;',
        '["In Python, use a dictionary check or async lock.", "In Java, ConcurrentHashMap.putIfAbsent returns null if the key was new.", "In Node.js, Map.has() and Map.set().", "Always use try-finally so failures don not leave deadlocks."]'::jsonb,
        'Check for atomic insertion, handling 409 Conflict on duplicate requests, and proper try/finally cleanup.'
    )
    ON CONFLICT (track_id, ticket_code) DO NOTHING;

    -- TICKET 3: FIN-103
    INSERT INTO public.simulation_tickets (
        track_id,
        ticket_code,
        title,
        order_index,
        business_context,
        acceptance_criteria,
        starter_code_python,
        starter_code_java,
        starter_code_node,
        hints,
        solution_guidelines
    ) VALUES (
        track_uuid,
        'FIN-103',
        'Structured Error Middleware & Security Audit Logging',
        3,
        'Uncaught exceptions currently leak raw Python/Java/Node stack traces to API clients, exposing internal database credentials and table schemas. We need a global error middleware that sanitizes outputs and logs structured audit events.',
        '["Catch all unhandled exceptions globally in middleware", "Sanitize response so internal stack traces and database errors are never exposed", "Return a consistent RFC-7807 structured JSON error format: { error_code, message, timestamp, request_id }", "Mask sensitive account_number and cvv fields before logging", "Return HTTP 500 with a generic message for unexpected server errors"]'::jsonb,
        'from fastapi import FastAPI, Request, status
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
    return response',
        'package com.finpulse.payments.middleware;

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
}',
        'const express = require("express");
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

module.exports = errorSanitizerMiddleware;',
        '["Do not send err.stack or ex.printStackTrace() to the HTTP client.", "Generate a unique request_id (UUID) so developers can cross-reference server logs without exposing internal state.", "Use regex or key masking to scrub sensitive card / CVV data."]'::jsonb,
        'Verify that internal stack traces are hidden, request_id is generated, and response format is consistent.'
    )
    ON CONFLICT (track_id, ticket_code) DO NOTHING;

END $$;
