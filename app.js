import 'dotenv/config';
import express from 'express';
import {mongoose} from 'mongoose';
import cors from 'cors';
import configurePassport from './auth/passport-config';
import { AppError, errorHandlers } from './utils/errorHandler';
import { createServer } from 'http';
import connectDatabase from './config/mogno-config';
import { createSocketServer } from './config/socketio-config';

// Import routers
import UserRouter from './routes/UserRouter';
import { configureSession } from './config/session-config';
import { configureCors } from './config/cors-config';

const app = express();

const httpServer = createServer(app);

// Setting up mongo database
async function main() {
    await connectDatabase();
}

main().catch((err) => console.error('Cannot connect to the database:', err));

// Configs
// Configs for the global middleware
const corsOption = configureCors();
const passport = configurePassport();  
const sessionMiddleware = configureSession();

// Global middleware
app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.set('trust proxy', 1); // For heroku, railway, etc
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routers
app.use('/user', UserRouter);

// Catching 404 and forwarding it to error handler
app.use((req,res,next) => {
    next(new AppError(404, 'Not Found'));
});

// Error handler
app.use((err,req,res,next) => {
    console.log(err)
    if (err instanceof mongoose.Error.ValidationError) {
        errorHandlers.handleDbValidationError(err,res);
    }else if ( err instanceof mongoose.Error.CastError) {
        errorHandlers.handleDbCastError(err,res);
    } else {
        errorHandlers.handleError(err,res);
    }
});

// const io = new Server(httpServer, {
//     cors: {
//         origin: "*",
//         credentials: true
//     },
//     connectionStateRecovery: {
//         // the backup duration of the sessions and the packets
//         maxDisconnectionDuration: 2 * 60 * 1000,
//     },
// });

// // convert a connect middleware to a Socket.IO middleware
// const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

// io.use(wrap(sessionMiddleware));
// io.use(wrap(passport.initialize()));
// io.use(wrap(passport.session()));

// io.use((socket, next) => {
//     if (socket.request.user) {
//       next();
//     } else {
//       next(new Error("unauthorized"));
//     }
//   });

// // To save users and their socket IDs
// const userSocketMap = new Map();

// io.on('connection', (socket) => {
//   const userId = socket.request.user._id.toString();

//   // Store the association between user ID and socket ID in the map
//   userSocketMap.set(userId, socket.id);

//   socket.join(userId);

//   socket.on('send-message', async(data) => {

//     const recipientId = data.recipient._id;

//     // Get the recipient's socket ID from the map
//     const recipientSocketId = userSocketMap.get(recipientId);

//     data.sender = {
//       userId: userId,
//       username: socket.request.user.username,
//       profilePicture: socket.request.user.profilePicture
//     }
    
//     data.timestamp = Date.now();

//     // Send to the sender.
//     socket.emit('sent-message', data);

//     // Check if the recipient is online (has a socket connection)
//     if (recipientSocketId && io.sockets.sockets.has(recipientSocketId)) {
//       // Emit the message only to the intended recipient's socket
//       // Send to the recipient.
//       io.to(recipientSocketId).emit('receive-message', data);
//     } 
    
//     // Save data to the database
//     try{
//       if(data.chatId === null) {
//         const result = await ChatController.createChat([userId, data.recipient._id]);
//         console.log(result);
//         const chatAddMessageResult = await ChatController.putChat(userId,result._id, data.message);
//         console.log('hellooooo')
//         // Send the chatId back to the client
//         socket.emit('chatId', result._id);
//       } else {
//         const result = await ChatController.putChat(userId, data.chatId, data.message);
//       }
//     } catch(err) {
//       socket.emit('error', 'Coukd not save message to database');
//     }

//   });

//   socket.on('disconnect', () => {
//     // Remove the association when the socket disconnects
//     userSocketMap.delete(userId);
//   });
// });

const io = createSocketServer(httpServer, sessionMiddleware, passport);

httpServer.listen(process.env.PORT || 10000, ()=> {
    console.log(`Listening at at port ${process.env.PORT}`);
});
 
