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
    },
    lastName:{
        type: String,
    },
    dob: {
        type: Date,
    },
    gender: {
        type: String,
        // must be either male or female
        enum: ['male', 'female']
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
    profilePicutres: {
        type: String,
        default: null
    }, 
    blockedProfiles: {
        type: [Schema.Types.ObjectId],
        ref: "User",
        default: []
    },
    bio: {
        type: String,
        default:''
    },
    verified: {
        type: Boolean,
        default: false,
    },
    onBoarded: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true })

const User = mongoose.model("User", UserSchema);
export default User;