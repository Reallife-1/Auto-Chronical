export enum VehicleType {
  CAR = 'car', VAN = 'van', TRUCK = 'truck',
  BUS = 'bus', MOTORCYCLE = 'motorcycle', OTHER = 'other',
}
export enum FuelType {
  PETROL = 'petrol', DIESEL = 'diesel', ELECTRIC = 'electric',
  HYBRID = 'hybrid',  OTHER = 'other',
}
export enum Transmission { AUTOMATIC = 'automatic', MANUAL = 'manual', CVT = 'cvt' , OTHER = 'other' }
export enum Ownership { OWNED = 'owned', LEASED = 'leased', COMPANY = 'company', FINANCED = 'financed' }
export enum LastServiced {
  UNDER_6_MONTHS = 'under_6_months',
  SIX_TO_12_MONTHS = '6_12_months',
  OVER_A_YEAR = 'over_a_year',
  NOT_SURE = 'not_sure',
}