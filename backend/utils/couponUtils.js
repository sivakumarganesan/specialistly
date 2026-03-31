/**
 * Check if a coupon is expired.
 * Treats the expiration date as end-of-day (23:59:59.999).
 * This allows coupons set to expire on March 31 to work all day on March 31.
 * 
 * @param {Date} expiresAt - The expiration date
 * @returns {boolean} - True if the coupon is expired, false otherwise
 */
export function isCouponExpired(expiresAt) {
  if (!expiresAt) return false;

  // Treat the expiration date as end of that day (23:59:59.999)
  const expirationDate = new Date(expiresAt);
  const endOfDay = new Date(
    expirationDate.getFullYear(),
    expirationDate.getMonth(),
    expirationDate.getDate(),
    23,
    59,
    59,
    999
  );

  // Coupon is expired if the end of that day has passed
  return endOfDay < new Date();
}
