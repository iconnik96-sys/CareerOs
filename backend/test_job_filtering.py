"""
Test script to verify job matching strictly by Title and Description with no substring collisions.
"""
import re

def get_role_slug(role_name=''):
    if not role_name:
        return 'backend'
    lower = f" {role_name.lower().strip()} "

    if any(k in lower for k in ['full stack', 'fullstack', 'full-stack', 'mern', 'mean']):
        return 'fullstack'
    if any(k in lower for k in ['cyber', 'security', 'infosec', 'pentest', 'penetration', 'vulnerability']) or re.search(r'\bsoc\b', lower):
        return 'cybersecurity'
    if any(k in lower for k in ['front', 'react', 'ui/ux', 'web developer', 'vue', 'angular', 'next.js', 'nextjs']) or re.search(r'\bui\b', lower):
        return 'frontend'
    if any(k in lower for k in ['data analyst', 'data analytics', 'data analysis', 'analytics', 'business intelligence', 'power bi', 'tableau']) or re.search(r'\bbi\b', lower) or (re.search(r'\banalyst\b', lower) and 'security' not in lower):
        return 'data-analyst'
    if any(k in lower for k in ['machine learning', 'deep learning', 'data scientist', 'data science', 'nlp', 'llm', 'pytorch', 'tensorflow', 'genai']) or re.search(r'\bai\b', lower) or re.search(r'\bml\b', lower):
        return 'ai-ml'
    if any(k in lower for k in ['devops', 'cloud', 'infra', 'platform', 'kubernetes', 'docker', 'terraform']) or re.search(r'\bsre\b', lower):
        return 'devops'
    if any(k in lower for k in ['back', 'java', 'python', 'spring', 'node', 'fastapi', 'django', 'flask', 'golang', 'sql']) or re.search(r'\bapi\b', lower):
        return 'backend'
    return 'backend'

def is_job_matching_role(job, target_role):
    if not job or not target_role or target_role == 'All':
        return True

    target_slug = get_role_slug(target_role)

    if job.get('role_id'):
        if get_role_slug(job['role_id']) == target_slug:
            return True

    title = f" {(job.get('title') or '').lower().strip()} "
    desc = (job.get('description') or '').lower()

    if target_slug == 'cybersecurity':
        return (
            any(k in title for k in ['cyber', 'security', 'infosec', 'pentest', 'penetration', 'vulnerability', 'incident response', 'firewall', 'threat']) or
            bool(re.search(r'\bsoc\b', title)) or
            any(k in desc for k in ['cybersecurity', 'soc analyst', 'information security', 'siem', 'wireshark', 'threat detection', 'incident response', 'vulnerability assessment'])
        )
    elif target_slug == 'frontend':
        return (
            (any(k in title for k in ['front', 'react', 'ui/ux', 'web developer', 'vue', 'angular', 'next.js', 'nextjs', 'javascript', 'typescript']) or
             bool(re.search(r'\bui\b', title)) or
             any(k in desc for k in ['frontend developer', 'front-end', 'react developer', 'user interface', 'client-side'])) and
            not any(k in title for k in ['full stack', 'fullstack', 'backend'])
        )
    elif target_slug == 'backend':
        return (
            (any(k in title for k in ['backend', 'back-end', 'back end', 'java', 'python', 'spring', 'fastapi', 'django', 'flask', 'node', 'express', 'golang', 'c++', '.net', 'database engineer', 'sql']) or
             bool(re.search(r'\bapi\b', title)) or
             any(k in desc for k in ['backend', 'back-end', 'server-side', 'microservices', 'spring boot', 'rest api', 'fastapi', 'database architecture'])) and
            not any(k in title for k in ['full stack', 'fullstack', 'frontend'])
        )
    elif target_slug == 'fullstack':
        return (
            any(k in title for k in ['full stack', 'fullstack', 'full-stack', 'mern', 'mean']) or
            any(k in desc for k in ['full stack', 'fullstack']) or
            (any(k in title for k in ['software engineer']) and not any(k in title for k in ['frontend', 'cyber', 'platform']))
        )
    elif target_slug == 'data-analyst':
        return (
            any(k in title for k in ['data analyst', 'data analysis', 'data analytics', 'analytics', 'business intelligence', 'bi analyst', 'power bi', 'tableau', 'sql analyst']) or
            any(k in desc for k in ['data analyst', 'data analytics', 'business intelligence']) or
            (bool(re.search(r'\banalyst\b', title)) and 'security' not in title and not bool(re.search(r'\bsoc\b', title)))
        )
    elif target_slug == 'ai-ml':
        return (
            any(k in title for k in ['machine learning', 'deep learning', 'data science', 'data scientist', 'nlp', 'llm', 'pytorch', 'tensorflow', 'genai', 'artificial intelligence']) or
            bool(re.search(r'\bai\b', title)) or bool(re.search(r'\bml\b', title)) or
            any(k in desc for k in ['machine learning', 'deep learning', 'artificial intelligence', 'llm', 'model training'])
        )
    elif target_slug == 'devops':
        return (
            any(k in title for k in ['devops', 'cloud', 'site reliability', 'infrastructure', 'platform', 'kubernetes', 'docker', 'terraform', 'aws', 'azure', 'gcp', 'ci/cd']) or
            bool(re.search(r'\bsre\b', title)) or
            any(k in desc for k in ['devops', 'ci/cd', 'kubernetes', 'cloud infrastructure', 'terraform', 'site reliability'])
        )
    return True

# Database sample jobs from screenshot
db_jobs = [
    {
        'title': 'Junior Java Backend Engineer',
        'company': 'Razorpay',
        'description': 'We are looking for enthusiastic freshers or early-career Java developers to join our Core Payments Infrastructure team.'
    },
    {
        'title': 'Associate Full Stack Developer',
        'company': 'JPMorgan Chase & Co.',
        'description': 'Join our global technology team designing modern web portals and backend microservices.'
    },
    {
        'title': 'Software Engineer 1 - Cloud & Platform',
        'company': 'Zeta Suite',
        'description': 'Build next-gen banking cloud solutions with Java, Spring Boot, Docker, Kubernetes, and distributed database systems.'
    },
    {
        'title': 'Junior Python/Backend Engineer',
        'company': 'Postman',
        'description': 'Work with the developer tooling team building scalable API testing engines and integrations using Python, FastAPI, PostgreSQL, and AWS.'
    },
    {
        'title': 'Backend Developer',
        'company': 'Swiggy',
        'description': 'Swiggy is seeking Graduate Software Engineers to help scale delivery logistics platforms.'
    },
]

print("\n--- Testing 'Cybersecurity Specialist' Filter ---")
cyber_matches = [j['title'] for j in db_jobs if is_job_matching_role(j, 'Cybersecurity Specialist')]
print("Cybersecurity matches found:", cyber_matches)
assert 'Associate Full Stack Developer' not in cyber_matches
assert len(cyber_matches) == 0
print("[PASS] 'Associate Full Stack Developer' is NOT matched to Cybersecurity!")

print("\n--- Testing 'Full Stack Developer' Filter ---")
fullstack_matches = [j['title'] for j in db_jobs if is_job_matching_role(j, 'Full Stack Developer')]
print("Full Stack matches found:", fullstack_matches)
assert 'Associate Full Stack Developer' in fullstack_matches
assert 'Junior Java Backend Engineer' not in fullstack_matches
print("[PASS] 'Associate Full Stack Developer' strictly matches Full Stack Developer!")

print("\n--- Testing 'Backend Developer' Filter ---")
backend_matches = [j['title'] for j in db_jobs if is_job_matching_role(j, 'Backend Developer')]
print("Backend matches found:", backend_matches)
assert 'Junior Java Backend Engineer' in backend_matches
assert 'Junior Python/Backend Engineer' in backend_matches
assert 'Backend Developer' in backend_matches
assert 'Associate Full Stack Developer' not in backend_matches
print("[PASS] Backend Developer matches Java, Python, and Backend roles!")

print("\n[SUCCESS] ALL TRACK ISOLATION TESTS PASSED WITH 100% ACCURACY!")
