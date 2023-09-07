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
        default: null,
        required: true,
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
    verified: {
        type: Boolean,
        default: false,
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
    }
}, { timestamps: true })

const User = mongoose.model("User", UserSchema);
export default User;