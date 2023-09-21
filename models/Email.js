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
    createAt: {
        type: Date,
        expiresL: 60*5,
        default: Date.now()
    },
});

const Email = mongoose.model('Email', EmailSchema);
export default Email;