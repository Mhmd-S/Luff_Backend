// socket-server.js
import { Server } from 'socket.io';
import { createChat, updateMessageToSeen, putChat } from '../controllers/ChatController.js';

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
            next(new Error('Unauthorized'));
        }
    });
}

// Configure event handlers for Socket.IO
const configureSocketEventHandlers = (io) => {
    io.on('connection', (socket) => {

        const userId = socket.request.user._id.toString();
        associateSocketWithUser( userId, socket);

        socket.on('send-message', async (data) => {
            handleSendMessage(io, socket, userId, data);
        });

        socket.on('read-message', async (data) => {
            handleUpdateMessageToSeen(io, socket, userId, data);
        });

        socket.on('disconnect', () => {
            disassociateSocketFromUser(userId);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
            socket.emit('error', 'An error occurred on the server.');
        });
    });
}

// Associate a socket with a user in the map
const associateSocketWithUser = (userId, socket) => {
    userSocketMap.set(userId, socket.id);
    socket.join(userId);
}

// Handle the 'send-message' event
const handleSendMessage = async (io, socket, userId, data) => {
    const recipientId = data.recipient._id;
    const recipientSocketId = userSocketMap.get(recipientId);

    console.log(data.recipient)

    data.sender = {
        _id: userId,
        name: socket.request.user.name,
        profilePictures: socket.request.user.profilePictures,
    };

    data.timestamp = Date.now();

    
    // Send the message to the intended recipient if they are online
    if (recipientSocketId && io.sockets.sockets.has(recipientSocketId)) {
        try{
            const response = await saveMessageToDatabase(data);
            io.to(recipientSocketId).emit('receive-message', response);
        } catch(err) {
            console.log('error','Could not send message to recipient')
        }
    }

}

const handleUpdateMessageToSeen = async (io, socket, userId, data) => {
    try{
        const response = await updateMessageToSeen(userId, data.messageId);
        io.to(userId).emit('update-message-to-seen', response);
    } catch(err){   
        console.log('error', 'Could not update message to seen');
    }
}

// Disassociate a socket from a user in the map
const disassociateSocketFromUser = (userId) => {
    userSocketMap.delete(userId);
}


const saveMessageToDatabase = async(data) => { // this
    if (data.chatId === null) {
        return;
    } else {
        try {
            // Save the message to the database
            const saveMessage = await putChat(data.sender, data.chatId, data.message);
            return saveMessage;
        } catch(err) {
            console.log(err);
        }
    }
}

// Function to emit a match
export const emitMatch = (userId, match) => {
    const userSocketId = userSocketMap.get(userId.toString());
    if (userSocketId && io.sockets.sockets.has(userSocketId)) {
        io.to(userSocketId).emit('match', match);
    }
}
