const express = require("express");
const router = express.Router();

const { sendEmail } = require("../services/emailsent");

router.post("/send-test", async (req, res) => {

    try {

        const { email } = req.body;

        await sendEmail({
            to: email,
            subject: "BloodConnect Test Email",
            html: `
                <h2>Hello!</h2>
                <p>Your email integration is working.</p>
            `
        });

        res.json({
            success: true,
            message: "Email sent successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});

module.exports = router;