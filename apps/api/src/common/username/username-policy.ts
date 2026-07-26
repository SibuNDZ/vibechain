/**
 * Shared username rules -- used by RegisterDto, UpdateProfileDto, and the
 * wallet-auth auto-provisioned username, so registration and profile edits
 * can never diverge from what mentions (Stage 3) will parse.
 */

// Lowercase-only: sidesteps case-insensitive-uniqueness-with-preserved-display
// entirely (no normalized column needed) -- see MEMORY discussion in chat.
export const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export const USERNAME_FORMAT_MESSAGE =
  "Username must be 3-30 characters: lowercase letters, numbers, and underscores only";

const COOLDOWN_DAYS = 30;
const HOLD_DAYS = 30;
export const USERNAME_COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
export const USERNAME_HOLD_MS = HOLD_DAYS * 24 * 60 * 60 * 1000;

// Derived from the actual apps/web route segments under (main)/ and (auth)/,
// plus generic terms that would read as official/impersonating if claimed as
// a handle. Not a literal URL-collision risk today (profiles are id-routed,
// /users/[id] not /users/[username]) but still worth blocking.
const ROUTE_RESERVED = [
  "admin",
  "cookies",
  "crowdfunding",
  "legal",
  "messages",
  "my-uploads",
  "privacy",
  "profile",
  "settings",
  "terms",
  "upload",
  "users",
  "videos",
  "login",
  "register",
];

const GENERIC_RESERVED = [
  "admin",
  "administrator",
  "vibechain",
  "support",
  "help",
  "mod",
  "moderator",
  "official",
  "api",
  "root",
  "system",
  "notifications",
  "search",
  "null",
  "undefined",
];

export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  ...ROUTE_RESERVED,
  ...GENERIC_RESERVED,
]);

export function isValidUsernameFormat(username: string): boolean {
  if (!USERNAME_REGEX.test(username)) return false;
  if (username.startsWith("_") || username.endsWith("_")) return false;
  if (username.includes("__")) return false;
  return true;
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

/** Slugifies arbitrary input (e.g. a wallet address) into a valid username seed. */
export function toUsernameSeed(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20) || "user";
}
