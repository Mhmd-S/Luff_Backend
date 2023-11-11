// socket-server.js
import { Server } from 'socket.io';
import { updateMessageToSeen, putChat } from '../controllers/ChatController.js';
import { errorHandlers } from './errorHandler';

const userSocketMap = new Map();
let io;

// Function to create a Socket.IO server
export const createSocketServer = (httpServer, sessionMiddleware, passport) => {
    io = initializeSocketServer(httpServer);
    configureSocketMiddleware(io, sessionMiddleware, passport);
    configureSocketEventHandlers(io);
}

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
}

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
            errorHandlers.handleSocketError(socket, 'Unauthorized');
        }
    });
}

// Configure event handlers for Socket.IO
const configureSocketEventHandlers = (io) => {
    io.on('connection', (socket) => {

        const userId = socket.request.user._id.toString();
        associateSocketWithUser( userId, socket);

        socket.on('send-message', async (data) => {
            try {
                await handleSendMessage(io, socket, userId, data);
            } catch (error) {
                errorHandlers.handleSocketError(error, socket);
            }
        });

        socket.on('read-message', async (data) => {
            try {
                await handleUpdateMessageToSeen(io, socket, userId, data);
            } catch (error) {
                errorHandlers.handleSocketError(error, socket);
            }
        });

        socket.on('disconnect', () => {
            disassociateSocketFromUser(userId);
        });

    });
}

// Handlers for Socket.IO events
// Handle the 'send-message' event
const handleSendMessage = async (io, socket, userId, data) => {

    const recipientId = data.recipient._id;
    const recipientSocketId = userSocketMap.get(recipientId);

    data.sender = {
        _id: userId,
        name: socket.request.user.name,
        profilePictures: socket.request.user.profilePictures,
    };

    data.timestamp = Date.now();

    // Save the message to the database
    try{
        const saveMessage = await putChat(data.sender, data.chatId, data.message);
    }catch(err){
        errorHandlers.handleSocketError(err, socket);
    }
    // Send the message to the intended recipient if they are online
    if (recipientSocketId && io.sockets.sockets.has(recipientSocketId)) {
        io.to(recipientSocketId).emit('receive-message', saveMessage);
    }

}

const handleUpdateMessageToSeen = async (io, socket, userId, data) => {
    const response = await updateMessageToSeen(userId, data.messageId);
    io.to(userId).emit('update-message-to-seen', response);
}

// Associate a socket with a user in the map
const associateSocketWithUser = (userId, socket) => {
    userSocketMap.set(userId, socket.id);
    socket.join(userId);
}

// Disassociate a socket from a user in the map
const disassociateSocketFromUser = (userId) => {
    userSocketMap.delete(userId);
}

// Function to emit a match
export const emitMatch = (userId, match) => {
    const userSocketId = userSocketMap.get(userId.toString());
    if (userSocketId && io.sockets.sockets.has(userSocketId)) {
        io.to(userSocketId).emit('match', match);
    }
}
