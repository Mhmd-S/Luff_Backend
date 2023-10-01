import session from 'express-session';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';

export const configureSession = () => {
    return session({
        secret: process.env.session_secret,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            client: mongoose.connection.getClient(),
        }),
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 60, // 30 days
            // sameSite: 'none',
            // secure: true,
        },
    });
};