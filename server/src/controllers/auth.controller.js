import User from "../models/user.schema.js";
import { generateToken } from "../utils/generateToken.js";
import {asyncHandler} from "../middlewares/errorHandle.js"

export const register = asyncHandler(async (req,res)=>{
    const {name , email , password,avatar} = req.body
    if(!name || !email || !password){
        return res.status(400).json({message:"All fields are required"})
    }
    if(password.length < 6){
        return res.status(400).json({message:"Password must be at least 6 characters long"})
    }
    const existingUser = await User.findOne({
        email:email
    })
    if(existingUser){
        return res.status(400).json({message:"User already exists"})
    }
    const user = await User.create({
        name,
        email,
        password,
        avatar:avatar || ""
    })
    generateToken(user._id, res)
    return res.status(201).json({
        user:{
            _id:user._id,
            name:user.name,
            email:user.email,
            avatar:user.avatar,
        }
    })
    
});

export const login = asyncHandler(async(req,res)=>{
    const {email , password} = req.body
    if(!email || !password){
        return res.status(400).json({message:"All fields are required"})
    }
    const user = await User.findOne({
        email:email
    })
    if(!user){
        return res.status(400).json({message:"Invalid email or password"})
    }
    const isMatch = await user.comparePassword(password)
    if(!isMatch){
        return res.status(400).json({message:"Invalid email or password"})
    }
    generateToken(user._id, res)
    return res.status(200).json({
        user:{
            _id:user._id,
            name:user.name,
            email:user.email,
            avatar:user.avatar,
        }
    })
});

export const logout = asyncHandler(async(req,res)=>{
    res.clearCookie("token")
    return res.status(200).json({message:"Logged out successfully"})
})

export const getMe = asyncHandler(async (req, res) => {
    const user = req.user
   return res.status(200).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    }
  })
})

