import { useState } from "react";
import axios from "axios";
import BackButton from "../components/BackButton";
import { useNavigate } from "react-router-dom";

interface SkillCriteria {
  skill: string;
  weight: number;
}

export default function PostJob() {

  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");

  // Skill criteria with weightage
  const [skillCriteria, setSkillCriteria] = useState<SkillCriteria[]>([
    { skill: "", weight: 0 }
  ]);

  const totalWeight = skillCriteria.reduce((sum, c) => sum + c.weight, 0);

  const addSkillCriteria = () => {
    setSkillCriteria([...skillCriteria, { skill: "", weight: 0 }]);
  };

  const removeSkillCriteria = (index: number) => {
    setSkillCriteria(skillCriteria.filter((_, i) => i !== index));
  };

  const updateSkillCriteria = (index: number, field: keyof SkillCriteria, value: string | number) => {
    const updated = [...skillCriteria];
    if (field === "weight") {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = String(value);
    }
    setSkillCriteria(updated);
  };

  const postJob = async () => {
    // Validate
    const validCriteria = skillCriteria.filter(c => c.skill.trim() !== "");

    if (validCriteria.length === 0) {
      alert("Please add at least one skill criteria");
      return;
    }

    const total = validCriteria.reduce((sum, c) => sum + c.weight, 0);
    if (total !== 100) {
      alert(`Skill weights must sum to 100%. Current total: ${total}%`);
      return;
    }

    const skillArray = validCriteria.map(c => c.skill.trim().toLowerCase());
    const recruiterId = localStorage.getItem("userId");
    
    if (!recruiterId) {
      alert("Error: You must be logged in to post a job.");
      navigate("/");
      return;
    }

    await axios.post("http://localhost:5000/api/recruiter/postJob", {
      title, company, description,
      recruiterId,
      skills: skillArray,
      skillCriteria: validCriteria.map(c => ({
        skill: c.skill.trim().toLowerCase(),
        weight: c.weight
      }))
    });
    alert("Job posted successfully");
    navigate("/recruiter/home");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "16px 18px",
    color: "#0f172a",
    fontSize: "1rem",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box"
  };

  const labelStyle: React.CSSProperties = {
    color: "#334155",
    fontSize: "0.9rem",
    fontWeight: 700,
    marginBottom: 8,
    display: "block",
    letterSpacing: "0.01em"
  };

  return (
    <div style={{
      background: "#f1f5f9",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px"
    }}>

      <div style={{ width: "100%", maxWidth: 700 }}>
        <BackButton />

        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 24,
          padding: "48px 40px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)"
        }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, marginBottom: 16,
              boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)"
            }}>📝</div>
            <h2 style={{ color: "#0f172a", fontSize: "1.75rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              Post a New Job
            </h2>
            <p style={{ color: "#64748b", margin: "8px 0 0 0", fontSize: "1rem" }}>
              Define the role and set ZKP-based skill criteria for candidate matching.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            <div>
              <label style={labelStyle}>Job Title</label>
              <input
                style={inputStyle}
                placeholder="e.g. Frontend Developer"
                value={title}
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
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Company</label>
              <input
                style={inputStyle}
                placeholder="Company Name"
                value={company}
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
                onChange={e => setCompany(e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Job Description</label>
              <textarea
                style={{
                  ...inputStyle,
                  height: 120,
                  resize: "none",
                  fontFamily: "inherit",
                  lineHeight: 1.6
                }}
                placeholder="Describe the job role, responsibilities, etc."
                value={description}
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
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* ZKP Skill Criteria Section */}
            <div>
              <label style={labelStyle}>
                🔐 ZKP Skill Criteria & Weightage
              </label>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0 0 16px 0", fontWeight: 500 }}>
                Define required skills and assign weights that sum to 100%. Candidates will be scored using ZKP circuits based on these criteria.
              </p>

              <div style={{
                background: "#faf5ff",
                border: "1px solid #e9d5ff",
                borderRadius: 16,
                padding: "24px",
              }}>

                {skillCriteria.map((criteria, index) => (
                  <div key={index} style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    marginBottom: index < skillCriteria.length - 1 ? 12 : 0
                  }}>
                    <div style={{ flex: 1 }}>
                      <input
                        style={{
                          ...inputStyle,
                          background: "#ffffff",
                          padding: "12px 14px"
                        }}
                        placeholder="Skill name (e.g. react)"
                        value={criteria.skill}
                        onChange={e => updateSkillCriteria(index, "skill", e.target.value)}
                      />
                    </div>
                    <div style={{ width: 100 }}>
                      <input
                        type="number"
                        style={{
                          ...inputStyle,
                          background: "#ffffff",
                          padding: "12px 14px",
                          textAlign: "center"
                        }}
                        placeholder="%"
                        min={0}
                        max={100}
                        value={criteria.weight || ""}
                        onChange={e => updateSkillCriteria(index, "weight", e.target.value)}
                      />
                    </div>
                    {skillCriteria.length > 1 && (
                      <button
                        onClick={() => removeSkillCriteria(index)}
                        style={{
                          background: "#fef2f2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          borderRadius: 10,
                          width: 36, height: 36,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          transition: "all 0.2s",
                          flexShrink: 0
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "#fee2e2";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "#fef2f2";
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {/* Add skill button */}
                <button
                  onClick={addSkillCriteria}
                  style={{
                    background: "transparent",
                    color: "#7c3aed",
                    border: "1px dashed #c4b5fd",
                    borderRadius: 10,
                    padding: "10px 18px",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    width: "100%",
                    marginTop: 12,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = "#f5f3ff";
                    e.currentTarget.style.borderColor = "#a78bfa";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "#c4b5fd";
                  }}
                >
                  + Add Skill Criteria
                </button>

                {/* Weight total indicator */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid #e9d5ff"
                }}>
                  <span style={{ color: "#6b21a8", fontWeight: 700, fontSize: "0.9rem" }}>
                    Total Weight
                  </span>
                  <span style={{
                    background: totalWeight === 100 ? "#dcfce7" : "#fef2f2",
                    color: totalWeight === 100 ? "#16a34a" : "#dc2626",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    padding: "6px 16px",
                    borderRadius: 999,
                    border: `1px solid ${totalWeight === 100 ? "#bbf7d0" : "#fecaca"}`
                  }}>
                    {totalWeight}% {totalWeight === 100 ? "✓" : `(need 100%)`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={postJob}
              style={{
                background: totalWeight === 100
                  ? "linear-gradient(135deg, #4f46e5, #3b82f6)"
                  : "#94a3b8",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "16px",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: totalWeight === 100 ? "pointer" : "not-allowed",
                transition: "transform 0.2s, box-shadow 0.2s",
                marginTop: 12,
                boxShadow: totalWeight === 100 ? "0 4px 6px -1px rgba(79, 70, 229, 0.2)" : "none"
              }}
              onMouseEnter={e => {
                if (totalWeight === 100) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(79, 70, 229, 0.3)";
                }
              }}
              onMouseLeave={e => {
                if (totalWeight === 100) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(79, 70, 229, 0.2)";
                }
              }}
            >
              🚀 Publish Job
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}