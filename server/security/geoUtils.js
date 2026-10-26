import { SECURITY_CONFIG } from '../config/security.js';
import { storeDb } from '../data/storeState.js';

/**
 * Calculate great-circle distance between two points on a sphere using Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in kilometers
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Validate delivery eligibility on the backend
 * Checks whether the delivery destination is within the strict 10.0 km boundary
 * @param {Object} location
 * @param {string} location.pincode
 * @param {number} [location.lat]
 * @param {number} [location.lon]
 * @returns {{ isEligible: boolean, distanceKm: number, reason?: string }}
 */
export function validateDeliveryRadius(location) {
  const storeSettings = (storeDb && typeof storeDb.getStoreSettings === 'function') 
    ? storeDb.getStoreSettings() 
    : {};
  const storeLat = Number(storeSettings.storeLat) || SECURITY_CONFIG.STORE.LATITUDE;
  const storeLon = Number(storeSettings.storeLng) || SECURITY_CONFIG.STORE.LONGITUDE;
  const maxRadiusKm = Number(storeSettings.maxDeliveryRadiusKm) || SECURITY_CONFIG.STORE.MAX_DELIVERY_RADIUS_KM;

  let targetLat = location.lat;
  let targetLon = location.lon;

  // If specific coordinates not provided by browser, look up authoritative PIN code centroid
  if (targetLat === undefined || targetLon === undefined) {
    const pin = String(location.pincode || '').trim();
    const pinEntry = SECURITY_CONFIG.STORE.PINCODE_COORDINATES[pin];
    if (!pinEntry) {
      return {
        isEligible: false,
        distanceKm: -1,
        reason: `PIN Code ${pin || 'unknown'} is outside the store's verified delivery zone.`
      };
    }
    targetLat = pinEntry.lat;
    targetLon = pinEntry.lon;
  }

  // Sanity check coordinates
  if (isNaN(targetLat) || isNaN(targetLon) || targetLat < -90 || targetLat > 90 || targetLon < -180 || targetLon > 180) {
    return {
      isEligible: false,
      distanceKm: -1,
      reason: 'Invalid geographic coordinates provided.'
    };
  }

  const distanceKm = calculateHaversineDistanceKm(storeLat, storeLon, targetLat, targetLon);

  if (distanceKm > maxRadiusKm) {
    return {
      isEligible: false,
      distanceKm,
      reason: `Delivery distance (${distanceKm} km) exceeds the maximum allowed limit of ${maxRadiusKm} km.`
    };
  }

  return {
    isEligible: true,
    distanceKm
  };
}
