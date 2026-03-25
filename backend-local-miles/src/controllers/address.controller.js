const AddressService = require('../services/address.service');

// 1. CREATE
exports.addAddress = async (req, res) => {
  try {
    const { 
      title, type, address, 
      line1, line2, city, pincode, 
      lat, lng, contactName, contactPhone, contactEmail, isDefault 
    } = req.body;

    // Validate only ESSENTIAL fields
    if (!title || !address || !lat || !lng) {
      return res.status(400).json({ success: false, message: "Title and Location are required" });
    }

    const addressData = {
      title, type, address, 
      line1: line1 || "", 
      line2: line2 || "", 
      city: city || "", 
      pincode: pincode || "",
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      contactName: contactName || "", 
      contactPhone: contactPhone || "", 
      contactEmail: contactEmail || "", // <--- NEW
      isDefault
    };

    const newAddress = await AddressService.createAddress(req.user.id, addressData);
    
    res.status(201).json({ success: true, data: newAddress });
  } catch (error) {
    console.error("Create Address Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. GET ALL
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await AddressService.getUserAddresses(req.user.id);
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. DELETE
exports.deleteAddress = async (req, res) => {
  try {
    await AddressService.deleteAddress(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    const statusCode = error.message.includes("Unauthorized") ? 403 : 404;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

// 4. SET DEFAULT
exports.setDefault = async (req, res) => {
  try {
    await AddressService.setAddressAsDefault(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: "Default address updated" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// NEW: Get Single Address (for Edit Page)
exports.getSingleAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await prisma.savedAddress.findUnique({
      where: { id }
    });

    if (!address || address.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Update Address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, type, address, line1, line2, city, pincode, 
      lat, lng, contactName, contactPhone, contactEmail, isDefault 
    } = req.body;

    // Check ownership
    const existing = await prisma.savedAddress.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Prepare Update Data
    const updateData = {
      title, type, address, line1, line2, city, pincode,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      contactName, contactPhone, 
      contactEmail, // <--- NEW
      isDefault
    };

    if (isDefault) {
       await prisma.$transaction([
        prisma.savedAddress.updateMany({
          where: { userId: req.user.id, isDefault: true },
          data: { isDefault: false }
        }),
        prisma.savedAddress.update({
          where: { id },
          data: updateData
        })
      ]);
    } else {
      await prisma.savedAddress.update({
        where: { id },
        data: updateData
      });
    }

    res.status(200).json({ success: true, message: "Address updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, message: "Failed to update address" });
  }
};