/**
 * CareerOS AI Interview Assessment PDF Export Utility
 * Generates an executive-grade, publication-quality PDF report
 * with strict multi-page layout and page-break isolation to prevent
 * elements and questions from cutting awkwardly across page boundaries.
 */

import { loadHtml2Pdf } from './pdfExport';

/**
 * Formats date string for report headers
 */
const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Robust HTML entity escaper to prevent DOM XSS when mounting report HTML
 */
export const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

/**
 * Builds the standalone HTML document for the Interview Assessment Report
 * with explicit page boundaries and unbroken question containers.
 */
export const buildInterviewReportHtml = ({
    evaluation = {},
    targetRole = 'Software Engineer',
    modeTitle = 'Technical & Core CS',
    difficulty = 'Medium',
    candidateName = 'Candidate',
    questions = [],
    questionAttempts = []
}) => {
    const safeCandidateName = escapeHtml(candidateName);
    const safeTargetRole = escapeHtml(targetRole);
    const safeModeTitle = escapeHtml(modeTitle);
    const safeDifficulty = escapeHtml(difficulty);

    const score = evaluation?.overall_score ?? 0;
    const grade = evaluation?.grade || (
        score >= 80 ? 'Strong Hire' :
        score >= 65 ? 'Hire / Competent' :
        score >= 50 ? 'Needs Practice' : 'Strong No Hire'
    );
    const safeGrade = escapeHtml(grade);

    // Color theming based on score
    const primaryColor = score >= 80 ? '#059669' : score >= 65 ? '#2563eb' : score >= 50 ? '#d97706' : '#dc2626';
    const primaryBg = score >= 80 ? '#ecfdf5' : score >= 65 ? '#eff6ff' : score >= 50 ? '#fffbeb' : '#fef2f2';
    const primaryBorder = score >= 80 ? '#a7f3d0' : score >= 65 ? '#bfdbfe' : score >= 50 ? '#fde68a' : '#fecaca';

    const answeredCount = evaluation?.answered_count ?? questionAttempts.filter(q => q.status === 'ANSWERED').length;
    const skippedCount = evaluation?.skipped_count ?? questionAttempts.filter(q => q.status === 'SKIPPED').length;
    const totalQ = evaluation?.total_questions ?? (questions.length || questionAttempts.length || 5);

    const qResults = evaluation?.per_question_results || questionAttempts;

    const dimensions = evaluation?.dimension_scores || [
        { name: 'Technical Accuracy', score: score, feedback: 'Technical correctness and concept mastery.' },
        { name: 'Structural Flow & STAR', score: score, feedback: 'Logical flow and response structure.' },
        { name: 'Depth & Edge Cases', score: score, feedback: 'Proactive exploration of limits and trade-offs.' },
        { name: 'Communication Clarity', score: score, feedback: 'Articulation, concise terminology, and delivery.' }
    ];

    const reportId = `COS-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    return `
    <div class="careeros-interview-pdf" style="
        width: 794px;
        background-color: #ffffff;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        padding: 24px 32px;
        box-sizing: border-box;
        margin: 0 auto;
        line-height: 1.45;
        font-size: 12.5px;
        position: relative;
    ">
        <style>
            .html2pdf__page-break {
                page-break-before: always !important;
                break-before: page !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .pdf-avoid-break {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                -webkit-column-break-inside: avoid !important;
            }
        </style>

        <!-- ========================================================================= -->
        <!-- PAGE 1: EXECUTIVE ASSESSMENT SCORECARD & COMPETENCY MATRIX                -->
        <!-- ========================================================================= -->
        <div class="pdf-page-1" style="box-sizing: border-box;">
            <!-- Top Gradient Accent Line -->
            <div style="height: 5px; width: 100%; background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #06b6d4 100%); border-radius: 3px; margin-bottom: 16px;"></div>

            <!-- Document Header Bar -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #e2e8f0; margin-bottom: 16px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
                        <div style="width: 22px; height: 22px; border-radius: 5px; background-color: #4f46e5; display: inline-flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 13px;">
                            C
                        </div>
                        <span style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.1em; color: #4f46e5; text-transform: uppercase;">
                            CareerOS AI Career Intelligence
                        </span>
                    </div>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                        AI Technical Interview Hiring Scorecard
                    </h1>
                    <p style="margin: 2px 0 0 0; font-size: 11.5px; color: #64748b;">
                        Official Candidate Evaluation & Technical Competency Benchmark
                    </p>
                </div>
                <div style="text-align: right;">
                    <span style="display: inline-block; padding: 3px 8px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 5px; font-size: 9.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                        Report ID: ${reportId}
                    </span>
                    <div style="font-size: 10.5px; color: #64748b;">
                        ${formatDate()} • ${formatTime()}
                    </div>
                </div>
            </div>

            <!-- Candidate & Interview Metadata Grid -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;">
                <div>
                    <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
                        Candidate
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">
                        ${safeCandidateName}
                    </div>
                </div>
                <div>
                    <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
                        Target Role
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: #4f46e5;">
                        ${safeTargetRole}
                    </div>
                </div>
                <div>
                    <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
                        Interview Track
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">
                        ${safeModeTitle}
                    </div>
                </div>
                <div>
                    <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;">
                        Difficulty / Format
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: #0f172a;">
                        ${safeDifficulty} • Live Voice
                    </div>
                </div>
            </div>

            <!-- Executive Score & Verdict Hero Banner -->
            <div class="pdf-avoid-break" style="
                background-color: ${primaryBg};
                border: 1px solid ${primaryBorder};
                border-left: 5px solid ${primaryColor};
                border-radius: 10px;
                padding: 14px 18px;
                margin-bottom: 18px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
            ">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <!-- Glowing Score Circle -->
                    <div style="
                        width: 70px;
                        height: 70px;
                        border-radius: 50%;
                        background-color: #ffffff;
                        border: 3.5px solid ${primaryColor};
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
                    ">
                        <span style="font-size: 24px; font-weight: 900; color: #0f172a; line-height: 1;">
                            ${score}
                        </span>
                        <span style="font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">
                            / 100
                        </span>
                    </div>

                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span style="
                                display: inline-block;
                                padding: 2.5px 10px;
                                border-radius: 9999px;
                                background-color: ${primaryColor};
                                color: #ffffff;
                                font-size: 10.5px;
                                font-weight: 800;
                                letter-spacing: 0.05em;
                                text-transform: uppercase;
                            ">
                                ${safeGrade}
                            </span>
                            <span style="font-size: 10.5px; color: #64748b; font-weight: 600;">
                                Hiring Recommendation
                            </span>
                        </div>
                        <div style="font-size: 12px; color: #1e293b; line-height: 1.4; max-width: 440px;">
                            ${escapeHtml(evaluation?.summary_verdict) || (score === 0 
                                ? 'Candidate skipped all interview questions. Zero technical competencies demonstrated.' 
                                : 'Candidate completed the live AI technical interview evaluation round.')}
                        </div>
                    </div>
                </div>

                <!-- Stats Column -->
                <div style="text-align: right; border-left: 1px solid ${primaryBorder}; padding-left: 16px; flex-shrink: 0;">
                    <div style="margin-bottom: 4px;">
                        <div style="font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">Questions Attempted</div>
                        <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${answeredCount} of ${totalQ}</div>
                    </div>
                    ${skippedCount > 0 ? `
                    <div>
                        <div style="font-size: 9.5px; font-weight: 700; color: #dc2626; text-transform: uppercase;">Skipped (0 pts)</div>
                        <div style="font-size: 13px; font-weight: 800; color: #dc2626;">${skippedCount} questions</div>
                    </div>
                    ` : `
                    <div>
                        <div style="font-size: 9.5px; font-weight: 700; color: #059669; text-transform: uppercase;">Completion Rate</div>
                        <div style="font-size: 13px; font-weight: 800; color: #059669;">100%</div>
                    </div>
                    `}
                </div>
            </div>

            <!-- SECTION 1: 4-Dimension Competency Matrix -->
            <div class="pdf-avoid-break" style="margin-bottom: 18px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                        1. Core Competency Dimensions
                    </h3>
                    <span style="font-size: 10.5px; color: #64748b;">Calibrated against Tier-1 Engineering Rubrics</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    ${dimensions.map(dim => {
                        const dimColor = dim.score >= 80 ? '#059669' : dim.score >= 65 ? '#2563eb' : dim.score >= 50 ? '#d97706' : '#dc2626';
                        return `
                        <div style="
                            background-color: #f8fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 7px;
                            padding: 10px 12px;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <span style="font-size: 11.5px; font-weight: 700; color: #0f172a;">${dim.name}</span>
                                <span style="font-size: 11.5px; font-weight: 800; color: ${dimColor};">${dim.score}/100</span>
                            </div>
                            <div style="width: 100%; height: 5px; background-color: #e2e8f0; border-radius: 9999px; overflow: hidden; margin-bottom: 6px;">
                                <div style="width: ${dim.score}%; height: 100%; background-color: ${dimColor}; border-radius: 9999px;"></div>
                            </div>
                            <div style="font-size: 10.5px; color: #475569; line-height: 1.35;">
                                ${dim.feedback || 'Evaluated during technical voice answers.'}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- SECTION 2: Strengths vs Identified Gaps -->
            <div class="pdf-avoid-break" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px;">
                <!-- Strengths Card -->
                <div style="
                    background-color: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    padding: 12px 14px;
                ">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                        <span style="font-size: 13px;">✅</span>
                        <h4 style="margin: 0; font-size: 11.5px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">
                            Key Strengths Demonstrated
                        </h4>
                    </div>
                    ${evaluation?.strengths && evaluation.strengths.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            ${evaluation.strengths.map(s => `
                                <div style="display: flex; align-items: flex-start; gap: 5px; font-size: 11px; color: #166534; line-height: 1.35;">
                                    <span style="font-weight: 800;">✓</span>
                                    <span>${escapeHtml(s)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="margin: 0; font-size: 11px; color: #64748b;">
                            Solid baseline attempt across fundamental definitions and concepts.
                        </p>
                    `}
                </div>

                <!-- Gaps & Improvements Card -->
                <div style="
                    background-color: #fffbeb;
                    border: 1px solid #fde68a;
                    border-radius: 8px;
                    padding: 12px 14px;
                ">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
                        <span style="font-size: 13px;">🎯</span>
                        <h4 style="margin: 0; font-size: 11.5px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">
                            Areas for Next Round Improvement
                        </h4>
                    </div>
                    ${evaluation?.missing_points && evaluation.missing_points.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 5px;">
                            ${evaluation.missing_points.map(m => `
                                <div style="display: flex; align-items: flex-start; gap: 5px; font-size: 11px; color: #92400e; line-height: 1.35;">
                                    <span style="font-weight: 800;">•</span>
                                    <span>${escapeHtml(m)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="margin: 0; font-size: 11px; color: #64748b;">
                            Practice addressing production edge cases, memory footprint, and concurrency proactively.
                        </p>
                    `}
                </div>
            </div>

            <!-- Page 1 Footer Bar -->
            <div style="
                border-top: 1px solid #e2e8f0;
                padding-top: 10px;
                margin-top: 14px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 9.5px;
                color: #94a3b8;
            ">
                <div>
                    CareerOS AI Assessment Engine • Full-Duplex Voice Rubrics
                </div>
                <div>
                    Executive Summary Scorecard • Page 1 of 2
                </div>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- CLEAN EXPLICIT PAGE BREAK TO PAGE 2                                       -->
        <!-- ========================================================================= -->
        <div class="html2pdf__page-break" style="page-break-before: always; break-before: page; height: 0; margin: 0; padding: 0;"></div>

        <!-- ========================================================================= -->
        <!-- PAGE 2: QUESTION-BY-QUESTION TRANSCRIPTS & BENCHMARK ANSWERS              -->
        <!-- ========================================================================= -->
        <div class="pdf-page-2" style="box-sizing: border-box; padding-top: 16px;">
            <!-- Page 2 Mini Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1.5px solid #e2e8f0; margin-bottom: 14px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">
                        CareerOS AI Technical Assessment
                    </span>
                    <span style="color: #cbd5e1;">|</span>
                    <span style="font-size: 11px; color: #64748b;">
                        Candidate: <strong style="color: #0f172a;">${safeCandidateName}</strong> (${safeTargetRole})
                    </span>
                </div>
                <div style="font-size: 10px; color: #94a3b8;">
                    Report ID: ${reportId}
                </div>
            </div>

            <!-- SECTION 3: Detailed Question-by-Question Breakdown -->
            <div style="margin-bottom: 18px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                        2. Question-by-Question Evaluation & Transcripts
                    </h3>
                    <span style="font-size: 10.5px; color: #64748b;">Total Evaluated Questions: ${qResults.length}</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${qResults.map((q, idx) => {
                        const isSkip = q.status === 'SKIPPED';
                        const qScore = isSkip ? 0 : (q.score ?? score);
                        const qBadgeColor = isSkip ? '#dc2626' : qScore >= 80 ? '#059669' : qScore >= 65 ? '#2563eb' : '#d97706';
                        const qBadgeBg = isSkip ? '#fef2f2' : qScore >= 80 ? '#ecfdf5' : qScore >= 65 ? '#eff6ff' : '#fffbeb';
                        const qBadgeBorder = isSkip ? '#fecaca' : qScore >= 80 ? '#a7f3d0' : qScore >= 65 ? '#bfdbfe' : '#fde68a';

                        return `
                        <div class="pdf-avoid-break" style="
                            background-color: #ffffff;
                            border: 1px solid ${isSkip ? '#fecaca' : '#e2e8f0'};
                            border-radius: 7px;
                            padding: 10px 14px;
                            box-sizing: border-box;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span style="font-size: 11.5px; font-weight: 800; color: #0f172a;">Question #${idx + 1}</span>
                                    <span style="font-size: 9.5px; font-weight: 700; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569;">
                                        ${escapeHtml(q.topic || safeModeTitle)}
                                    </span>
                                </div>
                                <span style="
                                    font-size: 10px;
                                    font-weight: 800;
                                    color: ${qBadgeColor};
                                    background-color: ${qBadgeBg};
                                    border: 1px solid ${qBadgeBorder};
                                    padding: 2px 8px;
                                    border-radius: 9999px;
                                ">
                                    ${isSkip ? 'SKIPPED • 0/100' : `ANSWERED • ${qScore}/100`}
                                </span>
                            </div>

                            <!-- Question Prompt -->
                            <div style="font-size: 11.5px; font-weight: 700; color: #0f172a; margin-bottom: 6px; line-height: 1.35;">
                                ${escapeHtml(q.question)}
                            </div>

                            <!-- Candidate Answer -->
                            ${isSkip ? `
                                <div style="
                                    background-color: #fef2f2;
                                    border: 1px dashed #fca5a5;
                                    border-radius: 5px;
                                    padding: 6px 10px;
                                    font-size: 10.5px;
                                    color: #dc2626;
                                    margin-bottom: 6px;
                                ">
                                    ⚠️ <strong>Skipped Question:</strong> Candidate skipped this question without answering. Strictly 0 marks awarded under standard hiring rubrics.
                                </div>
                            ` : `
                                <div style="
                                    background-color: #f8fafc;
                                    border: 1px solid #e2e8f0;
                                    border-radius: 5px;
                                    padding: 6px 10px;
                                    font-size: 10.5px;
                                    color: #334155;
                                    line-height: 1.4;
                                    margin-bottom: 6px;
                                ">
                                    <strong style="color: #0f172a;">Candidate's Spoken Answer:</strong><br/>
                                    "${escapeHtml(q.candidate_answer || '(No verbal answer transcribed)')}"
                                </div>
                            `}

                            <!-- Evaluator Feedback -->
                            ${q.feedback ? `
                                <div style="font-size: 10.5px; color: #475569; line-height: 1.35; border-left: 2.5px solid #6366f1; padding-left: 8px;">
                                    <strong style="color: #4f46e5;">Interviewer Analysis:</strong> ${escapeHtml(q.feedback)}
                                </div>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- SECTION 4: Benchmark Model Answer & Study Recommendations -->
            ${(evaluation?.model_improved_answer || evaluation?.interviewer_follow_up) ? `
            <div class="pdf-avoid-break" style="margin-bottom: 16px;">
                <div style="margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                    <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
                        3. Benchmark Model Answer & Study Recommendations
                    </h3>
                </div>

                ${evaluation.model_improved_answer ? `
                    <div style="
                        background-color: #f8fafc;
                        border: 1px solid #cbd5e1;
                        border-radius: 7px;
                        padding: 10px 14px;
                        margin-bottom: 8px;
                    ">
                        <div style="font-size: 11px; font-weight: 800; color: #4f46e5; margin-bottom: 3px; text-transform: uppercase;">
                            💡 Exemplary Staff-Level Response Structure
                        </div>
                        <div style="font-size: 10.5px; color: #334155; line-height: 1.45;">
                            ${escapeHtml(evaluation.model_improved_answer)}
                        </div>
                    </div>
                ` : ''}

                ${evaluation.interviewer_follow_up ? `
                    <div style="
                        background-color: #f8fafc;
                        border: 1px solid #cbd5e1;
                        border-radius: 7px;
                        padding: 10px 14px;
                    ">
                        <div style="font-size: 11px; font-weight: 800; color: #059669; margin-bottom: 3px; text-transform: uppercase;">
                            🔭 Recommended Deep-Dive Follow-Up Topic
                        </div>
                        <div style="font-size: 10.5px; color: #334155; line-height: 1.45;">
                            ${escapeHtml(evaluation.interviewer_follow_up)}
                        </div>
                    </div>
                ` : ''}
            </div>
            ` : ''}

            <!-- Page 2 Footer Bar -->
            <div style="
                border-top: 1px solid #e2e8f0;
                padding-top: 10px;
                margin-top: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 9.5px;
                color: #94a3b8;
            ">
                <div>
                    Generated automatically by <strong>CareerOS AI Interview Platform</strong> • Full-Duplex Voice Engine
                </div>
                <div>
                    Official Candidate Record • Page 2 of 2
                </div>
            </div>
        </div>
    </div>
    `;
};

/**
 * Downloads the interview report as a pixel-perfect, publication-grade PDF file
 */
export const downloadInterviewReportPdf = async ({
    evaluation = {},
    targetRole = 'Backend Developer',
    modeTitle = 'Technical & Core CS',
    difficulty = 'Medium',
    candidateName = 'Candidate',
    questions = [],
    questionAttempts = []
}) => {
    const safeCandidateName = (candidateName || 'Candidate')
        .trim()
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_');
    const safeRole = (targetRole || 'Software_Engineer')
        .trim()
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_');
    
    const filename = `CareerOS_Interview_Scorecard_${safeCandidateName}_${safeRole}_${Date.now()}.pdf`;

    // 1. Generate the HTML string
    const htmlContent = buildInterviewReportHtml({
        evaluation,
        targetRole,
        modeTitle,
        difficulty,
        candidateName: safeCandidateName,
        questions,
        questionAttempts
    });

    // 2. Create an isolated off-screen mount container
    const mountContainer = document.createElement('div');
    mountContainer.id = 'careeros-interview-pdf-mount';
    mountContainer.style.position = 'fixed';
    mountContainer.style.top = '0';
    mountContainer.style.left = '0';
    mountContainer.style.width = '794px';
    mountContainer.style.zIndex = '-99999';
    mountContainer.style.pointerEvents = 'none';
    mountContainer.style.backgroundColor = '#ffffff';
    mountContainer.innerHTML = htmlContent;

    document.body.appendChild(mountContainer);

    try {
        const html2pdf = await loadHtml2Pdf();

        const opt = {
            margin: [8, 8, 8, 8],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2, // 2x DPI for crystal clear text and graphics
                useCORS: true,
                letterRendering: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 794
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            },
            pagebreak: {
                mode: ['css', 'legacy'],
                before: '.html2pdf__page-break',
                avoid: ['.pdf-avoid-break']
            }
        };

        const targetEl = mountContainer.firstElementChild || mountContainer;
        await html2pdf().set(opt).from(targetEl).save();

        return { success: true, filename };
    } catch (err) {
        console.warn('html2pdf download encountered an issue, initiating print view fallback:', err);
        fallbackPrintPdf(htmlContent, filename);
        return { success: true, fallback: true, filename };
    } finally {
        if (mountContainer && mountContainer.parentNode) {
            mountContainer.parentNode.removeChild(mountContainer);
        }
    }
};

/**
 * Fallback print-to-PDF via isolated iframe if html2pdf encounters browser restrictions
 */
const fallbackPrintPdf = (htmlContent, title) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>${title}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 8mm;
                    }
                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: #ffffff;
                    }
                    .html2pdf__page-break {
                        page-break-before: always !important;
                        break-before: page !important;
                    }
                    .pdf-avoid-break {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
        </html>
    `);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
            if (iframe.parentNode) {
                document.body.removeChild(iframe);
            }
        }, 2000);
    }, 400);
};
