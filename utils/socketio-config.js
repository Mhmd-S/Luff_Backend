// socket-server.js
import { Server } from 'socket.io';
import { updateMessageToSeen, putChat } from '../controllers/ChatController.js';
import { errorHandlers } from './errorHandler';
import * as UserService from '../services/UserService.js';

const userSocketMap = new Map();
let io;

// Function to create a Socket.IO server
export const createSocketServer = (httpServer, sessionMiddleware, passport) => {
	io = initializeSocketServer(httpServer);
	configureSocketMiddleware(io, sessionMiddleware, passport);
	configureSocketEventHandlers(io);
};

// Initialize the Socket.IO server with options
const initializeSocketServer = (httpServer) => {
	try {
		return new Server(httpServer, {
			cors: {
				origin: 'http://127.0.0.1:5173',
				credentials: true,
			},
			connectionStateRecovery: {
				maxDisconnectionDuration: 2 * 60 * 1000,
			},
		});
	} catch (error) {
		console.error('Error initializing Socket.IO server:', error);
	}
};

// Configure middleware for Socket.IO
const configureSocketMiddleware = (io, sessionMiddleware, passport) => {
	io.use((socket, next) => {
		sessionMiddleware(socket.request, {}, next); // Handle sessions
	});

	io.use((socket, next) => {
		passport.initialize()(socket.request, {}, next); // Initialize Passport
	});

	io.use((socket, next) => {
		passport.session()(socket.request, {}, next); // Use Passport sessions
	});

	io.use((socket, next) => {
		if (socket.request.user) {
			next();
		} else {
			errorHandlers.handleSocketError('Unauthorized', io, socket.id);
		}
	});
};

// Configure event handlers for Socket.IO
const configureSocketEventHandlers = (io) => {
	io.on('connection', (socket) => {
		const userId = socket.request.user._id.toString();
		associateSocketWithUser(userId, socket);

		socket.on('send-message', async (data) => {
			try {
				await handleSendMessage(io, socket, userId, data);
			} catch (error) {
				errorHandlers.handleSocketError(error, io, socket.id);
			}
		});

		socket.on('read-message', async (data) => {
			try {
				await handleUpdateMessageToSeen(io, socket, userId, data);
			} catch (error) {
				errorHandlers.handleSocketError(error, io, socket.id);
			}
		});

		socket.on('disconnect', () => {
			disassociateSocketFromUser(userId);
		});
	});
};

// Handlers for Socket.IO events
// Handle the 'send-message' event
const handleSendMessage = async (io, socket, userId, data) => {
	// Check if the recipient is blocked
	if (socket.request.user.blockedUsers.includes(data.recipientId)) {
		errorHandlers.handleSocketError('User is blocked', io, socket.id);
		return;
	}

	const recipientId = data.recipient._id;
	const recipientSocketId = userSocketMap.get(recipientId);

	// Check if either users have blocked the other
	const recipientBlocked = await UserService.getUserById(recipientId);
	if (recipientBlocked.blockedUsers.includes(userId) || socket.request.user.blockedUsers.includes(recipientId)) {
		errorHandlers.handleSocketError('User is blocked', io, socket.id);
		return;
	}

	data.sender = {
		_id: userId,
		name: socket.request.user.name,
		profilePictures: socket.request.user.profilePictures,
	};

	delete data.senderId;
	delete data.recipientId;

	data.timestamp = Date.now();

	// Save the message to the database
	try {
		let saveMessage = await putChat(data.sender, data.chatId, data.message);
		// Send the message to the intended recipient if they are online
		if (recipientSocketId && io.sockets.sockets.has(recipientSocketId)) {
			io.to(recipientSocketId).emit('receive-message', saveMessage);
		}

		if (io.sockets.sockets.has(socket.id)) {
			// Send the message to the sender too
			saveMessage.recipient = {
				_id: recipientId,
				name: data.recipient.name,
				profilePictures: data.recipient.profilePictures,
			};
			console.log(saveMessage)
			io.to(socket.id).emit('sent-message-chat', saveMessage);
			io.to(socket.id).emit('sent-message-contacts', saveMessage);
			console.log('sent to sender');
		}
	} catch (err) {
		errorHandlers.handleSocketError(err, io, socket.id);
	}
};

const handleUpdateMessageToSeen = async (io, socket, userId, data) => {
	const response = await updateMessageToSeen(userId, data.messageId);
	io.to(userId).emit('update-message-to-seen', response);
};

// Associate a socket with a user in the map
const associateSocketWithUser = (userId, socket) => {
	userSocketMap.set(userId, socket.id);
	socket.join(userId);
};

// Disassociate a socket from a user in the map
const disassociateSocketFromUser = (userId) => {
	userSocketMap.delete(userId);
};

// Function to emit a match
export const emitMatch = async (user, likedUser, chat) => {
	user = {
		_id: user._id,
		name: user.name,
		profilePictures: user.profilePictures,
	};

	likedUser = {
		_id: likedUser._id,
		name: likedUser.name,
		profilePictures: likedUser.profilePictures,
	};

	const match = {
		chatId: chat._id,
		sender: user,
		recipient: likedUser,
	};

	const userSocketId = userSocketMap.get(user._id.toString());
	if (userSocketId && io.sockets.sockets.has(userSocketId)) {
		io.to(userSocketId).emit('match', match);
	}
};
