import { useEffect,useState } from "react";
import axios from "axios";

export default function MyApplications(){

const [apps,setApps] = useState([]);

useEffect(()=>{

const candidateId = localStorage.getItem("candidateId");

axios.get(
`http://localhost:5000/api/candidate/myApplications/${candidateId}`
)
.then(res=>setApps(res.data));

},[]);

return(

<div className="bg-gray-100 min-h-screen py-10">

<div className="max-w-4xl mx-auto">

<h2 className="text-3xl font-bold mb-8">
My Job Applications
</h2>

<div className="space-y-5">

{apps.map((a:any,index)=>(

<div
key={index}
className="bg-white p-6 rounded-xl shadow border border-gray-200"
>

<h3 className="text-xl font-semibold">
{a.jobId?.title}
</h3>

<p className="text-gray-600">
Company: {a.jobId?.company}
</p>

<p className="mt-2 font-medium">
Your Score: {a.score}%
</p>

</div>

))}

</div>

</div>

</div>

);

}