import crypto from 'crypto';

/**
 * Group invitations work like password-reset links: the email carries a
 * 256-bit random token and the database stores only its SHA-256 hash, so a
 * leaked database (or a group response that accidentally includes the
 * field) can never be replayed as a working invitation link.
 */
export function hashInvitationToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createInvitationToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashInvitationToken(token) };
}

/** Invitation links go stale; an emailed link should not live forever. */
export const INVITATION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
