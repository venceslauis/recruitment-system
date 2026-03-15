const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async(req,res)=>{

try{

const {name,email,password,role} = req.body;

const hash = await bcrypt.hash(password,10);

const user = new User({
name,
email,
password:hash,
role
});

await user.save();

res.json({message:"User registered"});

}catch(err){
res.status(500).json(err);
}

};


exports.login = async(req,res)=>{

try{

const {email,password} = req.body;

const user = await User.findOne({email});

if(!user) return res.status(404).json("User not found");

const valid = await bcrypt.compare(password,user.password);

if(!valid) return res.status(401).json("Invalid password");

const token = jwt.sign({id:user._id,role:user.role},"secret");

res.json({token,user});

}catch(err){
res.status(500).json(err);
}

};