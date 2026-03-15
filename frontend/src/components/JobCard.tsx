export default function JobCard({job}:any){

return(

<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition">
<h3 className="text-xl font-semibold">{job.title}</h3>

<p className="text-gray-600">{job.description}</p>

<p className="mt-3 text-blue-600 font-medium">Skills: {job.skills?.join(", ")}</p>

</div>

);

}