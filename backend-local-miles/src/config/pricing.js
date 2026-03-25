module.exports = {
  // 1. Zone Definitions
  CITY_RADIUS_KM: 25,     // Anything under 25km is considered "Within City"

  // 2. Dynamic Base Fares (Covers the first 2 km)
  BASE_DISTANCE_KM: 2, 
  CITY_BASE_PRICE: 50,    // Base & Minimum for local city runs
  STATE_BASE_PRICE: 100,  // Base & Minimum for out-of-city/interstate runs

  // 3. Ultra-Low Commuter Rates (For distance AFTER the first 2km)
  RATES: {
    STANDARD: {
      SHORT_DISTANCE: 6,   // ₹6/km (City traffic)
      LONG_DISTANCE: 1.5   // ₹1.5/km (Highway/Intercity commuter)
    }
  },

  // 4. Thresholds
  LONG_DISTANCE_THRESHOLD: 15, // km (When the rate drops from ₹6 to ₹1.5)

  // 5. THE PROMISE (Hard Caps to build trust)
  CITY_MAX_CAP: 100,  // Max price for any distance under 25km
  STATE_MAX_CAP: 300, // Absolute max price, even for 200km+

  // 6. Weight limits
  WEIGHT_LIMIT_FREE: 3,   
  COST_PER_EXTRA_KG: 15   
};