import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");

  const [eligibility, setEligibility] = useState({
    experience: 0,
    cgpa: 0,
    degree: "",
    location: "",
    gender: "Any",
    age: 0
  });

  const [skills, setSkills] = useState<{skill: string, weight: number}[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [currentWeight, setCurrentWeight] = useState(0);

  const [integrityEnabled, setIntegrityEnabled] = useState(false);
  const [integrityWeight, setIntegrityWeight] = useState(0);
  const [integrityQuestions, setIntegrityQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const totalCurrentWeight = skills.reduce((sum, s) => sum + s.weight, 0) + (integrityEnabled ? integrityWeight : 0);

  const addSkill = () => {
    if (currentSkill && currentWeight > 0) {
      setSkills([...skills, { skill: currentSkill.toLowerCase(), weight: currentWeight }]);
      setCurrentSkill("");
      setCurrentWeight(0);
    }
  };

  const addQuestion = () => {
    if (currentQuestion) {
      setIntegrityQuestions([...integrityQuestions, currentQuestion]);
      setCurrentQuestion("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalCurrentWeight !== 100) {
      setErr("Total skill weight + integrity weight must equal 100.");
      return;
    }
    setLoading(true);
    setErr("");
    
    try {
      const recruiterId = localStorage.getItem("userId");
      await API.post("/recruiter/postJob", {
        title, company, description,
        eligibility,
        skillCriteria: skills,
        integrityCheck: {
          enabled: integrityEnabled,
          weight: integrityWeight,
          questions: integrityQuestions
        },
        recruiterId
      });
      navigate("/recruiter/home");
    } catch (e: any) {
      setErr(e.response?.data?.error || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 mt-16 flex justify-center text-white">
      <div className="glass w-full max-w-4xl p-8 rounded-3xl relative">
        <button type="button" onClick={() => navigate("/recruiter/home")} className="absolute top-6 right-6 text-gray-400 hover:text-white font-bold text-2xl transition-colors cursor-pointer inline-flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full z-10">
          &times;
        </button>
        <h2 className="text-3xl font-bold mb-6 text-glow pr-8">Post a New Job</h2>
        {err && <div className="bg-red-500/20 text-red-200 p-4 rounded-xl mb-6">{err}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm mb-2 text-gray-300">Job Title</label>
              <input required maxLength={50} value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" placeholder="e.g. Senior Frontend Developer" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm mb-2 text-gray-300">Company</label>
              <input required value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm mb-2 text-gray-300">Job Description (Max 500 words)</label>
              <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/20 rounded-xl p-3 border border-white/10" />
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold mb-4 text-teal-300">Eligibility Criteria (ZKP Rules)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400">Min Experience (Yrs)</label>
                <input type="number" min="0" value={eligibility.experience} onChange={e => setEligibility({...eligibility, experience: +e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Min CGPA</label>
                <input type="number" step="0.1" max="10" value={eligibility.cgpa} onChange={e => setEligibility({...eligibility, cgpa: +e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Max Age</label>
                <input type="number" min="0" value={eligibility.age} onChange={e => setEligibility({...eligibility, age: +e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Required Degree</label>
                <input placeholder="e.g. B.Tech" value={eligibility.degree} onChange={e => setEligibility({...eligibility, degree: e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Location</label>
                <input placeholder="e.g. Remote" value={eligibility.location} onChange={e => setEligibility({...eligibility, location: e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Gender</label>
                <select value={eligibility.gender} onChange={e => setEligibility({...eligibility, gender: e.target.value})} className="w-full bg-black/20 rounded-xl p-2 border border-white/10 text-gray-200 [&>option]:text-black">
                  <option>Any</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-semibold mb-2 text-indigo-300 flex justify-between">
              <span>Skill & Integrity Weights</span>
              <span className={totalCurrentWeight === 100 ? "text-green-400" : "text-yellow-400"}>
                Total: {totalCurrentWeight}/100
              </span>
            </h3>
            <p className="text-sm text-gray-400 mb-4">You must distribute exactly 100 points among skills and integrity checks.</p>
            
            <div className="flex gap-4 mb-4">
              <input placeholder="Skill Name (e.g. React)" value={currentSkill} onChange={e => setCurrentSkill(e.target.value)} className="flex-1 bg-black/20 rounded-xl p-3 border border-white/10" />
              <input type="number" placeholder="Weight (e.g. 30)" value={currentWeight || ""} onChange={e => setCurrentWeight(+e.target.value)} className="w-32 bg-black/20 rounded-xl p-3 border border-white/10" />
              <button type="button" onClick={addSkill} className="bg-indigo-600 hover:bg-indigo-500 px-6 rounded-xl font-semibold">Add</button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {skills.map((s, i) => (
                <div key={i} className="bg-indigo-900/50 text-indigo-100 px-4 py-2 rounded-full text-sm border border-indigo-500/30 flex items-center gap-2">
                  <span>{s.skill} ({s.weight}%)</span>
                  <button type="button" onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-300 font-bold ml-2">×</button>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={integrityEnabled} onChange={e => setIntegrityEnabled(e.target.checked)} className="w-5 h-5 rounded border-gray-300" />
                <span className="font-semibold text-gray-200">Enable AI Integrity Check</span>
              </label>

              {integrityEnabled && (
                <div className="mt-4 space-y-4 pl-8">
                  <div>
                    <label className="block text-sm mb-1 text-gray-400">Integrity Weight (e.g. 20%)</label>
                    <input type="number" value={integrityWeight || ""} onChange={e => setIntegrityWeight(+e.target.value)} className="w-32 bg-black/20 rounded-xl p-2 border border-white/10" />
                  </div>
                  <div className="flex gap-4">
                     <input placeholder="Add custom integrity question (e.g. Are you willing to work night shifts?)" value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} className="flex-1 bg-black/20 rounded-xl p-3 border border-white/10" />
                     <button type="button" onClick={addQuestion} className="bg-teal-600 hover:bg-teal-500 px-6 rounded-xl font-semibold">Add</button>
                  </div>
                  <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
                    {integrityQuestions.map((q, i) => <li key={i}>{q} <button type="button" onClick={() => setIntegrityQuestions(integrityQuestions.filter((_, idx) => idx !== i))} className="text-red-400 ml-2">Remove</button></li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
             <button type="button" onClick={() => navigate("/recruiter/home")} className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/10 font-semibold transition">Cancel</button>
             <button type="submit" disabled={loading || totalCurrentWeight !== 100} className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-bold">
               {loading ? "Posting..." : "Post Job Live"}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};
export default PostJob;