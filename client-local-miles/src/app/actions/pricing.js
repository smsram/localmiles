'use server' 

export async function calculateDeliveryPrice(details) {
  const { distanceKm, weightKg, length, breadth, height, urgency } = details;

  // --- CONFIG ---
  const MIN_FARE = 40;
  const RATE_PER_KM = 10;
  const URGENCY_MULTIPLIERS = { 'standard': 1, 'sameday': 1.2, 'urgent': 1.5 };

  // --- LOGIC ---
  // 1. Volumetric Weight (Defaulting dimensions to 10 if missing to avoid NaN)
  const l = Number(length) || 10;
  const b = Number(breadth) || 10;
  const h = Number(height) || 10;
  
  const volWeight = (l * b * h) / 5000;
  const chargeableWeight = Math.max(Number(weightKg) || 1, volWeight);

  // 2. Base Calculation
  let total = MIN_FARE;
  
  // Calculate distance cost
  const dist = Number(distanceKm) || 0;
  if (dist > 2) {
    total += (dist - 2) * RATE_PER_KM;
  }
  
  // Calculate weight cost
  if (chargeableWeight > 1) {
    total += (chargeableWeight - 1) * 5; // ₹5 per extra kg
  }

  // 3. Multiplier
  const multiplier = URGENCY_MULTIPLIERS[urgency] || 1;
  const finalPrice = Math.ceil(total * multiplier);

  return { success: true, price: finalPrice };
}