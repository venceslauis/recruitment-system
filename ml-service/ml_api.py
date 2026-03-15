from flask import Flask,request,jsonify
import joblib

app = Flask(__name__)

model = joblib.load("model/candidate_rank_model.pkl")

@app.route("/predict",methods=["POST"])
def predict():

    data = request.json

    experience = data.get("experience",1)
    skills = data.get("skills",[])

    skill_count = len(skills)

    features = [[experience,skill_count]]

    score = model.predict(features)[0]

    return jsonify({
        "score":float(score)
    })

if __name__ == "__main__":
    app.run(port=8000)