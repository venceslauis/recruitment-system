import { useState } from "react";
import axios from "axios";
import { Link,useNavigate } from "react-router-dom";

export default function Register(){

const navigate = useNavigate();

const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [role,setRole] = useState("candidate");

const register = async () => {

await axios.post(
"http://localhost:5000/api/auth/register",
{email,password,role}
);

alert("Registration successful");

navigate("/");

};

return(

<div>

<h2>Register</h2>

<input
placeholder="Email"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
placeholder="Password"
type="password"
onChange={(e)=>setPassword(e.target.value)}
/>

<select onChange={(e)=>setRole(e.target.value)}>

<option value="candidate">Candidate</option>
<option value="recruiter">Recruiter</option>

</select>

<button onClick={register}>Register</button>

<p>
Already have an account? <Link to="/">Login here</Link>
</p>

</div>

);
}