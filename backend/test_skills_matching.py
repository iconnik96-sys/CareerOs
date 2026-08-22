"""
Test script for Job Details Matching and Missing Skills calculations.
"""

def is_skill_match(a, b):
    if not a or not b:
        return False
    a_low, b_low = a.lower().strip(), b.lower().strip()
    if a_low == b_low:
        return True
    if a_low in b_low or b_low in a_low:
        return True
    a_parts = [p.strip() for p in a_low.replace('/', ',').replace('&', ',').split(',') if p.strip()]
    b_parts = [p.strip() for p in b_low.replace('/', ',').replace('&', ',').split(',') if p.strip()]
    for ap in a_parts:
        for bp in b_parts:
            if ap == bp or (len(ap) > 2 and len(bp) > 2 and (ap in bp or bp in ap)):
                return True
    return False

def parse_job_skills(job):
    raw_skills = job.get('skills')
    if isinstance(raw_skills, list) and raw_skills:
        return raw_skills
    if isinstance(raw_skills, str) and raw_skills.strip():
        s = raw_skills.strip()
        if s.startswith('[') and s.endsWith(']'):
            import json
            try:
                return json.loads(s)
            except:
                pass
        return [item.strip() for item in s.replace('{', '').replace('}', '').split(',') if item.strip()]
    return ['Python', 'SQL', 'Git', 'Docker']

def calculate_skill_match(user_skills, job_skills, job=None):
    req_skills = parse_job_skills(job or {'skills': job_skills})
    matching = []
    missing = []
    for req in req_skills:
        if any(is_skill_match(u, req) for u in user_skills):
            matching.append(req)
        else:
            missing.append(req)
    score = round((len(matching) / len(req_skills)) * 100) if req_skills else 75
    return {'score': score, 'matching': matching, 'missing': missing, 'required': req_skills}

print("\n--- Test 1: Array of skills in database ---")
job1 = {
    'title': 'Junior Java Backend Engineer',
    'skills': ['Java', 'Spring Boot', 'Kafka', 'Docker', 'AWS']
}
user1 = ['Java', 'Spring Boot', 'Git']
res1 = calculate_skill_match(user1, job1['skills'], job1)
print("Result 1:", res1)
assert res1['matching'] == ['Java', 'Spring Boot']
assert res1['missing'] == ['Kafka', 'Docker', 'AWS']
assert res1['score'] == 40
print("[PASS] Test 1: Exact matching and missing skills verified!")

print("\n--- Test 2: Comma-separated string of skills in database ---")
job2 = {
    'title': 'Frontend Engineer',
    'skills': 'React, TypeScript, Next.js, Tailwind CSS'
}
user2 = ['React', 'TypeScript']
res2 = calculate_skill_match(user2, job2['skills'], job2)
print("Result 2:", res2)
assert res2['matching'] == ['React', 'TypeScript']
assert res2['missing'] == ['Next.js', 'Tailwind CSS']
assert res2['score'] == 50
print("[PASS] Test 2: Comma-separated database skills parsed and matched accurately!")

print("\n[SUCCESS] All Job Details Skill Matching tests passed with 100% precision!")
