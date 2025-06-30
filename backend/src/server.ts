import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import fbiRouter from "./api/fbi/fbiRouter";
import orgRouter from "./api/org/orgRouter";
import { registerAnalyzeWorkers } from "./api/fbi/queue";
import { LoadKeys } from "./common/utils/getCreds";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);
const originArray = env.CORS_ORIGIN.split(",");

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin:function (origin, callback) {
    if (!origin || originArray.includes(origin.trim())) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }, credentials: true }));app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/fbi", fbiRouter);
app.use("/org", orgRouter);

// Initialize the keys when the module is loaded
LoadKeys().catch(error => {
  console.error("Failed to load API keys:", error)
  process.exit(1)
})


// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());
registerAnalyzeWorkers()

export { app, logger };
