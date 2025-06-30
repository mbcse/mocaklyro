import dotenv from "dotenv";
import { cleanEnv, host, num, port, str, testOnly } from "envalid";

dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ devDefault: testOnly("test"), choices: ["development", "production", "test"] }),
  HOST: host({ devDefault: testOnly("localhost") }),
  PORT: port({ devDefault: testOnly(8000) }),
  CORS_ORIGIN: str({ devDefault: [
    "http://localhost:3001",
    "http://localhost:3000",
    "https://klyro.dev",
    "https://www.klyro.dev",
    "https://miniapp.klyro.dev"
  ].join(',') }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({ devDefault: testOnly(1000) }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({ devDefault: testOnly(1000) }),
  OPENAI_API_KEY: str(),
  ALCHEMY_API_KEY: str(),
  CRYPTO_COMPARE_API_KEY: str(),
  GITHUB_ACCESS_TOKEN: str(),
  REDIS_HOST: host({ devDefault: testOnly("localhost") }),
  REDIS_PORT: port({ devDefault: testOnly(6379) }),
  REDIS_PASSWORD: str({ devDefault: testOnly("") })
});
