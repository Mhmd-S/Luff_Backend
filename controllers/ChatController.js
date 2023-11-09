import { AppError } from '../utils/errorHandler';
import User from '../models/User';
import * as ChatService from '../services/ChatService';
import mongoose from 'mongoose';

export const getChat = async(req,res,next) => {
    try{
        const chatId = req.query.chatId;
        const page = req.query.page;
 
        if (!page || page < 1) {
            throw new AppError(400, "Invalid :page parameter");
        }

        const chat = await ChatService.getChat(chatId, page);

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

export const updateMessageToSeen = async(userId, messageId) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            throw new AppError(400, "Invalid :messageId parameter");
        }

        const message = await ChatService.updateMessageToSeen(userId, messageId);

        res.status(200).json({ status: "success", data: message });
    } catch (err) {
        next(err);
    }
}

// The code below is used by sockets only
// Handle Errors diffrently

export const createChat = async(participants) => {
    try {

        if (!participants) throw new AppError(400, "Invalid :participants parameter");

        if (!Array.isArray(participants)) throw new AppError(400, "Invalid :participants parameter");

        if (participants.length !== 2) throw new AppError(400, "Invalid :participants parameter");
        
        // check if participants are valid users
        if (!await User.exists({ _id: participants[0] }) || !await User.exists({ _id: participants[1] })) throw new AppError(404, "User not found!");

        const chat = await ChatService.createChat(participants);

        return chat;
    } catch (err) {
        console.log(err);
    }
} 

export const putChat = async(sender, chatId, message) => { // this
    try {
    
        if (!chatId) throw new AppError(400, "Invalid :chatId parameter");
        
        const chatPartcipants = await ChatService.getParticipants(chatId);

        if (chatPartcipants.participants.indexOf(sender._id) === -1) throw new AppError(401, "Unauthorized to access chat!");
        
        const recipient = chatPartcipants.participants[0] ===  sender._id ? chatPartcipants.participants[0] : chatPartcipants.participants[1];

        const chat = await ChatService.getChat(chatId   , 1);

        if (!chat) throw new AppError(404, "Chat not found!");

        const messageObj = {
            senderId: sender._id,
            recipientId: recipient,
            content: message,
            seenBy: [sender._id],
        };

        const result = await ChatService.putChat(chatId, messageObj);
        return result;
    
    } catch (err) {
        console.log(err);
    }
}