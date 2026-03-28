const prisma = require('../utils/prisma');

exports.createRoute = async (req, res) => {
  try {
    const { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng, time, isRecurring, maxDetourKm, vehicleCapacity } = req.body;
    
    if (!pickupLat || !dropoffLat || !time) {
      return res.status(400).json({ success: false, message: "Missing required route fields." });
    }

    const newRoute = await prisma.courierRoute.create({
      data: {
        userId: req.user.id,
        title: `${pickupAddress.split(',')[0]} to ${dropoffAddress.split(',')[0]}`,
        pickupAddress, pickupLat: parseFloat(pickupLat), pickupLng: parseFloat(pickupLng),
        dropoffAddress, dropoffLat: parseFloat(dropoffLat), dropoffLng: parseFloat(dropoffLng),
        time, isRecurring, 
        maxDetourKm: parseFloat(maxDetourKm), 
        vehicleCapacity,
        isActive: true
      }
    });

    res.status(201).json({ success: true, data: newRoute });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save route." });
  }
};

exports.getRoutes = async (req, res) => {
  try {
    const routes = await prisma.courierRoute.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, data: routes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch routes." });
  }
};

exports.toggleRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    const route = await prisma.courierRoute.findUnique({ where: { id } });
    if (!route || route.userId !== req.user.id) return res.status(404).json({ success: false, message: "Route not found." });

    await prisma.courierRoute.update({ where: { id }, data: { isActive } });
    res.status(200).json({ success: true, message: "Route status updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle route." });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const route = await prisma.courierRoute.findUnique({ where: { id } });
    if (!route || route.userId !== req.user.id) return res.status(404).json({ success: false, message: "Route not found." });

    await prisma.courierRoute.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Route deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete route." });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng, time, isRecurring, maxDetourKm, vehicleCapacity } = req.body;

    const existing = await prisma.courierRoute.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const updatedRoute = await prisma.courierRoute.update({
      where: { id },
      data: {
        title: `${pickupAddress.split(',')[0]} to ${dropoffAddress.split(',')[0]}`,
        pickupAddress, pickupLat: parseFloat(pickupLat), pickupLng: parseFloat(pickupLng),
        dropoffAddress, dropoffLat: parseFloat(dropoffLat), dropoffLng: parseFloat(dropoffLng),
        time, isRecurring, maxDetourKm: parseFloat(maxDetourKm), vehicleCapacity
      }
    });

    res.status(200).json({ success: true, data: updatedRoute });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update route." });
  }
};