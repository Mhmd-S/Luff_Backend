import express from 'express';
import checkAuth from '../auth/checkAuth.js';
import * as ChatController from '../controllers/ChatController';

let router = express.Router();

// Get a chat between two users. Takes Page, User Id and Recipient Id as query paramters.
router.get('/get-chat', checkAuth, ChatController.getChat);

// Get One user all chats. Takes Page and User Id as query paramters.
router.get('/get-chats', checkAuth, ChatController.getChats);

// Update chat to seen. Takes User Id and Chat Id as query paramters.
router.put('/update-chat-to-seen/:chatId', checkAuth, ChatController.updateChatToSeen);

export default router;