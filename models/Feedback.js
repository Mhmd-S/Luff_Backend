import mongoose from "mongoose";

const Schema = mongoose.Schema;

const FeedbackShcema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    feedback: {
        type: String,
        required: true
    },
})

const Feedback = mongoose.model('Feedback', FeedbackShcema);
export default Feedback;