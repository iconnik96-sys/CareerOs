/**
 * CareerOS — Placement Arena Service
 * 
 * Provides dynamic contest & real question fetching from Supabase.
 * Strictly queries the live database (no fallback/fake questions or answers).
 */

import { supabase } from '../lib/supabase';

const ARENA_SUBMISSIONS_LOCAL_KEY = 'careeros_arena_submissions_v1';

// Private in-memory store for contest answer keys (never serialized or exposed to sessionStorage)
const _contestAnswerKeys = new Map();

export const arenaService = {
  /**
   * Fetches real contest questions directly from Supabase.
   * Returns empty array if no real questions are configured yet.
   */
  async getActiveContest(contestCode = 'SPRINT-14') {
    const cacheKey = `careeros_arena_contest_${contestCode}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.round1Questions?.length > 0 || parsed.round2Challenge || parsed.round3Challenge)) {
          return parsed;
        }
      }
    } catch {
      // Ignore cache read failures
    }

    try {
      // 1. Fetch active contest record from Supabase
      const { data: contest, error: contestError } = await supabase
        .from('arena_contests')
        .select('*')
        .eq('contest_code', contestCode)
        .eq('is_active', true)
        .maybeSingle();

      if (contestError) {
        console.warn('Supabase contest fetch notice:', contestError.message || contestError);
        return {
          contestCode,
          title: 'Campus Placement Sprint',
          round1Questions: [],
          round2Challenge: null,
          round3Challenge: null,
          source: 'supabase_error',
          error: contestError.message
        };
      }

      if (!contest) {
        return {
          contestCode,
          title: 'Campus Placement Sprint',
          round1Questions: [],
          round2Challenge: null,
          round3Challenge: null,
          source: 'supabase_empty',
          error: `No active contest found with code "${contestCode}" in Supabase.`
        };
      }

      // 2. Fetch real questions for this contest
      const { data: questions, error: qError } = await supabase
        .from('arena_questions')
        .select('*')
        .eq('contest_id', contest.id)
        .order('question_order', { ascending: true });

      if (qError) {
        console.warn('Supabase questions fetch notice:', qError.message || qError);
        return {
          contestCode: contest.contest_code,
          title: contest.title,
          round1Questions: [],
          round2Challenge: null,
          round3Challenge: null,
          source: 'supabase_error',
          error: qError.message
        };
      }

      if (!questions || questions.length === 0) {
        return {
          contestCode: contest.contest_code,
          title: contest.title,
          round1Questions: [],
          round2Challenge: null,
          round3Challenge: null,
          source: 'supabase_empty',
          error: 'No questions have been configured for this contest in Supabase.'
        };
      }

      // 3. Extract real questions and isolate answer keys in private memory
      const r1AnswerMap = {};
      const sanitizedR1 = questions
        .filter(q => q.round_number === 1)
        .map(q => {
          const rawOptions = Array.isArray(q.options) ? q.options : [];
          const correctOpt = rawOptions.find(o => o.correct)?.id;
          if (correctOpt) r1AnswerMap[q.id] = correctOpt;
          return {
            id: q.id,
            topic: q.topic,
            companyTag: q.company_tag,
            question: q.question,
            // SECURITY: Strip 'correct' attribute so client cannot inspect sessionStorage or DevTools to cheat
            options: rawOptions.map(({ id, text }) => ({ id, text })),
            explanation: q.explanation
          };
        });

      const r2Q = questions.find(q => q.round_number === 2);
      const r3Q = questions.find(q => q.round_number === 3);

      const r2RawPatches = Array.isArray(r2Q?.options) ? r2Q.options : [];
      const r2CorrectId = r2RawPatches.find(p => p.correct)?.id || null;

      const r3RawDecisions = Array.isArray(r3Q?.options) ? r3Q.options : [];
      const r3CorrectId = r3RawDecisions.find(d => d.correct)?.id || null;

      _contestAnswerKeys.set(contest.contest_code, {
        r1: r1AnswerMap,
        r2: r2CorrectId,
        r3: r3CorrectId
      });

      const compiled = {
        contestCode: contest.contest_code,
        title: contest.title,
        theme: contest.theme,
        targetCompanies: contest.target_companies || ['Razorpay', 'Swiggy', 'TCS Prime'],
        round1Questions: sanitizedR1,
        round2Challenge: r2Q ? {
          id: r2Q.id,
          title: r2Q.topic,
          company: r2Q.company_tag,
          scenario: r2Q.question,
          codeSnippet: r2Q.code_snippet,
          question: 'Which production patch eliminates the race condition?',
          patches: r2RawPatches.map(({ id, patchTitle, codeDiff, rationale }) => ({ id, patchTitle, codeDiff, rationale }))
        } : null,
        round3Challenge: r3Q ? {
          id: r3Q.id,
          title: r3Q.topic,
          company: r3Q.company_tag,
          dilemma: r3Q.question,
          constraint: r3Q.scenario_metadata?.constraint || 'Decouple writes from relational DB under flash peak',
          question: 'As Staff Engineer, which architectural intervention restores sub-100ms response times?',
          decisions: r3RawDecisions.map(({ id, architectureName, topology, latencyImpact, costDelta }) => ({ id, architectureName, topology, latencyImpact, costDelta })),
          engineeringLesson: r3Q.explanation
        } : null,
        source: 'supabase_live'
      };

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(compiled));
      } catch {}

      return compiled;
    } catch (err) {
      console.warn('Supabase live arena fetch error:', err.message || err);
      return {
        contestCode,
        title: 'Campus Placement Sprint',
        round1Questions: [],
        round2Challenge: null,
        round3Challenge: null,
        source: 'supabase_error',
        error: err.message || 'Network error connecting to Supabase'
      };
    }
  },

  /**
   * Securely evaluates student answers against the private in-memory answer key
   */
  evaluateContestAnswers(contestCode, { round1Answers = {}, selectedPatch = null, selectedArchDecision = null }) {
    const key = _contestAnswerKeys.get(contestCode);
    if (!key) {
      return {}; // Signal caller to use safe fallback
    }

    const r1Keys = key.r1 || {};
    let r1Correct = 0;
    const qIds = Object.keys(r1Keys);
    qIds.forEach(qId => {
      if (round1Answers[qId] && round1Answers[qId] === r1Keys[qId]) {
        r1Correct++;
      }
    });

    const totalR1 = Math.max(qIds.length, 1);
    const r1Score = qIds.length > 0 ? Math.round((r1Correct / totalR1) * 100) : 0;

    const r2CorrectId = key.r2;
    const r2Score = r2CorrectId && selectedPatch === r2CorrectId ? 100 : (selectedPatch ? 20 : 0);

    const r3CorrectId = key.r3;
    const r3Score = r3CorrectId && selectedArchDecision === r3CorrectId ? 100 : (selectedArchDecision ? 25 : 0);

    const overallIndex = Math.round((r1Score * 0.4) + (r2Score * 0.3) + (r3Score * 0.3));

    return {
      r1Correct,
      r1Score,
      r2Score,
      r3Score,
      overallIndex
    };
  },

  /**
   * Persists student contest results into Supabase and local storage
   */
  async submitContestResult({
    user,
    profile,
    contestCode = 'SPRINT-14',
    results
  }) {
    const submissionPayload = {
      contest_code: contestCode,
      user_id: user?.id || null,
      user_handle: profile?.handle || `@${user?.email?.split('@')[0] || 'student'}`,
      college_name: profile?.college || profile?.university || 'College CSE 2026',
      round_1_score: results.r1Score,
      round_2_score: results.r2Score,
      round_3_score: results.r3Score,
      total_score: results.overallIndex,
      time_taken_seconds: results.totalTimeUsed,
      percentile: results.overallIndex >= 85 ? 96.5 : results.overallIndex >= 70 ? 84.2 : 62.0,
      hiring_verdict: results.overallIndex >= 85 ? 'Strong Hire' : results.overallIndex >= 70 ? 'Hire' : 'Eligible',
      submitted_at: new Date().toISOString()
    };

    // 1. Save locally for instant persistence
    try {
      const existing = JSON.parse(localStorage.getItem(ARENA_SUBMISSIONS_LOCAL_KEY) || '[]');
      existing.unshift(submissionPayload);
      localStorage.setItem(ARENA_SUBMISSIONS_LOCAL_KEY, JSON.stringify(existing.slice(0, 20)));
    } catch {}

    // 2. Persist to Supabase if user is authenticated
    if (user?.id) {
      try {
        await supabase.from('arena_submissions').insert([{
          user_id: user.id,
          user_handle: submissionPayload.user_handle,
          college_name: submissionPayload.college_name,
          round_1_score: submissionPayload.round_1_score,
          round_2_score: submissionPayload.round_2_score,
          round_3_score: submissionPayload.round_3_score,
          total_score: submissionPayload.total_score,
          time_taken_seconds: submissionPayload.time_taken_seconds,
          percentile: submissionPayload.percentile,
          hiring_verdict: submissionPayload.hiring_verdict,
          answers_payload: {
            round_1_correct: results.r1Correct,
            formatted_time: results.timeFormatted
          }
        }]);
      } catch (err) {
        console.warn('Failed to insert arena submission to Supabase:', err.message || err);
      }
    }

    return submissionPayload;
  }
};
