import { useEffect,useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RecruiterHome(){

const navigate = useNavigate();

const [jobs,setJobs] = useState([]);

useEffect(()=>{

axios.get("http://localhost:5000/api/recruiter/myJobs/demoRecruiter")
.then(res=>setJobs(res.data));

},[]);

return(

<div className="min-h-screen bg-gray-100 py-10">

<div className="max-w-4xl mx-auto">

{/* Header */}

<div className="flex justify-between items-center mb-8">

<h2 className="text-3xl font-bold">My Job Listings</h2>

<button
onClick={()=>navigate("/post-job")}
className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
>
+ Post New Job
</button>

</div>


{/* Jobs */}

<div className="space-y-5">

{jobs.map((job:any)=>(

<div
key={job._id}
className="bg-white border border-gray-200 rounded-xl shadow p-6 hover:shadow-lg transition"
>

<h3 className="text-xl font-semibold mb-2">
{job.title}
</h3>

{job.skills && job.skills.length > 0 && (

<div className="flex flex-wrap gap-2 mb-4">

{job.skills.map((skill:string,index:number)=>(
<span
key={index}
className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"
>
{skill}
</span>
))}

</div>

)}

<button
onClick={()=>{
window.location.href=`/applicants/${job._id}`;
}}
className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black transition"
>
View Applicants
</button>

</div>

))}

</div>

</div>

</div>

);

}