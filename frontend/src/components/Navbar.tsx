import { Link } from "react-router-dom";

export default function Navbar() {

  const role = localStorage.getItem("role");

  const linkStyle: React.CSSProperties = {
    color: "#475569",
    textDecoration: "none",
    fontSize: "0.95rem",
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: 8,
    transition: "all 0.2s"
  };

  return (
    <div style={{
      background: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      padding: "0 32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      height: 70,
      position: "sticky",
      top: 0,
      zIndex: 10,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
    }}>

      {/* Brand */}
      <h2 style={{
        margin: 0,
        fontSize: "1.25rem",
        fontWeight: 800,
        background: "linear-gradient(135deg, #000000ff, #716cddff)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-0.02em"
      }}>
        Privacy Job Portal
      </h2>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>

        {/* Candidate Navbar */}
        {role === "candidate" && (
          <>
            <Link style={linkStyle} to="/candidate/home"
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >
              Jobs
            </Link>

            <Link style={linkStyle} to="/my-applications"
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >
              My Applications
            </Link>
          </>
        )}

        {/* Recruiter Navbar */}
        {role === "recruiter" && (
          <>
            <Link style={linkStyle} to="/recruiter/home"
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >
              Dashboard
            </Link>

            <Link style={linkStyle} to="/post-job"
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >
              Post Job
            </Link>
          </>
        )}

        {/* Logged out */}
        {!role && (
          <>
            <Link style={linkStyle} to="/"
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >
              Login
            </Link>

            <Link style={linkStyle} to="/register"
              onMouseEnter={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#0f172a"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; }}
            >
              Register
            </Link>
          </>
        )}

        {/* Logout */}
        {role && (
          <button
            style={{
              background: "#fee2e2",
              color: "#ef4444",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "7px 18px",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: 12,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fca5a5"; e.currentTarget.style.color = "#b91c1c"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; }}
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
          >
            Logout
          </button>
        )}

      </div>
    </div>
  );
}