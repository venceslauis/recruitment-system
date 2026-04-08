# Match Score Calculation — Technical Documentation

> **File:** `backend/routes/candidateRoutes.js`  
> **Service:** `backend/services/ocrService.js`  
> **Last updated:** April 2026

---

## Overview

The **Match Score** is a weighted composite score (0–100) that evaluates how well a candidate's profile aligns with a job's requirements. It is calculated at the time of application submission and stored in the database. The score is only visible to the **recruiter** — never exposed to the candidate.

```
matchScore = skillScore + integrityScore + certificateBonus
```

All three components are weighted by the recruiter during job creation and must sum to 100.

---

## Architecture

```
Candidate submits application
          │
          ▼
  ┌───────────────────────────────────────────────┐
  │              PARALLEL SCORING ENGINE           │
  │                                               │
  │  ┌─────────────────┐  ┌────────────────────┐  │
  │  │ Per-Skill SBERT │  │ Vertex AI Gemini   │  │
  │  │ (runs in        │  │ Integrity Judge    │  │
  │  │  parallel for   │  │ (runs in parallel  │  │
  │  │  all skills)    │  │  with skills)      │  │
  │  └────────┬────────┘  └────────┬───────────┘  │
  │           │                    │              │
  │  ┌────────▼────────────────────▼───────────┐  │
  │  │         Certificate Verification        │  │
  │  │  (fuzzy name + SBERT + blockchain*)     │  │
  │  └────────────────────────────────────────┘  │
  └───────────────────────────────────────────────┘
          │
          ▼
  Normalize → Save to DB → ZKP Hash generated
```

---

## Component 1: Skill Score

### Method: Proportional SBERT Scoring (per-skill)

Each required skill defined by the recruiter is scored **independently** using the SBERT fine-tuned model (running locally on port 5000).

### Input
- **Candidate text:** Vertex AI-extracted `skills` field from resume (focused, clean signal)
- **Reference:** Each individual required skill name from recruiter's `skillCriteria`

### Formula

For each skill criterion `i`:

```
contribution_i = (SBERT_similarity_i / 100) × weight_i
```

```
skillScore = Σ contribution_i   for all i
```

### Properties
- **Proportional** — a skill with 70% similarity and weight 15 scores `0.70 × 15 = 10.5`
- **No cliff-edge** — partial knowledge gives partial credit
- **Parallel** — all skill SBERT calls fire simultaneously
- **Privacy-safe** — SBERT runs locally, no external API calls

### Example

| Required Skill | Sim % | Weight | Contribution |
|----------------|-------|--------|-------------|
| Python         | 88%   | 20     | 17.6        |
| Machine Learning | 72% | 20     | 14.4        |
| SQL            | 65%   | 15     | 9.75        |
| Apache Spark   | 22%   | 5      | 1.1         |
| **Total**      |       | **60** | **42.85**   |

> `skillScore = 42.85 / 60 max = 71.4% of skills weight`

---

## Component 2: Integrity Score

### Method: Vertex AI LLM Quality Judgment (with SBERT fallback)

Unlike skills, integrity scoring evaluates the **quality and thoughtfulness** of a candidate's answers — not just semantic closeness.

### Input
- **Candidate:** Free-text answers to integrity questions (anonymized before sending)
- **Reference:** Recruiter's integrity questions

### Anonymization (Privacy Protection)

Before sending to Vertex AI, the candidate's answers are scrubbed:
```
"My email is john@example.com and my mobile +91 9876543210..."
  → "My email is [EMAIL] and my mobile [PHONE]..."
```

### Scoring Rubric (sent to Gemini)

| Score Range | Meaning |
|------------|---------|
| 0–20       | Irrelevant, too short, or evasive |
| 21–40      | Vague, lacks substance |
| 41–60      | Acceptable, somewhat relevant |
| 61–80      | Good, thoughtful with examples |
| 81–100     | Excellent, mature, detailed |

### Formula

```
integrityScore = (LLM_score / 100) × integrityWeight
```

### Fallback
If Vertex AI is unavailable, falls back to SBERT semantic similarity:
```
integrityScore = (SBERT_similarity / 100) × integrityWeight
```

---

## Component 3: Certificate Bonus (k)

### Method: Three-Condition Verification Gate

A certificate earns weight **only if all three conditions are satisfied**:

```
verified = Condition(1) AND Condition(2) AND Condition(3)
```

| Condition | Check | Method |
|-----------|-------|--------|
| (1) Name match | Certificate recipient name ↔ candidate's form name | Fuzzy token match ≥ 0.70 |
| (2) Semantic relevance | Certificate title ↔ job title + required skills | SBERT similarity ≥ 0.5 |
| (3) Blockchain integrity | Certificate hash ↔ private ledger hash | ⏳ Pending blockchain deployment |

### Weight Per Certificate

```
cert_weight = totalCertificateWeight / expectedCertificates
```

### Accumulation Algorithm (k)

```python
k = 0
for each certificate uploaded:
    if verified(cert) AND k < totalCertWeight:
        k = min(k + cert_weight, totalCertWeight)
    # else: cert is listed but earns 0 score

certificateBonus = k
```

### Capping Rule
- Candidate may upload **any number** of certificates
- Score computation **stops** once `k == totalCertificateWeight`
- Extra verified certificates are recorded but **do not increase score**

### Example

```
Recruiter settings: certificateWeight=20, expectedCertificates=2
cert_weight = 20 / 2 = 10 per certificate

Candidate uploads 3 certificates:
  Cert A: name ✅, sem 0.82 ✅, blockchain ✅ → verified → k = 0 + 10 = 10
  Cert B: name ✅, sem 0.61 ✅, blockchain ✅ → verified → k = 10 + 10 = 20 ← STOP
  Cert C: name ✅, sem 0.55 ✅, blockchain ✅ → verified but k == 20 → score = 0

certificateBonus = 20
```

---

## Final Score Computation

### Raw Score

```
rawScore = skillScore + integrityScore + certificateBonus
```

### Normalization (Fix 4)

To guarantee a 0–100 output even if recruiter weights sum to 99 or 101 due to rounding:

```javascript
totalDefinedWeight = sum(skillWeights) + integrityWeight + certWeight

if |totalDefinedWeight - 100| > 1:
    matchScore = (rawScore / totalDefinedWeight) × 100   // normalize
else:
    matchScore = rawScore                                  // weights are clean
```

### Complete Example

| Component | Sim/Score | Weight | Score |
|-----------|-----------|--------|-------|
| Skills (proportional) | various | 60 | 42.85 |
| Integrity (LLM: 76/100) | 0.76 | 20 | 15.2 |
| Certificates (2/2 verified) | — | 20 | 20.0 |
| **Total** | | **100** | **78.05** |

```
matchScore = 42.85 + 15.20 + 20.00 = 78.05 / 100
```

---

## ZKP Proof Hash

After computing the final `matchScore`, a **tamper-evident audit hash** is generated:

```javascript
proofData = JSON.stringify({ email, jobId, matchScore, timestamp })
zkpProofHash = SHA-256(proofData)
```

This hash is:
- Stored in MongoDB alongside the application
- Displayed in the recruiter dashboard (first 12 chars visible)
- Used to verify score integrity — if any field changes, hash will not match

---

## Recruiter Dashboard View

The recruiter sees applicants ranked by `matchScore` (descending), with:
- **Score pills:** Skills | Integrity | Certs
- **Expandable breakdown:** Per-skill similarity % and contribution
- **ZKP proof hash** for audit trail
- Candidate's PII (name, email, phone)

> ⚠️ **Privacy guarantee:** The candidate NEVER sees their own score, breakdown, or ranking. This is enforced at the API level in `recruiterRoutes.js`.

---

## Privacy Summary

| Data | Where processed | Sent externally? |
|------|----------------|-----------------|
| Resume PII (name, email, phone) | Local regex | ❌ Never |
| Skills text | SBERT (local) | ❌ Never |
| Anonymized skills/projects | Vertex AI | ✅ (PII stripped) |
| Integrity answers | Vertex AI | ✅ (PII stripped) |
| Certificate text | Vertex AI | ✅ (no PII) |
| matchScore | MongoDB (your server) | ❌ Never |

---

## Technology Stack

| Component | Technology | Where |
|-----------|-----------|-------|
| OCR | Google Cloud Document AI | GCP |
| Resume parsing | Vertex AI Gemini 2.5-flash | GCP (private) |
| Skill similarity | Fine-tuned SBERT | Local (port 5000) |
| Integrity judging | Vertex AI Gemini | GCP (private) |
| Cert title matching | Fine-tuned SBERT | Local (port 5000) |
| Name matching | Custom fuzzy token algorithm | Local |
| Score storage | MongoDB | Your server |
| Audit trail | SHA-256 ZKP Hash | Your server |

---

*⏳ Blockchain condition (3) for certificate verification will replace the `cond3_blockchain = true` placeholder after ledger deployment.*
