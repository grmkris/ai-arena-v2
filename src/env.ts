import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_PATH: z.string().default("./data/arena.db"),
  REPLAY_DIR: z.string().default("./data/replays"),
  NODE_ENV: z
    .enum(["development", "production"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
