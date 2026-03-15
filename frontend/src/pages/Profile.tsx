import { useState, useEffect } from "react";
import axios from "axios";

export default function Profile(){

const [file,setFile] = useState<any>(null);

const [name,setName] = useState("");
const [age,setAge] = useState("");

const [score,setScore] = useState<number | null>(null);
const [skills,setSkills] = useState<string[]>([]);

const [candidateId,setCandidateId] = useState("");


/* LOAD SAVED PROFILE */

useEffect(()=>{

const id = localStorage.getItem("candidateId");

if(id){

setCandidateId(id);

axios.get(
`http://localhost:5000/api/candidate/profile/${id}`
).then(res=>{

setName(res.data.name);
setAge(res.data.age);
setScore(res.data.score);
setSkills(res.data.skills);

});

}

},[]);


/* UPLOAD RESUME */

const upload = async()=>{

const formData = new FormData();
formData.append("resume",file);

const res = await axios.post(
"http://localhost:5000/api/candidate/uploadResume",
formData
);

setSkills(res.data.skills);
setScore(res.data.score);

};


/* SAVE PROFILE */

const saveProfile = async()=>{

const res = await axios.post(
"http://localhost:5000/api/candidate/saveProfile",
{
name,
age,
skills,
score
}
);

localStorage.setItem("candidateId", res.data.candidateId);

alert("Profile saved successfully");

};


return(
<div className="max-w-2xl mx-auto py-12">
<div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">

<h2 className="text-2xl font-bold mb-6">Candidate Profile</h2>

<h3>Upload Resume</h3>

<input className="mb-4"
type="file"
onChange={(e)=>setFile(e.target.files?.[0])}
/>

<br/><br/>

<button onClick={upload} className="bg-blue-600 text-white px-4 py-2 rounded w-full">Upload Resume</button>

<hr/>

<h3>Personal Details</h3>
<div className="space-y-4">

<input className="border p-2 w-full mb-4 rounded"
placeholder="Full Name"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

<br/><br/>

<input className="border p-2 w-full mb-4 rounded"
placeholder="Age"
value={age}
onChange={(e)=>setAge(e.target.value)}
/>

<br/><br/>
</div>
{score !== null && (

<div className="mt-6 bg-green-100 p-4 rounded">

<h3 className="font-bold">AI Resume Score</h3>

<p className="text-2xl">{score} / 100</p>

</div>

)}

{skills.length > 0 && (

<div style={{marginTop:20}}>

<h3>Detected Skills</h3>

{skills.length > 0 && (

<div className="mt-6">

<h3 className="font-semibold mb-3">Detected Skills</h3>

<div className="flex flex-wrap gap-2">

{skills.map((skill,index)=>(
<span
key={index}
className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200"
>
{skill}
</span>
))}

</div>

</div>

)}

</div>

)}

<br/>

<button
style={{
padding:"10px 20px",
background:"#16a34a",
color:"white",
border:"none"
}}
onClick={saveProfile}
>
Save Profile
</button>

</div>
</div>
);

}