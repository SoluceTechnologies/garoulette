import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    APP_URL: z.url(),
    APP_PASSWORD: z.string().min(1),
    APP_SECRET: z.string().min(32),
  },

  runtimeEnv: {
    APP_URL: process.env.APP_URL,
    APP_PASSWORD: process.env.APP_PASSWORD,
    APP_SECRET: process.env.APP_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
