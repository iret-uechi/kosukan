import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "kosukan_auth";
export const OAUTH_STATE_COOKIE = "kosukan_oauth_state";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface AuthConfig {
  allowedUsers: Set<string>;
  clientId: string;
  clientSecret: string;
  cookieSecret: string;
}

interface AuthConfigStatus {
  config: AuthConfig | null;
  enabled: boolean;
  error: string | null;
}

export interface SessionPayload {
  avatarUrl?: string;
  exp: number;
  id: number;
  login: string;
  name?: string;
}

const authEnvKeys = [
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "AUTH_COOKIE_SECRET",
  "AUTH_ALLOWED_GITHUB_USERS",
] as const;

function getEnv(name: (typeof authEnvKeys)[number]): string {
  return process.env[name]?.trim() ?? "";
}

export function getAuthConfigStatus(): AuthConfigStatus {
  const values = authEnvKeys.map((key) => [key, getEnv(key)] as const);
  const configuredValues = values.filter(([, value]) => value.length > 0);

  if (configuredValues.length === 0) {
    return { config: null, enabled: false, error: null };
  }

  const missing = values.filter(([, value]) => value.length === 0).map(([key]) => key);
  if (missing.length > 0) {
    return {
      config: null,
      enabled: true,
      error: `Missing required auth environment variables: ${missing.join(", ")}`,
    };
  }

  const allowedUsers = new Set(
    getEnv("AUTH_ALLOWED_GITHUB_USERS")
      .split(/[\s,]+/)
      .map((user) => user.trim().toLowerCase())
      .filter(Boolean),
  );

  if (allowedUsers.size === 0) {
    return {
      config: null,
      enabled: true,
      error: "AUTH_ALLOWED_GITHUB_USERS must include at least one GitHub username.",
    };
  }

  const cookieSecret = getEnv("AUTH_COOKIE_SECRET");
  if (cookieSecret.length < 32) {
    return {
      config: null,
      enabled: true,
      error: "AUTH_COOKIE_SECRET must be at least 32 characters.",
    };
  }

  return {
    config: {
      allowedUsers,
      clientId: getEnv("GITHUB_CLIENT_ID"),
      clientSecret: getEnv("GITHUB_CLIENT_SECRET"),
      cookieSecret,
    },
    enabled: true,
    error: null,
  };
}

export function createRandomState(): string {
  return randomBytes(24).toString("base64url");
}

export function createSession(payload: Omit<SessionPayload, "exp">, secret: string): string {
  const session: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifySession(token: string | undefined, secret: string): SessionPayload | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  if (!safeEqual(signature, sign(encodedPayload, secret))) return null;

  try {
    const session = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (!session.login || !session.id || !session.exp) return null;
    if (session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (!rawName || rawValue.length === 0) continue;
    cookies.set(rawName, decodeURIComponent(rawValue.join("=")));
  }

  return cookies;
}

export function createCookie(
  name: string,
  value: string,
  requestUrl: string,
  maxAgeSeconds: number,
  path = "/",
): string {
  const url = new URL(requestUrl);
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAgeSeconds}`,
    `Path=${path}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (url.protocol === "https:" || !["localhost", "127.0.0.1"].includes(url.hostname)) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function expireCookie(name: string, requestUrl: string, path = "/"): string {
  return createCookie(name, "", requestUrl, 0, path);
}

export function getSessionMaxAgeSeconds(): number {
  return SESSION_MAX_AGE_SECONDS;
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}
