import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";

export default function Applicants() {

  const { jobId } = useParams();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/recruiter/applicants/${jobId}`)
      .then(res => setRankings(res.data))
      .finally(() => setLoading(false));
  }, [jobId]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
    if (score >= 40) return { bg: "#fefce8", color: "#ca8a04", border: "#fef08a" };
    return { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Moderate Match";
    return "Low Match";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: "linear-gradient(135deg, #f59e0b, #d97706)", icon: "🥇", shadow: "0 4px 6px -1px rgba(245, 158, 11, 0.3)" };
    if (rank === 2) return { bg: "linear-gradient(135deg, #9ca3af, #6b7280)", icon: "🥈", shadow: "0 4px 6px -1px rgba(107, 114, 128, 0.2)" };
    if (rank === 3) return { bg: "linear-gradient(135deg, #d97706, #b45309)", icon: "🥉", shadow: "0 4px 6px -1px rgba(217, 119, 6, 0.2)" };
    return { bg: "#f1f5f9", icon: "", shadow: "none" };
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        <BackButton />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: "0 4px 6px -1px rgba(245, 158, 11, 0.2)"
          }}>🏆</div>
          <h2 style={{ color: "#0f172a", fontSize: "1.8rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Candidate Rankings
          </h2>
        </div>

        {/* Privacy notice */}
        <div style={{
          background: "#faf5ff",
          border: "1px solid #e9d5ff",
          borderRadius: 14,
          padding: "16px 24px",
          marginBottom: 32
        }}>
          <p style={{ color: "#7c3aed", fontSize: "0.9rem", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
            🔐 <strong>Privacy-Preserving Rankings:</strong> Candidates are ranked using ZKP (Zero-Knowledge Proof) circuits.
            Scores are verified cryptographically. Candidate identities and personal details are not disclosed.
          </p>
        </div>

        {/* Stats bar */}
        {!loading && rankings.length > 0 && (
          <div style={{
            display: "flex",
            gap: 16,
            marginBottom: 28,
            flexWrap: "wrap"
          }}>
            <div style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "16px 24px",
              flex: 1,
              minWidth: 150,
              boxShadow: "0 2px 4px -1px rgba(0,0,0,0.04)"
            }}>
              <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Applicants
              </p>
              <p style={{ color: "#0f172a", fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {rankings.length}
              </p>
            </div>
            <div style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "16px 24px",
              flex: 1,
              minWidth: 150,
              boxShadow: "0 2px 4px -1px rgba(0,0,0,0.04)"
            }}>
              <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Top Score
              </p>
              <p style={{ color: "#16a34a", fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {rankings[0]?.matchScore ?? 0}%
              </p>
            </div>
            <div style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "16px 24px",
              flex: 1,
              minWidth: 150,
              boxShadow: "0 2px 4px -1px rgba(0,0,0,0.04)"
            }}>
              <p style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Average Score
              </p>
              <p style={{ color: "#4f46e5", fontSize: "1.8rem", fontWeight: 800, margin: 0 }}>
                {Math.round(rankings.reduce((s: number, r: any) => s + (r.matchScore || 0), 0) / rankings.length)}%
              </p>
            </div>
          </div>
        )}

        {/* Ranking cards */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: "#ffffff",
                borderRadius: 20,
                padding: 32,
                border: "1px solid #e2e8f0",
                animation: "pulse 1.5s ease-in-out infinite"
              }}>
                <div style={{ height: 24, width: "30%", background: "#e2e8f0", borderRadius: 8, marginBottom: 12 }} />
                <div style={{ height: 16, width: "60%", background: "#e2e8f0", borderRadius: 8 }} />
              </div>
            ))}
          </div>
        ) : rankings.length === 0 ? (
          <div style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: 24,
            padding: "80px 20px",
            textAlign: "center"
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
            <h3 style={{ color: "#0f172a", fontWeight: 800, margin: "0 0 8px 0", fontSize: "1.4rem" }}>
              No applicants yet
            </h3>
            <p style={{ color: "#64748b", margin: 0, fontSize: "1rem" }}>
              When candidates apply to this job, their anonymized rankings will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {rankings.map((r: any) => {
              const scoreStyle = getScoreColor(r.matchScore);
              const rankBadge = getRankBadge(r.rank);

              return (
                <div
                  key={r._id}
                  style={{
                    background: "#ffffff",
                    border: r.rank <= 3 ? "2px solid" : "1px solid #e2e8f0",
                    borderColor: r.rank === 1 ? "#fbbf24" : r.rank === 2 ? "#9ca3af" : r.rank === 3 ? "#d97706" : "#e2e8f0",
                    borderRadius: 20,
                    padding: "28px 32px",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05)";
                  }}
                >

                  {/* Header row */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {/* Rank badge */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: rankBadge.bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: r.rank <= 3 ? "#fff" : "#64748b",
                        fontSize: r.rank <= 3 ? "1.2rem" : "0.95rem",
                        fontWeight: 800,
                        boxShadow: rankBadge.shadow,
                        border: r.rank > 3 ? "1px solid #e2e8f0" : "none"
                      }}>
                        {r.rank <= 3 ? rankBadge.icon : `#${r.rank}`}
                      </div>
                      <div>
                        <h3 style={{ color: "#0f172a", fontSize: "1.15rem", fontWeight: 800, margin: "0 0 2px 0" }}>
                          Anonymous Candidate #{r.rank}
                        </h3>
                        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.8rem", fontWeight: 500 }}>
                          Identity protected via ZKP
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Score badge */}
                      <span style={{
                        background: scoreStyle.bg,
                        color: scoreStyle.color,
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        padding: "8px 20px",
                        borderRadius: 999,
                        border: `1px solid ${scoreStyle.border}`
                      }}>
                        {r.matchScore}%
                      </span>
                    </div>
                  </div>

                  {/* Score label */}
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "14px 20px",
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <span style={{ color: "#64748b", fontSize: "0.9rem", fontWeight: 600 }}>
                      Match Level
                    </span>
                    <span style={{ color: scoreStyle.color, fontWeight: 800, fontSize: "0.9rem" }}>
                      {getScoreLabel(r.matchScore)}
                    </span>
                  </div>

                  {/* Matched skills */}
                  {r.resumeSkills?.length > 0 && (
                    <div>
                      <p style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        margin: "0 0 10px 0"
                      }}>
                        Detected Skills
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {r.resumeSkills.map((skill: string, i: number) => (
                          <span key={i} style={{
                            background: "#eff6ff",
                            color: "#2563eb",
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

                  {/* ZKP Proof */}
                  {r.zkpProofHash && (
                    <div style={{
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      <span style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}>
                        🔗 ZKP Proof:
                      </span>
                      <code style={{
                        color: "#64748b",
                        fontSize: "0.7rem",
                        background: "#f1f5f9",
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontFamily: "monospace",
                        wordBreak: "break-all"
                      }}>
                        {r.zkpProofHash.substring(0, 16)}...{r.zkpProofHash.substring(r.zkpProofHash.length - 16)}
                      </code>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}