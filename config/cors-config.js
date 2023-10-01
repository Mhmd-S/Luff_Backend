import cors from 'cors';

export const configureCors = () => {
    const corsOptions = {
        origin: "http://127.0.0.1:5173",
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
    };
    return cors(corsOptions);
};