const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan'); 
const routes = require('./routes/v1/index'); // Points to your v1 routes

const app = express();

// ---------------------------------------------
// 1. GLOBAL MIDDLEWARES
// ---------------------------------------------

// Security
app.use(helmet());

// CORS (Allow Frontend)
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------
// 2. CUSTOM LOGGING (IST)
// ---------------------------------------------

// Create a custom token for Morgan that formats date to IST
morgan.token('date-ist', () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true,
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
});

// Log Format: [17/01/2026, 02:30:00 pm] GET /api/v1/login 200
app.use(morgan('[:date-ist] :method :url :status - :response-time ms'));

// ---------------------------------------------
// 3. ROUTE MOUNTING
// ---------------------------------------------

app.use('/api/v1', routes);

// ---------------------------------------------
// 4. ERROR HANDLING
// ---------------------------------------------

// 404 Not Found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Only print stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    console.error("❌ Error Stack:", err.stack);
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

module.exports = app;