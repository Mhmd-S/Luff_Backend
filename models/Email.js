import mongoose from "mongoose";

const Schema = mongoose.Schema;

const EmailSchema = new Schema({
    email:{
        type: String,
        required: true,
    },
    code:{
        type: String,
        required: true,
    },
    expireAt: {
        type: Date,
        default: Date.now,
        expires: 60,
    }
}, {timestamps: true});

const Email = mongoose.model('Email', EmailSchema);
export default Email;