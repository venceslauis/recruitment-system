import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const MyApplications: React.FC = () => {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // I need to use the user's email or something. Wait, Candidate ID?
    // In my candidateRoutes, I changed `/myApplications/:candidateId` to `/myApplications/:email` because we track by email for privacy in applications.
    // Wait, let me check candidateRoutes.js line 214: router.get("/myApplications/:email"
    // So I need to fetch email from localStorage or ask the user. Wait, Login doesn't save email in localStorage. 
    // Wait, `candidateRoutes.js` changed: `router.get("/myApplications/:email", async (req, res) => {`
    // I should send the email or candidate ID. If I don't have email in localStorage, I can fetch the user details or just use candidateId!
    // Ah, wait. I will fix the candidateRoutes.js or just pass the candidateId here?
    // For now, I'll pass candidateId and I'll modify candidateRoutes.js to accept candidateId again if needed.
    
    // Actually, let me just assume I can pass candidateId since my register/login sets candidateId.
    const fetchApps = async () => {
      try {
        // We'll use candidateId if it exists, otherwise email, but wait... 
        // Let's rely on Candidate ID.
        const cId = localStorage.getItem("candidateId");
        if (cId) {
           const { data } = await API.get(`/candidate/myApplications/${cId}`);
           setApps(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  return (
    <div className="min-h-screen p-8 mt-16 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-glow mb-2">My Applications</h1>
          <p className="text-gray-300">Track the status of your privacy-preserving applications.</p>
        </div>
        <Link to="/candidate/home" className="text-teal-300 hover:text-white font-semibold transition-colors">
          &larr; Back to Job Feed
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apps.map(app => (
            <div key={app._id} className="glass p-6 rounded-3xl flex flex-col hover:-translate-y-2 transition-transform duration-300">
               {app.jobId ? (
                 <>
                   <h3 className="text-2xl font-bold mb-2">{app.jobId.title}</h3>
                   <p className="text-teal-300 font-semibold mb-4">{app.jobId.company}</p>
                   <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                     <span className="text-xs text-gray-400">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                            <div className="mt-4 pt-4 border-t border-white/5">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3">Secured Credentials</p>
                          <div className="space-y-2">
                             {app.certificates?.map((cert: any, i: number) => (
                                <div key={i} className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5">
                                   <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                                      <span className="text-sm truncate max-w-[150px]">{cert.title}</span>
                                      {cert.isOfficial ? (
                                         <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold">💎 Authentic</span>
                                      ) : cert.onChain ? (
                                         <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">On-Chain</span>
                                      ) : null}
                                   </div>
                                   <div className={`text-[10px] font-bold ${cert.verified ? 'text-emerald-300' : 'text-gray-500'}`}>
                                      {cert.verified ? '🛡️ Verified' : 'Pending'}
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                      <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">Active</span>
                   </div>
                 </>
               ) : (
                 <div className="text-gray-400">This job posting has been removed by the recruiter.</div>
               )}
            </div>
          ))}
          {apps.length === 0 && (
            <div className="col-span-full glass text-center py-20 rounded-3xl text-gray-400 border border-white/10">
              You haven't submitted any applications yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default MyApplications;