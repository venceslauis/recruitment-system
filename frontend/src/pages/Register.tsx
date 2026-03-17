import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");

  const register = async () => {
    await axios.post(
      "http://localhost:5000/api/auth/register",
      { email, password, role }
    );
    alert("Registration successful");
    navigate("/");
  };

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
    <div style={{
      background: "#f1f5f9",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }}>

      <div style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 24,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)"
      }}>

        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <div style={{
            width: 60, height: 60,
            borderRadius: 16,
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)"
          }}>
            👤
          </div>
        </div>

        <h2 style={{
          color: "#0f172a",
          fontSize: "1.75rem",
          fontWeight: 800,
          textAlign: "center",
          margin: "0 0 6px 0",
          letterSpacing: "-0.02em"
        }}>
          Create Account
        </h2>
        <p style={{ color: "#64748b", textAlign: "center", margin: "0 0 32px 0", fontSize: "1rem" }}>
          Join the privacy-first job marketplace
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          <input
            placeholder="Email address"
            style={inputStyle}
            onFocus={e => {
              e.currentTarget.style.borderColor = "#10b981";
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.boxShadow = "none";
            }}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            style={inputStyle}
            onFocus={e => {
              e.currentTarget.style.borderColor = "#10b981";
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.boxShadow = "none";
            }}
            onChange={e => setPassword(e.target.value)}
          />

          <select
            style={{
              ...inputStyle,
              cursor: "pointer",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 16px center"
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = "#10b981";
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.boxShadow = "none";
            }}
            onChange={e => setRole(e.target.value)}
          >
            <option value="candidate">I am a Candidate</option>
            <option value="recruiter">I am a Recruiter</option>
          </select>

          <button
            onClick={register}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "16px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              marginTop: 8,
              boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(16, 185, 129, 0.3)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(16, 185, 129, 0.2)";
            }}
          >
            Create Account
          </button>

        </div>

        <p style={{ textAlign: "center", color: "#64748b", marginTop: 28, fontSize: "0.95rem" }}>
          Already have an account?{" "}
          <Link
            to="/"
            style={{ color: "#10b981", textDecoration: "none", fontWeight: 700 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
          >
            Login here
          </Link>
        </p>

      </div>

    </div>
  );
}