import { AppError } from '../utils/errorHandler';
import User from '../models/User';
import * as ChatService from '../services/ChatService';
import mongoose from 'mongoose';

export const getChat = async(req,res,next) => {
    try{

        const chatId = req.query.chatId;
        const page = req.query.page;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            throw new AppError(400, "Invalid chatId parameter");
        }

        const chatPartcipants = await ChatService.getParticipants(req.query.chatId);
        if (chatPartcipants.indexOf(req.user._id) === -1) {
            throw new AppError(401, "Unauthorized to access chat!");
        }
 
        if (!page || page < 1) {
            throw new AppError(400, "Invalid page parameter");
        }

        const chat = await ChatService.getChat(chatId, page);


        if (!chat) {
            throw new AppError(404, "Chat not found!");
        }

        // Reverse the messages array so the newest messages are at the end, easier to display in the client
        if (chat?.messages) {
            chat.messages.reverse();
        }

        res.status(200).json({ status: "success", data: chat });

    } catch (err) {
        next(err);
    }
}

export const updateChatToSeen = async(req,res,next) => {
    try {
        const userId = req.user._id;
        const chatId = req.query.id;
        const page = req.query.page;

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            throw new AppError(400, "Invalid id query");
        }

        if (!page || page < 1) {
            throw new AppError(400, "Invalid page query");
        }

        const chat = await ChatService.updateChatToSeen(userId, chatId, page);

        res.status(200).json({ status: "success", data: chat });
    }  catch (err) {
        next(err);
    }
}

export const getChats = async(req,res,next) => {
    try {
        const userId = req.user._id;
        const page = req.query.page;

        if (!page || page < 1) {
            throw new AppError(400, "Invalid page query");
        }

        const chats = await ChatService.getChats(userId, page);

        res.status(200).json({ status: "success", data: chats });
    } catch (err) {
        next(err);
    }
}

export const getUndreadChatsCount = async(req,res,next) => {
    try {
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new AppError(400, "Invalid :userId parameter");
        }

        const count = await ChatService.getUndreadChatsCount(userId);

        res.status(200).json({ status: "success", data: count });
    } catch (err) {
        next(err);
    }
}


// The code below is used by sockets only
// Handle Errors diffrently
export const updateMessageToSeen = async(userId, messageId) => {
    
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
        throw new AppError(400, "Invalid messageId");
    }
    
    const message = await ChatService.updateMessageToSeen(userId, messageId);
    
    return { status: "success", data: message };
}

export const createChat = async(participants) => {
    if (!participants) throw new AppError(400, "Invalid participants ");
    
    if (!Array.isArray(participants)) throw new AppError(400, "Invalid :participants parameter");
    
    if (participants.length !== 2) throw new AppError(400, "Invalid :participants parameter");
    
    // check if participants are valid users
    if (!await User.exists({ _id: participants[0] }) || !await User.exists({ _id: participants[1] })) throw new AppError(404, "User not found!");
    
    const chat = await ChatService.createChat(participants);
    
    return chat;
} 

export const putChat = async(sender, chatId, message) => { // this
    if (!chatId) throw new AppError(400, "Invalid :chatId parameter");
    
    const chatPartcipants = await ChatService.getParticipants(chatId);
   
    // Check if user authorized to access chat
    if (chatPartcipants.participants.indexOf(sender._id) === -1) throw new AppError(401, "Unauthorized to access chat!");
    
   
    // Figure out the recipient from the chat participants
    const recipient = chatPartcipants.participants[0] ===  sender._id ? chatPartcipants.participants[0] : chatPartcipants.participants[1];
   
    // Check if chat is valid
    const chat = await ChatService.getChat(chatId   , 1);
    if (!chat) throw new AppError(404, "Chat not found!");
   
    // Message obj to be saved in database
    const messageObj = {
        senderId: sender._id,
        chatId: chatId,
        recipientId: recipient,
        content: message,
        seenBy: [sender._id],
    };
   
    // Save message to database
    const result = await ChatService.putChat(chatId, messageObj);
   
    // Message obj to be sent to client
    const msg = {
        ...result._doc,
        sender: sender,
    }
   
    return msg;
}