-- ====================================================================
-- CareerOS — Placement Arena & Competitive Assessment Schema
-- Tables: arena_contests, arena_questions, arena_submissions
-- ====================================================================

-- 1. Create Arena Contests Table
CREATE TABLE IF NOT EXISTS public.arena_contests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_code TEXT UNIQUE NOT NULL, -- e.g. 'SPRINT-14'
    title TEXT NOT NULL,
    theme TEXT DEFAULT 'Fintech & Concurrency',
    target_companies TEXT[] DEFAULT ARRAY['Razorpay', 'Swiggy', 'TCS Prime', 'Infosys DSE'],
    total_duration_minutes INTEGER DEFAULT 20,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arena_contests_code ON public.arena_contests(contest_code);
CREATE INDEX IF NOT EXISTS idx_arena_contests_active ON public.arena_contests(is_active);

-- 2. Create Arena Questions Table
CREATE TABLE IF NOT EXISTS public.arena_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID REFERENCES public.arena_contests(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL CHECK (round_number IN (1, 2, 3)),
    question_order INTEGER DEFAULT 1,
    topic TEXT NOT NULL,
    company_tag TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Medium',
    question TEXT NOT NULL,
    code_snippet TEXT,
    options JSONB NOT NULL, -- Array of {id, text, correct, explanation}
    correct_option_id TEXT NOT NULL,
    explanation TEXT NOT NULL,
    scenario_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arena_questions_contest ON public.arena_questions(contest_id);
CREATE INDEX IF NOT EXISTS idx_arena_questions_round ON public.arena_questions(round_number);

-- 3. Create Arena Submissions Table (Records Student Scores & Percentiles)
CREATE TABLE IF NOT EXISTS public.arena_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id UUID REFERENCES public.arena_contests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_handle TEXT,
    college_name TEXT,
    round_1_score INTEGER DEFAULT 0,
    round_2_score INTEGER DEFAULT 0,
    round_3_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    time_taken_seconds INTEGER DEFAULT 0,
    percentile NUMERIC(5,2) DEFAULT 80.0,
    hiring_verdict TEXT DEFAULT 'Hire',
    answers_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arena_submissions_contest ON public.arena_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_arena_submissions_user ON public.arena_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_arena_submissions_score ON public.arena_submissions(total_score DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.arena_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_submissions ENABLE ROW LEVEL SECURITY;

-- Security Policies:
-- 1. Anyone (public or authenticated) can view active contests and contest questions
CREATE POLICY "Allow public read access to active contests"
ON public.arena_contests FOR SELECT
USING (is_active = true);

CREATE POLICY "Allow public read access to arena questions"
ON public.arena_questions FOR SELECT
USING (true);

-- 2. Authenticated students can submit their attempts and view their own submissions
CREATE POLICY "Allow authenticated students to insert submissions"
ON public.arena_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated students to read submissions"
ON public.arena_submissions FOR SELECT
TO authenticated
USING (true);

-- ====================================================================
-- SEED INITIAL SPRINT CONTEST AND QUESTIONS
-- ====================================================================
INSERT INTO public.arena_contests (contest_code, title, theme, target_companies, total_duration_minutes, is_active)
VALUES (
    'SPRINT-14',
    'National Placement Speed Sprint #14',
    'Fintech, Concurrency & Microservice Scaling',
    ARRAY['Razorpay', 'CRED', 'Swiggy', 'TCS Prime', 'Infosys DSE'],
    20,
    true
)
ON CONFLICT (contest_code) DO NOTHING;

-- Seed Questions for SPRINT-14 (Rounds 1, 2, and 3)
DO $$
DECLARE
    v_contest_id UUID;
BEGIN
    SELECT id INTO v_contest_id FROM public.arena_contests WHERE contest_code = 'SPRINT-14' LIMIT 1;

    -- Only seed if questions don't already exist for this contest
    IF NOT EXISTS (SELECT 1 FROM public.arena_questions WHERE contest_id = v_contest_id) THEN

        -- Round 1: Question 1 (SQL Indexing)
        INSERT INTO public.arena_questions (contest_id, round_number, question_order, topic, company_tag, difficulty, question, options, correct_option_id, explanation)
        VALUES (
            v_contest_id, 1, 1, 'Database & SQL Indexing', 'Razorpay / Swiggy', 'Medium',
            'A payments ledger query "SELECT * FROM transactions WHERE merchant_id = 42 ORDER BY created_at DESC LIMIT 20" takes 1,800ms on a 50M row PostgreSQL table. Which index structure immediately optimizes this query to sub-5ms?',
            '[
                {"id": "a", "text": "CREATE INDEX idx_merchant ON transactions(merchant_id);"},
                {"id": "b", "text": "CREATE INDEX idx_composite ON transactions(merchant_id, created_at DESC);", "correct": true},
                {"id": "c", "text": "CREATE INDEX idx_created ON transactions(created_at DESC);"},
                {"id": "d", "text": "CREATE HASH INDEX idx_hash ON transactions(merchant_id);"}
            ]'::jsonb,
            'b',
            'A composite B-tree index on (merchant_id, created_at DESC) allows Postgres to filter directly by merchant and traverse rows in reverse chronological order without an expensive external disk sort step.'
        );

        -- Round 1: Question 2 (Distributed Locks)
        INSERT INTO public.arena_questions (contest_id, round_number, question_order, topic, company_tag, difficulty, question, options, correct_option_id, explanation)
        VALUES (
            v_contest_id, 1, 2, 'Concurrency & Distributed Systems', 'CRED / Flipkart', 'Medium',
            'During a flash sale, two concurrent requests arrive simultaneously to book the final item in inventory. What Redis primitive guarantees atomic, double-allocation-safe locking with automatic crash safety?',
            '[
                {"id": "a", "text": "SET lock_key true followed by EXPIRE lock_key 30"},
                {"id": "b", "text": "SET lock_key uuid NX EX 30", "correct": true},
                {"id": "c", "text": "HSETNX lock_hash item_1 true"},
                {"id": "d", "text": "WATCH inventory_key followed by MULTI/EXEC without lease"}
            ]'::jsonb,
            'b',
            'The atomic command SET key uuid NX EX 30 sets the key ONLY if it does not exist (NX) with an automatic 30s TTL expiry (EX) in a single round-trip, preventing split-brain deadlocks if the node crashes.'
        );

        -- Round 1: Question 3 (Operating Systems)
        INSERT INTO public.arena_questions (contest_id, round_number, question_order, topic, company_tag, difficulty, question, options, correct_option_id, explanation)
        VALUES (
            v_contest_id, 1, 3, 'Operating Systems & Deadlocks', 'Amazon / TCS Prime', 'Easy',
            'In Java/Linux worker microservices, which condition does NOT need to hold true for a deadlock to occur?',
            '[
                {"id": "a", "text": "Mutual Exclusion"},
                {"id": "b", "text": "Hold and Wait"},
                {"id": "c", "text": "Preemption of held resources allowed by OS scheduler", "correct": true},
                {"id": "d", "text": "Circular Wait"}
            ]'::jsonb,
            'c',
            'Coffman deadlock conditions require "No Preemption" (resources cannot be forcibly taken from a holding thread). If the scheduler can preempt resources, deadlocks can be systematically prevented.'
        );

        -- Round 1: Question 4 (Rate Limiting)
        INSERT INTO public.arena_questions (contest_id, round_number, question_order, topic, company_tag, difficulty, question, options, correct_option_id, explanation)
        VALUES (
            v_contest_id, 1, 4, 'System Design & Rate Limiting', 'Uber / Zomato', 'Medium',
            'Which rate-limiting algorithm allows short bursts of traffic while strictly enforcing a smooth average consumption rate with O(1) memory overhead?',
            '[
                {"id": "a", "text": "Fixed Window Counter"},
                {"id": "b", "text": "Token Bucket Algorithm", "correct": true},
                {"id": "c", "text": "Sliding Window Log"},
                {"id": "d", "text": "Exponential Backoff Queue"}
            ]'::jsonb,
            'b',
            'Token Bucket allows bursts up to bucket capacity while refilling tokens at a constant rate with simple numeric tracking (tokens, last_refill_timestamp) in O(1) memory.'
        );

        -- Round 1: Question 5 (HTTP Idempotency)
        INSERT INTO public.arena_questions (contest_id, round_number, question_order, topic, company_tag, difficulty, question, options, correct_option_id, explanation)
        VALUES (
            v_contest_id, 1, 5, 'REST API & HTTP Idempotency', 'Stripe / PayU', 'Medium',
            'Which HTTP method/pattern should be used for a payment settlement endpoint that can be safely retried 10 times without double-charging the user account balance?',
            '[
                {"id": "a", "text": "Standard POST without custom headers"},
                {"id": "b", "text": "POST or PUT with an Idempotency-Key header verified against cache", "correct": true},
                {"id": "c", "text": "GET request with query params containing customer card token"},
                {"id": "d", "text": "HTTP PATCH with random uuid in query string"}
            ]'::jsonb,
            'b',
            'Passing a unique Idempotency-Key header allows the payment gateway to record the first execution in a fast key-value store (like Redis) and safely replay the exact cached response on duplicate retries.'
        );

        -- Round 2: The Code Surgeon (Microservice Bug Patch)
        INSERT INTO public.arena_questions (contest_id, round_number, question_order, topic, company_tag, difficulty, question, code_snippet, options, correct_option_id, explanation)
        VALUES (
            v_contest_id, 2, 1, 'Payment Wallet Concurrency Bug', 'Razorpay FinTech', 'Hard',
            'A wallet deduction microservice suffers intermittent balance discrepancies during simultaneous debit requests. Inspect the vulnerable code and choose the production atomic patch.',
            'async function processWalletDeduction(userId, amount) {
  // Line 1: Fetch customer record from database
  const user = await db.users.findById(userId);

  // Line 2: Check balance sufficiency
  if (user.balance < amount) {
    throw new Error(''INSUFFICIENT_FUNDS'');
  }

  // Line 3: Simulate 40ms downstream gateway auth latency
  await sleep(40);

  // Line 4: Calculate and save balance
  const remaining = user.balance - amount;
  await db.users.update(userId, { balance: remaining });
  return remaining;
}',
            '[
                {
                    "id": "p1",
                    "title": "Option A: In-Memory Mutex Lock",
                    "code": "const locks = new Set();\nif (locks.has(userId)) throw new Error(''BUSY'');\nlocks.add(userId);",
                    "explanation": "In-memory locks fail completely across multiple cluster instances / worker pods."
                },
                {
                    "id": "p2",
                    "title": "Option B: Atomic Conditional SQL Decrement (Recommended)",
                    "code": "const result = await db.query(\n  ''UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance'',\n  [amount, userId]\n);\nif (result.rowCount === 0) throw new Error(''INSUFFICIENT_FUNDS'');\nreturn result.rows[0].balance;",
                    "correct": true,
                    "explanation": "Executing an atomic conditional UPDATE at the database engine level guarantees ACID isolation without race conditions or distributed lock overhead."
                },
                {
                    "id": "p3",
                    "title": "Option C: Retry Loop with Timeout",
                    "code": "for (let i = 0; i < 3; i++) {\n  try { return await processWalletDeduction(userId, amount); }\n  catch(e) { await sleep(100); }\n}",
                    "explanation": "Retrying the same non-atomic read-modify-write logic worsens concurrency conflicts."
                },
                {
                    "id": "p4",
                    "title": "Option D: JavaScript Promise.all Synchronization",
                    "code": "return await Promise.all([\n  db.users.findById(userId),\n  db.users.update(userId, { amount })\n]);",
                    "explanation": "Promise.all parallelizes async calls, which does not provide database row locking."
                }
            ]'::jsonb,
            'p2',
            'Executing an atomic conditional UPDATE at the database engine level guarantees ACID isolation without race conditions or distributed lock overhead.'
        );

        -- Round 3: High-Scale Architecture Decision
        INSERT INTO public.arena_questions (contest_id, round_number, question_order, topic, company_tag, difficulty, question, options, correct_option_id, explanation, scenario_metadata)
        VALUES (
            v_contest_id, 3, 1, 'IPL Final Flash Surge: 18,000 Orders/Second', 'Swiggy / Zomato Real-Time Switch', 'Hard',
            'During the last 3 overs of the IPL final match, food delivery orders surge from 2,000 to 18,000 requests per second. The primary PostgreSQL database CPU spikes to 99%, and order checkout APIs begin returning HTTP 504 timeouts to hungry customers.',
            '[
                {
                    "id": "d1",
                    "title": "A. Vertically scale database instance to 64 vCPU (Hot Upgrade)",
                    "tradeoff": "Costs ₹35,000/hour, requires database downtime during failover, and fails when connections pool exhaust again in 5 minutes."
                },
                {
                    "id": "d2",
                    "title": "B. Asynchronous Buffer: Ingress to Apache Kafka + Redis Deduplication (Optimal)",
                    "tradeoff": "Checkout API immediately pushes order payload to Kafka partition and responds with 202 Accepted + tracking ID in 8ms. Worker consumers drain orders at steady 4,000 writes/sec with Redis idempotency keys. 0 orders lost, DB CPU drops to 52%.",
                    "correct": true
                },
                {
                    "id": "d3",
                    "title": "C. Provision 10 PostgreSQL Read Replicas with Round-Robin DNS",
                    "tradeoff": "Checkout orders are WRITE-intensive (INSERT/UPDATE), which cannot be offloaded to read replicas. Replication lag causes dirty reads."
                },
                {
                    "id": "d4",
                    "title": "D. Switch Order Table to MongoDB without Transactions",
                    "tradeoff": "Re-architecting database mid-outage is impossible and forfeits financial ledger ACID guarantees."
                }
            ]'::jsonb,
            'd2',
            'When write traffic exceeds relational database capacity, decoupling ingestion from persistence via high-throughput append-only message queues (Kafka / SQS) is the industry standard pattern for peak survivability.',
            '{"constraint": "You must prevent customer order drops while preserving payment consistency and keeping database CPU below 70%."}'::jsonb
        );

    END IF;
END $$;
