import Message from '../models/Message';
import Chat from '../models/Chat';

export const getParticipants = async(chatId) => {
    const result = await Chat.findById(chatId, 'participants').exec();
    return result; 
}

export const getChat = async(chatId, userId, page) => {
    const result = await Chat.findById(chatId).populate({
        path: 'messages',
        select: 'senderId content createdAt',
        options: {
            sort: { updatedAt: -1 },
            limit: 50,
            skip: (page-1) * 50
        },
    })
    .populate({
        path: 'lastMessage',
    }).exec();
    return result;
}

export const getChats = async(userID, page) => {
    const result = await Chat.find({ participants: { $in: [userID] } }, 'participants lastMessage updatedAt')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * 20)
        .limit(20)
        .populate('participants', 'name profilePictures')
        .populate('lastMessage', 'content updatedAt seenBy')
        .exec();

    return result;
}

export const getUndreadChatsCount = async(userId) => {
    const result = await Chat.find({ participants: { $in: [userId] } })
        .populate('lastMessage', 'seenBy')
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

export const updateChatToSeen = async(userId, chatId) => {
    const result = await Message.updateMany({ _id: chatId }, { $push: { seenBy: userId } }).exec();
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

export const putChat = async(chatId, messageObj) => {
    const message = new Message({...messageObj});
    const messageResult = await message.save();
    
    const chatResult = await Chat.findByIdAndUpdate(chatId, { lastMessage: messageResult._id, $push: { messages: messageResult._id } }).exec();
    return chatResult;
}