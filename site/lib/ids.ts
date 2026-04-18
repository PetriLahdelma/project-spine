import { randomBytes, randomUUID } from "node:crypto";

/** 128-bit opaque identifier for primary keys. URL-safe, 22 chars. */
export function newId(): string {
  return randomUUID();
}

/**
 * Short, unambiguous user-facing code for the device-flow.
 * 8 chars from an alphabet stripped of lookalikes (0/O, 1/I/L).
 * Formatted as XXXX-XXXX for readability.
 */
const USER_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newUserCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += USER_CODE_ALPHABET[bytes[i]! % USER_CODE_ALPHABET.length];
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

/** Opaque device_code — 32 bytes, base64url, the long-lived half of the pair. */
export function newDeviceCode(): string {
  return randomBytes(32).toString("base64url");
}

/** Opaque bearer token for the CLI. Plaintext shown once; only its sha256 is stored. */
export function newBearerToken(): string {
  return "sps_" + randomBytes(32).toString("base64url");
}

/** Normalize an arbitrary string into a lowercase-kebab URL slug. */
export function slugify(input: string, max = 48): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}
