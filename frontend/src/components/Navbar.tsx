import { Link } from "react-router-dom";

export default function Navbar() {

const role = localStorage.getItem("role");

return(

<div className="bg-blue-600 text-white p-4 flex justify-between">

<h2 className="text-xl font-bold">Privacy Job Portal</h2>

<div className="flex gap-6">

{role==="candidate" && (
<>
<Link style={{marginRight:15,color:"white"}} to="/candidate/home">Dashboard</Link>
<Link style={{marginRight:15,color:"white"}} to="/profile">Profile</Link>
</>
)}

{role==="recruiter" && (
<>
<Link to="/recruiter/home">Dashboard</Link>
<Link to="/post-job">Post Job</Link>
</>
)}
{!role && (
<>
<Link style={{marginRight:15,color:"white"}} to="/">Login</Link>
<Link style={{marginRight:15,color:"white"}} to="/register">Register</Link>
</>
)}
{role && (
<button
onClick={()=>{
localStorage.clear();
window.location.href="/";
}}
>
Logout
</button>
)}
</div>

</div>

);
}