export const VEHICLE_TYPES = [
  'car',
  'van',
  'truck',
  'bus',
  'motorcycle',
  'other',
] as const;

export const FUEL_TYPES = [
  'petrol',
  'diesel',
  'electric',
  'hybrid',
  'other',
] as const;

export const TRANSMISSION_TYPES = [
  'automatic',
  'manual',
  'cvt',
  'other',
] as const;

export const OWNERSHIP_TYPES = [
  'owned',
  'leased',
  'company',
  'financed',
] as const;

export const LAST_SERVICED_OPTIONS = [
  'under_6_months',
  '6_12_months',
  'over_a_year',
  'not_sure',
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];
export type OwnershipType = (typeof OWNERSHIP_TYPES)[number];
export type LastServicedOption = (typeof LAST_SERVICED_OPTIONS)[number];