const prisma = require('../utils/prisma');

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
    const { fullName, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ success: false, message: "This email is already linked to another account." });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        email
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isPhoneVerified: true,
        avatarUrl: true
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