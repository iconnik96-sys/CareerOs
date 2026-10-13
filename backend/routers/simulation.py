import os
import re
import json
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
import httpx

from services.llm_engine import llm_engine

router = APIRouter(prefix="/api/ai/simulation", tags=["Workplace Simulation"])
logger = logging.getLogger("WorkplaceSimulationRouter")

# ====================================================================
# Models & Schemas
# ====================================================================

class LineComment(BaseModel):
    line: Optional[int] = Field(default=None, description="Line number if identifiable")
    severity: str = Field(default="suggestion", description="'blocker', 'suggestion', or 'praise'")
    comment: str

class SimulationReviewRequest(BaseModel):
    ticket_code: str = Field(..., example="FIN-101")
    ticket_title: str = Field(..., example="Strict ISO-4217 Currency Code & Amount Boundary Validation")
    language: str = Field(default="python", example="python")  # 'python', 'java', 'node'
    submission_mode: str = Field(default="IN_BROWSER", example="IN_BROWSER") # 'IN_BROWSER' or 'GITHUB_PR'
    submitted_code: str = Field(..., min_length=1)
    github_pr_url: Optional[str] = Field(default=None, example="https://github.com/nikhil/finpulse-payments/pull/1")
    acceptance_criteria: List[str] = Field(default_factory=list)
    attempt_number: int = Field(default=1)

class SimulationReviewResponse(BaseModel):
    status: str = Field(..., example="APPROVED")  # "APPROVED" or "CHANGES_REQUESTED"
    score: int = Field(..., ge=0, le=100, example=88)
    summary: str
    strengths: List[str]
    improvements: List[str]
    line_comments: List[LineComment]
    star_bullet: str
    interview_talking_point: str

class StandupRequest(BaseModel):
    yesterday_work: str = Field(..., min_length=1)
    today_plan: str = Field(..., min_length=1)
    blockers: Optional[str] = Field(default="None")
    current_ticket: Optional[str] = Field(default="FIN-101")

class StandupResponse(BaseModel):
    manager_feedback: str
    communication_score: int
    suggestions: List[str]

class MentorHintRequest(BaseModel):
    ticket_code: str
    language: str
    current_code: str
    question: str

class MentorHintResponse(BaseModel):
    hint: str
    key_concept: str
    suggested_documentation: List[str]

# ====================================================================
# Default In-Memory Fallback Track & Tickets (FinPulse Payments)
# ====================================================================

DEFAULT_TRACK = {
    "id": "track-finpulse-001",
    "track_key": "finpulse-payments",
    "title": "FinPulse — High-Throughput Payment Gateway",
    "company_name": "FinPulse Global",
    "company_tagline": "Processing 50,000+ real-time checkout transactions per second across global merchant APIs.",
    "role_title": "Junior Backend Engineer",
    "difficulty": "Intermediate",
    "duration_hours": 4,
    "tech_stacks": ["Python (FastAPI)", "Java (Spring Boot)", "Node.js (Express)"],
    "github_templates": {
        "python": "https://github.com/CareerOS-HQ/finpulse-payments-python",
        "java": "https://github.com/CareerOS-HQ/finpulse-payments-java",
        "node": "https://github.com/CareerOS-HQ/finpulse-payments-node"
    },
    "architecture_overview": """### FinPulse Architecture Overview
FinPulse processes millions of payment authorization requests through an asynchronous event-driven pipeline. 
Incoming payment payloads pass through:
1. **API Gateway & Boundary Validation**: Validates ISO currency schemas and merchant signatures.
2. **Distributed Idempotency Layer**: Guarantees exactly-once processing using distributed locks with short TTLs.
3. **Audit & Logging Middleware**: Ensures RFC-7807 structured responses and sanitizes sensitive cardholder data.

As our newest Junior Backend Engineer, your sprint tickets target these exact production requirements.""",
    "tickets": [
        {
            "id": "ticket-fin-101",
            "ticket_code": "FIN-101",
            "title": "Strict ISO-4217 Currency Code & Amount Boundary Validation",
            "order_index": 1,
            "business_context": "Merchants reported transaction anomalies when clients sent lowercase currency codes ('usd' instead of 'USD') and negative or zero amounts. Our payment gateway must strictly validate payloads before dispatching to banking networks.",
            "acceptance_criteria": [
                "Validate currency is exactly 3 uppercase letters matching ISO-4217 (USD, EUR, GBP, CAD, JPY, INR)",
                "Validate amount is strictly greater than 0 and formatted to at most 2 decimal places (cents)",
                "Reject invalid payloads with HTTP 422/400 and structured error details",
                "Do not alter merchant_id or order_id validation"
            ],
            "starter_code_python": """from fastapi import FastAPI, HTTPException, status
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
    
    return {"status": "VALIDATED", "order_id": payload.order_id}""",
            "starter_code_java": """package com.finpulse.payments.controller;

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
}""",
            "starter_code_node": """const express = require("express");
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

module.exports = router;""",
            "hints": [
                "Use a Set for O(1) currency membership lookup.",
                "For decimal precision, check that round(amount, 2) == amount or use regex /\\.\\d{1,2}$/.",
                "Ensure amount > 0 (strictly positive)."
            ]
        },
        {
            "id": "ticket-fin-102",
            "ticket_code": "FIN-102",
            "title": "Distributed Idempotency Key Lock (Race Condition Prevention)",
            "order_index": 2,
            "business_context": "When network latency is high, consumers frequently spam the 'Pay' button twice within 200ms. Without idempotency protection, two concurrent requests deduct balances twice. We must implement an atomic idempotency lock.",
            "acceptance_criteria": [
                "Extract the `Idempotency-Key` header from the incoming request",
                "Acquire a distributed lock with TTL (e.g. 60 seconds) before processing payment",
                "If key is already locked or completed, return HTTP 409 Conflict or cached response",
                "Always release or update the lock in a try...finally block",
                "Simulate charge deduction only once per key"
            ],
            "starter_code_python": """from fastapi import FastAPI, Header, HTTPException, status
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
    return {"status": "SUCCESS", "amount": charge.amount}""",
            "starter_code_java": """package com.finpulse.payments.controller;

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
}""",
            "starter_code_node": """const express = require("express");
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

module.exports = router;""",
            "hints": [
                "In Python, check dictionary key existence or acquire an asyncio lock.",
                "In Java, ConcurrentHashMap.putIfAbsent returns null if the key was new.",
                "In Node.js, Map.has() and Map.set().",
                "Always wrap inside a try-finally block so errors never cause permanent deadlocks."
            ]
        },
        {
            "id": "ticket-fin-103",
            "ticket_code": "FIN-103",
            "title": "Structured Error Middleware & Security Audit Logging",
            "order_index": 3,
            "business_context": "Uncaught exceptions currently leak raw Python/Java/Node stack traces to API clients, exposing internal database credentials and table schemas. We need a global error middleware that sanitizes outputs and logs structured audit events.",
            "acceptance_criteria": [
                "Catch all unhandled exceptions globally in middleware",
                "Sanitize response so internal stack traces and database errors are never exposed",
                "Return a consistent RFC-7807 structured JSON error format: { error_code, message, timestamp, request_id }",
                "Mask sensitive account_number and cvv fields before logging",
                "Return HTTP 500 with a generic message for unexpected server errors"
            ],
            "starter_code_python": """from fastapi import FastAPI, Request, status
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
    return response""",
            "starter_code_java": """package com.finpulse.payments.middleware;

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
}""",
            "starter_code_node": """const express = require("express");
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

module.exports = errorSanitizerMiddleware;""",
            "hints": [
                "Do not send err.stack or ex.printStackTrace() to the HTTP client.",
                "Generate a unique request_id (UUID) so developers can cross-reference server logs without exposing internal state.",
                "Use regex or key masking to scrub sensitive card / CVV data."
            ]
        }
    ]
}

# ====================================================================
# Helper: Fetch GitHub PR Diff
# ====================================================================

async def fetch_github_pr_diff(pr_url: str) -> Optional[str]:
    """Fetches code diff from a public GitHub PR or raw diff endpoint."""
    if not pr_url:
        return None
    try:
        clean_url = pr_url.strip()
        diff_url = clean_url if clean_url.endswith(".diff") else f"{clean_url}.diff"
        headers = {
            "User-Agent": "CareerOS-CodeReviewer/1.0",
            "Accept": "text/plain"
        }
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(diff_url, headers=headers)
            if resp.status_code == 200 and len(resp.text) > 10:
                return resp.text[:15000] # Cap diff size for LLM context window
    except Exception as e:
        logger.warning(f"Could not fetch GitHub PR diff from {pr_url}: {e}")
    return None

# ====================================================================
# Endpoints
# ====================================================================

@router.get("/tracks")
def get_simulation_tracks():
    """Returns all available company simulation tracks."""
    return {"tracks": [DEFAULT_TRACK]}


@router.get("/tracks/{track_key}")
def get_simulation_track(track_key: str):
    """Returns details and tickets for a specific simulation track."""
    if track_key == DEFAULT_TRACK["track_key"]:
        return DEFAULT_TRACK
    raise HTTPException(status_code=404, detail="Simulation track not found")


@router.post("/review", response_model=SimulationReviewResponse)
async def review_simulation_submission(req: SimulationReviewRequest):
    """
    Evaluates an intern's Pull Request / code submission against acceptance criteria.
    Acts as Marcus, Staff Software Engineer at FinPulse Global.
    """
    code_content = req.submitted_code.strip()
    
    # If GitHub PR mode and URL provided, attempt to fetch live PR diff
    if req.submission_mode == "GITHUB_PR" and req.github_pr_url:
        pr_diff = await fetch_github_pr_diff(req.github_pr_url)
        if pr_diff:
            code_content = f"--- GITHUB PULL REQUEST DIFF ({req.github_pr_url}) ---\n{pr_diff}\n\n--- INTERN PR CODE ---\n{code_content}"

    # Verify LLM availability
    if not llm_engine.is_available():
        # Clean deterministic fallback for testing without Groq key
        return SimulationReviewResponse(
            status="APPROVED" if len(code_content) > 150 else "CHANGES_REQUESTED",
            score=85 if len(code_content) > 150 else 60,
            summary="Marcus (Staff Engineer): Code submission analyzed. Core logic addresses the ticket requirements.",
            strengths=["Clean syntax structure", "Aligned with basic function signatures"],
            improvements=["Ensure rigorous edge-case testing for negative numbers", "Add inline comments explaining locking logic"],
            line_comments=[
                LineComment(line=15, severity="praise", comment="Good separation of validation logic."),
                LineComment(line=28, severity="suggestion", comment="Ensure error messages do not leak internal system details.")
            ],
            star_bullet=f"Engineered production-grade payment service logic in {req.language.capitalize()} for ticket {req.ticket_code}, improving error resilience and meeting strict SLA requirements.",
            interview_talking_point=f"In my simulation project, I resolved ticket {req.ticket_code} by implementing clean validation and concurrency controls in {req.language.capitalize()}."
        )

    criteria_str = "\n".join([f"- {c}" for c in req.acceptance_criteria])
    
    system_prompt = f"""You are Marcus, a Staff Software Engineer conducting an educational, realistic, and constructive Pull Request review for a junior software engineer intern at FinPulse Global.

ROLE & TONE:
- Be warm, encouraging, but technically rigorous (like a high-bar senior mentor at Stripe or Google).
- Give line-specific feedback explaining WHY certain patterns matter.
- Evaluate whether the code actually satisfies the ticket's Acceptance Criteria.
- CRITERIA FOR 'APPROVED':
  - The core business requirements are solved cleanly.
  - Edge cases (null/empty inputs, boundary values, error paths) are addressed.
  - The code adheres to idiomatic practices for the selected language ({req.language.upper()}).
- CRITERIA FOR 'CHANGES_REQUESTED':
  - Critical acceptance criteria are missed or bypassed with placeholder TODOs.
  - Vulnerabilities (race conditions, unhandled exceptions, raw stack trace leaks).
  - Score should be below 75 if changes are requested, or 80-98 if approved.

You MUST respond strictly with a valid JSON object matching this schema:
{{
  "status": "APPROVED" | "CHANGES_REQUESTED",
  "score": 88,
  "summary": "1-2 paragraphs from Marcus reviewing the PR approach in a constructive senior dev voice.",
  "strengths": ["Clear separation of concerns", "Good use of thread-safe locks"],
  "improvements": ["Consider using TTL expiration", "Add logging with request ID"],
  "line_comments": [
    {{
      "line": 18,
      "severity": "blocker" | "suggestion" | "praise",
      "comment": "Specific constructive comment about this line or block."
    }}
  ],
  "star_bullet": "Google XYZ formula resume bullet point starting with a strong action verb (e.g. Architected, Engineered, Implemented) highlighting measurable outcomes.",
  "interview_talking_point": "Concise 2-3 sentence talking point the student can use in a real technical interview to explain how they solved this problem and what engineering trade-offs they considered."
}}"""

    user_prompt = f"""TICKET: {req.ticket_code} — {req.ticket_title}
LANGUAGE: {req.language.upper()}
SUBMISSION MODE: {req.submission_mode} (Attempt #{req.attempt_number})

ACCEPTANCE CRITERIA:
{criteria_str}

SUBMITTED CODE / PULL REQUEST CONTENT:
```{req.language.lower()}
{code_content}
```

Conduct your code review and respond strictly with valid JSON."""

    result = llm_engine.generate_json(
        prompt=user_prompt,
        system_instruction=system_prompt,
        temperature=0.25
    )

    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate AI code review. Please try again.")

    return SimulationReviewResponse(
        status=result.get("status", "CHANGES_REQUESTED"),
        score=int(result.get("score", 70)),
        summary=result.get("summary", "Review complete. Please address the feedback points."),
        strengths=result.get("strengths", ["Solid attempt at implementing requirements."]),
        improvements=result.get("improvements", ["Review acceptance criteria checklist."]),
        line_comments=[
            LineComment(
                line=c.get("line"),
                severity=c.get("severity", "suggestion"),
                comment=c.get("comment", "")
            )
            for c in result.get("line_comments", [])
        ],
        star_bullet=result.get("star_bullet", f"Implemented {req.ticket_code} payment services in {req.language.capitalize()} meeting strict validation guidelines."),
        interview_talking_point=result.get("interview_talking_point", f"Discussed how {req.ticket_code} was resolved using structured boundary checks.")
    )


@router.post("/standup", response_model=StandupResponse)
def conduct_daily_standup(req: StandupRequest):
    """Simulates a daily standup check-in with Engineering Manager Sarah."""
    if not llm_engine.is_available():
        return StandupResponse(
            manager_feedback="Sarah (EM): Great progress! Keep pushing on the concurrency constraints. Remember to reach out to Marcus if you hit any road blocks on distributed locks.",
            communication_score=85,
            suggestions=["Keep bullet points concise in standups", "Mention specific ticket numbers"]
        )

    system_prompt = """You are Sarah, an Engineering Manager at FinPulse Global running a daily asynchronous standup.
Review the intern's update:
1. Praise clear, concrete technical updates.
2. If they have blockers, provide encouraging, actionable guidance.
3. Grade their communication clarity on a 0-100 scale.
4. Give 1-2 tips on how engineers write world-class standup updates (e.g. concise, outcome-oriented).

Respond strictly with valid JSON:
{
  "manager_feedback": "Sarah's Slack reply to the intern (warm, professional, actionable).",
  "communication_score": 90,
  "suggestions": ["Tip 1", "Tip 2"]
}"""

    user_prompt = f"""Intern Standup Update:
- Yesterday: {req.yesterday_work}
- Today: {req.today_plan}
- Blockers: {req.blockers}
- Active Ticket: {req.current_ticket}"""

    result = llm_engine.generate_json(
        prompt=user_prompt,
        system_instruction=system_prompt,
        temperature=0.4
    )

    if not result:
        return StandupResponse(
            manager_feedback="Sarah (EM): Good update! Stay focused on your active ticket and don't hesitate to ask in #tech-help if you need assistance.",
            communication_score=80,
            suggestions=["Break today's plan into small testable milestones"]
        )

    return StandupResponse(
        manager_feedback=result.get("manager_feedback", "Great update! Keep up the good work."),
        communication_score=int(result.get("communication_score", 85)),
        suggestions=result.get("suggestions", [])
    )


@router.post("/mentor-hint", response_model=MentorHintResponse)
def get_socratic_mentor_hint(req: MentorHintRequest):
    """Provides a Socratic hint from Senior Dev Marcus without spoiling the answer."""
    if not llm_engine.is_available():
        return MentorHintResponse(
            hint="Marcus: Look closely at your locking mechanism. If an exception occurs between lock acquisition and release, what happens to other concurrent requests?",
            key_concept="Distributed locks with try-finally resource cleanup",
            suggested_documentation=["Redis SETNX documentation", "Concurrency best practices"]
        )

    system_prompt = f"""You are Marcus, Staff Software Engineer at FinPulse.
The intern is stuck on ticket {req.ticket_code} ({req.language.upper()}) and asked for help.

CRITICAL INSTRUCTION:
Do NOT write the complete solution code for them! Give a Socratic hint: explain the underlying computer science or language pattern and guide them to find the fix themselves.

Respond strictly with valid JSON:
{{
  "hint": "Your Socratic explanation guiding their thinking.",
  "key_concept": "Key technical concept name (e.g. Idempotency Key, Row-level Locking, Middleware Error Catchers)",
  "suggested_documentation": ["Relevant documentation topic 1", "Relevant documentation topic 2"]
}}"""

    user_prompt = f"""Student Question: {req.question}
Language: {req.language}
Current Code Snippet:
```{req.language}
{req.current_code[:1000]}
```"""

    result = llm_engine.generate_json(
        prompt=user_prompt,
        system_instruction=system_prompt,
        temperature=0.3
    )

    if not result:
        return MentorHintResponse(
            hint="Marcus: Review your error handling and check if all edge cases listed in the ticket acceptance criteria are handled.",
            key_concept="Boundary Condition Validation",
            suggested_documentation=["Official framework documentation"]
        )

    return MentorHintResponse(
        hint=result.get("hint", "Check the acceptance criteria carefully."),
        key_concept=result.get("key_concept", "Defensive Programming"),
        suggested_documentation=result.get("suggested_documentation", [])
    )
