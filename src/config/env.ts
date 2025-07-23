import dotenv from "dotenv";
import fs from "fs";
import { isDev } from "@/shared";

if (isDev) {
  const envFile = ".env";

  if (!fs.existsSync(envFile)) {
    console.error(`File ${envFile} was not found.`);
  }

  dotenv.config({ path: envFile });
  console.log(`Environment variables loaded from ${envFile}`);
}
