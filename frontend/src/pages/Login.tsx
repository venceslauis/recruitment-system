import { useState } from "react";
import axios from "axios";
import { Link,useNavigate } from "react-router-dom";

export default function Login(){

const navigate = useNavigate();

const [email,setEmail] = useState("");
const [password,setPassword] = useState("");

const login = async (e:any) => {

e.preventDefault(); // prevent page reload

try{

const res = await axios.post(
"http://localhost:5000/api/auth/login",
{ email, password }
);

localStorage.setItem("token", res.data.token);
localStorage.setItem("role", res.data.role);

if(res.data.role === "candidate"){
navigate("/candidate/home");
}else{
navigate("/recruiter/home");
}

}catch(err){
alert("Login failed");
}

};

return(

<div className="bg-gray-100 min-h-screen flex items-center justify-center">

<div className="bg-white shadow-lg rounded-xl p-8 w-96 border border-gray-200">

<h2 className="text-2xl font-semibold text-center mb-6">
Login
</h2>

<form onSubmit={login} className="space-y-4">

<input
type="email"
placeholder="Email"
className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
onChange={(e)=>setEmail(e.target.value)}
required
/>

<input
type="password"
placeholder="Password"
className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
onChange={(e)=>setPassword(e.target.value)}
required
/>

<button
type="submit"
className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
>

Login

</button>

</form>

<p className="text-center text-gray-600 mt-4">

New user?{" "}

<Link
to="/register"
className="text-blue-600 hover:underline"
>

Register here

</Link>

</p>

</div>

</div>

);

}