import { BrowserRouter,Routes,Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import CandidateHome from "./pages/CandidateHome";
import RecruiterHome from "./pages/RecruiterHome";
import Profile from "./pages/Profile";
import PostJob from "./pages/PostJob";
import Applicants from "./pages/Applicants";
import MyApplications from "./pages/MyApplications";
function App(){

return(

<BrowserRouter>

<Navbar/>

<Routes>

<Route path="/" element={<Login/>} />

<Route path="/register" element={<Register/>} />

<Route path="/candidate/home" element={<CandidateHome/>} />

<Route path="/recruiter/home" element={<RecruiterHome/>} />

<Route path="/profile" element={<Profile/>} />

<Route path="/post-job" element={<PostJob/>} />

<Route path="/applicants/:jobId" element={<Applicants/>} />
<Route path="/my-applications" element={<MyApplications/>}/>
</Routes>

</BrowserRouter>

);

}

export default App;