from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer, util
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load pre-trained model (NO TRAINING)
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/match', methods=['POST'])
def match():
    data = request.json

    resume = data['resumeText']
    job = data['jobDescription']

    embeddings = model.encode([resume, job])
    score = util.cos_sim(embeddings[0], embeddings[1]).item()

    return jsonify({
        "score": round(score * 100, 2)
    })

if __name__ == '__main__':
    app.run(port=5000)