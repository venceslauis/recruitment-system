import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const CandidateHome: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New applied states for apply modal
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applyForm, setApplyForm] = useState({
    name: "", email: "", phone: "", age: "", experience: "", cgpa: "", degree: "", location: "", gender: "Any", integrityAnswers: ""
  });
  const [resume, setResume] = useState<File | null>(null);
  const [certificate, setCertificate] = useState<File | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyErr, setApplyErr] = useState("");
  const [applySuccess, setApplySuccess] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await API.get("/candidate/jobs");
        setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyLoading(true); setApplyErr(""); setApplySuccess("");
    
    const formData = new FormData();
    formData.append("jobId", selectedJob._id);
    formData.append("candidateId", localStorage.getItem("candidateId") || "");
    Object.entries(applyForm).forEach(([k, v]) => formData.append(k, v));
    if (resume) formData.append("resume", resume);
    if (certificate) formData.append("certificate", certificate);

    try {
      const { data } = await API.post("/candidate/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setApplySuccess(data.message);
      setTimeout(() => {
        setSelectedJob(null);
        setApplySuccess("");
      }, 2000);
    } catch(err: any) {
      setApplyErr(err.response?.data?.message || "Application Failed");
    } finally {
      setApplyLoading(false);
    }
  };

  const filteredJobs = jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen p-8 mt-16 max-w-7xl mx-auto text-white">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-glow mb-2">Available Opportunities</h1>
          <p className="text-gray-300">Find the role that matches your skills perfectly.</p>
        </div>
        <div className="flex gap-4 items-center">
           <input 
             type="text" placeholder="Search jobs by keyword..." 
             value={search} onChange={e => setSearch(e.target.value)}
             className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 w-80 focus:outline-none focus:ring-2 focus:ring-teal-400"
           />
           <Link to="/my-applications" className="px-6 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10">
             My Applications
           </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map(job => (
            <div key={job._id} className="glass p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300">
              <div>
                <h3 className="text-2xl font-bold mb-1">{job.title}</h3>
                <p className="text-teal-300 font-semibold mb-3">{job.company}</p>
                <p className="text-gray-300 text-sm line-clamp-3 mb-4">{job.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {job.skillCriteria?.slice(0, 4).map((s: any, i: number) => (
                    <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded-md border border-white/5">{s.skill}</span>
                  ))}
                  {job.skillCriteria?.length > 4 && <span className="text-xs px-2 py-1">+{job.skillCriteria.length - 4} more</span>}
                </div>
              </div>
              <button 
                onClick={() => setSelectedJob(job)} 
                className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 hover:opacity-90 transition-opacity"
              >
                Apply Now
              </button>
            </div>
          ))}
          {filteredJobs.length === 0 && (
             <div className="col-span-full text-center py-20 text-gray-400 glass rounded-3xl">No jobs found matching your search.</div>
          )}
        </div>
      )}

      {selectedJob && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="glass w-full max-w-2xl p-8 rounded-3xl shadow-2xl relative mt-32 md:mt-0">
               <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 text-gray-400 hover:text-white font-bold text-xl">&times;</button>
               <h2 className="text-3xl font-bold mb-2 text-glow">Apply for {selectedJob.title}</h2>
               <p className="text-teal-300 mb-6">{selectedJob.company}</p>

               {applySuccess ? (
                  <div className="bg-green-500/20 text-green-200 border border-green-500/50 p-4 rounded-xl text-center font-bold">{applySuccess}</div>
               ) : (
                 <form onSubmit={handleApply} className="space-y-6">
                    {applyErr && <div className="bg-red-500/20 text-red-200 border border-red-500/50 p-3 rounded-xl">{applyErr}</div>}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                        <input required value={applyForm.name} onChange={e => setApplyForm({...applyForm, name: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Email</label>
                        <input type="email" required value={applyForm.email} onChange={e => setApplyForm({...applyForm, email: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                        <input required value={applyForm.phone} onChange={e => setApplyForm({...applyForm, phone: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Age</label>
                        <input type="number" required value={applyForm.age} onChange={e => setApplyForm({...applyForm, age: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" />
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <h3 className="text-lg font-semibold mb-4 text-gray-200">Eligibility & Qualifications</h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Experience (Yrs)</label>
                          <input type="number" required value={applyForm.experience} onChange={e => setApplyForm({...applyForm, experience: e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">CGPA</label>
                          <input type="number" step="0.1" required value={applyForm.cgpa} onChange={e => setApplyForm({...applyForm, cgpa: e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Highest Degree</label>
                          <input required value={applyForm.degree} onChange={e => setApplyForm({...applyForm, degree: e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Location</label>
                          <input required value={applyForm.location} onChange={e => setApplyForm({...applyForm, location: e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Gender</label>
                          <select required value={applyForm.gender} onChange={e => setApplyForm({...applyForm, gender: e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10 text-gray-200 [&>option]:text-black">
                             <option>Male</option><option>Female</option><option>Other</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                      <div>
                        <label className="text-xs font-semibold text-teal-300 mb-1 block">Resume (used for semantic matching)</label>
                        <input type="file" required accept=".png,.jpg,.jpeg" onChange={e => setResume(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-indigo-300 mb-1 block">Certificate (Optional - 10 Bonus Pts)</label>
                        <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={e => setCertificate(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30" />
                      </div>
                    </div>

                    {selectedJob.integrityCheck?.enabled && (
                       <div className="border-t border-white/10 pt-4">
                         <h3 className="text-sm font-semibold mb-2 text-yellow-300">Integrity Check ({selectedJob.integrityCheck.weight}% Weight)</h3>
                         <ul className="text-xs text-gray-400 list-disc pl-5 mb-2">
                           {selectedJob.integrityCheck.questions.map((q: string, i: number) => <li key={i}>{q}</li>)}
                         </ul>
                         <textarea 
                           required rows={3} placeholder="Answer the integerity questions comprehensively here..." 
                           value={applyForm.integrityAnswers} onChange={e => setApplyForm({...applyForm, integrityAnswers: e.target.value})}
                           className="w-full bg-black/20 rounded-xl p-3 border border-white/10 mt-2"
                         />
                       </div>
                    )}

                    <button type="submit" disabled={applyLoading} className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 shadow-lg text-lg">
                      {applyLoading ? "Processing Encryption & AI Checks..." : "Submit Zero-Knowledge Application"}
                    </button>
                 </form>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default CandidateHome;