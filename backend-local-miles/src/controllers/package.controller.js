const prisma = require('../utils/prisma');
const calculatePrice = require('../utils/priceCalculator');
const { generatePackageId } = require('../utils/idGenerator');
const { deleteFromCloudinary } = require('../config/cloudinary');

// ==========================================
// 1. CREATE DRAFT PACKAGE
// ==========================================
exports.createDraftPackage = async (req, res) => {
  try {
    // 1. LOGGING (Helps Debugging)
    console.log("📦 Draft Body Received:", req.body);
    console.log("📂 Files Received:", req.files?.length || 0);

    const body = req.body;
    const senderId = req.user.id; 

    // 2. VALIDATION: Check for Empty Body
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Request body is empty. Ensure you are sending FormData." 
      });
    }

    // 3. VALIDATION: Required Fields
    if (!body.title || !body.pickupAddress || !body.dropAddress) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: Title, Pickup Address, or Drop Address." 
      });
    }

    // 4. PROCESS IMAGES (With safety fallback)
    const imageRecords = req.files ? req.files.map(file => {
      // Ensure 'url' is never undefined to prevent PrismaClientValidationError
      const safeUrl = file.filename || file.path || "placeholder_image_error";
      return { url: safeUrl };
    }) : [];

    // 5. SAFE PARSING (Prevent NaN errors)
    const weight = parseFloat(body.weight || 0);
    const pickupLat = parseFloat(body.pickupLat || 0);
    const pickupLng = parseFloat(body.pickupLng || 0);
    const dropLat = parseFloat(body.dropLat || 0);
    const dropLng = parseFloat(body.dropLng || 0);
    
    // Check Declared Value
    if (body.declaredValue && parseFloat(body.declaredValue) > 50000) {
      return res.status(400).json({ 
        success: false, 
        message: "Declared value exceeds limit of ₹50,000." 
      });
    }

    // 6. RE-CALCULATE PRICE & BREAKDOWN
    const pricingResult = calculatePrice(
      pickupLat, pickupLng, 
      dropLat, dropLng, 
      weight, 
      body.urgency
    );

    // 7. GENERATE ID
    const publicId = generatePackageId();

    // 8. CREATE DB RECORD
    const newPackage = await prisma.package.create({
      data: {
        publicId,
        senderId,
        
        // Text Fields
        title: body.title,
        description: body.description || "",
        category: body.category || "DOCUMENTS",
        otherCategory: body.category === 'OTHER' ? body.otherCategory : null,
        size: body.size || "SMALL_BOX",
        
        // Numeric Fields
        weight: weight,
        length: parseFloat(body.length) || 0,
        breadth: parseFloat(body.breadth) || 0,
        height: parseFloat(body.height) || 0,
        declaredValue: body.declaredValue ? parseFloat(body.declaredValue) : null,

        // Boolean Fields (Handle "true" string from FormData)
        isFragile: body.isFragile === 'true',
        isLiquid: body.isLiquid === 'true',
        isGift: body.isGift === 'true',

        // Location Fields
        pickupAddress: body.pickupAddress,
        pickupLat: pickupLat,
        pickupLng: pickupLng,
        dropAddress: body.dropAddress,
        dropLat: dropLat,
        dropLng: dropLng,
        distanceKm: pricingResult.distance || 0,

        // Receiver Details
        receiverName: body.receiverName || "",
        receiverPhone: body.receiverPhone || "",
        receiverEmail: body.receiverEmail || null,

        // Logistics
        urgency: body.urgency || "STANDARD",
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        status: 'DRAFT',

        // --- FINANCIALS (Total + Breakdown) ---
        price: pricingResult.price || 0,
        driverFee: pricingResult.breakdown.driverFee,
        platformFee: pricingResult.breakdown.platformFee,
        taxAmount: pricingResult.breakdown.taxAmount,
        taxRateApplied: pricingResult.breakdown.taxRate,

        // 9. CONNECT IMAGES
        images: {
          create: imageRecords 
        }
      }
    });

    res.status(201).json({
      success: true,
      message: "Package draft created successfully",
      data: {
        id: newPackage.id,
        publicId: newPackage.publicId
      }
    });

  } catch (error) {
    console.error("Create Draft Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to create package draft" 
    });
  }
};

// ==========================================
// 2. GET PACKAGE BY ID
// ==========================================
exports.getPackageByPublicId = async (req, res) => {
  try {
    const { id } = req.params; // This will be the publicId (e.g., "LM26-xxxx")

    const pkg = await prisma.package.findUnique({
      where: { publicId: id },
      include: {
        images: true, // Fetch associated images
        sender: {
          select: { fullName: true, phone: true } // Optional: Sender details
        }
      }
    });

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    // Security Check: Ensure sender owns this package
    if (pkg.senderId !== req.user.id) {
       return res.status(403).json({ success: false, message: "Unauthorized access to this package" });
    }

    res.status(200).json({
      success: true,
      data: pkg
    });

  } catch (error) {
    console.error("Get Package Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch package details" });
  }
};

// ==========================================
// 3. UPDATE DRAFT PACKAGE
// ==========================================
exports.updateDraftPackage = async (req, res) => {
  try {
    const { id } = req.params; // This is the publicId
    const body = req.body;
    const senderId = req.user.id;

    // 1. Find the Package
    const existingPackage = await prisma.package.findUnique({
      where: { publicId: id },
      include: { images: true }
    });

    if (!existingPackage) return res.status(404).json({ message: "Package not found" });
    if (existingPackage.senderId !== senderId) return res.status(403).json({ message: "Unauthorized" });
    if (existingPackage.status !== 'DRAFT') return res.status(400).json({ message: "Only drafts can be edited" });

    // 2. Handle Image Deletion (Images removed by user)
    let deletedImageIds = [];
    if (body.deletedImageIds) {
       deletedImageIds = Array.isArray(body.deletedImageIds) 
         ? body.deletedImageIds 
         : [body.deletedImageIds]; 
    }

    if (deletedImageIds.length > 0) {
      // Find images to delete to get their Cloudinary Public ID (url)
      const imagesToDelete = existingPackage.images.filter(img => deletedImageIds.includes(img.id));
      
      for (const img of imagesToDelete) {
        await deleteFromCloudinary(img.url); // Delete from Cloudinary
      }

      // Delete from DB
      await prisma.packageImage.deleteMany({
        where: { id: { in: deletedImageIds } }
      });
    }

    // 3. Handle New Images (Uploaded via Middleware)
    const newImageRecords = req.files ? req.files.map(file => ({
      url: file.filename 
    })) : [];

    // 4. Recalculate Price & Breakdown
    const weight = parseFloat(body.weight || existingPackage.weight);
    const pickupLat = parseFloat(body.pickupLat || existingPackage.pickupLat);
    const pickupLng = parseFloat(body.pickupLng || existingPackage.pickupLng);
    const dropLat = parseFloat(body.dropLat || existingPackage.dropLat);
    const dropLng = parseFloat(body.dropLng || existingPackage.dropLng);
    const urgency = body.urgency || existingPackage.urgency;

    const pricingResult = calculatePrice(pickupLat, pickupLng, dropLat, dropLng, weight, urgency);

    // 5. Update Record
    const updatedPackage = await prisma.package.update({
      where: { publicId: id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        otherCategory: body.category === 'OTHER' ? body.otherCategory : null,
        size: body.size,
        weight: weight,
        declaredValue: body.declaredValue ? parseFloat(body.declaredValue) : null,
        
        isFragile: body.isFragile === 'true',
        isLiquid: body.isLiquid === 'true',
        isGift: body.isGift === 'true',

        pickupAddress: body.pickupAddress,
        pickupLat, pickupLng,
        dropAddress: body.dropAddress,
        dropLat, dropLng,
        distanceKm: pricingResult.distance,

        receiverName: body.receiverName,
        receiverPhone: body.receiverPhone,
        receiverEmail: body.receiverEmail,
        
        urgency,
        
        // --- UPDATE FINANCIALS ---
        price: pricingResult.price,
        driverFee: pricingResult.breakdown.driverFee,
        platformFee: pricingResult.breakdown.platformFee,
        taxAmount: pricingResult.breakdown.taxAmount,
        taxRateApplied: pricingResult.breakdown.taxRate,

        images: {
          create: newImageRecords // Add NEW images
        }
      }
    });

    res.status(200).json({ success: true, message: "Draft updated", data: updatedPackage });

  } catch (error) {
    console.error("Update Draft Error:", error);
    res.status(500).json({ success: false, message: "Failed to update draft" });
  }
};

// ==========================================
// 4. PROCESS PAYMENT (New Logic)
// ==========================================
exports.processPayment = async (req, res) => {
  try {
    const { id } = req.params; // Package Public ID
    const { paymentMethod } = req.body; // 'WALLET' or 'ONLINE'
    const senderId = req.user.id;

    // 1. Fetch Data
    const pkg = await prisma.package.findUnique({ where: { publicId: id } });
    const user = await prisma.user.findUnique({ where: { id: senderId } });

    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });
    if (pkg.senderId !== senderId) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (pkg.status !== 'DRAFT') return res.status(400).json({ success: false, message: "Order already processed" });

    const amountToPay = pkg.price;

    // 2. Handle Payment Logic
    if (paymentMethod === 'WALLET') {
      if (user.walletBalance < amountToPay) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient balance. Required: ₹${amountToPay}, Available: ₹${user.walletBalance}` 
        });
      }

      // WALLET TRANSACTION: Deduct Balance + Log Record + Update Package
      await prisma.$transaction([
        prisma.user.update({
          where: { id: senderId },
          data: { walletBalance: { decrement: amountToPay } }
        }),
        prisma.transaction.create({
          data: {
            userId: senderId,
            amount: amountToPay,
            type: 'DEBIT',
            status: 'SUCCESS',
            method: 'WALLET',
            referenceId: pkg.publicId,
            description: `Payment for delivery: ${pkg.title}`
          }
        }),
        prisma.package.update({
          where: { publicId: id },
          data: { status: 'PENDING', paymentMode: 'PREPAID' }
        })
      ]);

    } else if (paymentMethod === 'ONLINE') {
      // ONLINE TRANSACTION: Log Record + Update Package (No balance deduction)
      // Note: In real app, confirm payment gateway success signature here first
      await prisma.$transaction([
        prisma.transaction.create({
          data: {
            userId: senderId,
            amount: amountToPay,
            type: 'DEBIT',
            status: 'SUCCESS',
            method: 'ONLINE',
            referenceId: pkg.publicId,
            description: `Online Payment for: ${pkg.title}`
          }
        }),
        prisma.package.update({
          where: { publicId: id },
          data: { status: 'PENDING', paymentMode: 'PREPAID' }
        })
      ]);
    } else {
      return res.status(400).json({ success: false, message: "Invalid payment method" });
    }

    res.status(200).json({
      success: true,
      message: "Payment successful. Searching for couriers...",
      data: { publicId: id, status: 'PENDING' }
    });

  } catch (error) {
    console.error("Payment Processing Error:", error);
    res.status(500).json({ success: false, message: "Payment failed. Please try again." });
  }
};

// ==========================================
// 5. GET MY SHIPMENTS (List for Dashboard)
// ==========================================
exports.getMyShipments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build Filter
    const where = { senderId: userId };
    if (status && status !== 'all') {
      where.status = status.toUpperCase(); // Ensure enum match (PENDING, DRAFT, etc.)
    }

    // Fetch Data
    const [shipments, total] = await Promise.all([
      prisma.package.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          publicId: true,
          title: true,
          category: true,
          pickupAddress: true,
          dropAddress: true,
          status: true,
          price: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.package.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: shipments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get Shipments Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch shipments" });
  }
};

// ==========================================
// 6. DELETE PACKAGE (Drafts Only)
// ==========================================
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params; // Public ID
    const senderId = req.user.id;

    const pkg = await prisma.package.findUnique({
      where: { publicId: id },
      include: { images: true }
    });

    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });
    if (pkg.senderId !== senderId) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (pkg.status !== 'DRAFT') return res.status(400).json({ success: false, message: "Only drafts can be deleted" });

    // 1. Delete Images from Cloudinary
    for (const img of pkg.images) {
      await deleteFromCloudinary(img.url);
    }

    // 2. Delete from DB (Cascade will remove image records)
    await prisma.package.delete({
      where: { publicId: id }
    });

    res.status(200).json({ success: true, message: "Package deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete package" });
  }
};

// ==========================================
// 7. CANCEL ORDER & REFUND
// ==========================================
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params; // Package Public ID
    const senderId = req.user.id;

    const pkg = await prisma.package.findUnique({ where: { publicId: id } });

    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });
    if (pkg.senderId !== senderId) return res.status(403).json({ success: false, message: "Unauthorized" });

    // Prevent canceling packages that are already out for delivery or finished
    if (pkg.status === 'CANCELLED' || pkg.status === 'DELIVERED' || pkg.status === 'IN_TRANSIT') {
      return res.status(400).json({ success: false, message: `Cannot cancel a package with status: ${pkg.status}` });
    }

    // Handle Refund if it was already paid
    if (pkg.paymentMode === 'PREPAID' && pkg.price > 0 && pkg.status !== 'DRAFT') {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: senderId },
          data: { walletBalance: { increment: pkg.price } }
        }),
        prisma.transaction.create({
          data: {
            userId: senderId,
            amount: pkg.price,
            type: 'CREDIT',
            status: 'SUCCESS',
            method: 'WALLET',
            referenceId: pkg.publicId,
            description: `Refund for Cancelled Order: ${pkg.title}`
          }
        }),
        prisma.package.update({
          where: { publicId: id },
          data: { status: 'CANCELLED' }
        })
      ]);
    } else {
      // If it was COD or a Draft (no money was moved)
      await prisma.package.update({
        where: { publicId: id },
        data: { status: 'CANCELLED' }
      });
    }

    res.status(200).json({ success: true, message: "Order cancelled and amount refunded to wallet." });

  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to cancel order." });
  }
};

// NEW: Get Available Jobs for Couriers
exports.getAvailableJobs = async (req, res) => {
  try {
    // 'PENDING' strictly filters out 'DRAFT', 'ASSIGNED', 'CANCELLED', etc.
    // 'courierId: null' guarantees no one else has claimed it yet.
    const availablePackages = await prisma.package.findMany({
      where: { 
        status: 'PENDING',
        courierId: null 
      },
      select: {
        id: true,
        publicId: true,
        title: true,
        category: true,
        pickupAddress: true,
        pickupLat: true,
        pickupLng: true,
        dropAddress: true,
        dropLat: true,
        dropLng: true,
        weight: true,
        price: true, // The total amount paid by sender
        driverFee: true, // The actual amount the courier earns
        distanceKm: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map driverFee to 'price' so the frontend job cards automatically show the courier's cut
    const formattedPackages = availablePackages.map(pkg => ({
      ...pkg,
      price: pkg.driverFee > 0 ? pkg.driverFee : pkg.price 
    }));

    res.status(200).json({ success: true, data: formattedPackages });
  } catch (error) {
    console.error("Get Available Jobs Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch available jobs." });
  }
};

// Get Courier Activities (Active, Scheduled, History)
exports.getCourierActivities = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Active Jobs (In Progress)
    const activeJobs = await prisma.package.findMany({
      where: { courierId: userId, status: { in: ['PICKED_UP', 'IN_TRANSIT'] } },
      orderBy: { updatedAt: 'desc' }
    });

    // 2. Scheduled Jobs (Assigned but not yet picked up)
    const scheduledJobs = await prisma.package.findMany({
      where: { courierId: userId, status: 'ASSIGNED' },
      orderBy: { scheduledDate: 'asc', createdAt: 'desc' }
    });

    // 3. History Jobs (Completed or Cancelled)
    const historyJobs = await prisma.package.findMany({
      where: { courierId: userId, status: { in: ['DELIVERED', 'CANCELLED'] } },
      orderBy: { updatedAt: 'desc' }
    });

    res.status(200).json({ 
      success: true, 
      data: { activeJobs, scheduledJobs, historyJobs } 
    });
  } catch (error) {
    console.error("Get Courier Activities Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activities." });
  }
};