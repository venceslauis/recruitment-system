import { useEffect,useState } from "react";
import axios from "axios";

export default function CandidateHome(){

const [jobs,setJobs] = useState([]);

useEffect(()=>{

axios
.get("http://localhost:5000/api/candidate/jobs")
.then(res=>setJobs(res.data));

},[]);

return(

<div className="p-10 bg-gray-100 min-h-screen">

<h2 className="text-3xl font-bold mb-6">Available Jobs</h2>

{jobs.map((job:any)=>(
<div key={job._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition">

<h3 className="text-xl font-semibold">{job.title}</h3>
<p className="mt-3 text-sm">{job.description}</p>
<p className="mt-3 text-blue-600">Skills Required: {job.skills.join(", ")}</p>
<button onClick={()=>apply(job._id)} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
Apply
</button>

</div>
))}

</div>

);
}

async function apply(jobId:any){

const candidateId = localStorage.getItem("candidateId");

await axios.post(
"http://localhost:5000/api/candidate/apply",
{
jobId,
candidateId
}
);

alert("Applied successfully");

}