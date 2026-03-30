// -------------------------------------------------------------
// FORCE TIMEZONE: IST (Indian Standard Time)
// This must be the very first line before anything else loads.
// -------------------------------------------------------------
process.env.TZ = "Asia/Kolkata"; 

require('dotenv').config();
const http = require('http');
const app = require('./app');
const prisma = require('./utils/prisma');

// 1. Import our newly created Socket Service
const { initSocket } = require('./services/socket.service');

const PORT = process.env.PORT || 5000;

// 2. Create HTTP Server
const server = http.createServer(app);

// 3. Initialize Socket.io (Real-time Layer)
// This attaches the tracking rooms and live location listeners to our server
initSocket(server);

// 4. Start Server Logic
async function startServer() {
  try {
    // A. Connect to Database
    await prisma.$connect();
    
    // B. FORCE DATABASE TO IST SESSION
    // Even if the VPS is in New York, this session will behave like it's in Bangalore.
    await prisma.$executeRawUnsafe("SET TIME ZONE 'Asia/Kolkata'");
    
    console.log(`✅ Database connected (Timezone set to Asia/Kolkata)`);

    // C. Start Listening
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🕒 Server Time: ${new Date().toString()}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();