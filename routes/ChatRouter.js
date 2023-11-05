import express from 'express';
import checkAuth from '../auth/checkAuth.js';
import * as ChatController from '../controllers/ChatController';

let router = express.Router();

// Get a chat between two users. Takes Page and Recipient Id as query paramters.
router.get('/chat', checkAuth, ChatController.getChat);

// Get One user all chats. 
router.get('/chats', checkAuth, ChatController.getChats);

// Get Unread chats count.
router.get('/get-unread-chats-count', checkAuth, ChatController.getUndreadChatsCount);

// Update chat to seen. Takes User Id and Chat Id as query paramters.
router.put('/update-chat-to-seen', checkAuth, ChatController.updateChatToSeen);

// router.put('/update-message-to-seen', checkAuth, ChatController.updateMessageToSeen);

export default router;