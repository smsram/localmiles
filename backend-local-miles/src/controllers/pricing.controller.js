// controllers/pricing.controller.js
const calculatePrice = require('../utils/priceCalculator');

exports.getEstimate = async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng, weight, urgency } = req.body;

    if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
      return res.status(400).json({ 
        success: false, 
        message: "Both pickup and drop locations are required." 
      });
    }

    const result = calculatePrice(pickupLat, pickupLng, dropLat, dropLng, weight, urgency);

    res.status(200).json({
      success: true,
      data: {
        price: result.price,
        distance: result.distance,
        // Send breakdown to frontend so user sees "Delivery Fee vs Platform Fee"
        breakdown: result.breakdown 
      }
    });
  } catch (error) {
    console.error("Pricing Error:", error);
    res.status(500).json({ success: false, message: "Calculation failed" });
  }
};