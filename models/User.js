import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email:{
        type: String,
        required: true,
    },
    password:{
        type:String,
        required: true,
    },
    firstName:{
        type: String,
        required: true,
    },
    lastName:{
        type: String,
        required: true,
    },
    dob: {
        type: Date,
        default: null
    },
    enrolledCourse: {
        type: [Schema.Types.ObjectId],
        ref: "Course",
        default: []
    },
    matches: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    likedProfiles: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    verified: {
        type: Boolean,
        default: false,
    },
    primaryPicutre: {
        type: String,
        default: null
    }, 
    secondaryPictures: {
        type: [String],
        defualt: null
    },
    blockedProfiles: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    bio: {
        type: String,
        default:''
    }
}, { timestamps: true })

const User = mongoose.model("User", UserSchema);
export default User;