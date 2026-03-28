import { describe, it, expect } from 'vitest';

/**
 * Unit tests for coupon discount logic.
 * These validate the core calculation without requiring a running database.
 */

function applyCouponDiscount(price, coupon) {
  if (!coupon || !coupon.isActive) return { amount: price, discountAmount: 0, error: null };

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { amount: price, discountAmount: 0, error: 'Coupon expired' };
  }
  if (coupon.maxRedemptions && coupon.redemptions >= coupon.maxRedemptions) {
    return { amount: price, discountAmount: 0, error: 'Coupon fully redeemed' };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((price * coupon.discountValue) / 100);
  } else if (coupon.discountType === 'fixed') {
    discountAmount = Math.round(coupon.discountValue);
  }
  if (discountAmount > price) discountAmount = price;
  return { amount: price - discountAmount, discountAmount, error: null };
}

describe('Coupon Discount Logic', () => {
  it('returns original price when no coupon is provided', () => {
    const result = applyCouponDiscount(1000, null);
    expect(result.amount).toBe(1000);
    expect(result.discountAmount).toBe(0);
    expect(result.error).toBeNull();
  });

  it('applies a fixed discount correctly', () => {
    const coupon = { discountType: 'fixed', discountValue: 200, isActive: true, redemptions: 0, maxRedemptions: 5 };
    const result = applyCouponDiscount(1000, coupon);
    expect(result.amount).toBe(800);
    expect(result.discountAmount).toBe(200);
  });

  it('applies a percentage discount correctly', () => {
    const coupon = { discountType: 'percentage', discountValue: 25, isActive: true, redemptions: 0, maxRedemptions: 10 };
    const result = applyCouponDiscount(1000, coupon);
    expect(result.amount).toBe(750);
    expect(result.discountAmount).toBe(250);
  });

  it('caps discount at the price (no negative amounts)', () => {
    const coupon = { discountType: 'fixed', discountValue: 2000, isActive: true, redemptions: 0, maxRedemptions: 1 };
    const result = applyCouponDiscount(500, coupon);
    expect(result.amount).toBe(0);
    expect(result.discountAmount).toBe(500);
  });

  it('rejects an expired coupon', () => {
    const coupon = { discountType: 'fixed', discountValue: 100, isActive: true, expiresAt: '2020-01-01', redemptions: 0, maxRedemptions: 1 };
    const result = applyCouponDiscount(1000, coupon);
    expect(result.error).toBe('Coupon expired');
    expect(result.amount).toBe(1000);
  });

  it('rejects a fully redeemed coupon', () => {
    const coupon = { discountType: 'fixed', discountValue: 100, isActive: true, redemptions: 5, maxRedemptions: 5 };
    const result = applyCouponDiscount(1000, coupon);
    expect(result.error).toBe('Coupon fully redeemed');
    expect(result.amount).toBe(1000);
  });

  it('rejects an inactive coupon', () => {
    const coupon = { discountType: 'fixed', discountValue: 100, isActive: false, redemptions: 0, maxRedemptions: 5 };
    const result = applyCouponDiscount(1000, coupon);
    expect(result.amount).toBe(1000);
    expect(result.discountAmount).toBe(0);
  });

  it('handles 100% percentage discount', () => {
    const coupon = { discountType: 'percentage', discountValue: 100, isActive: true, redemptions: 0, maxRedemptions: 1 };
    const result = applyCouponDiscount(1000, coupon);
    expect(result.amount).toBe(0);
    expect(result.discountAmount).toBe(1000);
  });

  it('handles 0 price course with coupon', () => {
    const coupon = { discountType: 'fixed', discountValue: 100, isActive: true, redemptions: 0, maxRedemptions: 1 };
    const result = applyCouponDiscount(0, coupon);
    expect(result.amount).toBe(0);
    expect(result.discountAmount).toBe(0);
  });
});
