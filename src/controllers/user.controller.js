import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResonse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req,res)=>{
   //we have to register the user
   /*
   take the form data from the frontend
   validate all the data
   take the avatar  and coverimage from the local path, middleware multer
   upload to the cloudinary and get all the links
   check the user exits or not , 
   create the user 
   return the response for the user creation except password and refresh tokens

   */
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


export {registerUser};