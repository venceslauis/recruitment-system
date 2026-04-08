const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const { VertexAI } = require('@google-cloud/vertexai');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

// ─── Document AI Setup ────────────────────────────────────────────────────────
const endpoint = process.env.PREDICTION_ENDPOINT || "";
const match = endpoint.match(/projects\/(\d+)\/locations\/([^\/]+)\/processors\/([a-zA-Z0-9]+)/);

const projectId = process.env.VERTEX_PROJECT_ID || (match ? match[1] : "");
const docAiLocation = process.env.LOCATION || (match ? match[2] : "us");
const processorId = match ? match[3] : "";

let docAiClient = null;
try {
  docAiClient = new DocumentProcessorServiceClient();
} catch (err) {
  console.warn("WARNING: Document AI client failed to initialize.");
}

// ─── Vertex AI Setup ─────────────────────────────────────────────────────────
const vertexLocation = process.env.VERTEX_LOCATION || "us-central1";

// Try model names in priority order until one works
const MODEL_FALLBACK_CHAIN = [
  process.env.VERTEX_MODEL || "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash-002",
];

let vertexAI = null;
let geminiModel = null;
try {
  vertexAI = new VertexAI({ project: projectId, location: vertexLocation });
  geminiModel = vertexAI.getGenerativeModel({ model: MODEL_FALLBACK_CHAIN[0] });
  console.log(`Vertex AI ready [model: ${MODEL_FALLBACK_CHAIN[0]}], location=${vertexLocation}`);
} catch (err) {
  console.warn("WARNING: Vertex AI client failed to initialize:", err.message);
}

// ─── Helper: Detect MIME type ─────────────────────────────────────────────────
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':  return 'application/pdf';
    case '.png':  return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.txt':  return 'text/plain';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:      return 'application/pdf';
  }
}

// ─── Stage 1: Document AI OCR ─────────────────────────────────────────────────
async function processDocument(filePath) {
  try {
    const mimeType = getMimeType(filePath);

    // Fast-path: local parsing for .txt
    if (mimeType === 'text/plain') {
      console.log("📄 Reading plain text file locally...");
      const text = fs.readFileSync(filePath, 'utf8');
      return { success: true, text };
    }

    // Fast-path: local parsing for .docx using mammoth
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log("📄 Extracting text from DOCX locally using mammoth...");
      const result = await mammoth.extractRawText({ path: filePath });
      return { success: true, text: result.value };
    }

    if (!docAiClient) {
      return { success: false, error: "Document AI credentials missing.", text: "" };
    }

    const file = fs.readFileSync(filePath);
    const name = `projects/${projectId}/locations/${docAiLocation}/processors/${processorId}`;
    console.log("🚀 Sending document to Document AI...");
    console.log("Processor Path:", name);

    const [result] = await docAiClient.processDocument({
      name,
      rawDocument: {
        content: file.toString('base64'),
        mimeType: getMimeType(filePath),
      },
    });

    const text = result.document.text;
    console.log("✅ OCR Success");
    console.log(`📝 Extracted length: ${text.length}`);

    return { success: true, text };
  } catch (error) {
    console.error('OCR Error:', error.message);
    return { success: false, error: error.message, text: "" };
  }
}

// ─── Stage 2: Privacy-Safe PII Extraction (LOCAL — never leaves server) ───────
function extractPIILocally(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const phoneRawMatch = text.match(/(?:\+?(\d{1,3})[\s\-]?)?(\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})/);
  let phone = "";
  if (phoneRawMatch) {
    // Strip all non-digits, then take last 10 digits (removes country code like +91)
    const digits = phoneRawMatch[0].replace(/\D/g, "");
    phone = digits.slice(-10);
    if (phone.length !== 10) phone = ""; // Discard if not exactly 10 digits
  }
  const cgpaMatch  = text.match(/(?:cgpa|gpa|cpi)[\s:\-]*([0-9]{1,2}(?:\.[0-9]{1,2})?)/i);
  const expMatch   = text.match(/([0-9]+(?:\.[0-9]+)?)\+?\s*years?(?:\s*of)?\s*experience/i);
  const degreeMatch= text.match(/(b\.?tech|b\.?e\.?|b\.?sc|m\.?tech|m\.?sc|bca|mca|bba|mba|ph\.?d|bachelor(?:'s)?|master(?:'s)?)/i);

  // Name heuristic: first short line with no digits/email
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = "";
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    if (lines[i].split(' ').length <= 5 && !lines[i].includes('@') && !/\d/.test(lines[i])) {
      name = lines[i].replace(/[^a-zA-Z\s]/g, "").trim();
      if (name.length > 2) break;
    }
  }

  return {
    name,
    email:      emailMatch  ? emailMatch[0]            : "",
    phone,
    cgpa:       cgpaMatch   ? parseFloat(cgpaMatch[1])  : "",
    experience: expMatch    ? parseFloat(expMatch[1])   : "",
    degree:     degreeMatch ? degreeMatch[0]             : "",
  };
}

// ─── Stage 3: Anonymize text before sending to Vertex AI ─────────────────────
function anonymizeText(text, pii) {
  let anon = text;
  if (pii.email) anon = anon.replace(new RegExp(pii.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[EMAIL]');
  if (pii.phone) anon = anon.replace(new RegExp(pii.phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[PHONE]');
  if (pii.name && pii.name.length > 2) anon = anon.replace(new RegExp(pii.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[CANDIDATE]');
  return anon;
}

// ─── Helper: Invoke Vertex AI with Exponential Backoff + Model Fallback ──────
async function invokeVertexAIWithRetry(prompt, retries = 3) {
  if (!vertexAI) return null;

  for (const modelName of MODEL_FALLBACK_CHAIN) {
    let attempt = 0;
    while (attempt < retries) {
      try {
        console.log(`🧠 Invoking Vertex AI [model: ${modelName}, attempt: ${attempt + 1}/${retries}]...`);
        const model = vertexAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.candidates[0].content.parts[0].text.trim();
        const cleaned = responseText.replace(/```json|```/g, "").trim();
        return { parsed: JSON.parse(cleaned), modelName };
      } catch (err) {
        if (err.message && err.message.includes("404")) {
          console.warn(`Model '${modelName}' not available (404), trying next model...`);
          break; // Move to next model immediately
        }

        attempt++;
        const isRateLimit = err.message && (err.message.includes("429") || err.message.includes("quota") || err.message.includes("rate limit"));

        if (attempt >= retries || (!isRateLimit && attempt >= 1)) {
          console.error(`Vertex AI error [model: ${modelName}]:`, err.message);
          break; // Stop retrying this model on non-rate-limit errors or if exhausted
        }

        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`⏳ Vertex AI Rate Limit / Intermittent Error. Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return null;
}

// ─── Stage 4: Vertex AI — Structured extraction with model fallback ──────────
async function extractWithVertexAI(anonymizedText) {
  if (!vertexAI) {
    console.warn("Vertex AI unavailable — falling back to heuristics.");
    return null;
  }

  const prompt = `You are a resume parser. Extract structured information from this resume text.
Return ONLY a valid JSON object with exactly these keys:
{
  "skills": "comma-separated list of technical skills only (no bullets, no summaries)",
  "projects": "brief list of project titles/descriptions, one per line",
  "internships": "brief list of internships/work experience, one per line"
}

Rules:
- skills: Only include actual technical skills (languages, tools, frameworks). No sentences.
- Remove ALL bullet points (•, -, *, etc.)
- Do NOT include summaries or objectives in any field
- If a field has no data, return an empty string ""
- Return ONLY the JSON, no markdown, no explanation

Resume text:
${anonymizedText.slice(0, 3000)}`;

  const aiResult = await invokeVertexAIWithRetry(prompt);
  if (aiResult && aiResult.parsed) {
    console.log(`✅ Vertex AI extraction complete [model: ${aiResult.modelName}]`);
    return aiResult.parsed;
  }

  console.warn("All Vertex AI models exhausted/failed — falling back to heuristics.");
  return null;
}

// ─── Heuristic fallback (if Vertex AI unavailable) ───────────────────────────
function heuristicExtract(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const allSectionKws = ["skills","technical skills","core competencies","technologies",
    "projects","personal projects","academic projects","internships","experience",
    "work experience","employment","education","academic background","summary",
    "profile","about","objective","professional summary","tools","frameworks","software",
    "certifications","achievements","awards"];

  const getSectionContent = (keywords) => {
    let inSection = false, sectionLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (keywords.some(kw => line === kw || line.startsWith(kw + ":"))) { inSection = true; continue; }
      if (inSection) {
        if (allSectionKws.some(kw => line === kw || line.startsWith(kw + ":"))) break;
        sectionLines.push(lines[i]);
      }
    }
    return sectionLines;
  };

  const sanitize = (t) => t
    .replace(/[•●▪\-*\u2022\u25CF\u25AA]/g, ' ')
    .replace(/\s+/g, ' ').replace(/ ,/g, ',')
    .replace(/^[, ]+/, '').replace(/[, ]+$/, '')
    .replace(/,+/g, ',').trim();

  return {
    skills:      sanitize(getSectionContent(["skills","technical skills","core competencies","technologies"]).join(", ")),
    projects:    sanitize(getSectionContent(["projects","personal projects","academic projects"]).join("\n")),
    internships: sanitize(getSectionContent(["internships","experience","work experience","employment"]).join("\n")),
  };
}

// ─── Main Public Interface ────────────────────────────────────────────────────
async function extractText(filePath) {
  const result = await processDocument(filePath);
  if (!result.success) throw new Error(result.error);
  return result.text;
}

async function extractResumeFeatures(text) {
  // Stage 1: Extract PII locally (never sent externally)
  const pii = extractPIILocally(text);

  // Stage 2: Anonymize the text
  const anonymized = anonymizeText(text, pii);

  // Stage 3: Try Vertex AI for clean structured extraction
  let aiExtracted = await extractWithVertexAI(anonymized);

  // Stage 4: Fallback to heuristics if Vertex AI failed
  if (!aiExtracted) {
    aiExtracted = heuristicExtract(text);
  }

  // Combine: PII from local extraction + content from Vertex AI
  return {
    name:        pii.name,
    email:       pii.email,
    phone:       pii.phone,
    cgpa:        pii.cgpa,
    experience:  pii.experience,
    degree:      pii.degree,
    skills:      (aiExtracted.skills || "").slice(0, 1000),
    projects:    (aiExtracted.projects || "").slice(0, 1000),
    internships: (aiExtracted.internships || "").slice(0, 1000),
  };
}

// ─── Fuzzy Name Matcher ───────────────────────────────────────────────────────
// Returns a 0-1 similarity score between two names
// Handles: abbreviations ("Kavin S" vs "Kavin Sathish"), case, extra spaces
function fuzzyNameMatch(nameA, nameB) {
  if (!nameA || !nameB) return 0;

  const normalize = (s) => s.toLowerCase().trim().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ");
  const a = normalize(nameA);
  const b = normalize(nameB);

  if (a === b) return 1.0;

  const tokensA = a.split(" ");
  const tokensB = b.split(" ");

  // Check if all tokens of shorter name exist in longer (handles abbreviations)
  const shorter = tokensA.length <= tokensB.length ? tokensA : tokensB;
  const longer  = tokensA.length <= tokensB.length ? tokensB : tokensA;

  // Match: first name must match, remaining tokens checked by initial or full match
  let matchCount = 0;
  for (const token of shorter) {
    const found = longer.some(t => t === token || t.startsWith(token) || token.startsWith(t[0]));
    if (found) matchCount++;
  }

  return matchCount / shorter.length;
}

// ─── Certificate Feature Extractor (Vertex AI + Heuristic fallback) ───────────
async function extractCertificateFeatures(text) {
  // First try Vertex AI for accurate structured extraction
  if (vertexAI) {
    const prompt = `You are a certificate parser. Extract structured fields from this certificate text.
Return ONLY a valid JSON object with exactly these keys:
{
  "recipientName": "full name of the person who received the certificate",
  "certificateTitle": "title or name of the course/achievement/program",
  "issuingOrganization": "organization or institution that issued the certificate",
  "completionDate": "date of completion or issue (as string, empty if not found)"
}

Rules:
- recipientName: The actual person's name — look for phrases like 'awarded to', 'certifies that', 'presented to', 'this is to certify', 'completed by'
- certificateTitle: The course or achievement name — usually the most prominent heading
- Return ONLY the JSON, no markdown, no explanation
- If a field is not found, use an empty string ""

Certificate text:
${text.slice(0, 2000)}`;

    const aiResult = await invokeVertexAIWithRetry(prompt);
    if (aiResult && aiResult.parsed) {
      const parsed = aiResult.parsed;
      console.log(`✅ Certificate parsed by Vertex AI [model: ${aiResult.modelName}]`);
      return {
        name:                parsed.recipientName || "",
        title:               parsed.certificateTitle || "",
        issuingOrganization: parsed.issuingOrganization || "",
        completionDate:      parsed.completionDate || "",
        parsedBy:            "vertex-ai"
      };
    }
  }

  // Heuristic fallback
  console.warn("Certificate falling back to heuristic extraction.");
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = "";
  const nameTriggers = ["awarded to","presented to","certifies that","this certificate is given to","successfully completed","completed by","this is to certify"];
  for (let i = 0; i < lines.length; i++) {
    if (nameTriggers.some(t => lines[i].toLowerCase().includes(t))) {
      if (i + 1 < lines.length) name = lines[i + 1];
      break;
    }
  }
  const title = lines.length > 0 ? lines[0] + (lines.length > 1 ? " " + lines[1] : "") : "";
  return { name, title, issuingOrganization: "", completionDate: "", parsedBy: "heuristic" };
}

// ─── Vertex AI Integrity Scorer ───────────────────────────────────────────────
// Uses LLM to judge the QUALITY and RELEVANCE of candidate answers,
// not just semantic similarity. Returns a score 0–100.
async function scoreIntegrityWithLLM(questions, candidateAnswers, integrityWeight) {
  if (!vertexAI || !questions || !candidateAnswers) return null;

  // Anonymize candidate answers before sending to Vertex AI
  const safeAnswers = candidateAnswers
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[EMAIL]')
    .replace(/(?:\+?\d{1,3}[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/g, '[PHONE]');

  const questionsText = Array.isArray(questions) ? questions.join("\n") : questions;

  const prompt = `You are an expert HR assessor evaluating a candidate's integrity and honesty.

Evaluate the quality of the candidate's answers to the following integrity questions.
Consider: relevance, thoughtfulness, honesty, specificity, and maturity of response.

INTEGRITY QUESTIONS:
${questionsText}

CANDIDATE ANSWERS:
${safeAnswers.slice(0, 1500)}

Score the answers on a scale of 0 to 100 where:
- 0–20: Irrelevant, too short, or evasive answers
- 21–40: Vague answers with little substance
- 41–60: Acceptable answers, somewhat relevant
- 61–80: Good, thoughtful answers with specific examples
- 81–100: Excellent, mature, honest and detailed answers

Return ONLY a valid JSON object:
{
  "score": <number 0-100>,
  "justification": "<one sentence reason>"
}

Return ONLY the JSON. No markdown. No extra text.`;

  const aiResult = await invokeVertexAIWithRetry(prompt);
  if (aiResult && aiResult.parsed) {
    const parsed = aiResult.parsed;
    const score = Math.min(100, Math.max(0, Number(parsed.score) || 0));
    console.log(`🧠 Integrity LLM score: ${score}/100 — ${parsed.justification} [model: ${aiResult.modelName}]`);
    return (score / 100) * integrityWeight;
  }

  console.warn("All LLM models failed for integrity — caller should fall back to SBERT.");
  return null;
}

module.exports = {
  extractText,
  extractResumeFeatures,
  extractCertificateFeatures,
  processDocument,
  fuzzyNameMatch,
  scoreIntegrityWithLLM,
};