const { 
  CITY_RADIUS_KM, BASE_DISTANCE_KM, 
  CITY_BASE_PRICE, STATE_BASE_PRICE,
  RATES, LONG_DISTANCE_THRESHOLD, 
  CITY_MAX_CAP, STATE_MAX_CAP,
  WEIGHT_LIMIT_FREE, COST_PER_EXTRA_KG 
} = require('../config/pricing');

// Helper: Haversine Formula 
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
};
const deg2rad = (deg) => deg * (Math.PI / 180);

const calculatePrice = (pickupLat, pickupLng, dropLat, dropLng, weightKg) => {
  const rawDistance = getDistanceFromLatLonInKm(pickupLat, pickupLng, dropLat, dropLng);
  const totalKm = parseFloat((rawDistance * 1.2).toFixed(1)); 
  const rateCard = RATES.STANDARD; 

  // --- 1. DETERMINE ZONE (City vs State) ---
  const isCity = totalKm <= CITY_RADIUS_KM;
  const currentBasePrice = isCity ? CITY_BASE_PRICE : STATE_BASE_PRICE;
  const currentMaxCap = isCity ? CITY_MAX_CAP : STATE_MAX_CAP;

  // --- 2. CALCULATE BASE + DISTANCE ---
  let distanceCost = currentBasePrice; 
  let remainingKm = totalKm - BASE_DISTANCE_KM;

  if (remainingKm > 0) {
    if (remainingKm <= LONG_DISTANCE_THRESHOLD) {
      distanceCost += remainingKm * rateCard.SHORT_DISTANCE;
    } else {
      distanceCost += LONG_DISTANCE_THRESHOLD * rateCard.SHORT_DISTANCE;
      const longDistanceKm = remainingKm - LONG_DISTANCE_THRESHOLD;
      distanceCost += longDistanceKm * rateCard.LONG_DISTANCE;
    }
  }

  // --- 3. APPLY THE "TRUST CAPS" ---
  // If the math pushes the price too high, force it back down to the cap
  distanceCost = Math.min(distanceCost, currentMaxCap);

  // --- 4. WEIGHT COST ---
  const safeWeight = (!weightKg || weightKg < 0) ? 0 : parseFloat(weightKg);
  let weightCost = 0;
  if (safeWeight > WEIGHT_LIMIT_FREE) {
    weightCost = (safeWeight - WEIGHT_LIMIT_FREE) * COST_PER_EXTRA_KG;
  }

  let finalBill = distanceCost + weightCost;

  // --- 5. ENFORCE ABSOLUTE MINIMUM ---
  // Just in case a discount or weird math happens, never go below the Base Price
  if (finalBill < currentBasePrice) finalBill = currentBasePrice;

  // --- 6. SPLIT THE REVENUE (85% Commuter / 15% Platform) ---
  const driverShare = finalBill * 0.85; 
  const platformFee = finalBill * 0.15; 

  return {
    price: Math.round(finalBill),
    distance: totalKm,
    zone: isCity ? 'CITY' : 'STATE', // Useful for showing UI badges to the user
    breakdown: {
      driverFee: parseFloat(driverShare.toFixed(2)),
      platformFee: parseFloat(platformFee.toFixed(2)),
      taxAmount: 0,
      totalAmount: parseFloat(finalBill.toFixed(2))
    }
  };
};

module.exports = calculatePrice;