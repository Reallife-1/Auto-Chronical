import { Type } from 'class-transformer';
import {
  IsDateString, IsEnum, IsInt, IsOptional, IsString,
  Max, MaxLength, Min,
} from 'class-validator';
import {
  FuelType, LastServiced, Ownership, Transmission, VehicleType,
} from '../vehicle.enums';

export class CreateVehicleDto {
  @IsString() @MaxLength(100)
  name: string;

  @IsString() @MaxLength(20)
  plateNumber: string;

  @IsOptional() @IsString() @MaxLength(30)
  vehicleNumber?: string;

  @IsOptional() @IsString() @MaxLength(30)
  vin?: string;

  @IsString() @MaxLength(50)
  make: string;

  @IsString() @MaxLength(50)
  model: string;

  @Type(() => Number) @IsInt() @Min(1900) @Max(new Date().getFullYear() + 1)
  year: number;

  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @IsOptional() @IsString()
  registrationCountry?: string; // default 'Nigeria'

  @IsOptional() @IsEnum(FuelType)
  fuelType?: FuelType;

  @IsOptional() @IsEnum(Transmission)
  transmission?: Transmission;

  @IsOptional() @IsString() @MaxLength(30)
  colour?: string;

  @IsOptional() @IsString() @MaxLength(100)
  assignedDriver?: string;

  @IsOptional() @IsEnum(Ownership)
  ownership?: Ownership;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  mileageKm?: number;

  @IsOptional() @IsEnum(LastServiced)
  lastServiced?: LastServiced;

  @IsOptional() @IsDateString()
  insuranceExpiry?: string;

  @IsOptional() @IsDateString()
  nextService?: string;
}