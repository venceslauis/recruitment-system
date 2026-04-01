import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const RecruiterHome: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const recruiterId = localStorage.getItem("userId");
      const { data } = await API.get(`/recruiter/myJobs/${recruiterId}`);
      setJobs(data);
    };
    fetchJobs();
  }, []);

  return (
    <div className="min-h-screen p-8 mt-16 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-white text-glow">Dashboard</h1>
          <p className="text-gray-300 mt-2">Manage your posted opportunities and candidates.</p>
        </div>
        <Link to="/post-job" className="bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 px-6 py-3 rounded-xl font-bold text-white shadow-lg glow transition-transform transform hover:scale-105">
          + Post New Job
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map(job => (
          <div key={job._id} className="glass p-6 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
             <h3 className="text-2xl font-bold text-white mb-2">{job.title}</h3>
             <p className="text-gray-300 text-sm mb-4 line-clamp-2">{job.description}</p>
             
             <div className="flex flex-wrap gap-2 mb-6">
               {job.skillCriteria?.map((s: any, i: number) => (
                 <span key={i} className="text-xs bg-indigo-500/30 text-indigo-100 px-2 py-1 rounded-md border border-indigo-500/20">
                   {s.skill} ({s.weight}%)
                 </span>
               ))}
               {job.integrityCheck?.enabled && (
                 <span className="text-xs bg-yellow-500/30 text-yellow-100 px-2 py-1 rounded-md border border-yellow-500/20">
                   Integrity ({job.integrityCheck.weight}%)
                 </span>
               )}
             </div>

             <div className="border-t border-white/10 pt-4 flex justify-between items-center">
               <span className="text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</span>
               <Link to={`/applicants/${job._id}`} className="text-sm font-semibold text-blue-300 hover:text-white transition-colors">
                 View Applicants &rarr;
               </Link>
             </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400 glass rounded-3xl">
            You haven't posted any jobs yet. Get started by clicking the "Post New Job" button.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterHome;