import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import mongoose from "mongoose"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import inscriptionRoutes from "./routes/inscriptionRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import toolRoutes from "./routes/toolRoutes.js"
import { errorHandler } from "./middleware/errorHandler.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 6000
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/inscriptions"

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in environment variables")
  process.exit(1)
}

// Ensure upload directories exist so image processing / OCR don't fail with ENOENT
const UPLOADS_DIR = path.join(__dirname, "uploads")
for (const sub of ["originals", "processed"]) {
  fs.mkdirSync(path.join(UPLOADS_DIR, sub), { recursive: true })
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))

const allowedOrigin = process.env.ALLOWED_ORIGIN || "*"
app.use(cors({ origin: allowedOrigin, credentials: true }))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Rate limit auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
})

app.use("/api/auth", authLimiter, authRoutes)
app.use("/api/inscriptions", inscriptionRoutes)
app.use("/api/tools", toolRoutes)

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

app.use(errorHandler)

// Retry with exponential backoff instead of exiting. A nonzero exit makes nodemon
// treat a transient network blip as a terminal crash and stop until a file changes.
const MAX_RETRY_DELAY = 30000

const connectWithRetry = async (attempt = 1) => {
  try {
    await mongoose.connect(MONGO_URI)
    const { host, name } = mongoose.connection
    console.log(`MongoDB connected: ${host}/${name}`)
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  } catch (err) {
    const delay = Math.min(MAX_RETRY_DELAY, 2000 * 2 ** (attempt - 1))
    console.error(`MongoDB connection error (attempt ${attempt}): ${err.message}`)
    console.error(`Retrying in ${delay / 1000}s...`)
    setTimeout(() => connectWithRetry(attempt + 1), delay)
  }
}

connectWithRetry()
