const crypto = require('crypto');

/**
 * Generates a Public User ID
 * Format: UID-XXXX-XXXX (8 Random Chars)
 * Example: UID-9X2M-4P8Q
 */
exports.generateUserId = () => {
  // Generate 4 bytes (8 hex chars)
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  // Split into two blocks of 4 for readability
  const part1 = rand.substring(0, 4);
  const part2 = rand.substring(4, 8);
  return `UID-${part1}-${part2}`;
};

/**
 * Generates a Public Package ID
 * Format: LM + YY + 6 Random Chars
 * Example: LM26-77B2-9A
 */
exports.generatePackageId = () => {
  const year = new Date().getFullYear().toString().slice(-2); // "26"
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  
  const part1 = rand.substring(0, 4); // First 4 chars
  const part2 = rand.substring(4, 6); // Last 2 chars
  
  return `LM${year}-${part1}-${part2}`;
};