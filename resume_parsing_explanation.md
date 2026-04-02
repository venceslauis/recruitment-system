# Resume Parsing & SBERT Integration in the Privacy Job Portal

## Does the SBERT Model Work Here?
**Yes**, the SBERT (Sentence-BERT) model is actively used in the application. It runs as a microservice written in Python and Flask (`sbert-service/app.py`) on port 5000. 

Whenever a candidate applies for a job and uploads a resume:
1. The backend (`backend/routes/candidateRoutes.js`) extracts text from the resume file.
2. It sends an HTTP POST request to the local SBERT service (`http://127.0.0.1:5000/match`) containing the parsed `resumeText` and the `jobDescription` (recruiter skill criteria).
3. The backend also uses SBERT to verify the applicant's `integrityAnswers` against the actual `integrityCheck.questions` set by the recruiter.

## SBERT Model and Dataset
The application uses the `all-MiniLM-L6-v2` model from the `sentence-transformers` library. 
- **Dataset**: In production (`app.py`), the model is used off-the-shelf as a pre-trained model (`# Load pre-trained model (NO TRAINING)`). The native `all-MiniLM-L6-v2` model is trained on a massive and diverse dataset of over 1 billion sentence pairs including Reddit comments, Quora duplicate questions, Wikipedia paragraphs, and the Stanford Natural Language Inference (SNLI) corpus. 
- **Fine-tuning (Optional)**: In the codebase, there is also a `train.py` script provided with a small dummy dataset containing specific tech-recruitment pairs (e.g., "Python developer with ML experience" vs "Machine Learning Engineer role"). This could be used by you to fine-tune the SBERT model for deeper HR-domain understanding, though it is currently unused in the main API endpoint.

## What is the Use of Resume Parsing in This Project?
Resume parsing automates the screening process and ensures standard evaluation criteria. In this system:
1. **OCR Extraction Tool**: The backend relies on **Tesseract OCR (tesseract.js)** to visually read and parse the text from the uploaded resume file. Even if it's an image or a scanned PDF, Tesseract turns it into raw string text (`resumeText`).
2. **Automated Screening Score**: By making the resume machine-readable, the system avoids manual recruiter bias and dynamically feeds the data into the NLP model.
3. **Calculating Match Score**: It aggregates points to form an overall match score which securely drives the Zero-Knowledge Proof (ZKP) mechanisms.

## How the Similarity Check Works
Once the AI receives the `resumeText` and the `jobDescription`:
1. **Vector Embeddings**: SBERT converts both pieces of text into high-dimensional numerical vectors (Embeddings).
2. **Cosine Similarity**: It measures the mathematical distance (Cosine Similarity, `util.cos_sim`) between the two vectors. If the vectors point in the same direction, the texts are highly related; if they are orthogonal, they are unrelated.
3. **Weight Allocation**: The raw Cosine Similarity score (0.0 to 1.0) is converted into a percentage (0 to 100). The node backend then scales this percentage depending on the specific weight the recruiter assigned to a given skill criteria or integrity question.
4. **Final Result**: The skill text match, integrity answers match, and bonus certificate points are algebraically summed together. This `matchScore` is then hashed and recorded for ZKP (Zero-Knowledge Proof) validation, making sure the application is cryptographically sealed and blindly fair.
