import "dotenv/config";
import nodemailer from "nodemailer";

console.log("========== Email Service Loaded ==========");

console.log("GOOGLE_USER:", process.env.GOOGLE_USER);
console.log("CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID);
console.log("CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET);
console.log("REFRESH_TOKEN exists:", !!process.env.GOOGLE_REFRESH_TOKEN);

console.log("Creating transporter...");

// Creating transporter for communication b/w webserver and smtp server.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

console.log("Transporter created");

console.log("Calling transporter.verify()...");

// Verify the connection configuration
transporter.verify((error, success) => {
  console.log("Verify callback executed");

  if (error) {
    console.error("Error connecting to email server:");
    console.error(error);
  } else {
    console.log("Email server is ready to send messages");
    console.log(success);
  }
});

// This fn is used to send the email (Notice email is sent in the form of html)
export const sendEmail = async ({ to, subject, html, text }) => {
  console.log("==================================");
  console.log("sendEmail() called");
  console.log("To:", to);
  console.log("Subject:", subject);

  const mailOptions = {
    from: process.env.GOOGLE_USER,
    to,
    subject,
    html,
    text,
  };

  console.log("Mail options created");
  console.log("Calling transporter.sendMail()...");

  const start = Date.now();

  const details = await transporter.sendMail(mailOptions);

  console.log("transporter.sendMail() completed");
  console.log("Time Taken:", Date.now() - start, "ms");

  console.log("Email sent successfully");
  console.log("Message ID:", details.messageId);
  console.log("Accepted:", details.accepted);
  console.log("Rejected:", details.rejected);
  console.log(details);

  return details;
};