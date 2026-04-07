from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer, util
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Load fine-tuned model if available, otherwise fall back to pre-trained
fine_tuned_path = os.path.join(os.path.dirname(__file__), 'fine_tuned_sbert')
if os.path.exists(fine_tuned_path):
    print(f"Loading fine-tuned SBERT model from '{fine_tuned_path}'")
    model = SentenceTransformer(fine_tuned_path)
else:
    print("Fine-tuned model not found. Using pre-trained 'all-MiniLM-L6-v2'")
    print("Run 'python train.py' to fine-tune the model for better accuracy.")
    model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/match', methods=['POST'])
def match():
    data = request.json

    resume = data.get('resumeText', '')
    job = data.get('jobDescription', '')

    if not resume or not job:
        return jsonify({"score": 0, "error": "Both resumeText and jobDescription are required"})

    embeddings = model.encode([resume, job])
    score = util.cos_sim(embeddings[0], embeddings[1]).item()

    # Clamp score between 0 and 100
    score_pct = max(0, min(100, round(score * 100, 2)))

    return jsonify({
        "score": score_pct
    })

@app.route('/health', methods=['GET'])
def health():
    model_type = "fine-tuned" if os.path.exists(fine_tuned_path) else "pre-trained"
    return jsonify({"status": "ok", "model": model_type})

if __name__ == '__main__':
    app.run(port=5000)