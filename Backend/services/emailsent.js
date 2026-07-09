const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendEmail = async ({ to, subject, html }) => {

    await transporter.verify();

    const info = await transporter.sendMail({
        from: `"BloodConnect" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
    });

    console.log("Message ID:", info.messageId);

    return info;
};

module.exports = { sendEmail };