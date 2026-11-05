import jwt from 'jsonwebtoken';

/** Reads JWT_SECRET from env, throwing a clear error when missing. */
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is missing in server/.env');
  }
  return secret;
}

function generateToken(userId: string): string {
  const options: jwt.SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ id: userId }, jwtSecret(), { expiresIn: options });
}

export default generateToken;
