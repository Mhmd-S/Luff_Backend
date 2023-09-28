import cors from 'cors';

export const configureCors = () => {
    const corsOptions = {
        origin: "*",
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
    };
    return cors(corsOptions);
};