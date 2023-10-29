import 'dotenv/config';
import express from 'express';
import {mongoose} from 'mongoose';
import configurePassport from './config/passport-config';
import { AppError, errorHandlers } from './utils/errorHandler';
import { createServer } from 'http';
import connectDatabase from './config/mogno-config';

// Import routers
import UserRouter from './routes/UserRouter';
import RegistrationRouter from './routes/RegistrationRouter';
import ResetRouter from './routes/ResetRouter';

// Import configs
import { configureSession } from './config/session-config';
import { configureCors } from './config/cors-config';
import { populateUsers } from './utils/FakerHandler';
import { createSocketServer } from './utils/socketio-config';

const app = express();

// Setting up mongo database
async function main() {
    await connectDatabase();
}

main().catch((err) => console.error('Cannot connect to the database:', err));

// Configs
// Configs for the global middleware 
const corsOption = configureCors();
const sessionMiddleware = configureSession();
const passport = configurePassport(); 

// Global middleware
app.use(corsOption);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.set('trust proxy', 1); // For heroku, railway, etc
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routers
app.use('/registration', RegistrationRouter);
app.use('/user', UserRouter);
app.use('/reset', ResetRouter);

// populateUsers();

// Catching 404 and forwarding it to error handler
app.use((req,res,next) => {
    next(new AppError(404, 'Not Found'));
});

// Error handler
app.use((err,req,res,next) => {
    if (err instanceof mongoose.Error.ValidationError) {
        errorHandlers.handleDbValidationError(err,res);
    }else if ( err instanceof mongoose.Error.CastError) {
        errorHandlers.handleDbError(err,res);
    }else if (Array.isArray(err.detail)) {
        errorHandlers.handleFormError(err,res);
    } else {
        errorHandlers.handleError(err,res);
    }
});

const httpServer = createServer(app);

createSocketServer(httpServer, sessionMiddleware, passport);

httpServer.listen(process.env.PORT || 10000, ()=> {
    console.log(`Listening at at port ${process.env.PORT}`);
});
 
