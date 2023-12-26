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

    const emailHTML = `
        <html>
            <body>
                <h1>Verification Code for UniLuff Account</h1>
                <p>${message}</p>
                <p>Welcome to UniLuff!</p>
                <p>Regards,</p>
                <p>UniLuff Team</p>
            </body>
        </html>
    `;

    // Email transporter configuration
    const mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: to,
        subject: subject,
        html: emailHTML
    };

    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            throw err;
        } 
    });

    return { status: 'success', message: 'Email sent' };
}