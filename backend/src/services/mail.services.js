import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // CHANGED: Use 587 instead of 465
  secure: false, // CHANGED: Must be false for port 587 (it upgrades to secure automatically)
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
  connectionTimeout: 10000,
});

// Switch to the promise-based version of verify so you can await it
export const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email server is ready to send messages");
    return true;
  } catch (error) {
    console.error("Error connecting to email server in production:", error);
    return false;
  }
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.GOOGLE_USER,
    to,
    subject,
    html,
    text,
  };

  // Force the serverless environment to wait for the email to fully send
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("sendMail error details:", err);
        reject(err);
      } else {
        console.log("Email sent successfully:", info.messageId);
        resolve(info);
      }
    });
  });
};
