import mongoose from "mongoose";

const ResetTokenSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 3600,// this is the expiry time in seconds
    },
});

const ResetToken = mongoose.model('ResetToken', ResetTokenSchema);
export default ResetToken;