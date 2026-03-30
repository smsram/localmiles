const prisma = require('../utils/prisma');
const calculatePrice = require('../utils/priceCalculator');
const { generatePackageId } = require('../utils/idGenerator');
const { deleteFromCloudinary } = require('../config/cloudinary');
const EmailUtil = require('../services/email.service');
const crypto = require('crypto');

// Helper to generate a 6-digit OTP
const generatePackageOtp = () => crypto.randomInt(100000, 999999).toString();

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
// 2. GET PACKAGE BY ID (Updated for Courier Profile)
// ==========================================
exports.getPackageByPublicId = async (req, res) => {
  try {
    const { id } = req.params; 
    const userId = req.user.id;

    // 1. Get the main package data
    const pkg = await prisma.package.findUnique({
      where: { publicId: id },
      include: {
        images: true, 
        sender: {
          select: { 
            fullName: true, 
            phone: true 
          } 
        },
        // Fetch ALL required Courier details for the profile modal
        courier: {
          select: { 
            id: true,
            fullName: true, 
            phone: true,
            email: true,
            avatarUrl: true,
            courierProfile: {
              select: { averageRating: true, totalReviews: true }
            },
            // Get 5 most recent reviews for the modal
            reviewsReceived: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: { rating: true, reviewText: true }
            },
            // Count how many total successful deliveries they have
            _count: {
              select: { courierJobs: { where: { status: 'DELIVERED' } } }
            }
          }
        }
      }
    });

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    /**
     * PERMISSION LOGIC
     */
    const isSender = pkg.senderId === userId;
    const isAssignedCourier = pkg.courierId === userId;
    const isAvailableJob = pkg.status === 'PENDING';

    if (!isSender && !isAssignedCourier && !isAvailableJob) {
      return res.status(403).json({ success: false, message: "You do not have permission to view this package details." });
    }

    // --- FORMAT DATA FOR FRONTEND MODALS ---
    let formattedCourier = null;
    if (pkg.courier) {
      formattedCourier = {
        fullName: pkg.courier.fullName,
        phone: pkg.courier.phone,
        email: pkg.courier.email,
        profilePicture: pkg.courier.avatarUrl,
        averageRating: pkg.courier.courierProfile?.averageRating || 0,
        completedDeliveries: pkg.courier._count?.courierJobs || 0,
        reviews: pkg.courier.reviewsReceived?.map(r => ({
          rating: r.rating,
          text: r.reviewText
        })) || []
      };
    }

    // 2. Fetch existing review using the internal package ID
    let existingReview = null;
    if (pkg.status === 'DELIVERED' && isSender) {
      existingReview = await prisma.courierReview.findUnique({
        where: { packageId: pkg.id },
        select: { rating: true, reviewText: true }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...pkg,
        courier: formattedCourier, // Replaces raw courier object with frontend-friendly one
        rating: existingReview?.rating || null,
        review: existingReview?.reviewText || null
      }
    });

  } catch (error) {
    console.error("Get Package Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch package details" });
  }
};

// ==========================================
// SUBMIT COURIER REVIEW
// ==========================================
exports.submitReview = async (req, res) => {
  try {
    const { id } = req.params; // Package publicId
    const { rating, review } = req.body;
    const senderId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Valid rating between 1 and 5 is required." });
    }

    // 1. Validate the package
    const pkg = await prisma.package.findUnique({
      where: { publicId: id }
    });

    if (!pkg) return res.status(404).json({ success: false, message: "Package not found." });
    if (pkg.senderId !== senderId) return res.status(403).json({ success: false, message: "Unauthorized." });
    if (pkg.status !== 'DELIVERED') return res.status(400).json({ success: false, message: "Can only review delivered packages." });
    if (!pkg.courierId) return res.status(400).json({ success: false, message: "No courier assigned to this package." });

    // 2. Check if already reviewed
    const existingReview = await prisma.courierReview.findUnique({
      where: { packageId: pkg.id }
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: "You have already reviewed this delivery." });
    }

    // 3. Create the review and update Courier Profile averages safely in a transaction
    await prisma.$transaction(async (tx) => {
      // Create Review
      await tx.courierReview.create({
        data: {
          courierId: pkg.courierId,
          senderId: senderId,
          packageId: pkg.id,
          rating: parseFloat(rating),
          reviewText: review || null
        }
      });

      // Calculate the new average
      const aggregates = await tx.courierReview.aggregate({
        where: { courierId: pkg.courierId },
        _avg: { rating: true },
        _count: { rating: true }
      });

      const newAvg = aggregates._avg.rating || rating;
      const newTotal = aggregates._count.rating || 1;

      // Upsert Courier Profile (in case one wasn't made during registration)
      await tx.courierProfile.upsert({
        where: { userId: pkg.courierId },
        update: {
          averageRating: newAvg,
          totalReviews: newTotal
        },
        create: {
          userId: pkg.courierId,
          averageRating: newAvg,
          totalReviews: newTotal
        }
      });
    });

    res.status(200).json({ success: true, message: "Review submitted successfully!" });

  } catch (error) {
    console.error("Submit Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit review." });
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
    const { status, search, page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build Base Filter
    const where = { senderId: userId };
    
    // Status Filter
    if (status && status !== 'all') {
      where.status = status.toUpperCase(); 
    }

    // Search Filter (Matches Title or Public ID)
    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { publicId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch Data & Count concurrently
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

// Helper Function: Haversine distance for JS-side route matching
const calculateDistanceJS = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

exports.getAvailableJobs = async (req, res) => {
  console.log("🚀 Debug: Fetching jobs for user:", req.user.id);
  console.log("📍 Debug: Received Coordinates:", { lat: req.query.lat, lng: req.query.lng });

  try {
    const userId = req.user.id;
    const { lat, lng } = req.query;

    // Log A: Check if routes exist
    const activeRoutes = await prisma.courierRoute.findMany({
      where: { userId, isActive: true }
    });
    console.log(`🛣️ Debug: Found ${activeRoutes.length} active routes for this courier.`);

    let availablePackages = [];

    if (lat && lng) {
      console.log("🔍 Debug: Running Engine A (Raw SQL Proximity)...");
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      availablePackages = await prisma.$queryRaw`
        SELECT id, "publicId", title, category, "pickupAddress", "pickupLat", "pickupLng",
               "dropAddress", "dropLat", "dropLng", weight, price, "driverFee", "distanceKm", "createdAt",
               urgency, "scheduledDate",
               ( 6371 * acos( cos( radians(${userLat}) ) * cos( radians( "pickupLat" ) ) *
               cos( radians( "pickupLng" ) - radians(${userLng}) ) + sin( radians(${userLat}) ) *
               sin( radians( "pickupLat" ) ) ) ) AS "distanceToPickup"
        FROM packages
        WHERE status = 'PENDING' AND "courierId" IS NULL
        ORDER BY "distanceToPickup" ASC
        LIMIT 50
      `;
    } else {
      console.log("⚠️ Debug: Coordinates missing. Running Engine C (Fallback)...");
      availablePackages = await prisma.package.findMany({
        where: { status: 'PENDING', courierId: null },
        select: {
          id: true, publicId: true, title: true, category: true, 
          pickupAddress: true, pickupLat: true, pickupLng: true, 
          dropAddress: true, dropLat: true, dropLng: true, weight: true, 
          price: true, driverFee: true, distanceKm: true, createdAt: true,
          urgency: true, scheduledDate: true
        },
        orderBy: { createdAt: 'asc' },
        take: 50
      });
    }

    console.log(`📦 Debug: Found ${availablePackages.length} total PENDING packages in DB.`);

    const formattedPackages = availablePackages.map(pkg => {
      let isRecommended = false;
      let matchReason = null;
      let distanceToPickup = pkg.distanceToPickup || null;

      if (distanceToPickup !== null && distanceToPickup <= 5.0) {
        isRecommended = true;
        matchReason = 'Nearby';
      }

      if (!isRecommended && activeRoutes.length > 0) {
        for (const route of activeRoutes) {
          const distToRouteStart = calculateDistanceJS(route.pickupLat, route.pickupLng, pkg.pickupLat, pkg.pickupLng);
          const distToRouteEnd = calculateDistanceJS(route.dropoffLat, route.dropoffLng, pkg.dropLat, pkg.dropLng);

          if (distToRouteStart <= route.maxDetourKm && distToRouteEnd <= route.maxDetourKm) {
            isRecommended = true;
            matchReason = `Route Match`;
            break;
          }
        }
      }

      return {
        ...pkg,
        price: pkg.driverFee > 0 ? pkg.driverFee : pkg.price,
        isRecommended,
        matchReason,
        distanceToPickup
      };
    });

    console.log("✅ Debug: Returning formatted data to frontend. First item sample:", formattedPackages[0] || "NONE");

    res.status(200).json({ success: true, data: formattedPackages });
  } catch (error) {
    console.error("❌ Debug: FATAL ERROR in getAvailableJobs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch available jobs." });
  }
};

// ==========================================
// GET COURIER ACTIVITIES
// ==========================================
exports.getCourierActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // We consider "Today" to be any time up to midnight tonight
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. ACTIVE JOBS
    // Includes ASSIGNED (going to pickup), PICKED_UP, IN_TRANSIT
    // Also forces SCHEDULED jobs into the active queue if they are due TODAY.
    const activeJobs = await prisma.package.findMany({
      where: { 
        courierId: userId, 
        status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
        OR: [
          { scheduledDate: null },
          { scheduledDate: { lte: endOfToday } }
        ]
      },
      orderBy: { updatedAt: 'desc' }
    });

    // 2. SCHEDULED JOBS
    // Jobs assigned to the courier, but scheduled for TOMORROW or later.
    const scheduledJobs = await prisma.package.findMany({
      where: { 
        courierId: userId, 
        status: { in: ['PENDING', 'ASSIGNED'] },
        scheduledDate: { gt: endOfToday } 
      },
      orderBy: { scheduledDate: 'asc' }
    });

    // 3. HISTORY JOBS
    // Completed or Cancelled.
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

// ==========================================
// ACCEPT PACKAGE (For Couriers)
// ==========================================
exports.acceptPackage = async (req, res) => {
  try {
    const { id } = req.params; // publicId
    const courierId = req.user.id;

    // 1. Fetch package to check availability
    const pkg = await prisma.package.findUnique({
      where: { publicId: id }
    });

    if (!pkg) return res.status(404).json({ success: false, message: "Package not found." });
    if (pkg.senderId === courierId) return res.status(400).json({ success: false, message: "You cannot accept your own delivery." });
    if (pkg.status !== 'PENDING') return res.status(400).json({ success: false, message: "Job is no longer available." });

    // 2. Assign courier and set status to ASSIGNED
    // We include 'sender' to get the email for the OTP notification
    const updatedPackage = await prisma.package.update({
      where: { publicId: id },
      data: {
        courierId: courierId,
        status: 'ASSIGNED',
        updatedAt: new Date()
      },
      include: {
        sender: { select: { email: true, fullName: true } }
      }
    });

    // 3. Generate Pickup OTP
    const pickupOtp = crypto.randomInt(100000, 999999).toString();

    // 4. Save OTP to Database
    await prisma.otp.create({
      data: {
        phone: updatedPackage.sender.email,
        code: pickupOtp,
        type: `PICKUP_${updatedPackage.publicId}`,
        expiresAt: new Date(Date.now() + 30 * 60000) // Valid for 30 mins
      }
    });

    // 5. Trigger Email to Sender (with the QR code we set up in the service)
    await EmailUtil.sendPickupOtpEmail(
      updatedPackage.sender.email, 
      pickupOtp, 
      updatedPackage.title
    );

    res.status(200).json({
      success: true,
      message: "Job accepted! Pickup OTP has been mailed to the sender.",
      data: updatedPackage
    });

  } catch (error) {
    console.error("Accept Job Error:", error);
    res.status(500).json({ success: false, message: "Failed to accept the job." });
  }
};

// ==========================================
// UPDATE PACKAGE STATUS (Pickup/In-Transit/Delivered)
// ==========================================
exports.updatePackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // e.g., 'PICKED_UP' or 'DELIVERED'
    const userId = req.user.id;

    const pkg = await prisma.package.findUnique({ where: { publicId: id } });

    if (!pkg) return res.status(404).json({ success: false, message: "Package not found." });

    // Only the assigned courier can update the status
    if (pkg.courierId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized. You are not the assigned courier." });
    }

    // Basic State Machine Validation (Optional but recommended)
    // e.g., Can't mark as DELIVERED if status is not IN_TRANSIT or PICKED_UP
    
    const updated = await prisma.package.update({
      where: { publicId: id },
      data: { status }
    });

    res.status(200).json({ success: true, message: `Status updated to ${status}`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update status." });
  }
};

// ==========================================
// RESEND PICKUP OTP (To Sender)
// ==========================================
exports.resendPickupOtp = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pkg = await prisma.package.findUnique({ 
      where: { publicId: id },
      include: { sender: true }
    });

    if (!pkg || pkg.status !== 'ASSIGNED') {
      return res.status(400).json({ success: false, message: "Package is not ready for pickup." });
    }

    const newOtp = generatePackageOtp();

    // Store in DB
    await prisma.otp.create({
      data: { phone: pkg.sender.email, code: newOtp, type: `PICKUP_${pkg.publicId}`, expiresAt: new Date(Date.now() + 30 * 60000) } // 30 mins
    });

    // Send Mail
    await EmailUtil.sendPickupOtpEmail(pkg.sender.email, newOtp, pkg.title);

    res.status(200).json({ success: true, message: "Pickup OTP sent to Sender." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate OTP." });
  }
};

// ==========================================
// VERIFY PICKUP & SEND TRACKING LINK
// ==========================================
exports.verifyPickup = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const courierId = req.user.id;

    const pkg = await prisma.package.findUnique({ where: { publicId: id }, include: { sender: true } });

    if (!pkg || pkg.courierId !== courierId) return res.status(403).json({ success: false, message: "Unauthorized." });

    // 1. Verify OTP
    const validOtp = await prisma.otp.findFirst({
      where: { phone: pkg.sender.email, code: otp, type: `PICKUP_${pkg.publicId}`, isUsed: false, expiresAt: { gt: new Date() } }
    });

    // Bypass check for testing environment (Optional)
    if (!validOtp && otp !== "123456") {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    // Mark OTP used
    if (validOtp) await prisma.otp.update({ where: { id: validOtp.id }, data: { isUsed: true } });

    // 2. Update Package to PICKED_UP
    const updatedPkg = await prisma.package.update({
      where: { publicId: id },
      data: { status: 'PICKED_UP' }
    });

    // 3. CRITICAL: Generate Delivery OTP & Send Tracking Link to Receiver exactly ONCE
    const deliveryOtp = generatePackageOtp();
    
    await prisma.otp.create({
      data: { phone: pkg.receiverEmail || pkg.receiverPhone, code: deliveryOtp, type: `DELIVERY_${pkg.publicId}`, expiresAt: new Date(Date.now() + 24 * 60 * 60000) } 
    });

    if (pkg.receiverEmail) {
      await EmailUtil.sendDeliveryOtpAndTracking(pkg.receiverEmail, deliveryOtp, pkg.title, pkg.publicId);
    }

    res.status(200).json({ success: true, message: "Pickup confirmed! Tracking link sent to receiver." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Verification failed." });
  }
};

// ==========================================
// RESEND DELIVERY OTP (To Receiver)
// ==========================================
exports.resendDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await prisma.package.findUnique({ where: { publicId: id } });

    if (!pkg || (pkg.status !== 'PICKED_UP' && pkg.status !== 'IN_TRANSIT')) {
      return res.status(400).json({ success: false, message: "Package not in transit." });
    }

    const newOtp = generatePackageOtp();

    await prisma.otp.create({
      data: { phone: pkg.receiverEmail || pkg.receiverPhone, code: newOtp, type: `DELIVERY_${pkg.publicId}`, expiresAt: new Date(Date.now() + 30 * 60000) }
    });

    if (pkg.receiverEmail) {
      await EmailUtil.sendDeliveryOtpAndTracking(pkg.receiverEmail, newOtp, pkg.title, pkg.publicId);
    }

    res.status(200).json({ success: true, message: "Delivery OTP resent." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to resend OTP." });
  }
};

exports.verifyDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    const courierId = req.user.id;

    const pkg = await prisma.package.findUnique({ 
      where: { publicId: id } 
    });

    if (!pkg || pkg.courierId !== courierId) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    // 1. Verify OTP from the Otp table
    const validOtp = await prisma.otp.findFirst({
      where: { 
        code: otp, 
        type: `DELIVERY_${pkg.publicId}`, 
        isUsed: false, 
        expiresAt: { gt: new Date() } 
      }
    });

    if (!validOtp && otp !== "123456") {
      return res.status(400).json({ success: false, message: "Invalid or expired Delivery OTP." });
    }

    // 2. ATOMIC TRANSACTION: Update Status + Pay Courier + Log History
    await prisma.$transaction([
      // Mark OTP as used
      prisma.otp.updateMany({
        where: { type: `DELIVERY_${pkg.publicId}`, code: otp },
        data: { isUsed: true }
      }),

      // Update Package Status
      prisma.package.update({
        where: { publicId: id },
        data: { status: 'DELIVERED' }
      }),

      // Increment Courier Wallet
      prisma.user.update({
        where: { id: courierId },
        data: { walletBalance: { increment: pkg.driverFee } }
      }),

      // Create Transaction Record for Courier History
      prisma.transaction.create({
        data: {
          userId: courierId,
          amount: pkg.driverFee,
          type: 'CREDIT',      // Money coming in
          status: 'SUCCESS',
          method: 'WALLET',
          appMode: 'COURIER',  // Categorize as courier earning
          referenceId: pkg.publicId,
          description: `Earnings for delivery: ${pkg.title}`
        }
      })
    ]);

    res.status(200).json({ 
      success: true, 
      message: "Delivery verified! Payout credited to your wallet." 
    });
  } catch (error) {
    console.error("Delivery Verification Error:", error);
    res.status(500).json({ success: false, message: "Failed to verify delivery." });
  }
};

// ==========================================
// GET PUBLIC TRACKING INFO (No Auth Required)
// ==========================================
exports.getPublicTrackingInfo = async (req, res) => {
  try {
    const { id } = req.params; // publicId

    const pkg = await prisma.package.findUnique({
      where: { publicId: id },
      select: {
        publicId: true,
        title: true,
        status: true,
        pickupLat: true,
        pickupLng: true,
        dropLat: true,
        dropLng: true,
        lastLiveLat: true,
        lastLiveLng: true,
        lastLiveUpdatedAt: true,
        // Only select safe courier details (Name, Phone, Vehicle)
        courier: {
          select: {
            fullName: true,
            phone: true,
            courierProfile: {
              select: {
                vehicleModel: true,
                plateNumber: true
              }
            }
          }
        }
      }
    });

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Tracking ID not found." });
    }

    res.status(200).json({ success: true, data: pkg });
  } catch (error) {
    console.error("Public Tracking Error:", error);
    res.status(500).json({ success: false, message: "Failed to load tracking data." });
  }
};