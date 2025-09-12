const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require("mongoose");
const rateLimit = require('express-rate-limit');
const { CohereClient } = require("cohere-ai");
require('dotenv').config();
const authRoutes = require('./routes/auth');
const alertRoutes = require('./routes/alerts');
const blockchainRoutes = require('./routes/blockchain');
const dashboardRoutes = require('./routes/dashboard');
const { errorHandler } = require('./middleware/errorHandler');
// ✅ Connect to MongoDB
mongoose
  .connect("mongodb+srv://pt264doc_db_user:TWyK6GUm2uzk4EpO@cluster0.wtgkn57.mongodb.net/SmartTouristApp", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});
// Initialize Cohere client
const cohere = new CohereClient({
  token: "OIMid1VKRxGeWKszWBCWZQpfYOKIm9t4asDsGI6G",
});

// API route for chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await cohere.chat({
      model: "command-r",
      message: prompt,
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Cohere API Error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// gps data
let logs = [
   { lat:  29.752810, lon: 78.498960, tag: "normal", timestamp: "2025-09-08 21:48" },
  { lat:  26.752810, lon: 75.498960, tag: "sos", timestamp: "2025-09-08 21:00" },
  { lat:   28.7041, lon: 77.1025, tag: "normal", timestamp: "2025-09-08 21:00" },
];
// Receive GPS from ESP32
app.post("/gps", (req, res) => {
  console.log("hello form gps");
  const { lat, lon, tag, timestamp } = req.body;
  logs.push({ lat, lon, tag, timestamp });
  console.log("Received:", { lat, lon, tag, timestamp });
  res.json({ status: "ok", logs });
});

// Serve data to frontend
app.get("/data", (req, res) => {
  res.json(logs); // frontend can fetch this
});
// API routes
app.use('/api/auth', authRoutes);// done
app.use('/api/alerts', alertRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use(errorHandler);

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running at http://192.168.1.10:3000");
});


module.exports = app;