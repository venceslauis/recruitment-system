import { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";

export default function MyApplications() {

  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {

    const candidateId = localStorage.getItem("candidateId");

    if (!candidateId || candidateId === "null") {
      console.warn("No candidateId found in localStorage");
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:5000/api/candidate/myApplications/${candidateId}`)
      .then(res => setApps(res.data))
      .catch(err => console.error("Failed to fetch applications:", err))
      .finally(() => setLoading(false));

  }, []);

  const cancelApplication = async (applicationId: string) => {
    if (!window.confirm("Are you sure you want to cancel this application?")) {
      return;
    }

    setCancelingId(applicationId);
    try {
      await axios.delete(`http://localhost:5000/api/candidate/application/${applicationId}`);
      setApps(prev => prev.filter(app => app._id !== applicationId));
    } catch (err) {
      console.error("Failed to cancel application:", err);
      alert("Failed to cancel application. Please try again.");
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        <BackButton />

        {/* Header */}
        <div style={{ marginBottom: "40px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)"
          }}>🚀</div>
          <div>
            <h2 style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#0f172a",
              margin: "0 0 6px 0",
              letterSpacing: "-0.02em"
            }}>
              My Applications
            </h2>
            {!loading && (
              <p style={{ color: "#64748b", margin: 0, fontSize: "1rem" }}>
                {apps.length} job{apps.length !== 1 ? "s" : ""} applied
              </p>
            )}
          </div>
        </div>

        {/* Privacy notice */}
        <div style={{
          background: "#faf5ff",
          border: "1px solid #e9d5ff",
          borderRadius: 14,
          padding: "16px 24px",
          marginBottom: 28
        }}>
          <p style={{ color: "#7c3aed", fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>
            🔐 Your scores and rankings are computed using ZKP circuits and are only visible to recruiters in anonymized form. Your personal details remain private.
          </p>
        </div>

        {/* States */}
        {loading ? (

          /* Loading skeleton */
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: "#ffffff",
                borderRadius: "20px",
                padding: "32px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                animation: "pulse 1.5s ease-in-out infinite"
              }}>
                <div style={{ height: "24px", width: "40%", background: "#e2e8f0", borderRadius: "8px", marginBottom: "16px" }} />
                <div style={{ height: "16px", width: "25%", background: "#e2e8f0", borderRadius: "8px" }} />
              </div>
            ))}
          </div>

        ) : apps.length === 0 ? (

          /* Empty state */
          <div style={{
            background: "#ffffff",
            borderRadius: "24px",
            padding: "80px 40px",
            textAlign: "center",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)",
            border: "1px dashed #cbd5e1"
          }}>
            <div style={{ fontSize: "4.5rem", marginBottom: "20px" }}>📋</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: "0 0 10px 0", letterSpacing: "-0.01em" }}>
              No applications yet
            </h3>
            <p style={{ color: "#64748b", margin: 0, fontSize: "1.05rem" }}>
              Head over to Available Jobs and start applying!
            </p>
          </div>

        ) : (

          /* Application cards grid */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "24px"
          }}>
            {apps.map((a: any, index: number) => (

              <div key={index} style={{
                background: "#ffffff",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#6ee7b7";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0";
                }}
              >

                {/* Top row: status badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    background: "#dcfce7",
                    color: "#16a34a",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    padding: "6px 14px",
                    borderRadius: "999px",
                    letterSpacing: "0.06em",
                    border: "1px solid #bbf7d0"
                  }}>
                    ✓ APPLIED
                  </span>

                  {/* ZKP Privacy badge — instead of showing score */}
                  <span style={{
                    background: "#faf5ff",
                    color: "#7c3aed",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "6px 14px",
                    borderRadius: "999px",
                    border: "1px solid #e9d5ff"
                  }}>
                    🔐 ZKP Protected
                  </span>
                </div>

                {/* Job title */}
                <div>
                  <h3 style={{
                    fontSize: "1.4rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: "0 0 6px 0",
                    letterSpacing: "-0.01em"
                  }}>
                    {a.jobId?.title ?? "Untitled Position"}
                  </h3>
                  {a.jobId?.company && (
                    <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0, fontWeight: 500 }}>
                      🏢 {a.jobId.company}
                    </p>
                  )}
                </div>

                {/* Skills required */}
                {a.jobId?.skills?.length > 0 && (
                  <div>
                    <p style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      margin: "0 0 10px 0"
                    }}>
                      Skills Required
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {a.jobId.skills.map((skill: string, i: number) => (
                        <span key={i} style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          padding: "4px 12px",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0"
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Your extracted skills */}
                {a.resumeSkills?.length > 0 && (
                  <div>
                    <p style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      margin: "0 0 10px 0"
                    }}>
                      Your Matched Skills
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {a.resumeSkills.map((skill: string, i: number) => (
                        <span key={i} style={{
                          background: "#eff6ff",
                          color: "#2563eb",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          padding: "4px 12px",
                          borderRadius: "8px",
                          border: "1px solid #bfdbfe"
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider & Actions — NO score shown */}
                <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                  <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0, fontWeight: 500 }}>
                    Application submitted securely
                  </p>
                  
                  <button
                    onClick={() => cancelApplication(a._id)}
                    disabled={cancelingId === a._id}
                    style={{
                      background: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "10px",
                      padding: "8px 16px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      cursor: cancelingId === a._id ? "not-allowed" : "pointer",
                      opacity: cancelingId === a._id ? 0.6 : 1,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => {
                      if (cancelingId !== a._id) {
                        (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#fca5a5";
                      }
                    }}
                    onMouseLeave={e => {
                      if (cancelingId !== a._id) {
                        (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#fecaca";
                      }
                    }}
                  >
                    {cancelingId === a._id ? "Canceling..." : "Cancel"}
                  </button>
                </div>

              </div>
            ))}
          </div>

        )}

      </div>

      {/* Pulse animation for skeleton */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

    </div>
  );
}