import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RecruiterHome() {

  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const recruiterId = localStorage.getItem("userId");
    if (!recruiterId) {
      navigate("/");
      return;
    }
    axios.get(`http://localhost:5000/api/recruiter/myJobs/${recruiterId}`)
      .then(res => setJobs(res.data));
  }, [navigate]);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 36
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.2)"
            }}>📋</div>
            <h2 style={{ color: "#0f172a", fontSize: "1.8rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              My Job Listings
            </h2>
          </div>

          <button
            onClick={() => navigate("/post-job")}
            style={{
              background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px 24px",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
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
            + Post New Job
          </button>
        </div>

        {/* Jobs list */}
        {jobs.length === 0 ? (
          <div style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: 24,
            padding: "80px 20px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
            <h3 style={{ color: "#0f172a", fontWeight: 800, margin: "0 0 8px 0", fontSize: "1.4rem" }}>
              No jobs posted yet
            </h3>
            <p style={{ color: "#64748b", margin: 0, fontSize: "1rem" }}>
              Click "Post New Job" in the top right to create your first listing!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {jobs.map((job: any) => (
              <div
                key={job._id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
                  padding: "28px 32px",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "#93c5fd";
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.08)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: "#0f172a", fontSize: "1.35rem", fontWeight: 800, margin: "0 0 8px 0", letterSpacing: "-0.01em" }}>
                      {job.title}
                    </h3>

                    {job.company && (
                      <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 14px 0", fontWeight: 500 }}>
                        🏢 {job.company}
                      </p>
                    )}

                    {/* Skill criteria with weights */}
                    {job.skillCriteria && job.skillCriteria.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          margin: "0 0 8px 0"
                        }}>
                          🔐 ZKP Skill Criteria
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {job.skillCriteria.map((c: any, index: number) => (
                            <span key={index} style={{
                              background: "#faf5ff",
                              color: "#7c3aed",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              padding: "5px 14px",
                              borderRadius: 8,
                              border: "1px solid #e9d5ff"
                            }}>
                              {c.skill} — {c.weight}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Regular skills (backward compat) */}
                    {(!job.skillCriteria || job.skillCriteria.length === 0) && job.skills && job.skills.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                        {job.skills.map((skill: string, index: number) => (
                          <span key={index} style={{
                            background: "#f0fdf4",
                            color: "#16a34a",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            padding: "4px 12px",
                            borderRadius: 8,
                            border: "1px solid #bbf7d0"
                          }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { window.location.href = `/applicants/${job._id}`; }}
                    style={{
                      background: "#f8fafc",
                      color: "#4f46e5",
                      border: "1px solid #cbd5e1",
                      borderRadius: 12,
                      padding: "10px 24px",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      flexShrink: 0
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#eff6ff";
                      e.currentTarget.style.borderColor = "#bfdbfe";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#cbd5e1";
                    }}
                  >
                    View Rankings →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}