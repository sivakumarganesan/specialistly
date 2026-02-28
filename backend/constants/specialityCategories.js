/**
 * Predefined Speciality Categories for the Marketplace
 * Used to tag specialists and filter by customers
 */
export const SPECIALITY_CATEGORIES = [
  'Healthcare',
  'Sports',
  'Dietitian',
  'Entertainment',
  'Astrology/Numerology',
  'Coaching',
  'Medical',
  'Law & Legal Services',
  'Technology & IT',
  'Design & Arts',
  'Digital Marketing',
  'Fitness & Nutrition',
  'Education & Career'
];

/**
 * Category descriptions for UI display
 */
export const CATEGORY_DESCRIPTIONS = {
  'Healthcare': 'Health and wellness services',
  'Sports': 'Sports training and coaching',
  'Dietitian': 'Dietary and nutrition consultation',
  'Entertainment': 'Entertainment and performance',
  'Astrology/Numerology': 'Astrology and numerology services',
  'Coaching': 'Life and business coaching',
  'Medical': 'Medical consultation services',
  'Law & Legal Services': 'Legal and law services',
  'Technology & IT': 'Tech and IT solutions',
  'Design & Arts': 'Design and artistic services',
  'Digital Marketing': 'Digital marketing services',
  'Fitness & Nutrition': 'Fitness training and nutrition planning',
  'Education & Career': 'Education and career development'
};

/**
 * Get all categories
 */
export const getAllCategories = () => SPECIALITY_CATEGORIES;

/**
 * Validate if a category is valid
 */
export const isValidCategory = (category) => SPECIALITY_CATEGORIES.includes(category);

/**
 * Get category description
 */
export const getCategoryDescription = (category) => CATEGORY_DESCRIPTIONS[category] || category;
