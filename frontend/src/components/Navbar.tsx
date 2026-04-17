import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-white/10 px-8 py-4 flex justify-between items-center transition-all bg-black/40 backdrop-blur-xl">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-indigo-400 hover:opacity-80 transition-opacity">
          PrivacyProof Recruiter
        </Link>
        <Link to="/issuer" className="text-[10px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full hover:bg-emerald-500/20 transition-all">
          Issuer Portal
        </Link>
      </div>

      <div className="flex gap-4 items-center">
        {role === "candidate" && (
          <>
            <Link to="/candidate/home" className="text-gray-300 hover:text-white font-semibold transition-colors">
              Jobs Feed
            </Link>
            <Link to="/my-applications" className="text-gray-300 hover:text-white font-semibold transition-colors">
              My Applications
            </Link>
          </>
        )}

        {role === "recruiter" && (
          <>
            <Link to="/recruiter/home" className="text-gray-300 hover:text-white font-semibold transition-colors">
              Dashboard
            </Link>
            <Link to="/post-job" className="text-gray-300 hover:text-white font-semibold transition-colors">
              Post Job
            </Link>
          </>
        )}

        {!role && (
          <>
            <Link to="/" className="text-gray-300 hover:text-white font-semibold transition-colors">
              Login
            </Link>
            <Link to="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl font-bold transition-transform hover:scale-105">
              Register
            </Link>
          </>
        )}

        {role && (
          <button
            onClick={handleLogout}
            className="ml-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-5 py-2 rounded-xl font-bold transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}