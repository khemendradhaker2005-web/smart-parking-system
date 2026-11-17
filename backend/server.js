require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { initDatabase, closeDatabase, getActiveEngine } = require('./src/database/db');
const { initSchema } = require('./src/database/initSchema');
const { seed } = require('./src/database/seed');
const { initSocket } = require('./src/services/socketService');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const parkingRoutes = require('./src/routes/parkingRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const staffRoutes = require('./src/routes/staffRoutes');

const app = express();
const server = http.createServer(app);

// Port configuration (Render assigns dynamic PORT, defaults to 5001 locally)
const PORT = process.env.PORT || 5001;

// CORS configuration - Support configured origins, onrender.com preview origins, or wildcard
const configuredOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || process.env.CLIENT_URL || '*')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow Render subdomains
    if (origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Socket.IO
initSocket(server);

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Root API Welcome / Status
app.get('/', (req, res) => {
  res.json({
    name: 'ParkSmart Campus Parking API',
    status: 'online',
    version: '1.0.0',
    healthCheck: '/health',
    documentation: 'See README.md for complete API documentation',
  });
});

// Health check endpoint (Available at both /health and /api/health for Render and clients)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ParkSmart Campus Parking API',
    version: '1.0.0',
    uptime: process.uptime(),
    database: {
      engine: getActiveEngine(),
      status: 'connected',
    },
    environment: process.env.NODE_ENV || 'development',
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/staff', staffRoutes);

// 404 Catch-All
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
  });
});

// Graceful Shutdown
let isShuttingDown = false;

async function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[System] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('[System] HTTP and Socket server closed.');
    try {
      await closeDatabase();
      console.log('[System] Database connections terminated cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[System] Error during database shutdown:', err.message);
      process.exit(1);
    }
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.error('[System] Shutdown timeout reached. Forcing process exit.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Server Startup
async function startServer() {
  try {
    console.log('[System] Initializing database and services...');
    await initDatabase();
    await initSchema();

    // In development or if AUTO_SEED is requested, ensure demo data exists
    if (process.env.AUTO_SEED === 'true' || process.env.NODE_ENV !== 'production') {
      await seed();
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`  PARKSMART API SERVER RUNNING ON PORT ${PORT} (0.0.0.0)`);
      console.log(`  Health Check: http://localhost:${PORT}/health`);
      console.log(`  API Health:   http://localhost:${PORT}/api/health`);
      console.log(`  Socket.IO:    Ready on ws://0.0.0.0:${PORT}`);
      console.log(`  Active DB:    ${getActiveEngine()}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[Fatal Error during startup]:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
