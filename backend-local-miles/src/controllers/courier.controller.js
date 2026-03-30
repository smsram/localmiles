const prisma = require('../utils/prisma');

/**
 * PROCESS HEARTBEAT
 * Purpose: Keeps a courier's "Shift" alive or starts a new one.
 * Triggered by: DashboardLayout.js every 3 minutes.
 */
exports.processHeartbeat = async (req, res) => {
  try {
    const courierId = req.user.id;
    const now = new Date();
    
    // Threshold to determine if this is a continuation of a current session 
    // or a brand new one (e.g., if they were offline for 15+ minutes)
    const timeoutThreshold = new Date(now.getTime() - 15 * 60000); 

    // 1. Find the most recent open shift for this courier
    const activeShift = await prisma.courierShift.findFirst({
      where: { 
        courierId, 
        endTime: null 
      },
      orderBy: { startTime: 'desc' }
    });

    if (activeShift) {
      // 2. Check if the existing shift is actually old/stale
      if (activeShift.lastHeartbeat < timeoutThreshold) {
        // CLOSE STALE SHIFT: User was away too long, close it at the last known activity
        await prisma.courierShift.update({
          where: { id: activeShift.id },
          data: { endTime: activeShift.lastHeartbeat }
        });

        // START NEW SHIFT: They are back online now
        await prisma.courierShift.create({
          data: { 
            courierId, 
            startTime: now, 
            lastHeartbeat: now 
          }
        });
      } else {
        // UPDATE ACTIVE SHIFT: Normal behavior, just bump the heartbeat timestamp
        await prisma.courierShift.update({
          where: { id: activeShift.id },
          data: { lastHeartbeat: now }
        });
      }
    } else {
      // 3. NO OPEN SHIFT FOUND: Start a completely fresh session
      await prisma.courierShift.create({
        data: { 
          courierId, 
          startTime: now, 
          lastHeartbeat: now 
        }
      });
    }

    // Return success silently. 204 No Content is also acceptable here to save bandwidth.
    res.status(200).json({ success: true, timestamp: now });
  } catch (error) {
    console.error("Heartbeat Error:", error);
    // Return 500 but don't break the frontend layout
    res.status(500).json({ success: false, message: "Heartbeat processing failed" });
  }
};

/**
 * TOGGLE COURIER STATUS (Optional)
 * Useful if you want an explicit "Go Offline" button that closes the shift immediately.
 */
exports.toggleOnlineStatus = async (req, res) => {
  try {
    const courierId = req.user.id;
    const { isOnline } = req.body;
    const now = new Date();

    if (!isOnline) {
      // Manual "Go Offline": Close any open shifts immediately
      await prisma.courierShift.updateMany({
        where: { courierId, endTime: null },
        data: { endTime: now }
      });
      return res.status(200).json({ success: true, message: "You are now offline." });
    }

    // Manual "Go Online": Handled by the next heartbeat, but we can start it here too
    await prisma.courierShift.create({
      data: { courierId, startTime: now, lastHeartbeat: now }
    });

    res.status(200).json({ success: true, message: "You are now online." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Status toggle failed." });
  }
};