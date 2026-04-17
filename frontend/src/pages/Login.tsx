import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      const { data } = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", data.userId);
      if (data.role === "candidate" && data.candidateId) {
        localStorage.setItem("candidateId", data.candidateId);
      }
      
      if (data.role === "candidate") navigate("/candidate/home");
      else if (data.role === "issuer") navigate("/issuer");
      else navigate("/recruiter/home");
    } catch (error: any) {
      setErr(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8 rounded-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse" style={{ animationDelay: "2s" }}></div>
        
        <h2 className="text-4xl font-extrabold text-center mb-8 text-glow text-white">Login</h2>
        
        {err && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-md">
            {err}
          </div>
        )}

        <form onSubmit={handleLogin} className="relative z-10 flex flex-col space-y-5" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Email Address</label>
            <input 
              type="email" 
              required
              autoComplete="off"
              className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-inner"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                autoComplete="new-password"
                className="w-full bg-white bg-opacity-10 border border-white border-opacity-20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-inner pr-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 mt-4 rounded-xl font-bold tracking-wide text-white transition-all transform hover:scale-[1.02] ${loading ? 'bg-gray-500 opacity-70' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg glow'}`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-300 relative z-10">
          Don't have an account? <Link to="/register" className="text-blue-300 font-semibold hover:underline hover:text-blue-100 transition-colors">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;