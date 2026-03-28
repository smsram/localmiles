const prisma = require('../utils/prisma');
const { cloudinary } = require('../config/cloudinary');

// ==========================================
// 1. UPDATE USER ROLE (SENDER/COURIER/BOTH)
// ==========================================
exports.updateRole = async (req, res) => {
  try {
    const userId = req.user.id; 
    let { role } = req.body; 

    if (!role) return res.status(400).json({ success: false, message: "Role is required" });

    // Force Uppercase to match Prisma Enums
    role = role.toUpperCase();

    if (!['SENDER', 'COURIER', 'BOTH'].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role selected" });
    }

    // Determine Courier Status
    let status = (role === 'COURIER' || role === 'BOTH') ? 'PENDING' : 'NONE';

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        primaryGoal: role, 
        courierStatus: status,
        lastActiveMode: role === 'SENDER' ? 'SENDER' : 'COURIER' 
      }
    });

    res.json({ 
      success: true, 
      message: "Role updated successfully", 
      data: { mode: updatedUser.lastActiveMode } 
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ success: false, message: "Failed to update role" });
  }
};

// ==========================================
// 2. UPDATE USER PROFILE (Settings Page)
// ==========================================
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      fullName, 
      email, 
      pushNotifications, 
      emailAlerts, 
      language 
    } = req.body;

    // 1. Fetch current user data to check existing status
    const currentUser = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { email: true, phone: true } 
    });

    const updateData = {
      fullName,
      pushNotifications,
      emailAlerts,
      language
    };

    // 2. Only allow email update if the current email is null/empty
    if (!currentUser.email && email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email already taken." });
      }
      updateData.email = email;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        avatarUrl: true,
        pushNotifications: true,
        emailAlerts: true,
        language: true
      }
    });

    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully", 
      data: updatedUser 
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Internal server error while updating profile." });
  }
};

// ==========================================
// 3. GET COURIER PROFILE
// ==========================================
exports.getCourierProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { courierProfile: true }, 
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // If courier profile doesn't exist yet, create a blank one
    if (!user.courierProfile) {
      user.courierProfile = await prisma.courierProfile.create({
        data: { userId: user.id }
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

// ==========================================
// 4. COMBINED UPDATE: PROFILE, IDENTITY & VEHICLE
// ==========================================
exports.updateCourierDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      fullName, 
      vehicleModel, vehicleColor, fuelType, regYear, plateNumber,
      avatarBase64, 
      vehicleImageBase64, 
      rcBookBase64, 
      insuranceBase64, 
      pollutionBase64,
      aadhaarBase64,
      dlBase64 
    } = req.body;

    // 1. Helper to upload to Cloudinary with specific folder logic
    const uploadDoc = async (base64Str, subfolder) => {
      if (!base64Str) return null;
      try {
        const result = await cloudinary.uploader.upload(base64Str, { 
          folder: `localmiles_dev/couriers/${subfolder}` 
        });
        return result.secure_url;
      } catch (err) {
        console.error(`Cloudinary Upload Error (${subfolder}):`, err);
        return null;
      }
    };

    // 2. Process File Uploads concurrently for speed
    const [
      avatarUrl, vehicleImage, rcBookUrl, 
      insuranceUrl, pollutionUrl, aadhaarUrl, dlUrl
    ] = await Promise.all([
      uploadDoc(avatarBase64, 'avatars'),
      uploadDoc(vehicleImageBase64, 'vehicles'),
      uploadDoc(rcBookBase64, 'documents'),
      uploadDoc(insuranceBase64, 'documents'),
      uploadDoc(pollutionBase64, 'documents'),
      uploadDoc(aadhaarBase64, 'identity'),
      uploadDoc(dlBase64, 'identity')
    ]);

    // 3. Prepare User Table Update (fullName, avatar)
    const userUpdateData = {};
    if (fullName) userUpdateData.fullName = fullName;
    if (avatarUrl) userUpdateData.avatarUrl = avatarUrl;

    // 4. Prepare CourierProfile Table Update
    const profileUpdateData = {
      // Basic Fields
      ...(vehicleModel && { vehicleModel }),
      ...(vehicleColor && { vehicleColor }),
      ...(fuelType && { fuelType }),
      ...(regYear && { regYear }),
      ...(plateNumber && { plateNumber }),
      
      // Image URLs
      ...(vehicleImage && { vehicleImage }),
      ...(rcBookUrl && { rcBookUrl }),
      ...(insuranceUrl && { insuranceUrl }),
      ...(pollutionUrl && { pollutionUrl }),
      ...(aadhaarUrl && { aadhaarUrl }),
      ...(dlUrl && { dlUrl }),

      // Reset verification if documents are newly uploaded
      ...(rcBookUrl && { rcVerified: false }),
      ...(insuranceUrl && { insuranceVerified: false }),
      ...(pollutionUrl && { pollutionVerified: false }),
      ...(aadhaarUrl && { aadhaarVerified: false }),
      ...(dlUrl && { dlVerified: false })
    };

    // 5. Execute DB Updates in a Transaction
    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      }),
      prisma.courierProfile.update({
        where: { userId: userId },
        data: profileUpdateData,
      })
    ]);

    res.status(200).json({ 
      success: true, 
      message: "Details updated successfully", 
      data: {
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
        courierProfile: updatedProfile
      }
    });

  } catch (error) {
    console.error("Courier Update Error:", error);
    res.status(500).json({ success: false, message: "Internal server error while updating details" });
  }
};