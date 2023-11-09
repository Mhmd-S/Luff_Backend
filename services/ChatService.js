import Message from '../models/Message';
import Chat from '../models/Chat';

export const getParticipants = async(chatId) => {
    const result = await Chat.findById(chatId, 'participants').exec();
    return result; 
}

export const getChat = async(chatId, page) => {
    const result = await Chat.findById(chatId).populate({
        path: 'messages',
        select: 'senderId content seenBy createdAt',
        options: {
            sort: { createdAt: 1 },
            skip: (page-1) * 30,
            limit: 30,
        },
    })
    .populate({
        path: 'lastMessage',
    }).exec();
    return result;
}

export const getChats = async(userID, page) => { // this
    const result = await Chat.find({ participants: { $in: [userID] } }, 'participants lastMessage updatedAt')
        .skip((page - 1) * 20)
        .limit(20)
        .populate('participants', 'name profilePictures')
        .populate('lastMessage', 'content updatedAt seenBy')
        .exec();

    return result;
}

export const getUndreadChatsCount = async(userId) => {
    const result = await Chat.find({ participants: { $in: [userId] } })
        .populate('lastMessage')
        .exec();
    let count = 0;
    result.forEach(chat => {
        if (chat.lastMessage == null || !chat.lastMessage.seenBy.includes(userId)) {
            count++;
        }
    });
    return count;
}

 export const createChat = async(participants) => {
    const chat = new Chat({ participants: participants });
    const result = await chat.save();
    return result;
}

// Updates a batch of 25 messages for chat to seen using the userId
export const updateChatToSeen = async(userId, chatId, page) => {
    const chatInfo = await Chat.findById(chatId, 'messages').exec();
    
    let messages = await Message.find({ _id: { $in: chatInfo.messages } })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * 25)
        .limit(25)
        .exec();

    messages = messages.filter(message => !message.seenBy.includes(userId));
    
    const messageIds = messages.map(message => message._id);
    
    const result = await Message.updateMany({ _id: { $in: messageIds } }, { $addToSet: { seenBy: userId } }).exec();
    
    return result;
}

export const updateMessageToSeen = async(userId, messageId) => {
    const result = await Message.findByIdAndUpdate( messageId, { $push: { seenBy: userId} } ).exec();
    return result;
}

export const checkChatExists = async(chatId) => { 
    const result = await Chat.findById(chatId, 'createdAt').exec();
    if (result) {
        return true;
    } else {
        return false;
    }
}

export const putChat = async (chatId, messageObj) => {
    const message = new Message({ ...messageObj });
    const messageResult = await message.save();

    const response = await Chat.findByIdAndUpdate(chatId, {
        lastMessage: messageResult._id,
        $push: {
            messages: {
                $each: [messageResult._id],
                $position: 0,
            },
        },
    }).exec();

    return messageResult;
};
