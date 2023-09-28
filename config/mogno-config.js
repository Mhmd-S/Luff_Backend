// config/database.js

import mongoose from 'mongoose';

export default async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        });
        console.log('Connected to the database');
    } catch (error) {
        console.error('Database connection error:', error);
        // You can add additional error handling here, such as throwing an error or exiting the application.
    }
}
