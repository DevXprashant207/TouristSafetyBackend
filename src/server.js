const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const alertRoutes = require('./routes/alerts');
const blockchainRoutes = require('./routes/blockchain');
const dashboardRoutes = require('./routes/dashboard');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081', 'exp://'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
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
// gps data
let logs = [
  { lat: 28.6139, lon: 77.2090, tag: "normal", time: "2025-09-08 21:00" },
  { lat: 28.7041, lon: 77.1025, tag: "sos",    time: "2025-09-08 21:02" },
  { lat: 19.0760, lon: 72.8777, tag: "normal", time: "2025-09-08 21:04" },
  { lat: 12.9716, lon: 77.5946, tag: "normal", time: "2025-09-08 23:30" },
  { lat: 22.5726, lon: 88.3639, tag: "sos",    time: "2025-09-08 23:35" }
];
// Receive GPS from ESP32
app.post("/gps", (req, res) => {
  console.log("hello form gps");
  const { lat, lon, tag, time } = req.body;
  logs.push({ lat, lon, tag, time });
  console.log("Received:", { lat, lon, tag, time });
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

app.listen(PORT, () => {
  console.log(`🚀 Tourist Safety Backend running on port http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;