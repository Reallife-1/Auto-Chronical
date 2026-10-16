import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  FUEL_TYPES,
  LAST_SERVICED_OPTIONS,
  OWNERSHIP_TYPES,
  TRANSMISSION_TYPES,
  VEHICLE_TYPES,
  type FuelType,
  type LastServicedOption,
  type OwnershipType,
  type TransmissionType,
  type VehicleType,
} from '../vehicles.constants';

export class CreateVehicleDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(20)
  plateNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  vin?: string;

  @IsString()
  @MaxLength(50)
  make: string;

  @IsString()
  @MaxLength(50)
  model: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsEnum(VEHICLE_TYPES)
  vehicleType: VehicleType;

  @IsOptional()
  @IsString()
  registrationCountry?: string; // default 'Nigeria'

  @IsOptional()
  @IsEnum(FUEL_TYPES)
  fuelType?: FuelType;

  @IsOptional()
  @IsEnum(TRANSMISSION_TYPES)
  transmission?: TransmissionType;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  colour?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  assignedDriver?: string;

  @IsOptional()
  @IsEnum(OWNERSHIP_TYPES)
  ownership?: OwnershipType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileageKm?: number;

  @IsOptional()
  @IsEnum(LAST_SERVICED_OPTIONS)
  lastServiced?: LastServicedOption;

  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsOptional()
  @IsDateString()
  nextService?: string;
}