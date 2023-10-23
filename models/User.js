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
        name:{
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
        orientation: {
            type: String,
            enum: ['male', 'female']
        },
        matches: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        likedUsers: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        rejectedUsers: {
            type: [Schema.Types.ObjectId],
            ref: "User",
            default: []
        },
        profilePictures: {
            type:  Schema.Types.Map,
            of: String,
            default: {
                0: "",
                1: "",
                2: "",
                3: "",
                4: "",
                5: "",
            }
        }, 
        blockedUsers: {
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
        onboardStep: {
            type: Number,
            default: 0, // 0 start onboarding, 1 email verified, 2 profile created
        }
    }, { timestamps: true })

    const User = mongoose.model("User", UserSchema);
    export default User;