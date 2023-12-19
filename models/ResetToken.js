import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ResetTokenSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600,// this is the expiry time in seconds - 1 hour
    },
});

const ResetToken = mongoose.model('ResetToken', ResetTokenSchema);
export default ResetToken;