import nodemailer from 'nodemailer';

 // Send email to user
 const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    },
});

export const sendEmail = (to, subject, message) => {
    // Email transporter configuration
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: to,
        subject: subject,
        text: message,
    };

    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            throw err;
        } 
    });

    return { status: 'success', message: 'Email sent' };
}