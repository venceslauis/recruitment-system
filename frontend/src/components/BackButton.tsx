import { useNavigate } from "react-router-dom";

export default function BackButton() {

  const navigate = useNavigate();

  const goBack = () => {
    const role = localStorage.getItem("role");
    if (role === "candidate") navigate("/candidate/home");
    else if (role === "recruiter") navigate("/recruiter/home");
    else navigate("/");
  };

  return (
    <button
      onClick={goBack}
      style={{
        background: "#ffffff",
        color: "#64748b",
        border: "1px solid #cbd5e1",
        borderRadius: 10,
        padding: "8px 18px",
        fontSize: "0.9rem",
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: 24,
        transition: "all 0.2s",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "#f8fafc";
        e.currentTarget.style.color = "#0f172a";
        e.currentTarget.style.borderColor = "#94a3b8";
        e.currentTarget.style.transform = "translateX(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "#ffffff";
        e.currentTarget.style.color = "#64748b";
        e.currentTarget.style.borderColor = "#cbd5e1";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      ← Back
    </button>
  );
}