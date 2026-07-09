import "server-only";
import bcrypt from "bcryptjs";
import { env } from "@/env";

/** Verify a plaintext password against the bcrypt hash in APP_PASSWORD_HASH. */
export async function verifyPassword(plain: string): Promise<boolean> {
  return bcrypt.compare(plain, env.APP_PASSWORD_HASH);
}
