import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const CandidateHome: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Apply modal states
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applyForm, setApplyForm] = useState({
    name: "", email: "", phone: "", age: "", experience: "", cgpa: "", degree: "", location: "", gender: "Any", integrityAnswers: "",
    skills: "", projects: "", internships: ""
  });
  
  const [resume, setResume] = useState<File | null>(null);
  const [parsingResume, setParsingResume] = useState(false);

  const [certificates, setCertificates] = useState<{file: File, name: string, title: string}[]>([]);
  const [parsingCert, setParsingCert] = useState(false);

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

  const handleResumeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setResume(file);
        
        // Auto parse
        setParsingResume(true);
        const fd = new FormData();
        fd.append("resume", file);
        try {
           const { data } = await API.post("/candidate/parse-resume", fd, {
             headers: { "Content-Type": "multipart/form-data" }
           });
           setApplyForm(prev => ({
             ...prev,
             name: prev.name || data.name || "",
             email: prev.email || data.email || "",
             phone: prev.phone || data.phone || "",
             skills: prev.skills || data.skills || "",
             projects: prev.projects || data.projects || "",
             internships: prev.internships || data.internships || ""
           }));
        } catch(err) {
           console.error("Resume parse failed", err);
        } finally {
           setParsingResume(false);
        }
     }
  };

  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     if(e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if(file.size > 1024 * 1024) { 
           alert(`File ${file.name} exceeds 1MB`); 
           return; 
        }

        setParsingCert(true);
        const fd = new FormData();
        fd.append("certificate", file);
        try {
           const { data } = await API.post("/candidate/parse-certificate", fd, {
              headers: { "Content-Type": "multipart/form-data" }
           });
           
           setCertificates(prev => [...prev, {
              file: file,
              name: data.name || "",
              title: data.title || ""
           }]);

        } catch(err) {
           console.error("Cert Parse Failed", err);
           setCertificates(prev => [...prev, { file: file, name: "", title: "" }]);
        } finally {
           setParsingCert(false);
        }
     }
     e.target.value = "";
  };

  const updateCertificateField = (index: number, field: "name" | "title", value: string) => {
     const next = [...certificates];
     next[index][field] = value;
     setCertificates(next);
  };

  const removeCertificate = (index: number) => {
     setCertificates(certificates.filter((_, i) => i !== index));
  };


  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resume) {
       setApplyErr("Please upload your resume.");
       return;
    }
    if (applyForm.phone.length !== 10) {
       setApplyErr("Phone number must be exactly 10 digits.");
       return;
    }
    setApplyLoading(true); setApplyErr(""); setApplySuccess("");
    
    const formData = new FormData();
    formData.append("jobId", selectedJob._id);
    formData.append("candidateId", localStorage.getItem("candidateId") || "");
    Object.entries(applyForm).forEach(([k, v]) => formData.append(k, v));
    
    if (resume) formData.append("resume", resume);
    
    certificates.forEach(cert => {
       formData.append("certificate", cert.file);
       formData.append("certificateNames", cert.name);
       formData.append("certificateTitles", cert.title);
    });

    try {
      const { data } = await API.post("/candidate/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setApplySuccess(data.message);
      setTimeout(() => {
        setSelectedJob(null);
        setApplySuccess("");
        setApplyForm({
          name: "", email: "", phone: "", age: "", experience: "", cgpa: "", degree: "", location: "", gender: "Any", integrityAnswers: "",
          skills: "", projects: "", internships: ""
        });
        setResume(null);
        setCertificates([]);
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
                {/* Changed to pre-wrap to make full description visible without clamping */}
                <p className="text-gray-300 text-sm whitespace-pre-wrap mb-4 max-h-40 overflow-y-auto pr-2">{job.description}</p>
                
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
         <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="glass w-full max-w-3xl p-6 sm:p-8 rounded-3xl shadow-2xl relative my-auto">
               <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 font-bold text-xl inline-flex items-center justify-center w-10 h-10 transition z-50">
                 &times;
               </button>
               
               <h2 className="text-3xl font-bold mb-2 text-glow pr-10">Apply for {selectedJob.title}</h2>
               <p className="text-teal-300 mb-6">{selectedJob.company}</p>

               {applySuccess ? (
                  <div className="bg-green-500/20 text-green-200 border border-green-500/50 p-4 rounded-xl text-center font-bold">{applySuccess}</div>
               ) : (
                 <form onSubmit={handleApply} className="space-y-6">
                    {applyErr && <div className="bg-red-500/20 text-red-200 border border-red-500/50 p-3 rounded-xl">{applyErr}</div>}
                    
                    {/* Resume Upload & Info Autofilling */}
                    <div className="bg-white/5 border border-teal-500/30 p-4 rounded-2xl mb-6">
                       <label className="text-sm font-semibold text-teal-300 mb-2 block">1. Upload Resume to Auto-Fill (PDF, JPG, PNG)</label>
                       <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleResumeSelect} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30 mb-2" />
                       {parsingResume && <p className="text-xs text-yellow-300 animate-pulse mt-2">Parsing resume with OCR... Please wait.</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                        <input required value={applyForm.name} onChange={e => setApplyForm({...applyForm, name: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10 font-bold" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Email</label>
                        <input type="email" required value={applyForm.email} onChange={e => setApplyForm({...applyForm, email: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                        <input type="tel" maxLength={10} required value={applyForm.phone} onChange={e => {
                          const val = e.target.value.replace(/\D/g, "");
                          setApplyForm({...applyForm, phone: val});
                        }} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" placeholder="10 Digits" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Age</label>
                        <input type="number" required value={applyForm.age} onChange={e => setApplyForm({...applyForm, age: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="col-span-full">
                           <label className="text-xs text-gray-400 mb-1 block">Skills</label>
                           <textarea rows={2} value={applyForm.skills} onChange={e => setApplyForm({...applyForm, skills: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" placeholder="Extracted skills will appear here" />
                       </div>
                       <div>
                           <label className="text-xs text-gray-400 mb-1 block">Projects</label>
                           <textarea rows={3} value={applyForm.projects} onChange={e => setApplyForm({...applyForm, projects: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" placeholder="Extracted projects will appear here" />
                       </div>
                       <div>
                           <label className="text-xs text-gray-400 mb-1 block">Internships</label>
                           <textarea rows={3} value={applyForm.internships} onChange={e => setApplyForm({...applyForm, internships: e.target.value})} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" placeholder="Extracted internships will appear here" />
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

                    <div className="border-t border-white/10 pt-4">
                        <label className="text-sm font-semibold text-indigo-300 mb-2 block">Upload Certificates / Proofs (Increases Match Score)</label>
                        <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={handleCertificateUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 mb-4" />
                        
                        {parsingCert && <p className="text-xs text-yellow-300 animate-pulse mb-2">Parsing certificate... Please wait.</p>}

                        <div className="space-y-4">
                           {certificates.map((cert, idx) => (
                             <div key={idx} className="bg-black/20 p-4 rounded-xl border border-indigo-500/30 flex flex-col md:flex-row gap-4 items-center">
                                <div className="flex-1">
                                    <label className="text-xs text-indigo-200 mb-1 block">Name on Certificate</label>
                                    <input value={cert.name} onChange={e => updateCertificateField(idx, 'name', e.target.value)} className="w-full bg-black/40 rounded-lg p-2 border border-indigo-500/20 text-sm" placeholder="Participant Name" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-indigo-200 mb-1 block">Certificate Title/Domain</label>
                                    <input value={cert.title} onChange={e => updateCertificateField(idx, 'title', e.target.value)} className="w-full bg-black/40 rounded-lg p-2 border border-indigo-500/20 text-sm" placeholder="Coursera Python, AWS Cloud Practitioner..." />
                                </div>
                                <button type="button" onClick={() => removeCertificate(idx)} className="text-red-400 hover:text-red-300 font-bold self-end md:self-center mt-2 md:mt-0 p-2">Remove</button>
                             </div>
                           ))}
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

                    <div className="flex gap-4 pt-4 border-t border-white/10">
                      <button type="button" onClick={() => setSelectedJob(null)} className="w-1/3 py-4 rounded-xl font-bold border border-white/20 hover:bg-white/10 transition-colors">
                        Cancel
                      </button>
                      <button type="submit" disabled={applyLoading || !resume} className="w-2/3 py-4 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 shadow-lg text-lg disabled:opacity-50">
                        {applyLoading ? "Processing Registration..." : "Submit Application"}
                      </button>
                    </div>
                 </form>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

export default CandidateHome;