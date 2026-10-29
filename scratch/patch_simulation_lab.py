# encoding: utf-8
target = r"c:\Users\nikhi\OneDrive\Desktop\Project\CareerOS\frontend\src\components\simulation\DeveloperSimulationLab.jsx"

with open(target, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update import
old_import = "import { getCompanyById, getLevelData } from '../../data/simulationCatalog';"
new_import = "import { getCompanyById, getLevelData, getInterviewPitchForTask } from '../../data/simulationCatalog';"

if old_import in content:
    content = content.replace(old_import, new_import)
    print("Updated simulationCatalog import.")

# 2. Update generatedReview
old_review_block = """            const generatedReview = {
                status: 'APPROVED',
                score: 96,
                summary: `Outstanding work on ${currentTicketData.code}! You systematically tackled the 3 required changes, satisfied all acceptance criteria, and verified your implementation in WebAssembly before submitting. This code is clean, robust, and production-ready.`,
                criteria_breakdown: criteriaList.map(crit => ({
                    criterion: crit,
                    status: 'PASS',
                    feedback: 'Verified and passing 100% of automated unit and boundary tests under high-concurrency simulation.',
                    points_awarded: Math.floor(100 / criteriaList.length),
                    points_possible: Math.floor(100 / criteriaList.length)
                })),
                star_bullet: `Engineered and verified ${currentTicketData.title} within FinPulse Payments infrastructure, achieving 100% test pass rate and eliminating edge-case failure modes under 15,000 req/sec load.`,
                interview_talking_point: `In a tech interview, highlight ${currentTicketData.code}: explain why edge-case boundary testing is critical in fintech, how you architected the 3 changes without introducing regressions, and how automated verification guaranteed zero production incidents.`
            };"""

new_review_block = """            const pitch = getInterviewPitchForTask(currentTicketData.code);
            const companyName = company?.name || 'enterprise';
            const starBullet = pitch?.elevatorPitch || `Engineered and verified ${currentTicketData.title} within ${companyName} infrastructure, achieving 100% test pass rate and eliminating edge-case failure modes under production load.`;
            const interviewPoint = pitch?.interviewerQuestions?.[0]?.a || `In a tech interview, highlight ${currentTicketData.code}: explain the architecture bottleneck, how you implemented the defensive changes without introducing regressions, and how automated tests verified the fix.`;

            const generatedReview = {
                status: 'APPROVED',
                score: 96,
                summary: `Outstanding work on ${currentTicketData.code} at ${companyName}! You systematically tackled the 3 required changes, satisfied all acceptance criteria, and verified your implementation in WebAssembly before submitting. This code is clean, robust, and production-ready.`,
                criteria_breakdown: criteriaList.map(crit => ({
                    criterion: crit,
                    status: 'PASS',
                    feedback: `Verified and passing 100% of automated unit and boundary tests under high-concurrency simulation for ${companyName}.`,
                    points_awarded: Math.floor(100 / criteriaList.length),
                    points_possible: Math.floor(100 / criteriaList.length)
                })),
                star_bullet: starBullet,
                interview_talking_point: interviewPoint
            };"""

content_lf = content.replace("\r\n", "\n")
if old_review_block.replace("\r\n", "\n") in content_lf:
    content_lf = content_lf.replace(old_review_block.replace("\r\n", "\n"), new_review_block.replace("\r\n", "\n"))
    print("Updated generatedReview in DeveloperSimulationLab.jsx.")
else:
    print("WARNING: old_review_block not found!")

with open(target, "w", encoding="utf-8") as f:
    f.write(content_lf)

print("Saved DeveloperSimulationLab.jsx.")
