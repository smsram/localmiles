const prisma = require('../utils/prisma');

/**
 * Create a new address for a user.
 * Handles the 'isDefault' logic automatically.
 */
exports.createAddress = async (userId, data) => {
  const { isDefault, ...rest } = data;

  // If this address is set as default, we must unset any existing defaults first
  if (isDefault) {
    return await prisma.$transaction(async (tx) => {
      // 1. Unset existing default
      await tx.savedAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });

      // 2. Create new address
      return await tx.savedAddress.create({
        data: {
          userId,
          isDefault: true,
          ...rest
        }
      });
    });
  } else {
    // Simple creation if not default
    return await prisma.savedAddress.create({
      data: {
        userId,
        isDefault: false,
        ...rest
      }
    });
  }
};

/**
 * Get all addresses for a user.
 * Sorted by Default first, then Newest.
 */
exports.getUserAddresses = async (userId) => {
  return await prisma.savedAddress.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' }, // true comes before false
      { createdAt: 'desc' }
    ]
  });
};

/**
 * Delete an address.
 * securely checks ownership before deleting.
 */
exports.deleteAddress = async (userId, addressId) => {
  // 1. Check ownership
  const address = await prisma.savedAddress.findUnique({
    where: { id: addressId }
  });

  if (!address) {
    throw new Error("Address not found");
  }

  if (address.userId !== userId) {
    throw new Error("Unauthorized access to this address");
  }

  // 2. Delete
  return await prisma.savedAddress.delete({
    where: { id: addressId }
  });
};

/**
 * Set a specific address as the default.
 * Uses a transaction to ensure data consistency.
 */
exports.setAddressAsDefault = async (userId, addressId) => {
  // Check existence/ownership first
  const address = await prisma.savedAddress.findFirst({
    where: { id: addressId, userId }
  });

  if (!address) {
    throw new Error("Address not found or unauthorized");
  }

  // Perform updates atomically
  return await prisma.$transaction([
    // 1. Set all user's addresses to non-default
    prisma.savedAddress.updateMany({
      where: { userId },
      data: { isDefault: false }
    }),
    // 2. Set the target address to default
    prisma.savedAddress.update({
      where: { id: addressId },
      data: { isDefault: true }
    })
  ]);
};