import mongoose from 'mongoose';

const Schema = mongoose.Schema

const messageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  chatId:{
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  seenBy: {
    type: [Schema.Types.ObjectId],
    ref: 'User',
  },
}, {timestamps: true});

const Message = mongoose.model('Message', messageSchema);
export default Message;