import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";

const Applicants: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const { data } = await API.get(`/recruiter/applicants/${jobId}`);
        setApplicants(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [jobId]);

  return (
    <div className="min-h-screen p-8 mt-16 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-glow mb-2">Applicants</h1>
          <p className="text-gray-300">Ranked by Semantic Score and ZKP validated Eligibility Match.</p>
        </div>
        <Link to="/recruiter/home" className="text-blue-300 hover:text-white font-semibold transition-colors">
          &larr; Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {applicants.length > 0 ? applicants.map((app, index) => (
            <div key={app._id} className="glass p-6 rounded-3xl flex items-center justify-between hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-glow-yellow' : index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700' : 'bg-white/10'}`}>
                  #{app.rank}
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-1">{app.name}</h3>
                  <div className="text-sm text-gray-400 flex items-center gap-4">
                    <span>Email: {app.email}</span>
                    <span>|</span>
                    <span>Phone: {app.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-lg">
                  {Math.round(app.matchScore)} <span className="text-base text-gray-400">Score</span>
                </div>
                <div className="mt-2 text-xs font-mono text-gray-500 bg-black/30 px-3 py-1 rounded-full border border-white/5 truncate max-w-[200px]" title={app.zkpProofHash}>
                  Proof: {app.zkpProofHash?.substring(0, 12)}...
                </div>
              </div>
            </div>
          )) : (
            <div className="glass text-center py-20 rounded-3xl text-gray-400">
              No candidates have applied to this job yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Applicants;