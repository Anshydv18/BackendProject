import mongoose,{Schema} from "mongoose";

const VideoSchema = new Schema({
    videoFile:{
        type:String, //cloudinary link
        required:true,
    },
    thumbnail:{
        type:String, //cloudinary link
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    }
},{timestamps:true})

export const video = mongoose.model("Video",VideoSchema)