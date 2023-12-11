import Message from '../models/Message';
import Chat from '../models/Chat';

export const getParticipants = async(chatId) => {
    const result = await Chat.findById(chatId, 'participants').exec();
    return result; 
}

export const getChat = async(chatId, pageNumber) => {

    const nPerPage = 30;
    const skipFormula = ( pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0 );

    const result = await Chat.findById(chatId).populate({
        path: 'messages',
        select: 'senderId content seenBy createdAt',
        options: {
            sort: { createdAt: -1 },
            skip: skipFormula,
            limit: nPerPage,
        },
    })
    .populate({
        path: 'lastMessage',
    }).exec();

    return result;
}

export const getChats = async(userID, pageNumber) => { 

    const nPerPage = 20;
    const skipFormula = ( pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0 );

    const result = await Chat.find({ participants: { $in: [userID] } }, 'participants lastMessage updatedAt')
        .sort({ updatedAt: -1 })
        .skip(skipFormula)
        .limit(nPerPage)
        .populate('participants', 'name profilePictures blockedUsers')
        .populate('lastMessage', 'content updatedAt seenBy')
        .exec();

    // Filter out chats where either users are blocked
    result.forEach((chat, index) => {
        if (chat.participants[0].blockedUsers.includes(userID) || chat.participants[1].blockedUsers.includes(userID)) {
            result.splice(index, 1);
        }
    });

    return result;
}

export const getUndreadChatsCount = async(userId) => {
    const result = await Chat.find({ participants: { $in: [userId] } })
        .sort({ updatedAt: -1 })
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

    // Save the message
    const messageResult = await message.save();

    // Update the chat
    const response = await Chat.findByIdAndUpdate(chatId, {
        lastMessage: messageResult._id,
        $push: {
            messages: {
                $each: [messageResult._id],
                $position: 0,
            },
        },
    }).exec();

    // Return
    return messageResult;
};
    