import { useState } from "react";
import axios from "axios";

export default function PostJob(){

const [title,setTitle] = useState("");
const [company,setCompany] = useState("");
const [description,setDescription] = useState("");
const [skills,setSkills] = useState("");

const postJob = async()=>{

const skillArray = skills
.split(",")
.map(s => s.trim().toLowerCase());

await axios.post(
"http://localhost:5000/api/recruiter/postJob",
{
title,
company,
description,
skills:skillArray
}
);

alert("Job posted successfully");

};

return(

<div className="min-h-screen bg-gray-100 flex items-center justify-center">

<div className="bg-white w-full max-w-xl p-8 rounded-xl shadow-lg border border-gray-200">

<h2 className="text-2xl font-bold mb-6 text-center">
Post a New Job
</h2>

<div className="space-y-5">

{/* Job Title */}

<div>
<label className="block text-sm font-semibold mb-1">
Job Title
</label>
<input
className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="e.g. Frontend Developer"
value={title}
onChange={(e)=>setTitle(e.target.value)}
/>
</div>

{/* Company */}

<div>
<label className="block text-sm font-semibold mb-1">
Company
</label>
<input
className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="Company Name"
value={company}
onChange={(e)=>setCompany(e.target.value)}
/>
</div>

{/* Description */}

<div>
<label className="block text-sm font-semibold mb-1">
Job Description
</label>
<textarea
className="w-full border rounded-lg p-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="Describe the job role, responsibilities, etc."
value={description}
onChange={(e)=>setDescription(e.target.value)}
/>
</div>

{/* Skills */}

<div>
<label className="block text-sm font-semibold mb-1">
Required Skills
</label>
<input
className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="react, node, mongodb"
value={skills}
onChange={(e)=>setSkills(e.target.value)}
/>
<p className="text-xs text-gray-500 mt-1">
Enter skills separated by commas
</p>
</div>

{/* Submit */}

<button
onClick={postJob}
className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
>
Post Job
</button>

</div>

</div>

</div>

);
}