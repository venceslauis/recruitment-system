import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
import os

# Example training data
# features: [experience_years, skill_count]

X = np.array([
    [1,3],
    [2,4],
    [3,5],
    [4,6],
    [5,8]
])

# score output
y = np.array([40,55,65,75,90])

model = LinearRegression()

model.fit(X,y)

# create model folder if not exists
os.makedirs("model",exist_ok=True)

joblib.dump(model,"model/candidate_rank_model.pkl")

print("Model trained and saved")