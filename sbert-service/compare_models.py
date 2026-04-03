import warnings
warnings.filterwarnings("ignore")
import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from sentence_transformers import SentenceTransformer, util

print("Loading models...")
base = SentenceTransformer('all-MiniLM-L6-v2')
tuned = SentenceTransformer('fine_tuned_sbert')
print("Models loaded!\n")

tests = [
    ("Python developer with ML experience", "Machine Learning Engineer role", "HIGH MATCH - skill overlap"),
    ("React frontend developer", "Backend Node.js job", "LOW MATCH - different stack"),
    ("Developed REST APIs using Python Flask deployed on AWS EC2 with Docker", "Senior Backend Developer - Python, AWS, Docker, CI/CD", "HIGH - Resume vs JD"),
    ("I am flexible and willing to work night shifts as needed", "Are you willing to work in night shifts?", "HIGH - Integrity question"),
    ("Experienced chef with French cuisine specialization", "Python Backend Developer - Django, REST APIs", "NO MATCH - wrong field"),
    ("Data analyst with SQL and Python tableau experience", "Data Science role requiring Python and SQL", "HIGH - related field"),
    ("WordPress and PHP developer", "Full Stack JavaScript Developer React Node.js", "LOW - different tech"),
    ("Built machine learning models for fraud detection using scikit-learn and XGBoost", "ML Engineer - Fraud Detection, scikit-learn, Feature Engineering", "HIGH - exact match"),
    ("I had pizza for lunch and watched a movie", "Why are you interested in this position?", "NO MATCH - irrelevant answer"),
    ("Self-taught developer with 3 years freelance React projects", "Junior Web Developer - Portfolio Required", "MEDIUM - partial match"),
]

print(f"{'Test Case':<45} {'Base':>8} {'Tuned':>8} {'Change':>8}")
print("=" * 75)

for t1, t2, label in tests:
    e_base = base.encode([t1, t2])
    e_tuned = tuned.encode([t1, t2])
    s_base = util.cos_sim(e_base[0], e_base[1]).item() * 100
    s_tuned = util.cos_sim(e_tuned[0], e_tuned[1]).item() * 100
    change = s_tuned - s_base
    arrow = "+" if change > 0 else ""
    print(f"{label:<45} {s_base:>7.1f}% {s_tuned:>7.1f}% {arrow}{change:>6.1f}%")

print("=" * 75)
print("Base = pre-trained all-MiniLM-L6-v2")
print("Tuned = fine-tuned on 200+ HR/recruitment pairs")
