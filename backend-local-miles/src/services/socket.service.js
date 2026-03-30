const socketIo = require('socket.io');
const prisma = require('../utils/prisma'); // Import Prisma to save locations

let io;

exports.initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    // console.log(`🔌 New Client Connected: ${socket.id}`);

    // Join tracking room
    socket.on('join_tracking', (packageId) => {
      const roomName = `tracking_${packageId}`;
      socket.join(roomName);
    });

    // Handle incoming live location from Courier
    socket.on('update_location', async (data) => {
      const { packageId, lat, lng, time } = data;
      const roomName = `tracking_${packageId}`;
      
      // 1. Broadcast to Sender/Receiver instantly
      socket.to(roomName).emit('location_updated', { lat, lng, time });

      // 2. Save "Last Known Location" & handle Auto-Transit logic
      try {
        // A. Check the current status of the package safely
        const pkg = await prisma.package.findUnique({
          where: { publicId: packageId },
          select: { status: true }
        });

        if (!pkg) return; // Ignore pings for deleted/invalid packages

        // B. Prepare the basic location update payload
        const updateData = {
          lastLiveLat: parseFloat(lat),
          lastLiveLng: parseFloat(lng),
          lastLiveUpdatedAt: new Date()
        };

        // C. AUTO-TRANSIT FAILSAFE: 
        // If the courier is broadcasting location but the status is still 'PICKED_UP', force it to 'IN_TRANSIT'
        if (pkg.status === 'PICKED_UP') {
          updateData.status = 'IN_TRANSIT';
          
          // Optional: You can emit an event here back to the courier's frontend 
          // telling them "Job auto-started!" so their UI refreshes automatically.
          socket.emit('transit_auto_started'); 
        }

        // D. Commit to database
        await prisma.package.update({
          where: { publicId: packageId },
          data: updateData
        });

      } catch (err) {
        console.error("Failed to save live location to DB:", err);
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

exports.getIo = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};