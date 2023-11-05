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
            sort: { updatedAt: -1 },
            limit: 25,
            skip: (page-1) * 25
        },
    })
    .populate({
        path: 'lastMessage',
    }).exec();
    return result;
}

export const getChats = async(userID, page) => { // this
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

export const updateChatToSeen = async(userId, chatId) => {

    const chatInfo = await Chat.findById( chatId ).exec();
    
    const result = await Message.findByIdAndUpdate( chatInfo.lastMessage, { $push: { seenBy: userId} } ).exec();
    
    return result;
}

export const updateMessagetoSeen = async(userId, messageId) => {
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

export const putChat = async(chatId, messageObj) => {
    const message = new Message({...messageObj});
    const messageResult = await message.save();
    
    await Chat.findByIdAndUpdate(chatId, { lastMessage: messageResult._id, $push: { messages: messageResult._id } }).exec();
    
    return messageResult;
}