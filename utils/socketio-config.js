// socket-server.js

import { Server } from 'socket.io';

// Function to create a Socket.IO server
export const createSocketServer = (httpServer, sessionMiddleware, passport) => {
    const io = initializeSocketServer(httpServer);
    configureSocketMiddleware(io, sessionMiddleware, passport);
    configureSocketEventHandlers(io);

    return io;
}

// Initialize the Socket.IO server with options
const initializeSocketServer = (httpServer) => {
    try {
        return new Server(httpServer, {
            cors: {
                origin: '*',
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
            next(new Error('Unauthorized'));
        }
    });
}

// Configure event handlers for Socket.IO
const configureSocketEventHandlers = (io) => {
    const userSocketMap = new Map();

    io.on('connection', (socket) => {
        const userId = socket.request.user._id.toString();
        associateSocketWithUser(userSocketMap, userId, socket);

        socket.on('send-message', async (data) => {
            handleSendMessage(io, userSocketMap, socket, userId, data);
        });

        socket.on('disconnect', () => {
            disassociateSocketFromUser(userSocketMap, userId);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            socket.emit('error', 'An error occurred on the server.');
        });
    });
}

// Associate a socket with a user in the map
const associateSocketWithUser = (userSocketMap, userId, socket) => {
    userSocketMap.set(userId, socket.id);
    socket.join(userId);
}

// Handle the 'send-message' event
const handleSendMessage = async (io, userSocketMap, socket, userId, data) => {
    const recipientId = data.recipient._id;
    const recipientSocketId = userSocketMap.get(recipientId);

    data.sender = {
        userId: userId,
        username: socket.request.user.username,
        profilePicture: socket.request.user.profilePicture,
    };

    data.timestamp = Date.now();

    socket.emit('sent-message', data);

    if (recipientSocketId && io.sockets.sockets.has(recipientSocketId)) {
        io.to(recipientSocketId).emit('receive-message', data);
    }

    try {
        saveMessageToDatabase(data);
    } catch (err) {
        socket.emit('error', 'Could not save message to the database');
    }
}

// Disassociate a socket from a user in the map
const disassociateSocketFromUser = (userSocketMap, userId) => {
    userSocketMap.delete(userId);
}

// Function to save the message to the database (to be implemented)
const saveMessageToDatabase = async(data) => {
    if (data.chatId === null) {
        try {
            const chatInfo = await ChatController.createChat([data.sender.userId, data.recipient._id]);
            const chatId = chatInfo._id;
            // Save the message to the database
            const saveMessage = await ChatController.putChat(data.sender.userId, chatId, data.message);
        } catch(err) {
            console.log(err);
        }
    } else {
        try {
            // Save the message to the database
            const saveMessage = await ChatController.putChat(data.sender.userId, data.chatId, data.message);
        } catch(err) {
            console.log(err);
        }
    }
}
