import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const [otp, setOtp] = useState("");
  
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const navigate = useNavigate();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const { data } = await API.post("/auth/request-otp", { email });
      setOtpSent(true);
      setMsg(data.message);
    } catch (error: any) {
      setErr(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    try {
      await API.post("/auth/register", { email, password, role, otp });
      navigate("/");
    } catch (error: any) {
      setErr(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass w-full max-w-md p-8 rounded-2xl relative overflow-hidden transition-all duration-500">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-teal-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-pulse" style={{ animationDelay: "1s" }}></div>
        
        <h2 className="text-4xl font-extrabold text-center mb-6 text-glow text-white">
          Create Account
        </h2>
        
        {err && <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-4 text-sm">{err}</div>}
        {msg && <div className="bg-green-500 bg-opacity-20 border border-green-500 text-green-200 px-4 py-3 rounded-xl mb-4 text-sm">{msg}</div>}

        {!otpSent ? (
           <form onSubmit={handleRequestOtp} className="relative z-10 flex flex-col space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Role</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => setRole("candidate")} className={`flex-1 py-2 rounded-xl border ${role === 'candidate' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-white/20 text-gray-300'}`}>Candidate</button>
                <button type="button" onClick={() => setRole("recruiter")} className={`flex-1 py-2 rounded-xl border ${role === 'recruiter' ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-transparent border-white/20 text-gray-300'}`}>Recruiter</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner"
                placeholder="you@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 mt-4 rounded-xl font-bold text-white bg-gradient-to-r from-teal-400 to-indigo-500 hover:opacity-90 transition-opacity">
              {loading ? "Sending OTP..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="relative z-10 flex flex-col space-y-4">
            <div className="text-center text-gray-300 mb-2">We sent a 6-digit code to <span className="text-white font-semibold">{email}</span></div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Enter OTP</label>
              <input 
                type="text" required maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center text-2xl tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="000000"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 mt-4 rounded-xl font-bold text-white bg-gradient-to-r from-teal-400 to-indigo-500 hover:opacity-90 transition-opacity">
              {loading ? "Verifying..." : "Register"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-gray-300 relative z-10">
          Already have an account? <Link to="/" className="text-teal-300 font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;