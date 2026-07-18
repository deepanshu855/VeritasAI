import "dotenv/config";
import { google } from "googleapis";

// 1. Establish the HTTP OAuth2 Client
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// 2. HTTP-based verification
export const verifyConnection = async () => {
  try {
    // This tests the HTTPS connection by grabbing a fresh access token
    await oAuth2Client.getAccessToken();
    return true;
  } catch (error) {
    // Kept this error log: Crucial if your OAuth token ever expires!
    console.error("Error connecting to Google API in production:", error);
    return false;
  }
};

// 3. HTTP-based email sender
export const sendEmail = async ({ to, subject, html, text }) => {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  // Manually construct the standard email headers
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `From: ${process.env.GOOGLE_USER}`,
    `To: ${to}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${utf8Subject}`,
    "", // Required empty line between headers and body
    html || text,
  ];

  const message = messageParts.join("\n");

  // The Gmail API requires a specific Base64 URL-safe encoding
  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Fire the HTTP POST request to bypass the SMTP port block
  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });

  return res.data;
};
