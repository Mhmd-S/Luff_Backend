import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ReportSchema = new Schema({
    reporter: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reported: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
})

const Report = mongoose.model('Report', ReportSchema);
export default Report;