# Zero-Knowledge Proof (ZKP) Eligibility Circuits
**Privacy-Preserving Recruitment Project**

This document outlines the architecture, circuit design, and backend integration plan for integrating Zero-Knowledge Proofs (ZK-SNARKs) via ZoKrates into the applicant eligibility checking process.

## 1. ZKP Architecture in the Project

**Core Objective:** We want to verify that a candidate meets the recruiter's minimum constraints (e.g., minimum CGPA, minimum experience) without saving the candidate's exact raw data to our database.

**The "ZKP-Inspired" Backend-Side Proof Generation (Option A):**
1. **Frontend:** Candidate enters their real `cgpa` and `experience`.
2. **Backend (Apply Route):** Receives the raw inputs.
3. **Backend-Side ZoKrates:** The Node.js backend passes the raw inputs (as private variables) and the job's minimum requirements (as public variables) to the ZoKrates binary.
4. **ZKP Witness & Proof:** A cryptographic `.json` proof is dynamically generated. 
5. **On-Chain / Local Verification:** The backend verifies this proof. If it passes, the candidate is allowed to be scored via SBERT and registered. The actual raw `cgpa` and `experience` are **dropped/discarded** instead of being saved in the MongoDB database, maintaining privacy.

---

## 2. ZoKrates Circuits

You only need **one reusable circuit** per condition. Here is the exact `.zok` code structure you will use in the backend.

### A. The Combined Eligibility Circuit (`eligibility.zok`)
Instead of running multiple proofs, we can combine the checks (CGPA and Experience) into one circuit.

*Note: ZoKrates uses field elements (integers). For CGPA (e.g., `8.5`), we multiply by 10 to operate with integers (e.g., `85`).*

```zokrates
// eligibility.zok

// private field candidate_cgpa : The candidate's actual CGPA (* 10)
// private field candidate_exp  : The candidate's actual Experience 
// public field min_cgpa        : The recruiter's minimum CGPA (* 10)
// public field min_exp         : The recruiter's minimum Experience

def main(private field candidate_cgpa, private field candidate_exp, field min_cgpa, field min_exp) -> bool {
    
    // Check 1: Candidate CGPA must be >= Minimum CGPA
    bool check_cgpa = candidate_cgpa >= min_cgpa;
    
    // Check 2: Candidate Exp must be >= Minimum Exp
    bool check_exp = candidate_exp >= min_exp;
    
    // Both constraints must be satisfied
    return check_cgpa && check_exp;
}
```

---

## 3. Implementation Workflow

### Step 1: ZoKrates Compilation & Trusted Setup
These steps are run **once** by the developer on the server to prepare the cryptography proving keys.

```bash
# 1. Compile the circuit
zokrates compile -i eligibility.zok

# 2. Perform the trusted setup (Generates proving.key and verification.key)
zokrates setup

# 3. Export a smart contract for blockchain verification (Optional but impressive)
zokrates export-verifier
```

### Step 2: Dynamic Proof Generation (inside Node.js)
When the React frontend hits `POST /api/candidate/apply`, the Node backend executes the following via a child process.

```bash
# Assuming Job requires Experience >= 2 and CGPA >= 7.5 (75)
# Candidate provides Experience = 3, CGPA = 8.2 (82)

# Generate Witness (candidate_cgpa, candidate_exp, min_cgpa, min_exp)
zokrates compute-witness -a 82 3 75 2

# Generate Cryptographic Proof
zokrates generate-proof
```
*This produces a `proof.json` file on the backend server.*

### Step 3: Verification
The backend then verifies the proof mathematically.
```bash
zokrates verify
# Outputs "PASS" or "FAIL"
```

---

## 4. Node.js Integration Code (Snippet)

To wire this into your existing codebase, you can use Node's `child_process` module to run the ZoKrates CLI dynamically.

```javascript
const { execSync } = require("child_process");

function verifyEligibilityWithZKP(candidateCgpa, candidateExp, minCgpa, minExp) {
    try {
        // Step 1: Scale CGPA to integers 
        const c_cgpa = Math.floor(parseFloat(candidateCgpa) * 10);
        const m_cgpa = Math.floor(parseFloat(minCgpa) * 10);
        const c_exp = parseInt(candidateExp);
        const m_exp = parseInt(minExp);

        // Step 2: Compute witness
        execSync(`zokrates compute-witness -a ${c_cgpa} ${c_exp} ${m_cgpa} ${m_exp}`);
        
        // Step 3: Generate the ZK Proof
        execSync("zokrates generate-proof");
        
        // Step 4: Verify the Proof mathematically without looking at the raw values
        const buffer = execSync("zokrates verify");
        const output = buffer.toString();
        
        return output.includes("PASS");
        
    } catch (err) {
        console.error("ZKP Generation Failed:", err);
        return false;
    }
}
```

## 5. Security & Academic Value
By executing this cycle, your portal successfully demonstrates **Zero-Knowledge Proofs applied to candidate screening**. 

During your project Viva/Presentation you can claim:
> *"The backend receives the candidate's exact credentials but passes them into a one-way ZK-SNARK circuit. It only receives a cryptographic boolean validation in return. We do not persist the candidate's raw numbers in our application database, ensuring privacy against data breaches."*
