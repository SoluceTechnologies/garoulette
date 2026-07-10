"use server";

import bcrypt from "bcryptjs";
import { env } from "@/env";

export async function verifyPassword(plain: string): Promise<boolean> {
  return await bcrypt.compare(plain, env.APP_PASSWORD);
}
