import { useEffect,useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

export default function Applicants(){

const { jobId } = useParams();

const [apps,setApps] = useState([]);

useEffect(()=>{

axios.get(
`http://localhost:5000/api/recruiter/applicants/${jobId}`
)
.then(res=>{
setApps(res.data);
});

},[]);

return(

<div className="bg-gray-100 min-h-screen py-10">

<div className="max-w-4xl mx-auto">

<h2 className="text-3xl font-bold mb-8">
Applicants
</h2>

<div className="space-y-6">

{apps.map((a:any,index)=>(

<div
key={a._id || index}
className="bg-white p-6 rounded-xl shadow border border-gray-200"
>

{/* Header */}

<div className="flex justify-between items-center mb-4">

<h3 className="text-lg font-semibold">
Rank #{index+1}
</h3>

<span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
Score: {a.score}%
</span>

</div>

{/* Candidate Info */}

<div className="grid grid-cols-2 gap-4 text-gray-700 mb-4">

<p><strong>Name:</strong> {a.candidateId?.name}</p>

<p><strong>Age:</strong> {a.candidateId?.age}</p>

</div>

{/* Skills */}

{a.candidateId?.skills?.length > 0 && (

<div className="flex flex-wrap gap-2">

{a.candidateId.skills.map((skill:string,i:number)=>(
<span
key={i}
className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
>
{skill}
</span>
))}

</div>

)}

</div>

))}

</div>

</div>

</div>

);

}