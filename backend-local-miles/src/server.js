// -------------------------------------------------------------
// FORCE TIMEZONE: IST (Indian Standard Time)
// This must be the very first line before anything else loads.
// -------------------------------------------------------------
process.env.TZ = "Asia/Kolkata"; 

require('dotenv').config();
const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');
const prisma = require('./utils/prisma');

const PORT = process.env.PORT || 5000;

// 1. Create HTTP Server
const server = http.createServer(app);

// 2. Initialize Socket.io (Real-time Layer)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 3. Global Socket Instance
global.io = io;

io.on('connection', (socket) => {
  // console.log(`⚡ New client connected: ${socket.id}`);
  
  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('disconnect', () => {
    // console.log('Client disconnected');
  });
});

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