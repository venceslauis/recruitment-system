import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import joblib
import os

print("=" * 60)
print("  ADVANCED CANDIDATE RANKING MODEL TRAINING")
print("=" * 60)

# ============================================================
# 1. DATASET GENERATION — 20,000 REALISTIC SAMPLES
# ============================================================
print("\nGenerating realistic synthetic candidate dataset (20,000 samples)...")

np.random.seed(42)
n_samples = 20000

# === Feature Generation ===

# Experience: 0 to 25 years (continuous)
experience = np.random.uniform(0, 25, n_samples)

# Skill count: 0 to 30 skills (integer)
skill_count = np.random.randint(0, 31, n_samples)

# Education level: 0=High School, 1=Diploma, 2=Bachelor's, 3=Master's, 4=PhD
education_level = np.random.choice([0, 1, 2, 3, 4], n_samples, p=[0.05, 0.1, 0.5, 0.25, 0.1])

# Certification count: 0-10 certifications
cert_count = np.random.poisson(lam=2, size=n_samples)
cert_count = np.clip(cert_count, 0, 10)

# Project count: 0-20 projects mentioned in resume
project_count = np.random.poisson(lam=4, size=n_samples)
project_count = np.clip(project_count, 0, 20)

# Skill relevance score (simulating SBERT similarity, 0-100)
skill_relevance = np.random.beta(2, 5, n_samples) * 100  # skewed towards lower scores (realistic)

# Leadership experience (boolean, 0 or 1)
leadership = np.random.choice([0, 1], n_samples, p=[0.7, 0.3])

# ============================================================
# 2. REALISTIC NON-LINEAR SCORING FORMULA
# ============================================================

# Experience: Strong returns up to 8 years, then diminishing, slight penalty for >20 (overqualified)
exp_score = np.where(
    experience < 8,
    experience * 3.5,
    np.where(
        experience < 15,
        28 + (experience - 8) * 1.5,
        np.where(
            experience < 20,
            38.5 + (experience - 15) * 0.5,
            41 - (experience - 20) * 0.3  # slight diminish for very senior
        )
    )
)

# Skills: Logarithmic returns (first 5 skills matter a lot)
skill_score = np.log1p(skill_count) * 8

# Education: Step-wise with bonus for higher education
education_score = np.where(
    education_level == 0, 0,
    np.where(education_level == 1, 3,
    np.where(education_level == 2, 6,
    np.where(education_level == 3, 10, 14)))
)

# Certifications: Diminishing returns
cert_score = np.log1p(cert_count) * 4

# Projects: Shows initiative, moderate impact
project_score = np.log1p(project_count) * 3

# Skill relevance: High impact — this is the SBERT similarity score
# Weighted heavily since it represents actual skill-job alignment
relevance_score = skill_relevance * 0.25

# Leadership: Bonus for leadership experience, scaled by experience
leadership_score = leadership * np.where(experience > 3, 5, 2)

# Interaction terms (simulate real-world correlations)
# High experience + relevant skills = bonus
synergy_bonus = np.where(
    (experience > 5) & (skill_relevance > 50),
    3.0,
    0.0
)

# Education + certifications synergy
edu_cert_bonus = np.where(
    (education_level >= 3) & (cert_count >= 2),
    2.0,
    0.0
)

# Noise: Simulate human review variance (different reviewers, different days)
noise = np.random.normal(0, 3, n_samples)

# === Final Score Computation ===
total_score = (
    exp_score + 
    skill_score + 
    education_score + 
    cert_score + 
    project_score + 
    relevance_score + 
    leadership_score + 
    synergy_bonus + 
    edu_cert_bonus + 
    noise
)

# Normalize to 10-99 range
total_score = np.clip(total_score, 10, 99)

# ============================================================
# 3. FEATURE MATRIX
# ============================================================
X = np.column_stack((
    experience,
    skill_count,
    education_level,
    cert_count,
    project_count,
    skill_relevance,
    leadership
))

feature_names = [
    "experience", "skill_count", "education_level", 
    "cert_count", "project_count", "skill_relevance", "leadership"
]

y = total_score

print(f"Dataset shape: {X.shape}")
print(f"Features: {feature_names}")
print(f"Score range: [{y.min():.1f}, {y.max():.1f}]")
print(f"Score mean: {y.mean():.1f}, std: {y.std():.1f}")

# ============================================================
# 4. TRAIN/TEST SPLIT
# ============================================================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"\nTraining samples: {X_train.shape[0]}")
print(f"Testing samples: {X_test.shape[0]}")

# ============================================================
# 5. MODEL TRAINING — Gradient Boosting Regressor
#    (Superior to Random Forest for structured scoring problems)
# ============================================================
print("\nTraining Gradient Boosting Regressor...")
print("(This may take a moment with 20K samples and 500 estimators)")

model = GradientBoostingRegressor(
    n_estimators=500,          # 500 boosting stages
    max_depth=6,               # Moderate depth for complex interactions
    min_samples_split=10,      # Avoid overfitting
    min_samples_leaf=5,        # Minimum samples in leaf
    learning_rate=0.05,        # Conservative learning rate
    subsample=0.8,             # Stochastic gradient boosting
    max_features='sqrt',       # Feature randomization
    random_state=42,
    validation_fraction=0.1,   # Use 10% for early stopping
    n_iter_no_change=20,       # Early stopping patience
    tol=0.001
)

model.fit(X_train, y_train)

# ============================================================
# 6. MODEL EVALUATION
# ============================================================
y_pred_train = model.predict(X_train)
y_pred_test = model.predict(X_test)

# Test metrics
mse = mean_squared_error(y_test, y_pred_test)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y_test, y_pred_test)
r2 = r2_score(y_test, y_pred_test)

# Train metrics (for overfitting check)
r2_train = r2_score(y_train, y_pred_train)

print(f"\n{'=' * 50}")
print(f"  MODEL EVALUATION RESULTS")
print(f"{'=' * 50}")
print(f"  Training R² Score:  {r2_train:.4f}")
print(f"  Testing R² Score:   {r2:.4f}")
print(f"  RMSE:               {rmse:.2f}")
print(f"  MAE:                {mae:.2f}")
print(f"  MSE:                {mse:.2f}")
print(f"{'=' * 50}")

# Overfitting check
overfit_gap = r2_train - r2
if overfit_gap < 0.05:
    print(f"  ✅ No significant overfitting (gap: {overfit_gap:.4f})")
elif overfit_gap < 0.1:
    print(f"  ⚠️  Mild overfitting detected (gap: {overfit_gap:.4f})")
else:
    print(f"  ❌ Significant overfitting (gap: {overfit_gap:.4f})")

# Cross-validation
print(f"\nRunning 5-fold cross-validation...")
cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')
print(f"  CV R² Scores: {cv_scores}")
print(f"  Mean CV R²:   {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# Feature importance
print(f"\n{'=' * 50}")
print(f"  FEATURE IMPORTANCE")
print(f"{'=' * 50}")
importances = model.feature_importances_
sorted_idx = np.argsort(importances)[::-1]
for idx in sorted_idx:
    bar = "█" * int(importances[idx] * 50)
    print(f"  {feature_names[idx]:20s}: {importances[idx]:.4f}  {bar}")

# ============================================================
# 7. SAVE MODEL
# ============================================================
os.makedirs("model", exist_ok=True)

# Save the model
joblib.dump(model, "model/candidate_rank_model.pkl")

# Save feature names for reference
joblib.dump(feature_names, "model/feature_names.pkl")

print(f"\n{'=' * 50}")
print(f"  ✅ Model saved to model/candidate_rank_model.pkl")
print(f"  ✅ Feature names saved to model/feature_names.pkl")
print(f"  ✅ Training complete!")
print(f"{'=' * 50}")

# ============================================================
# 8. SAMPLE PREDICTIONS
# ============================================================
print(f"\n{'=' * 50}")
print(f"  SAMPLE PREDICTIONS")
print(f"{'=' * 50}")

test_cases = [
    {"experience": 0, "skill_count": 2, "education_level": 2, "cert_count": 0, "project_count": 1, "skill_relevance": 30, "leadership": 0, "label": "Fresh Graduate"},
    {"experience": 3, "skill_count": 8, "education_level": 2, "cert_count": 1, "project_count": 4, "skill_relevance": 60, "leadership": 0, "label": "Junior Developer"},
    {"experience": 7, "skill_count": 15, "education_level": 3, "cert_count": 3, "project_count": 8, "skill_relevance": 75, "leadership": 1, "label": "Senior Developer"},
    {"experience": 12, "skill_count": 20, "education_level": 4, "cert_count": 5, "project_count": 12, "skill_relevance": 90, "leadership": 1, "label": "Tech Lead/Expert"},
    {"experience": 5, "skill_count": 10, "education_level": 2, "cert_count": 2, "project_count": 5, "skill_relevance": 20, "leadership": 0, "label": "Weak Match (low relevance)"},
]

for tc in test_cases:
    features = [[tc["experience"], tc["skill_count"], tc["education_level"], 
                  tc["cert_count"], tc["project_count"], tc["skill_relevance"], tc["leadership"]]]
    pred = model.predict(features)[0]
    print(f"  {tc['label']:30s} → Predicted Score: {pred:.1f}")