// // socket-config.js

// import { Server } from 'socket.io';

// export function createSocketServer(httpServer, sessionMiddleware, passport) {
//     // Create a new instance of Socket.IO and attach it to the HTTP server
//     const io = new Server(httpServer, {
//         cors: {
//             origin: '*',
//             credentials: true,
//         },
//         connectionStateRecovery: {
//             maxDisconnectionDuration: 2 * 60 * 1000,
//         },
//     });

//     // Middleware for Socket.IO to handle sessions and passport authentication
//     io.use((socket, next) => {
//         sessionMiddleware(socket.request, {}, next); // Handle sessions
//     });

//     io.use((socket, next) => {
//         passport.initialize()(socket.request, {}, next); // Initialize Passport
//     });

//     io.use((socket, next) => {
//         passport.session()(socket.request, {}, next); // Use Passport sessions
//     });

//     io.use((socket, next) => {
//         if (socket.request.user) {
//             next();
//         } else {
//             next(new Error('Unauthorized'));
//         }
//     });

//     // Map to store user socket associations
//     const userSocketMap = new Map();

//     io.on('connection', (socket) => {
//         const userId = socket.request.user._id.toString();

//         // Store the association between user ID and socket ID in the map
//         userSocketMap.set(userId, socket.id);

//         socket.join(userId);

//         socket.on('send-message', async (data) => {
//             const recipientId = data.recipient._id;
//             const recipientSocketId = userSocketMap.get(recipientId);

//             data.sender = {
//                 userId: userId,
//                 username: socket.request.user.username,
//                 profilePicture: socket.request.user.profilePicture,
//             };

//             data.timestamp = Date.now();

//             // Send to the sender
//             socket.emit('sent-message', data);

//             // Check if the recipient is online (has a socket connection)
//             if (recipientSocketId && io.sockets.sockets.has(recipientSocketId)) {
//                 // Emit the message only to the intended recipient's socket
//                 io.to(recipientSocketId).emit('receive-message', data);
//             }

//             // Save data to the database (you can implement this part)
//             try {
//                 if (data.chatId === null) {
//                     // Create a chat or perform other database operations
//                     // ...
//                 } else {
//                     // Update an existing chat or perform other database operations
//                     // ...
//                 }
//             } catch (err) {
//                 socket.emit('error', 'Could not save message to the database');
//             }
//         });

//         socket.on('disconnect', () => {
//             // Remove the association when the socket disconnects
//             userSocketMap.delete(userId);
//         });
//     });

//     return io;
// }
