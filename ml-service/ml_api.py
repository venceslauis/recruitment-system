from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

model = joblib.load("model/candidate_rank_model.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    # Extract all 7 features (with backwards-compatible defaults)
    experience = data.get("experience", 0)
    skills = data.get("skills", [])
    skill_count = len(skills) if isinstance(skills, list) else int(skills)
    education_level = data.get("education_level", 2)   # default: Bachelor's
    cert_count = data.get("cert_count", 0)
    project_count = data.get("project_count", 0)
    skill_relevance = data.get("skill_relevance", 50)  # SBERT score if available
    leadership = data.get("leadership", 0)

    features = [[experience, skill_count, education_level, 
                  cert_count, project_count, skill_relevance, leadership]]

    score = model.predict(features)[0]
    score = float(np.clip(score, 10, 99))

    return jsonify({
        "score": round(score, 2),
        "features_used": {
            "experience": experience,
            "skill_count": skill_count,
            "education_level": education_level,
            "cert_count": cert_count,
            "project_count": project_count,
            "skill_relevance": skill_relevance,
            "leadership": leadership
        }
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "GradientBoostingRegressor"})

if __name__ == "__main__":
    app.run(port=8000)