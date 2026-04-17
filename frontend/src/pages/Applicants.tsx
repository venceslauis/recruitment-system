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

                  {/* ── Certificate Verification Section ── */}
                  <div className="mt-8 border-t border-white/5 pt-5">
                    <p className="text-sm text-gray-400 font-semibold mb-4 uppercase tracking-widest">Verified Credentials & Proofs</p>
                    <div className="space-y-4">
                      {app.certificates?.length > 0 ? app.certificates.map((cert: any, i: number) => (
                        <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl gap-4">
                          <div className="flex items-start gap-4">
                             <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                             </div>
                             <div>
                                <h4 className="font-bold text-white leading-tight">{cert.title || "Untitled Certificate"}</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Issued to: <span className="text-gray-200">{cert.name}</span></p>
                                {cert.fileHash && (
                                   <p className="text-[10px] font-mono text-gray-500 mt-2 bg-black/40 px-2 py-1 rounded inline-block">
                                      Fingerprint: <span className="text-teal-500/80">{cert.fileHash.substring(0, 16)}...</span>
                                   </p>
                                )}
                             </div>
                          </div>
                          <div className="flex items-center gap-3 self-end md:self-center">
                            {cert.isOfficial ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-bold shadow-sm shadow-blue-500/20">
                                <span className="text-lg">💎</span>
                                Authentic (Issued at Source)
                              </div>
                            ) : cert.onChain && cert.verified ? (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold shadow-sm shadow-emerald-500/20">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                                Verified On Blockchain
                              </div>
                            ) : (
                              <div className="px-3 py-1.5 bg-gray-500/10 text-gray-400 border border-white/10 rounded-full text-xs">
                                Verification Pending
                              </div>
                            )}
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-gray-500 italic">No certificates provided with this application.</p>
                      )}
                    </div>
                  </div>
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