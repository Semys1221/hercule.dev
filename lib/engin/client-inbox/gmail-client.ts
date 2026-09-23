import { google } from "googleapis";

export function isGmailConfigured(): boolean {
  return Boolean(
    process.env.GMAIL_CLIENT_ID?.trim() &&
      process.env.GMAIL_CLIENT_SECRET?.trim() &&
      process.env.GMAIL_REFRESH_TOKEN?.trim(),
  );
}

export function getGmailMailbox(): string {
  return process.env.GMAIL_MAILBOX?.trim() || "thomas@hercule.dev";
}

export function getMailboxEmail(): string {
  return getGmailMailbox().trim().toLowerCase();
}

export function getGmailFromHeader(): string {
  return process.env.GMAIL_FROM?.trim() || "Thomas <thomas@hercule.dev>";
}

function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail OAuth is not configured (GMAIL_CLIENT_*).");
  }
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export function getGmailApi() {
  return google.gmail({ version: "v1", auth: getOAuth2Client() });
}
