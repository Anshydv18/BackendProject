import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResonse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

const generateAccessTokenAndRefreshToken = async(userid)=>{
   try {
      const user = await User.findById(userid)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()
      user.refreshToken = refreshToken
      await user.save({validateBeforeSave:false})
   
      return {accessToken,refreshToken}
   } catch (error) {
      throw new ApiError(406,"Something went wrong while generating refresh token")
   }
}


const registerUser = asyncHandler(async(req,res)=>{
   
   const {fullname,email,username,password}=req.body
   // if(fullname===""){
   //    throw new ApiError(400,"fullname is required")
   // }
   //we can check all this field by using if condition but some is property over the array so that we can do it easily
   if(
      [fullname,email,username,password].some((field)=>field.trim()==="")
   ){
      throw new ApiError(400,"All fields are required")
   }

   const existedUser = await User.findOne({
      $or:[{username},{email}]
   })

   if(existedUser){
      throw new ApiError(409,"user with email or username already exists")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
       coverImageLocalPath = req.files.coverImage[0].path
   }

   if(!avatarLocalPath){
      throw new ApiError(400,"Avatar file is required")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const cover = await uploadOnCloudinary(coverImageLocalPath);

   // console.log(avatar);
   if(!avatar){
      throw new ApiError(400,"Avatar file is required")
   }

   const user = await User.create({
      fullname,
      email,
      username : username.toLowerCase(),
      avatar:avatar.url,
      coverImage:cover?.url, //optional chaining
      password,
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if(!createdUser){
      throw new ApiError(500,"something went wrong while registering the User")
   }

   return res.status(201).json(
      new ApiResonse(200,createdUser,"user registerred Sucessfully")
   )
})

const loginUser = asyncHandler(async(req,res)=>{
   const {username,email,password} = req.body
   if(!username && !email){
      throw new ApiError(400,"username or email is required")
   }

   const user = await User.findOne({
      $or :[{username},{email}]
   })

   if(!user){
      throw new ApiError(402,"user does not exits")
   }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if(!isPasswordValid){
      throw new ApiError(404,"password is incorrect")
   }

  const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
   httpOnly:true,
   secure:true
  }


  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
   new ApiResonse(200,
      {
         user:loggedInUser,accessToken,refreshToken
      }
   ,"user logged in successfully"))
})


const logoutUser = asyncHandler(async(req,res)=>{
   
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset:{
            refreshToken:""
         }
      },{
         new:true
      }
   )

   const options ={
      httpOnly:true,
      secure:true,
   }

   return res
   .status(203)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResonse(200,{},"User logged out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
   const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken
   if(!incomingrefreshToken){
      throw new ApiError(404,"unauthorized request")
   }

 try {
     const decodedToken = jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET)
     const user = await User.findById(decodedToken?._id)
  
     if(!user){
        throw new ApiError(404,'Invalid Refresh Token')
     }
  
     if(incomingrefreshToken!==user?.refreshToken){
        throw new ApiError(401,'Refresh Token is expired')
     }
  
     const options = {
        httpOnly:true,
        secure:true
     }
  
     const {accessToken,newrefreshToken}=await generateAccessTokenAndRefreshToken(user?._id)
  
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newrefreshToken,options)
     .json(
        new ApiResonse(200,
           {accessToken,newrefreshToken},
           "Access Token and Refresh Token generated successfully"
        )
     )
 } catch (error) {
   throw new ApiError(400,"Api error in refreshing refresh TOken")
 }
})


export {registerUser,loginUser,logoutUser,refreshAccessToken};