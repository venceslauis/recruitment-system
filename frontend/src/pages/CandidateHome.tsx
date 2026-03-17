import { useEffect, useState } from "react";
import axios from "axios";

export default function CandidateHome() {

  const [jobs, setJobs] = useState<any[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Application modal state
  const [applyingJob, setApplyingJob] = useState<any | null>(null);
  const [applyName, setApplyName] = useState("");
  const [applyAge, setApplyAge] = useState("");
  const [applyFile, setApplyFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ skills: string[] } | null>(null);

  const candidateId = localStorage.getItem("candidateId");
  const validCandidateId = candidateId && candidateId !== "null" ? candidateId : null;

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/candidate/jobs")
      .then(res => setJobs(res.data));

    if (validCandidateId) {
      axios
        .get(`http://localhost:5000/api/candidate/myApplications/${validCandidateId}`)
        .then(res => {
          const ids = new Set<string>(res.data.map((a: any) => a.jobId?._id ?? a.jobId));
          setAppliedJobIds(ids);
        });
    }
  }, []);

  const openApplyModal = (job: any) => {
    setApplyingJob(job);
    setApplyName("");
    setApplyAge("");
    setApplyFile(null);
    setSubmitResult(null);
  };

  const closeApplyModal = () => {
    setApplyingJob(null);
    setApplyName("");
    setApplyAge("");
    setApplyFile(null);
    setSubmitResult(null);
  };

  async function submitApplication() {
    if (!applyingJob) return;
    if (!applyName.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (!applyAge.trim()) {
      alert("Please enter your age.");
      return;
    }
    if (!applyFile) {
      alert("Please upload your resume (PDF).");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("resume", applyFile);
      formData.append("jobId", applyingJob._id);
      formData.append("name", applyName);
      formData.append("age", applyAge);
      if (validCandidateId) {
        formData.append("candidateId", validCandidateId);
      }

      const res = await axios.post("http://localhost:5000/api/candidate/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setAppliedJobIds(prev => new Set(prev).add(applyingJob._id));
      setSubmitResult({ skills: res.data.extractedSkills || [] });

    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to apply. Please try again.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "14px 18px",
    color: "#0f172a",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box"
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.2)"
            }}>💼</div>
            <h2 style={{ color: "#0f172a", fontSize: "1.8rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Available Jobs
            </h2>
          </div>
          <p style={{ color: "#64748b", margin: 0, paddingLeft: 58, fontSize: "1rem" }}>
            {jobs.length} position{jobs.length !== 1 ? "s" : ""} open
          </p>
        </div>

        {/* Job cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 24
        }}>
          {jobs.map((job: any) => {
            const alreadyApplied = appliedJobIds.has(job._id);

            return (
              <div key={job._id} style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 32,
                border: alreadyApplied ? "2px solid #22c55e" : "1px solid #e2e8f0",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                flexDirection: "column",
                gap: 14
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                  if (!alreadyApplied) e.currentTarget.style.borderColor = "#93c5fd";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)";
                  if (!alreadyApplied) e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                {/* Applied badge */}
                {alreadyApplied && (
                  <div style={{
                    alignSelf: "flex-start",
                    background: "#dcfce7",
                    color: "#16a34a",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "4px 14px",
                    borderRadius: 999,
                    letterSpacing: "0.05em",
                  }}>
                    ✓ APPLIED
                  </div>
                )}

                {/* Title */}
                <h3 style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                  lineHeight: 1.3,
                  letterSpacing: "-0.01em"
                }}>
                  {job.title}
                </h3>

                {/* Company */}
                {job.company && (
                   <p style={{ color: "#475569", margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 500 }}>
                     🏢 {job.company}
                   </p>
                )}

                {/* Description */}
                {job.description && (
                  <p style={{
                    color: "#64748b",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    margin: 0,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {job.description}
                  </p>
                )}

                {/* Skills */}
                {job.skills?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {job.skills.map((skill: string, i: number) => (
                      <span key={i} style={{
                        background: "#f1f5f9",
                        color: "#475569",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        padding: "4px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0"
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Skill Weightage info */}
                {job.skillCriteria?.length > 0 && (
                  <div style={{
                    background: "#faf5ff",
                    border: "1px solid #e9d5ff",
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginTop: 4
                  }}>
                    <p style={{ color: "#7c3aed", fontSize: "0.8rem", fontWeight: 700, margin: "0 0 8px 0" }}>
                      🔐 ZKP Scoring Criteria
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {job.skillCriteria.map((c: any, i: number) => (
                        <span key={i} style={{
                          background: "#ede9fe",
                          color: "#6d28d9",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: 6
                        }}>
                          {c.skill}: {c.weight}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply button */}
                <div style={{ marginTop: "auto", paddingTop: 16 }}>
                  {alreadyApplied ? (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      color: "#16a34a",
                      background: "#f0fdf4",
                      padding: "12px",
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      border: "1px solid #bbf7d0"
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Application Submitted
                    </div>
                  ) : (
                    <button
                      onClick={() => openApplyModal(job)}
                      style={{
                        background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 12,
                        padding: "14px 24px",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        width: "100%",
                        boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(79, 70, 229, 0.3)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(79, 70, 229, 0.2)";
                      }}
                    >
                      Apply Now
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ========================= */}
      {/* APPLICATION MODAL         */}
      {/* ========================= */}
      {applyingJob && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: 20
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: 24,
            padding: "40px 36px",
            maxWidth: 520,
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            animation: "fadeIn 0.2s ease-out"
          }}>

            {!submitResult ? (
              <>
                {/* Modal header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                  <div>
                    <h3 style={{ color: "#0f172a", fontSize: "1.4rem", fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.01em" }}>
                      Apply for Position
                    </h3>
                    <p style={{ color: "#64748b", margin: 0, fontSize: "0.95rem" }}>
                      {applyingJob.title} at {applyingJob.company || "Company"}
                    </p>
                  </div>
                  <button
                    onClick={closeApplyModal}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: 10,
                      width: 36, height: 36,
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#64748b",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; }}
                  >
                    ✕
                  </button>
                </div>

                {/* ZKP info banner */}
                <div style={{
                  background: "#faf5ff",
                  border: "1px solid #e9d5ff",
                  borderRadius: 14,
                  padding: "16px 20px",
                  marginBottom: 24
                }}>
                  <p style={{ color: "#7c3aed", fontSize: "0.85rem", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                    🔐 Your resume skills will be matched against job criteria using ZKP circuits.
                    Your personal details (name, age) remain private and are never visible to recruiters.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Name */}
                  <div>
                    <label style={{ color: "#334155", fontSize: "0.9rem", fontWeight: 700, marginBottom: 8, display: "block" }}>
                      Full Name
                    </label>
                    <input
                      style={inputStyle}
                      placeholder="Enter your full name"
                      value={applyName}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4f46e5";
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      onChange={e => setApplyName(e.target.value)}
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label style={{ color: "#334155", fontSize: "0.9rem", fontWeight: 700, marginBottom: 8, display: "block" }}>
                      Age
                    </label>
                    <input
                      type="number"
                      style={inputStyle}
                      placeholder="Enter your age"
                      value={applyAge}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = "#4f46e5";
                        e.currentTarget.style.background = "#ffffff";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.1)";
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.background = "#f8fafc";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                      onChange={e => setApplyAge(e.target.value)}
                    />
                  </div>

                  {/* Resume upload */}
                  <div>
                    <label style={{ color: "#334155", fontSize: "0.9rem", fontWeight: 700, marginBottom: 8, display: "block" }}>
                      📄 Upload Resume (PDF)
                    </label>
                    <div style={{
                      border: applyFile ? "2px solid #22c55e" : "2px dashed #cbd5e1",
                      borderRadius: 14,
                      padding: "24px",
                      textAlign: "center",
                      background: applyFile ? "#f0fdf4" : "#f8fafc",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={e => setApplyFile(e.target.files?.[0] || null)}
                        style={{
                          width: "100%",
                          cursor: "pointer"
                        }}
                      />
                      {applyFile && (
                        <p style={{ color: "#16a34a", fontWeight: 600, margin: "8px 0 0 0", fontSize: "0.85rem" }}>
                          ✓ {applyFile.name}
                        </p>
                      )}
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "8px 0 0 0", fontWeight: 500 }}>
                      Skills will be automatically extracted from your resume
                    </p>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={submitApplication}
                    disabled={submitting}
                    style={{
                      background: submitting ? "#a5b4fc" : "linear-gradient(135deg, #4f46e5, #3b82f6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 12,
                      padding: "16px",
                      fontWeight: 700,
                      fontSize: "1rem",
                      cursor: submitting ? "not-allowed" : "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      marginTop: 4,
                      boxShadow: submitting ? "none" : "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
                    }}
                    onMouseEnter={e => {
                      if (!submitting) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(79, 70, 229, 0.3)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!submitting) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(79, 70, 229, 0.2)";
                      }
                    }}
                  >
                    {submitting ? "Submitting..." : "🚀 Submit Application"}
                  </button>
                </div>
              </>
            ) : (
              /* Success state */
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32, marginBottom: 20,
                  boxShadow: "0 10px 15px -3px rgba(34, 197, 94, 0.3)"
                }}>✓</div>

                <h3 style={{ color: "#0f172a", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 8px 0" }}>
                  Application Submitted!
                </h3>
                <p style={{ color: "#64748b", margin: "0 0 24px 0", fontSize: "1rem" }}>
                  Your application has been submitted securely via ZKP.
                </p>

                {submitResult.skills.length > 0 && (
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "20px",
                    marginBottom: 24,
                    textAlign: "left"
                  }}>
                    <p style={{ color: "#334155", fontSize: "0.85rem", fontWeight: 700, margin: "0 0 10px 0" }}>
                      🛠️ Skills Extracted from Resume:
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {submitResult.skills.map((skill: string, i: number) => (
                        <span key={i} style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          padding: "4px 12px",
                          borderRadius: 8,
                          border: "1px solid #bfdbfe"
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{
                  background: "#faf5ff",
                  border: "1px solid #e9d5ff",
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 24
                }}>
                  <p style={{ color: "#7c3aed", fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
                    🔐 Your score has been computed using ZKP circuits and is only visible to the recruiter as an anonymous ranking.
                  </p>
                </div>

                <button
                  onClick={closeApplyModal}
                  style={{
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    padding: "14px 32px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Modal animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}