import crypto from 'crypto';

type SessionPayload = {
  userId: string;
  leagueId?: string | null;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error('SESSION_SECRET must be configured.');
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf-8');
}

function sign(payload: string) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createSessionToken(payload: SessionPayload) {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function readSessionToken(token?: string | null): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
  } catch {
    return null;
  }
}
