import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

print("Generating realistic synthetic candidate dataset (5,000 samples)...")

# Generate 5000 random samples
np.random.seed(42)
n_samples = 5000

# Experience ranges from 0 to 20 years
experience = np.random.uniform(0, 20, n_samples)

# Skill count ranges from 0 to 25 skills
skill_count = np.random.randint(0, 26, n_samples)

# Non-linear scoring function to simulate reality:
# 1. Experience gives strong returns up to 10 years, then diminishing returns.
exp_score = np.where(experience < 10, experience * 4, 40 + (experience - 10) * 1) 

# 2. Skills give logarithmic returns (first 5 skills matter a lot, 20th skill barely moves the needle).
skill_score = np.log1p(skill_count) * 15 

# Add random noise to simulate human review variance
noise = np.random.normal(0, 4, n_samples)

# Combine and cap between 10 and 99
total_score = exp_score + skill_score + noise
total_score = np.clip(total_score, 10, 99)

# Format for sklearn
X = np.column_stack((experience, skill_count))
y = total_score

# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Advanced Random Forest Model...")
model = RandomForestRegressor(
    n_estimators=100,      # 100 distinct decision trees
    max_depth=10,          # Control depth to prevent overfitting
    min_samples_split=5,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"\n--- Model Evaluation ---")
print(f"Mean Squared Error: {mse:.2f} (Avg variance from true score)")
print(f"R2 Score:           {r2:.4f} (1.0 is a perfect correlation)")
print(f"------------------------\n")

# Create model folder if not exists
os.makedirs("model", exist_ok=True)

# Save the upgraded model
joblib.dump(model, "model/candidate_rank_model.pkl")

print("✅ Model successfully trained and saved to model/candidate_rank_model.pkl")