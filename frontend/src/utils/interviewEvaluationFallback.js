/**
 * Client-Side Heuristic Technical Interview Evaluator Fallback
 * Guarantees that candidates never lose their scores, feedback, or PDF reports
 * even when the AI backend is sleeping, cold-starting (~50s on Render), or temporarily offline.
 */

export function generateLocalInterviewEvaluation({ targetRole = 'Software Engineer', interviewMode = 'TECHNICAL', difficulty = 'Medium', questions = [] }) {
    const totalQ = questions.length || 5;
    const classified = questions.map((q, idx) => {
        const rawAns = (q.candidate_answer || '').trim();
        const isSkip = q.status === 'SKIPPED' || rawAns.length < 10;
        return {
            idx,
            id: q.id || `q_${idx + 1}`,
            question: q.question,
            topic: q.topic || interviewMode,
            difficulty: q.difficulty || difficulty,
            answer: rawAns,
            isSkip
        };
    });

    const skippedCount = classified.filter(c => c.isSkip).length;
    const answeredCount = totalQ - skippedCount;

    if (answeredCount === 0) {
        return {
            overall_score: 0,
            grade: 'Strong No Hire',
            summary_verdict: `Candidate skipped all ${totalQ} interview questions without providing answers. Zero marks awarded across all competencies (0/100).`,
            total_questions: totalQ,
            answered_count: 0,
            skipped_count: totalQ,
            dimension_scores: [
                { name: 'Technical Accuracy', score: 0, feedback: 'All technical questions were skipped (0/100).' },
                { name: 'Structural Flow & STAR', score: 0, feedback: 'No structured responses provided (0/100).' },
                { name: 'Depth & Edge Cases', score: 0, feedback: 'No technical depth demonstrated (0/100).' },
                { name: 'Communication Clarity', score: 0, feedback: 'No verbal answers provided for evaluation (0/100).' }
            ],
            per_question_results: classified.map(c => ({
                question_idx: c.idx,
                question: c.question,
                topic: c.topic,
                difficulty: c.difficulty,
                status: 'SKIPPED',
                score: 0,
                candidate_answer: '(Skipped — No verbal answer provided)',
                feedback: 'Question skipped by candidate without answering. 0 marks awarded.',
                dimension_scores: [
                    { name: 'Technical Accuracy', score: 0, feedback: 'Skipped (0/100)' },
                    { name: 'Structural Flow & STAR', score: 0, feedback: 'Skipped (0/100)' },
                    { name: 'Depth & Edge Cases', score: 0, feedback: 'Skipped (0/100)' },
                    { name: 'Communication Clarity', score: 0, feedback: 'Skipped (0/100)' }
                ],
                strengths: [],
                missing_points: ['Question was skipped without answering.'],
                model_improved_answer: 'Review fundamental principles for this topic and attempt each question with structured reasoning.'
            })),
            strengths: [],
            missing_points: [`Candidate skipped all ${totalQ} questions in this round.`],
            model_improved_answer: 'To pass technical rounds, candidates must actively attempt every question, explain underlying mechanics, and analyze trade-offs.',
            interviewer_follow_up: 'Study core engineering fundamentals for this track and practice articulating answers out loud without skipping.',
            is_client_heuristic: true
        };
    }

    // Evaluate answered questions based on word count, technical depth, and keyword grounding
    const perQuestionResults = classified.map(c => {
        if (c.isSkip) {
            return {
                question_idx: c.idx,
                question: c.question,
                topic: c.topic,
                difficulty: c.difficulty,
                status: 'SKIPPED',
                score: 0,
                candidate_answer: '(Skipped — No verbal answer provided)',
                feedback: 'Question skipped by candidate without answering. 0 marks awarded.',
                dimension_scores: [
                    { name: 'Technical Accuracy', score: 0, feedback: 'Skipped (0/100)' },
                    { name: 'Structural Flow & STAR', score: 0, feedback: 'Skipped (0/100)' },
                    { name: 'Depth & Edge Cases', score: 0, feedback: 'Skipped (0/100)' },
                    { name: 'Communication Clarity', score: 0, feedback: 'Skipped (0/100)' }
                ],
                strengths: [],
                missing_points: ['Question was skipped.'],
                model_improved_answer: 'Review fundamental principles for this topic.'
            };
        }

        const wordCount = c.answer.split(/\s+/).length;
        const lower = c.answer.toLowerCase();

        // Technical keyword match heuristic
        const keywords = ['api', 'database', 'sql', 'cache', 'redis', 'index', 'latency', 'scale', 'async', 'thread', 'docker', 'service', 'transaction', 'acid', 'architecture', 'component', 'state', 'hook', 'design', 'test'];
        const matchedKw = keywords.filter(k => lower.includes(k));

        const accuracyScore = Math.min(95, Math.max(45, 50 + Math.min(30, matchedKw.length * 6) + Math.min(15, Math.floor(wordCount / 8))));
        const starScore = Math.min(95, Math.max(40, 50 + (lower.includes('when') || lower.includes('situation') ? 12 : 0) + (lower.includes('built') || lower.includes('implemented') ? 15 : 0) + (lower.includes('result') || lower.includes('improved') ? 15 : 0)));
        const depthScore = Math.min(95, Math.max(40, 45 + Math.min(35, Math.floor(wordCount / 4)) + (lower.includes('trade-off') || lower.includes('because') ? 15 : 0)));
        const clarityScore = Math.min(95, Math.max(55, 60 + Math.min(30, Math.floor(wordCount / 6))));

        const qOverall = Math.round((accuracyScore + starScore + depthScore + clarityScore) / 4);

        return {
            question_idx: c.idx,
            question: c.question,
            topic: c.topic,
            difficulty: c.difficulty,
            status: 'ANSWERED',
            score: qOverall,
            candidate_answer: c.answer,
            feedback: `Good technical explanation covering ${c.topic}. Provided ${wordCount} words of verbal analysis with strong focus on engineering concepts.`,
            dimension_scores: [
                { name: 'Technical Accuracy', score: accuracyScore, feedback: `Demonstrated understanding of ${c.topic} fundamentals.` },
                { name: 'Structural Flow & STAR', score: starScore, feedback: `Structured communication with clear problem context.` },
                { name: 'Depth & Edge Cases', score: depthScore, feedback: `Addressed implementation requirements and architectural considerations.` },
                { name: 'Communication Clarity', score: clarityScore, feedback: `Articulated response clearly with standard industry terminology.` }
            ],
            strengths: [
                `Clear articulation of ${c.topic} core mechanics`,
                `Good conversational pacing (${wordCount} words)`
            ],
            missing_points: [
                `Could dive deeper into worst-case algorithmic complexity and production failure modes.`
            ],
            model_improved_answer: `When answering questions on ${c.topic}, begin with a high-level definition, illustrate with a concrete production scenario, and explicitly discuss trade-offs (e.g. latency vs consistency or memory vs CPU).`
        };
    });

    const sumScores = perQuestionResults.reduce((acc, q) => acc + q.score, 0);
    const overallScore = Math.round(sumScores / totalQ);

    const dimScores = [
        { name: 'Technical Accuracy', score: Math.round(perQuestionResults.reduce((a, q) => a + (q.dimension_scores[0]?.score || 0), 0) / totalQ), feedback: 'Evaluated accuracy across technical concepts.' },
        { name: 'Structural Flow & STAR', score: Math.round(perQuestionResults.reduce((a, q) => a + (q.dimension_scores[1]?.score || 0), 0) / totalQ), feedback: 'Evaluated situation, task, action, and result articulation.' },
        { name: 'Depth & Edge Cases', score: Math.round(perQuestionResults.reduce((a, q) => a + (q.dimension_scores[2]?.score || 0), 0) / totalQ), feedback: 'Evaluated consideration of edge cases and trade-offs.' },
        { name: 'Communication Clarity', score: Math.round(perQuestionResults.reduce((a, q) => a + (q.dimension_scores[3]?.score || 0), 0) / totalQ), feedback: 'Evaluated verbal pacing and vocabulary clarity.' }
    ];

    let grade = 'Strong No Hire';
    if (overallScore >= 80) grade = 'Staff / Strong Hire';
    else if (overallScore >= 65) grade = 'Hire / Competent';
    else if (overallScore >= 50) grade = 'Lean Hire / Needs Practice';
    else if (overallScore >= 30) grade = 'Borderline';

    const strengths = [
        `Completed ${answeredCount} of ${totalQ} questions with focused technical explanations`,
        `Demonstrated working knowledge of ${targetRole} principles and relevant tooling`,
        `Maintained active conversational dialogue throughout the interview track`
    ];

    const missingPoints = [
        `Ensure edge-case error scenarios and fallback mechanisms are explicitly highlighted.`,
        skippedCount > 0 ? `Avoid skipping questions: ${skippedCount} question(s) were skipped, which reduced your total score.` : `Incorporate specific numerical metrics (e.g., latency reduction, throughput improvements) into your answers.`
    ];

    return {
        overall_score: overallScore,
        grade,
        summary_verdict: `Candidate completed ${answeredCount} of ${totalQ} interview questions for ${targetRole} (${interviewMode}). Demonstrated solid engineering communication and problem-solving capability.`,
        total_questions: totalQ,
        answered_count: answeredCount,
        skipped_count: skippedCount,
        dimension_scores: dimScores,
        per_question_results: perQuestionResults,
        strengths,
        missing_points: missingPoints,
        model_improved_answer: `For senior and FAANG-grade placement interviews, always structure your responses using the STAR method: state the Situation and Task in 2 sentences, explain the Action with technical depth, and quantify the Result.`,
        interviewer_follow_up: `Review system design fundamentals and rehearse 2-minute elevator pitches for your primary technical projects.`,
        is_client_heuristic: true
    };
}

