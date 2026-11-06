import fs from 'fs';
import path from 'path';

/**
 * Pluggable mail delivery. In dev (no SMTP configured) every message is
 * logged to the server console AND appended to server/.mail-outbox.txt —
 * that file is how the password-reset link is delivered locally.
 * To go live, replace the body with nodemailer or a provider SDK
 * (SendGrid, SES); no caller needs to change.
 */
export interface MailOptions {
  to: string;
  subject: string;
  text: string;
}

const OUTBOX = path.resolve(__dirname, '..', '..', '.mail-outbox.txt');

export async function sendMail({ to, subject, text }: MailOptions): Promise<void> {
  const stamp = new Date().toISOString();
  const block = `[${stamp}] To: ${to}\nSubject: ${subject}\n${text}\n${'─'.repeat(56)}\n`;

  console.log('──────── MAIL (dev stub — no SMTP configured) ────────');
  console.log(block.trimEnd());

  // A file copy of everything "sent", readable without touching the console.
  try {
    fs.appendFileSync(OUTBOX, block);
  } catch {
    /* outbox is best-effort; console still carries the message */
  }
}
