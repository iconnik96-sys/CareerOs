import os

# 1. Update backend/routers/resume_analyzer.py
with open("backend/routers/resume_analyzer.py", "r", encoding="utf-8") as f:
    ra = f.read()

ra_target = """@router.post("/parse-and-extract-profile", response_model=ExtractedProfileResponse)
async def parse_and_extract_profile(file: UploadFile = File(...)):"""

ra_replacement = """@router.post("/parse-and-extract-profile", response_model=ExtractedProfileResponse)
async def parse_and_extract_profile(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    check_and_consume_quota(user, "resume_scans")"""

ra_norm = ra.replace("\r\n", "\n")
ra_target_norm = ra_target.replace("\r\n", "\n")
ra_rep_norm = ra_replacement.replace("\r\n", "\n")

if ra_target_norm in ra_norm:
    ra_norm = ra_norm.replace(ra_target_norm, ra_rep_norm, 1)
    with open("backend/routers/resume_analyzer.py", "w", encoding="utf-8", newline="\r\n") as f:
        f.write(ra_norm.replace("\n", "\r\n"))
    print("SUCCESS: resume_analyzer.py updated")
else:
    print("ERROR in resume_analyzer.py: target not found")

# 2. Update backend/routers/cover_letter.py
with open("backend/routers/cover_letter.py", "r", encoding="utf-8") as f:
    cl = f.read()

cl_target1 = """@router.post("/outreach-message", response_model=OutreachResponse)
def generate_outreach(req: OutreachRequest):"""

cl_rep1 = """@router.post("/outreach-message", response_model=OutreachResponse)
def generate_outreach(
    req: OutreachRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    check_and_consume_quota(user, "cover_letters")"""

cl_target2 = """@router.post("/rag-company-outreach", response_model=RagCompanyOutreachResponse)
def rag_company_outreach(req: RagCompanyOutreachRequest):"""

cl_rep2 = """@router.post("/rag-company-outreach", response_model=RagCompanyOutreachResponse)
def rag_company_outreach(
    req: RagCompanyOutreachRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    check_and_consume_quota(user, "cover_letters")"""

cl_norm = cl.replace("\r\n", "\n")
if cl_target1.replace("\r\n", "\n") in cl_norm and cl_target2.replace("\r\n", "\n") in cl_norm:
    cl_norm = cl_norm.replace(cl_target1.replace("\r\n", "\n"), cl_rep1.replace("\r\n", "\n"), 1)
    cl_norm = cl_norm.replace(cl_target2.replace("\r\n", "\n"), cl_rep2.replace("\r\n", "\n"), 1)
    with open("backend/routers/cover_letter.py", "w", encoding="utf-8", newline="\r\n") as f:
        f.write(cl_norm.replace("\n", "\r\n"))
    print("SUCCESS: cover_letter.py updated")
else:
    print("ERROR in cover_letter.py: targets not found")

# 3. Update backend/routers/job_matcher.py
with open("backend/routers/job_matcher.py", "r", encoding="utf-8") as f:
    jm = f.read()

jm_target = """@router.post("/rag-semantic-job-match", response_model=RagJobMatchResponse)
def rag_semantic_job_match(req: RagJobMatchRequest):"""

jm_rep = """@router.post("/rag-semantic-job-match", response_model=RagJobMatchResponse)
def rag_semantic_job_match(
    req: RagJobMatchRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    check_and_consume_quota(user, "job_matches")"""

jm_norm = jm.replace("\r\n", "\n")
if jm_target.replace("\r\n", "\n") in jm_norm:
    jm_norm = jm_norm.replace(jm_target.replace("\r\n", "\n"), jm_rep.replace("\r\n", "\n"), 1)
    # Also sanitize resume_snippet in prompt
    old_snippet = """Candidate Resume Text (Snippet):
\"\"\"{resume_snippet}\"\"\""""
    new_snippet = """<untrusted_candidate_resume_snippet>
{sanitize_ai_input(resume_snippet, 2500)}
</untrusted_candidate_resume_snippet>"""
    if old_snippet in jm_norm:
        jm_norm = jm_norm.replace(old_snippet, new_snippet, 1)
    with open("backend/routers/job_matcher.py", "w", encoding="utf-8", newline="\r\n") as f:
        f.write(jm_norm.replace("\n", "\r\n"))
    print("SUCCESS: job_matcher.py updated")
else:
    print("ERROR in job_matcher.py: target not found")

# 4. Update backend/routers/interview_evaluator.py
with open("backend/routers/interview_evaluator.py", "r", encoding="utf-8") as f:
    ie = f.read()

ie_target1 = """@router.post("/generate-interview-questions", response_model=List[InterviewQuestionItem])
def generate_interview_questions(req: QuestionGenRequest):"""

ie_rep1 = """@router.post("/generate-interview-questions", response_model=List[InterviewQuestionItem])
def generate_interview_questions(
    req: QuestionGenRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    check_and_consume_quota(user, "voice_interviews")"""

ie_target2 = """@router.post("/clarify-interview-question", response_model=QuestionClarifyResponse)
def clarify_interview_question(req: QuestionClarifyRequest):"""

ie_rep2 = """@router.post("/clarify-interview-question", response_model=QuestionClarifyResponse)
def clarify_interview_question(
    req: QuestionClarifyRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    check_and_consume_quota(user, "voice_interviews")"""

ie_target3 = """@router.post("/interview-voice-turn", response_model=VoiceTurnResponse)
def interview_voice_turn(req: VoiceTurnRequest):"""

ie_rep3 = """@router.post("/interview-voice-turn", response_model=VoiceTurnResponse)
def interview_voice_turn(
    req: VoiceTurnRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    check_and_consume_quota(user, "voice_interviews")"""

ie_norm = ie.replace("\r\n", "\n")
if ie_target1.replace("\r\n", "\n") in ie_norm:
    ie_norm = ie_norm.replace(ie_target1.replace("\r\n", "\n"), ie_rep1.replace("\r\n", "\n"), 1)
    ie_norm = ie_norm.replace(ie_target2.replace("\r\n", "\n"), ie_rep2.replace("\r\n", "\n"), 1)
    ie_norm = ie_norm.replace(ie_target3.replace("\r\n", "\n"), ie_rep3.replace("\r\n", "\n"), 1)
    # Sanitize voice speech turn
    old_speech = """Candidate's Answer:
\"{req.candidate_speech}\""""
    new_speech = """<untrusted_candidate_answer>
{sanitize_ai_input(req.candidate_speech, 4000)}
</untrusted_candidate_answer>"""
    if old_speech in ie_norm:
        ie_norm = ie_norm.replace(old_speech, new_speech, 1)
    with open("backend/routers/interview_evaluator.py", "w", encoding="utf-8", newline="\r\n") as f:
        f.write(ie_norm.replace("\n", "\r\n"))
    print("SUCCESS: interview_evaluator.py updated")
else:
    print("ERROR in interview_evaluator.py: target not found")

# 5. Update backend/routers/simulation.py
with open("backend/routers/simulation.py", "r", encoding="utf-8") as f:
    sim = f.read()

sim_target1 = """@router.post("/standup", response_model=StandupResponse)
def conduct_daily_standup(req: StandupRequest):"""

sim_rep1 = """@router.post("/standup", response_model=StandupResponse)
def conduct_daily_standup(
    req: StandupRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    check_and_consume_quota(user, "simulations")"""

sim_target2 = """@router.post("/mentor-hint", response_model=MentorHintResponse)
def get_socratic_mentor_hint(req: MentorHintRequest):"""

sim_rep2 = """@router.post("/mentor-hint", response_model=MentorHintResponse)
def get_socratic_mentor_hint(
    req: MentorHintRequest,
    user: Dict[str, Any] = Depends(verify_authenticated_student)
):
    check_and_consume_quota(user, "simulations")"""

sim_norm = sim.replace("\r\n", "\n")
if sim_target1.replace("\r\n", "\n") in sim_norm and sim_target2.replace("\r\n", "\n") in sim_norm:
    sim_norm = sim_norm.replace(sim_target1.replace("\r\n", "\n"), sim_rep1.replace("\r\n", "\n"), 1)
    sim_norm = sim_norm.replace(sim_target2.replace("\r\n", "\n"), sim_rep2.replace("\r\n", "\n"), 1)
    # Sanitize user inputs in standup & mentor hint
    old_standup = """    user_prompt = f\"\"\"Intern Standup Update:
- Yesterday: {req.yesterday_work}
- Today: {req.today_plan}
- Blockers: {req.blockers}
- Active Ticket: {req.current_ticket}\"\"\""""
    new_standup = """    user_prompt = f\"\"\"Intern Standup Update:
- Yesterday: {sanitize_ai_input(req.yesterday_work, 1000)}
- Today: {sanitize_ai_input(req.today_plan, 1000)}
- Blockers: {sanitize_ai_input(req.blockers, 1000)}
- Active Ticket: {sanitize_ai_input(req.current_ticket, 100)}\"\"\""""
    if old_standup in sim_norm:
        sim_norm = sim_norm.replace(old_standup, new_standup, 1)
    
    old_hint = """    user_prompt = f\"\"\"Student Question: {req.question}
Language: {req.language}
Current Code Snippet:
```{req.language}
{req.current_code[:1000]}
```\"\"\""""
    new_hint = """    user_prompt = f\"\"\"Student Question: {sanitize_ai_input(req.question, 1000)}
Language: {sanitize_ai_input(req.language, 50)}
Current Code Snippet:
<untrusted_student_code>
{sanitize_ai_input(req.current_code, 1500)}
</untrusted_student_code>\"\"\""""
    if old_hint in sim_norm:
        sim_norm = sim_norm.replace(old_hint, new_hint, 1)

    with open("backend/routers/simulation.py", "w", encoding="utf-8", newline="\r\n") as f:
        f.write(sim_norm.replace("\n", "\r\n"))
    print("SUCCESS: simulation.py updated")
else:
    print("ERROR in simulation.py: targets not found")

# 6. Update backend/routers/bullet_enhancer.py
with open("backend/routers/bullet_enhancer.py", "r", encoding="utf-8") as f:
    be = f.read()

be_norm = be.replace("\r\n", "\n")
old_be_schema = '  "original": "{req.raw_bullet}",'
new_be_schema = '  "original": "Original raw draft bullet",'
if old_be_schema in be_norm:
    be_norm = be_norm.replace(old_be_schema, new_be_schema, 1)
    with open("backend/routers/bullet_enhancer.py", "w", encoding="utf-8", newline="\r\n") as f:
        f.write(be_norm.replace("\n", "\r\n"))
    print("SUCCESS: bullet_enhancer.py updated")

