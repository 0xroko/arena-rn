import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_ARENA_API_URL: z.string(),
  EXPO_PUBLIC_ARENA_CLIENT_ID: z.string(),
  EXPO_PUBLIC_ARENA_TOKEN_URL: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
