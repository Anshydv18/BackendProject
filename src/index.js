//require('dotenv').config({path:'./env'})
import mongoose from "mongoose";

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";


dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`Server is running on port ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("MongoDB connection is failed ||",error);
})






/*(async ()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error",(error)=>{
        console.log("ERRR",error);
        throw error
       })

       app.listen(process.env.PORT,()=>{
        console.log("Server is running on port",process.env.PORT);
       })

    } catch (error) {
        console.log("Eroor",error);
        throw error;
    }
})()*/