import { useEffect,useState } from "react";
import API from "../services/api";
import JobCard from "../components/JobCard";

export default function JobList(){

const [jobs,setJobs]=useState([]);

useEffect(()=>{

API.get("/recruiter/allJobs")
.then(res=>setJobs(res.data));

},[]);

return(

<div>

<h2>Jobs</h2>

{jobs.map((j:any)=>(

<JobCard job={j}/>

))}

</div>

);

}