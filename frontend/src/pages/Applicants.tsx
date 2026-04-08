import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";

const Applicants: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) =>
    setExpandedId(prev => (prev === id ? null : id));

  return (
    <div className="min-h-screen p-8 mt-16 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-glow mb-2">Applicants</h1>
          <p className="text-gray-300">Ranked by AI-scored skill coverage, integrity, and verified certificates.</p>
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
        <div className="space-y-4">
          {applicants.length > 0 ? applicants.map((app, index) => (
            <div key={app._id} className="glass rounded-3xl overflow-hidden transition-all duration-300">

              {/* ── Main Row ── */}
              <div
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggleExpand(app._id)}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0
                    ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-glow-yellow'
                    : index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                    : index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700'
                    : 'bg-white/10'}`}>
                    #{app.rank}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-1">{app.name}</h3>
                    <div className="text-sm text-gray-400 flex items-center gap-4">
                      <span>{app.email}</span>
                      <span>|</span>
                      <span>{app.phone}</span>
                    </div>
                    {/* Score bar */}
                    {app.scoreDetails && (
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">
                          Skills: {Math.round(app.scoreDetails.skillScore || 0)}
                        </span>
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
                          Integrity: {Math.round(app.scoreDetails.integrityScore || 0)}
                        </span>
                        <span className="bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                          Certs: {Math.round(app.scoreDetails.certificateBonus || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-lg">
                    {Math.round(app.matchScore)} <span className="text-base text-gray-400">/ 100</span>
                  </div>
                  <div className="text-xs font-mono text-gray-500 bg-black/30 px-3 py-1 rounded-full border border-white/5 truncate max-w-[200px]" title={app.zkpProofHash}>
                    Proof: {app.zkpProofHash?.substring(0, 12)}...
                  </div>
                  <span className="text-xs text-gray-500">{expandedId === app._id ? "▲ Hide details" : "▼ View details"}</span>
                </div>
              </div>

              {/* ── Expanded Skill Breakdown ── */}
              {expandedId === app._id && app.scoreDetails?.skillBreakdown?.length > 0 && (
                <div className="border-t border-white/10 px-6 pb-6 pt-4">
                  <p className="text-sm text-gray-400 font-semibold mb-3 uppercase tracking-widest">Skill Coverage Breakdown</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {app.scoreDetails.skillBreakdown.map((s: any, i: number) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm border
                          ${s.matched
                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{s.matched ? '✅' : '❌'}</span>
                          <span className="font-medium">{s.skill}</span>
                        </span>
                        <span className="text-xs opacity-70">{s.similarity?.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    {app.scoreDetails.skillBreakdown.filter((s: any) => s.matched).length} / {app.scoreDetails.skillBreakdown.length} required skills matched
                  </p>
                </div>
              )}

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