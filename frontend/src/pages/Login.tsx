import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e: any) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      if (res.data.userId) {
        localStorage.setItem("userId", res.data.userId);
      }

      if (res.data.candidateId) {
        localStorage.setItem("candidateId", res.data.candidateId);
      }

      if (res.data.role === "candidate") {
        window.location.href = "/candidate/home";
      } else {
        window.location.href = "/recruiter/home";
      }

    } catch (err) {
      alert("Login failed");
    }
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
            background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)"
          }}>
            👋
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
          Welcome Back
        </h2>
        <p style={{ color: "#64748b", textAlign: "center", margin: "0 0 32px 0", fontSize: "1rem" }}>
          Sign in to your account
        </p>

        <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          <input
            type="email"
            placeholder="Email address"
            style={inputStyle}
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
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            style={inputStyle}
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
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "16px",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              marginTop: 8,
              boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(79, 70, 229, 0.3)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(79, 70, 229, 0.2)";
            }}
          >
            Sign In
          </button>

        </form>

        <p style={{ textAlign: "center", color: "#64748b", marginTop: 28, fontSize: "0.95rem" }}>
          New user?{" "}
          <Link
            to="/register"
            style={{ color: "#4f46e5", textDecoration: "none", fontWeight: 700 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
          >
            Register here
          </Link>
        </p>

      </div>

    </div>
  );
}